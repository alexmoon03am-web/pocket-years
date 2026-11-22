"""Check the compiled Android package independently of its build helpers."""
import argparse
import base64
import hashlib
import struct
import subprocess
import zipfile
import zlib
from pathlib import Path
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

def u16(b,o):return struct.unpack_from('<H',b,o)[0]
def u32(b,o):return struct.unpack_from('<I',b,o)[0]
def u64(b,o):return struct.unpack_from('<Q',b,o)[0]
def part(b,o):
    size=u32(b,o);return b[o+4:o+4+size],o+4+size
def uleb(b,o):
    value=0;shift=0
    while True:
        n=b[o];o+=1;value|=(n&127)<<shift
        if n<128:return value,o
        shift+=7

def signature(data):
    eocd=data.rindex(b'PK\x05\x06')
    cd=u32(data,eocd+16);block=cd-8-u64(data,cd-24)
    assert data[cd-16:cd]==b'APK Sig Block 42' and u64(data,block)==u64(data,cd-24)
    assert eocd+22==len(data)
    pos=block+8
    while pos<cd-24:
        length=u64(data,pos);tag=u32(data,pos+8)
        if tag==0x7109871a:break
        pos+=8+length
    assert tag==0x7109871a
    signers,_=part(data,pos+12);signer,_=part(signers,0)
    signed,p=part(signer,0);signatures,p=part(signer,p);spki,p=part(signer,p);assert p==len(signer)
    digests,p=part(signed,0);certs,p=part(signed,p);extras,p=part(signed,p);assert not extras and p==len(signed)
    dg,_=part(digests,0);sig,_=part(signatures,0)
    assert u32(dg,0)==u32(sig,0)==0x0103
    digest,_=part(dg,4);signature_value,_=part(sig,4);certificate,_=part(certs,0)
    pub=x509.load_der_x509_certificate(certificate).public_key()
    assert pub.public_bytes(serialization.Encoding.DER,serialization.PublicFormat.SubjectPublicKeyInfo)==spki
    pub.verify(signature_value,signed,padding.PKCS1v15(),hashes.SHA256())
    end=bytearray(data[eocd:]);struct.pack_into('<I',end,16,block)
    chunk_hashes=[]
    for section in (data[:block],data[cd:eocd],end):
        for start in range(0,len(section),1048576):
            c=section[start:start+1048576]
            chunk_hashes.append(hashlib.sha256(b'\xa5'+len(c).to_bytes(4,'little')+c).digest())
    assert digest==hashlib.sha256(b'\x5a'+len(chunk_hashes).to_bytes(4,'little')+b''.join(chunk_hashes)).digest()

    return x509.load_der_x509_certificate(certificate).fingerprint(hashes.SHA256())

def chunks(buf,start,end):
    while start<end:
        kind,header,size=struct.unpack_from('<HHI',buf,start)
        assert header>=8 and header<=size and start+size<=end
        yield kind,header,buf[start:start+size]
        start+=size
    assert start==end

def string_pool(c):
    count=u32(c,8);start=u32(c,20);assert u32(c,16)&0x100
    strings=[]
    for i in range(count):
        o=start+u32(c,28+i*4)
        def size_at(n):
            if c[n]&128:return (c[n]&127)*256+c[n+1],n+2
            return c[n],n+1
        _,o=size_at(o);length,o=size_at(o)
        strings.append(c[o:o+length].decode())
    return strings

def verify_xml(b, *, require_portrait=False, require_haptics=False):
    assert u16(b,0)==3 and u32(b,4)==len(b)
    entries=[];stack=[];strings=[];resource_ids=[]
    enum_ids={'screenOrientation':0x0101001e,'appCategory':0x01010545}
    for kind,_,c in chunks(b,8,len(b)):
        if kind==1:strings=string_pool(c)
        if kind==0x0180:resource_ids=[u32(c,i) for i in range(8,len(c),4)]
        if kind==0x0102:
            tag=strings[u32(c,20)];attrs={}
            at,step,n=struct.unpack_from('<HHH',c,24)
            for i in range(n):
                pos=16+at+i*step;name_index=u32(c,pos+4);name=strings[name_index];v=u32(c,pos+16)
                if name in enum_ids:
                    assert strings[u32(c,pos)]=='http://schemas.android.com/apk/res/android',name
                    assert resource_ids[name_index]==enum_ids[name],name
                    assert c[pos+15] in (0x10,0x11),name
                attrs[name]=strings[v] if c[pos+15]==3 else v
            entries.append((tag,attrs));stack.append(tag)
        if kind==0x0103:assert strings[u32(c,20)]==stack.pop()
    assert not stack
    tags_in_order=[n for n,_ in entries]
    expected=['manifest','uses-sdk','application','activity','intent-filter','action','category']
    if 'uses-permission' in tags_in_order:
        expected.insert(2,'uses-permission')
        assert dict(entries)['uses-permission']=={'name':'android.permission.VIBRATE'}
    assert tags_in_order==expected
    if require_haptics:
        assert 'uses-permission' in tags_in_order
    tags=dict(entries);manifest=tags['manifest'];assert manifest['package']=='studio.pocketyears.game'
    assert tags['uses-sdk']=={'minSdkVersion':26,'targetSdkVersion':34}
    assert tags['application']['label']=='Pocket Years' and tags['application']['icon']==0x7f010000
    assert tags['activity']['exported']==0xffffffff and tags['activity']['name']=='.MainActivity'
    if require_portrait:
        assert tags['activity'].get('screenOrientation')==1,'The launch activity must request upright portrait'
        assert tags['application'].get('appCategory')==0,'The application must declare the game category'
    assert tags['action']['name']=='android.intent.action.MAIN' and tags['category']['name']=='android.intent.category.LAUNCHER'
    return manifest['versionName'],manifest['versionCode']

def verify_resources(b):
    assert u16(b,0)==2 and u32(b,4)==len(b) and u32(b,8)==1
    sections=list(chunks(b,12,len(b)));pool=string_pool(sections[0][2]);kind,head,pkg=sections[1]
    assert kind==0x200 and u32(pkg,8)==127
    assert pkg[12:268].decode('utf-16-le').rstrip('\0')=='studio.pocketyears.game'
    children=list(chunks(pkg,head,len(pkg)))
    assert string_pool(children[0][2])==['drawable'] and string_pool(children[1][2])==['ic_launcher']
    _,h,t=children[-1]
    assert t[8]==1 and u32(t,12)==1 and u16(t,34)==0xffff
    entry=u32(t,16)+u32(t,h);assert u32(t,entry+4)==0 and t[entry+11]==3
    assert pool[u32(t,entry+12)]=='res/drawable-nodpi/ic_launcher.png'

def check_dex(d):
    assert d[:8]==b'dex\n035\0' and u32(d,32)==len(d) and u32(d,36)==112
    assert hashlib.sha1(d[32:]).digest()==d[12:32] and zlib.adler32(d[12:])&0xffffffff==u32(d,8)
    def rows(at,fmt):
        count,start=struct.unpack_from('<II',d,at)
        return [struct.unpack_from(fmt,d,start+i*struct.calcsize(fmt)) for i in range(count)]
    strings=[]
    for off, in rows(56,'<I'):
        length,p=uleb(d,off);s=d[p:d.index(0,p)].decode();assert length==len(s);strings.append(s)
    assert strings==sorted(set(strings))
    types=[strings[i] for i, in rows(64,'<I')]
    methods=[(types[cl],strings[name]) for cl,_,name in rows(88,'<HHI')]
    definition,=rows(96,'<8I');assert types[definition[0]]=='Lstudio/pocketyears/game/MainActivity;'
    assert types[definition[2]]=='Landroid/app/Activity;'
    at=definition[6];counts=[]
    for _ in range(4):num,at=uleb(d,at);counts.append(num)
    assert counts==[0,0,1,2];code={}
    for count in counts[2:]:
        index=0
        for _ in range(count):
            delta,at=uleb(d,at);index+=delta;_,at=uleb(d,at);off,at=uleb(d,at)
            regs,ins=struct.unpack_from('<HH',d,off);n=u32(d,off+12)
            code[methods[index][1]]=(regs,ins,struct.unpack_from('<'+str(n)+'H',d,off+16))
    assert set(code)=={'<init>','onCreate','onBackPressed'}
    # Run the actual shipped DEX instructions against observable stand-ins for the framework.
    def run(name,view='game',can_back=False):
        n,ins,ops=code[name];regs=[None]*n;regs[n-ins]='activity'
        pc=0;result=None;calls=[]
        while pc<len(ops):
            word=ops[pc];op=word&255;a=word>>8
            if op==0x07:regs[a&15]=regs[a>>4];pc+=1
            elif op==0x12:regs[a&15]=a>>4;pc+=1
            elif op==0x13:regs[a]=ops[pc+1];pc+=2
            elif op==0x14:regs[a]=ops[pc+1]|ops[pc+2]<<16;pc+=3
            elif op==0x1a:regs[a]=strings[ops[pc+1]];pc+=2
            elif op==0x22:
                regs[a]={'Landroid/webkit/WebView;':'game','Lstudio/pocketyears/game/SaveFiles;':'picker'}[types[ops[pc+1]]];pc+=2
            elif op==0x1f:pc+=2
            elif op in (0x6e,0x6f,0x70):
                target=methods[ops[pc+1]];indices=[(ops[pc+2]>>(i*4))&15 for i in range(4)]+[a&15]
                args=tuple(regs[k] for k in indices[:a>>4]);owner,method=target
                calls.append((method,args))
                result={'getSettings':'settings','getWindow':'window','getDecorView':'decor','findViewById':view,'canGoBack':can_back}.get(method)
                pc+=3
            elif op in (0x0c,0x0a):regs[a]=result;pc+=1
            elif op in (0x38,0x39,0x29):
                disp=struct.unpack('<h',struct.pack('<H',ops[pc+1]))[0]
                go=op==0x29 or (not regs[a] if op==0x38 else bool(regs[a]));pc+=disp if go else 2
            elif op==0x0e:return calls
            else:raise AssertionError(f'Unknown DEX opcode {op:#x}')
        raise AssertionError('Missing return')
    calls=run('onCreate')
    for setting,val in [('setJavaScriptEnabled',1),('setDomStorageEnabled',1),('setAllowFileAccess',0),('setAllowContentAccess',0),('setBlockNetworkLoads',1)]:
        assert (setting,('settings',val)) in calls,setting
    assert ('install',('picker','activity','game')) in calls
    assert ('<init>',('game','activity')) in calls and ('setContentView',('activity','game')) in calls
    assert ('setId',('game',1)) in calls and ('loadUrl',('game','file:///android_asset/index.html')) in calls
    assert run('onBackPressed',can_back=True)[-1]==('goBack',('game',))
    assert run('onBackPressed',can_back=False)[-1]==('onBackPressed',('activity',))
    assert run('onBackPressed',view=None)[-1]==('onBackPressed',('activity',))

def verify(path):
    data=path.read_bytes();signature(data)
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None and len(z.namelist())==len(set(z.namelist()))
        check_dex(z.read('classes.dex'))
        picker=z.read('classes2.dex')
        assert picker[:8]==b'dex\n035\0' and u32(picker,32)==len(picker)
        assert hashlib.sha1(picker[32:]).digest()==picker[12:32]
        assert all(token in picker for token in (b'android.intent.action.CREATE_DOCUMENT',b'android.intent.action.OPEN_DOCUMENT',b'JavascriptInterface',b'PocketFiles',b'pending-import.json'))
        assert verify_xml(z.read('AndroidManifest.xml'),require_portrait=True,require_haptics=True)==('1.3.2',21)
        verify_resources(z.read('resources.arsc'))
        for name in ('resources.arsc','classes.dex','classes2.dex','res/drawable-nodpi/ic_launcher.png'):
            info=z.getinfo(name);o=info.header_offset
            assert info.compress_type==zipfile.ZIP_STORED and (o+30+u16(data,o+26)+u16(data,o+28))%4==0
        mf=z.read('META-INF/MANIFEST.MF').decode()
        for n in z.namelist():
            if n.startswith('META-INF/'):continue
            encoded=base64.b64encode(hashlib.sha256(z.read(n)).digest()).decode()
            assert 'Name: '+n+'\r\nSHA-256-Digest: '+encoded+'\r\n' in mf,n
    java=subprocess.run(['java','-m','jdk.jartool/sun.security.tools.jarsigner.Main','-verify',str(path)],capture_output=True,text=True,check=True)
    assert 'jar verified.' in java.stdout and 'internal inconsistencies' not in java.stdout
    print('PASS signed APK v1 + v2, content digests, aligned resources, game category, fixed upright portrait on the launch activity, compiled launcher and Back button branches.')
def verify_upgrade(previous,current):
    assert signature(previous.read_bytes())==signature(current.read_bytes()), 'APK signer changed'
    with zipfile.ZipFile(previous) as old, zipfile.ZipFile(current) as new:
        _,old_code=verify_xml(old.read('AndroidManifest.xml'))
        _,new_code=verify_xml(new.read('AndroidManifest.xml'))
        assert old_code<new_code, 'An update needs a higher version code'
        assert b'studio.pocketyears.save.v1' in old.read('assets/app.js') and b'studio.pocketyears.save.v1' in new.read('assets/app.js')
    print('PASS in-place upgrade metadata: identical package and signing certificate, increasing version code and matching save key.')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('apk',type=Path);parser.add_argument('--upgrade-from',type=Path)
    args=parser.parse_args();verify(args.apk)
    if args.upgrade_from:verify_upgrade(args.upgrade_from,args.apk)
