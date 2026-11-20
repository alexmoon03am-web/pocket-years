"""Compile the project's small Activity with javac and lower its JVM bytecode to DEX.

The portable build supports the instruction subset used by MainActivity. It
stops on other instructions. Use the Android Gradle build for a general app.
The generated Android API stubs serve as compile-time declarations only.
"""
import hashlib
import re
import shutil
import struct
import subprocess
import zlib
from pathlib import Path

STUBS={
 'studio.pocketyears.game.SaveFiles':'public class SaveFiles { public void install(android.app.Activity a,android.webkit.WebView w){} }',
 'android.content.Context':'public class Context {}',
 'android.os.Bundle':'public class Bundle {}',
 'android.view.View':'''public class View {
     public static final int SYSTEM_UI_FLAG_LIGHT_STATUS_BAR=8192, SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR=16;
     public void setId(int id) {} public void setSystemUiVisibility(int flags) {}
     public void setBackgroundColor(int color) {} }''',
 'android.view.Window':'''public class Window {
     public void setStatusBarColor(int c) {} public void setNavigationBarColor(int c) {}
     public View getDecorView() { return null; } }''',
 'android.webkit.WebSettings':'''public class WebSettings {
     public void setJavaScriptEnabled(boolean v) {} public void setDomStorageEnabled(boolean v) {}
     public void setAllowFileAccess(boolean v) {} public void setAllowContentAccess(boolean v) {}
     public void setBlockNetworkLoads(boolean v) {} }''',
 'android.webkit.WebView':'''public class WebView extends android.view.View {
     public WebView(android.content.Context c) {} public WebSettings getSettings() { return null; }
     public void loadUrl(String url) {} public boolean canGoBack() { return false; } public void goBack() {} }''',
 'android.app.Activity':'''public class Activity extends android.content.Context {
     protected void onCreate(android.os.Bundle state) {} public void onBackPressed() {}
     public void setContentView(android.view.View v) {} public android.view.Window getWindow() { return null; }
     public <T extends android.view.View> T findViewById(int id) { return null; } }'''
}

def p(fmt,*args):return struct.pack('<'+fmt,*args)
def leb(v):
    out=bytearray()
    while v>=128:out.append((v&127)|128);v>>=7
    out.append(v);return bytes(out)
def pad(b):return bytes((-len(b))%4)
def short(t):return 'L' if t.startswith(('L','[')) else t
def signature(desc):
    args,ret=desc[1:].split(')')
    types=tuple(re.findall(r'\[*(?:L[^;]+;|[BCDFIJSZ])',args))
    if ''.join(types)!=args:raise ValueError(desc)
    return ret,types

class Reader:
    def __init__(self,data):self.data=data;self.pos=0
    def take(self,n):v=self.data[self.pos:self.pos+n];self.pos+=n;return v
    def u1(self):return self.take(1)[0]
    def u2(self):return int.from_bytes(self.take(2),'big')
    def u4(self):return int.from_bytes(self.take(4),'big')

class ClassFile:
    def __init__(self,data):
        r=Reader(data)
        if r.u4()!=0xcafebabe:raise ValueError('Not a class file')
        r.take(4);size=r.u2();self.cp=[None]
        for _ in range(1,size):
            tag=r.u1()
            if tag==1:value=r.take(r.u2()).decode()
            elif tag==3:value=r.u4()
            elif tag in (7,8):value=r.u2()
            elif tag in (9,10,11,12):value=(r.u2(),r.u2())
            else:raise ValueError('Unsupported constant pool tag '+str(tag))
            self.cp.append((tag,value))
        self.access=r.u2();self.name=self.cls(r.u2());self.base=self.cls(r.u2())
        if r.u2() or r.u2():raise ValueError('Portable build supports a field-free Activity with no interfaces')
        self.defs=[]
        for _ in range(r.u2()):
            access=r.u2();name=self.utf(r.u2());desc=self.utf(r.u2())
            method=(self.name,name,*signature(desc))
            code=None
            for _ in range(r.u2()):
                attr=self.utf(r.u2());payload=r.take(r.u4())
                if attr=='Code':
                    cr=Reader(payload);stack,locals_=cr.u2(),cr.u2()
                    bytecode=cr.take(cr.u4())
                    if cr.u2():raise ValueError('Unexpected exception handler')
                    code=(stack,locals_,bytecode)
            if code is None:raise ValueError('No bytecode for '+name)
            self.defs.append((method,access,code))
    def utf(self,i):return self.cp[i][1]
    def cls(self,i):return 'L'+self.utf(self.cp[i][1])+';'
    def ref(self,i):
        cl,nat=self.cp[i][1];name,desc=self.cp[nat][1]
        owner=self.cls(cl);name=self.utf(name)
        if owner==self.name and name in ('getWindow','findViewById','setContentView'):owner=self.base
        if owner=='Landroid/webkit/WebView;' and name in ('setId','setBackgroundColor'):owner='Landroid/view/View;'
        return owner,name,*signature(self.utf(desc))

def compile_java(source,tmp):
    tmp=Path(tmp);sources=[]
    for name,definition in STUBS.items():
        path=tmp/(name.replace('.','/')+'.java');path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text('package '+name.rsplit('.',1)[0]+';\n'+definition);sources.append(str(path))
    compiler=[shutil.which('javac')] if shutil.which('javac') else ['java','-m','jdk.compiler/com.sun.tools.javac.Main']
    subprocess.run(compiler+['-g:none','-d',str(tmp)]+sources+[str(source)],check=True)
    output=list(tmp.glob('studio/**/MainActivity.class'))
    if len(output)!=1:raise ValueError('Expected one compiled launcher')
    return ClassFile(output[0].read_bytes())

# Each translated unit records either literal DEX words or pool references to patch.
def lower(cf,method,code):
    stack_size,locals_,bytecode=code
    _,_,_,params=method
    ins_size=1+len(params);local_start=locals_-ins_size
    total=locals_+stack_size;param_base=total-ins_size
    if total>16:raise ValueError('Portable emitter needs fewer than 17 registers')
    def local(i):return param_base+i if i<ins_size else i-ins_size
    emitted=[];stack=0;pc=0;labels={};fixups=[];max_args=0
    def push():
        nonlocal stack
        dest=local_start+stack;stack+=1
        if stack>stack_size:raise ValueError('JVM stack overflow')
        return dest
    def pop():
        nonlocal stack
        stack-=1
        if stack<0:raise ValueError('JVM stack underflow')
        return local_start+stack
    def move(dest,src):emitted.append(0x07|(dest<<8)|(src<<12))
    def constant(v):
        dest=push();v&=0xffffffff
        if v<=7:emitted.append(0x12|(dest<<8)|(v<<12))
        elif v<=0x7fff:emitted.extend([0x13|(dest<<8),v])
        else:emitted.extend([0x14|(dest<<8),v&65535,v>>16])
    while pc<len(bytecode):
        start=pc;labels[start]=len(emitted);op=bytecode[pc];pc+=1
        if 0x2a<=op<=0x2d:move(push(),local(op-0x2a))
        elif op==0x19:move(push(),local(bytecode[pc]));pc+=1
        elif 0x4b<=op<=0x4e:move(local(op-0x4b),pop())
        elif op==0x3a:move(local(bytecode[pc]),pop());pc+=1
        elif 0x02<=op<=0x08:constant(op-0x03)
        elif op==0x10:constant(struct.unpack_from('>b',bytecode,pc)[0]);pc+=1
        elif op==0x11:constant(struct.unpack_from('>h',bytecode,pc)[0]);pc+=2
        elif op in (0x12,0x13):
            n=1 if op==0x12 else 2
            i=int.from_bytes(bytecode[pc:pc+n],'big');pc+=n;tag,val=cf.cp[i]
            if tag==3:constant(val)
            elif tag==8:emitted.extend([0x1a|(push()<<8),('string',cf.utf(val))])
            else:raise ValueError('Unsupported ldc value')
        elif op in (0xbb,0xc0):
            typ=cf.cls(int.from_bytes(bytecode[pc:pc+2],'big'));pc+=2
            reg=push() if op==0xbb else local_start+stack-1
            emitted.extend([(0x22 if op==0xbb else 0x1f)|(reg<<8),('type',typ)])
        elif op==0x59:
            src=local_start+stack-1;move(push(),src)
        elif op in (0xb6,0xb7):
            target=cf.ref(int.from_bytes(bytecode[pc:pc+2],'big'));pc+=2
            count=1+len(target[3]);max_args=max(max_args,count)
            if count>5 or stack<count:raise ValueError('Invalid call signature')
            regs=list(range(local_start+stack-count,local_start+stack))+[0]*5
            stack-=count
            opcode=0x6e if op==0xb6 else (0x70 if target[1]=='<init>' else 0x6f)
            emitted.extend([opcode|((count*16+regs[4])<<8),('method',target),regs[0]|regs[1]<<4|regs[2]<<8|regs[3]<<12])
            if target[2]!='V':
                emitted.append((0x0c if short(target[2])=='L' else 0x0a)|(push()<<8))
        elif op in (0xc6,0xc7,0x99,0x9a,0xa7):
            disp=struct.unpack_from('>h',bytecode,pc)[0];pc+=2
            idx=len(emitted)
            if op==0xa7:emitted.append(0x29)
            else:emitted.append((0x38 if op in (0xc6,0x99) else 0x39)|(pop()<<8))
            emitted.append(0);fixups.append((idx,start+disp))
            if stack!=0:raise ValueError('Only empty-stack branch targets are supported')
        elif op==0xb1:
            if stack:raise ValueError('Unexpected operands at return')
            emitted.append(0x000e)
        else:raise ValueError(f'Unsupported JVM instruction {op:#x} at {start}')
    for idx,target in fixups:
        disp=labels[target]-idx
        if not -32768<=disp<32768:raise ValueError('Branch out of range')
        emitted[idx+1]=disp&65535
    return total,ins_size,max_args,emitted

def dex(cf):
    compiled={m:(access,lower(cf,m,code)) for m,access,code in cf.defs}
    methods=set(compiled);types={cf.name,cf.base};strings=set()
    for _,(_,_,_,words) in compiled.values():
        for token in words:
            if isinstance(token,tuple):
                kind,value=token
                if kind=='method':methods.add(value)
                elif kind=='string':strings.add(value)
                elif kind=='type':types.add(value)
    for owner,name,ret,args in methods:
        types.update([owner,ret,*args]);strings.update([name,short(ret)+''.join(map(short,args))])
    strings=sorted(strings|types);sidx={s:i for i,s in enumerate(strings)}
    types=sorted(types,key=sidx.__getitem__);tidx={t:i for i,t in enumerate(types)}
    protos=sorted({(ret,args) for _,_,ret,args in methods},key=lambda a:(tidx[a[0]],tuple(tidx[t] for t in a[1])))
    pidx={v:i for i,v in enumerate(protos)}
    methods=sorted(methods,key=lambda m:(tidx[m[0]],sidx[m[1]],pidx[(m[2],m[3])]))
    midx={m:i for i,m in enumerate(methods)}
    soff=112;toff=soff+4*len(strings);poff=toff+4*len(types);moff=poff+12*len(protos)
    coff=moff+8*len(methods);dataoff=coff+32;data=bytearray()
    def add(chunk,aligned=False):
        if aligned:data.extend(pad(data))
        pos=dataoff+len(data);data.extend(chunk);return pos
    args_off={}
    for _,args in protos:
        if args and args not in args_off:
            args_off[args]=add(p('I',len(args))+b''.join(p('H',tidx[t]) for t in args),True)
    s_off=[]
    for s in strings:
        if not s.isascii():raise ValueError('Non-ASCII launcher strings require MUTF-8 encoding')
        s_off.append(add(leb(len(s))+s.encode()+b'\0'))
    lookup={'string':sidx,'type':tidx,'method':midx}
    code_off={}
    for m in sorted(compiled,key=midx.__getitem__):
        _,(regs,ins,outs,instructions)=compiled[m]
        words=[w if isinstance(w,int) else lookup[w[0]][w[1]] for w in instructions]
        code_off[m]=add(p('HHHHII',regs,ins,outs,0,0,len(words))+p(str(len(words))+'H',*words),True)
    directs=sorted((m for m in compiled if m[1]=='<init>'),key=midx.__getitem__)
    virtuals=sorted((m for m in compiled if m not in directs),key=midx.__getitem__)
    classdata=bytearray(leb(0)+leb(0)+leb(len(directs))+leb(len(virtuals)))
    for group in (directs,virtuals):
        previous=0
        for m in group:
            flags=compiled[m][0]|(0x10000 if m[1]=='<init>' else 0)
            classdata.extend(leb(midx[m]-previous)+leb(flags)+leb(code_off[m]));previous=midx[m]
    class_data_off=add(classdata);data.extend(pad(data));mapoff=dataoff+len(data)
    map_items=[(0,1,0),(1,len(strings),soff),(2,len(types),toff),(3,len(protos),poff),(5,len(methods),moff),(6,1,coff),
               (0x1001,len(args_off),min(args_off.values())),(0x2002,len(strings),s_off[0]),(0x2001,len(compiled),min(code_off.values())),
               (0x2000,1,class_data_off),(0x1000,1,mapoff)]
    data.extend(p('I',len(map_items))+b''.join(p('HHII',t,0,n,o) for t,n,o in sorted(map_items,key=lambda i:i[2])))
    out=bytearray(dataoff+len(data));out[:8]=b'dex\n035\0'
    out[32:112]=p('20I',len(out),112,0x12345678,0,0,mapoff,len(strings),soff,len(types),toff,len(protos),poff,0,0,len(methods),moff,1,coff,len(data),dataoff)
    for i,x in enumerate(s_off):struct.pack_into('<I',out,soff+4*i,x)
    for i,t in enumerate(types):struct.pack_into('<I',out,toff+4*i,sidx[t])
    for i,(ret,args) in enumerate(protos):
        struct.pack_into('<III',out,poff+12*i,sidx[short(ret)+''.join(map(short,args))],tidx[ret],args_off.get(args,0))
    for i,(owner,name,ret,args) in enumerate(methods):struct.pack_into('<HHI',out,moff+8*i,tidx[owner],pidx[(ret,args)],sidx[name])
    struct.pack_into('<8I',out,coff,tidx[cf.name],cf.access&0x11,tidx[cf.base],0,0xffffffff,0,class_data_off,0)
    out[dataoff:]=data;out[12:32]=hashlib.sha1(out[32:]).digest();struct.pack_into('<I',out,8,zlib.adler32(out[12:])&0xffffffff)
    return bytes(out)
