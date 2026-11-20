"""Compile this project's Android manifest and launcher resource to binary Android formats."""
import re
import struct
import xml.etree.ElementTree as ET

NS='http://schemas.android.com/apk/res/android'
NO=0xffffffff
IDS={'theme':0x01010000,'label':0x01010001,'icon':0x01010002,'name':0x01010003,
     'exported':0x01010010,'screenOrientation':0x0101001e,'minSdkVersion':0x0101020c,'versionCode':0x0101021b,
     'versionName':0x0101021c,'targetSdkVersion':0x01010270,'allowBackup':0x01010280,
     'appCategory':0x01010545,'enableOnBackInvokedCallback':0x0101066c}
ENUMS={'screenOrientation':{'portrait':1},'appCategory':{'game':0}}
REFERENCES={'@drawable/ic_launcher':0x7f010000,'@android:style/Theme.Material.Light.NoActionBar':0x01030241}

def p(fmt,*v): return struct.pack('<'+fmt,*v)
def pool(strings):
    offsets=[];data=bytearray()
    def u8len(n): return bytes([n]) if n<128 else bytes([(n>>8)|128,n&255])
    for s in strings:
        b=s.encode('utf-8');offsets.append(len(data))
        data.extend(u8len(len(s.encode('utf-16-le'))//2)+u8len(len(b))+b+b'\0')
    data.extend(bytes((-len(data))%4))
    offset=28+4*len(strings)
    return p('HHIIIIII',1,28,offset+len(data),len(strings),0,0x100,offset,0)+b''.join(p('I',x) for x in offsets)+data

def resource_table(pkg):
    global_strings=pool(['res/drawable-nodpi/ic_launcher.png'])
    type_strings=pool(['drawable']);keys=pool(['ic_launcher'])
    spec=p('HHIBBHII',0x0202,16,20,1,0,0,1,0x100)  # density-dependent launcher
    config=bytearray(64);struct.pack_into('<I',config,0,64)
    struct.pack_into('<H',config,14,0xffff)  # DENSITY_NONE
    type_header=20+len(config);entries_start=type_header+4
    entry=p('HHI',8,0,0)+p('HBBI',8,0,3,0)
    typed=p('HHIBBHII',0x0201,type_header,entries_start+len(entry),1,0,0,1,entries_start)+config+p('I',0)+entry
    children=type_strings+keys+spec+typed
    pkg_header=288
    package=(p('HHII',0x0200,pkg_header,pkg_header+len(children),0x7f)+
             pkg.encode('utf-16-le').ljust(256,b'\0')+
             p('IIIII',pkg_header,1,pkg_header+len(type_strings),1,0)+children)
    return p('HHII',2,12,12+len(global_strings)+len(package),1)+global_strings+package

def manifest(main,gradle):
    config=gradle.read_text()
    def value(label):
        return re.search(r'\b'+label+r"\s+['\"]?([.\w]+)",config)[1]
    package=value('applicationId')
    root=ET.parse(main/'AndroidManifest.xml').getroot()
    key=lambda n:'{'+NS+'}'+n
    root.set('package',package);root.set(key('versionCode'),value('versionCode'));root.set(key('versionName'),value('versionName'))
    root.insert(0,ET.Element('uses-sdk',{key('minSdkVersion'):value('minSdk'),key('targetSdkVersion'):value('targetSdk')}))
    strings=list(IDS)
    def keep(s):
        if s not in strings:strings.append(s)
    keep('android');keep(NS)
    def attr_kind(n,v):
        if v in REFERENCES:return 1,REFERENCES[v]
        if n in ENUMS:return 0x10,ENUMS[n][v]
        if n in ('allowBackup','exported','enableOnBackInvokedCallback'):return 0x12,NO if v=='true' else 0
        if n in ('versionCode','minSdkVersion','targetSdkVersion'):return 0x10,int(v)
        return 3,None
    for elem in root.iter():
        keep(elem.tag)
        for name,val in elem.attrib.items():
            n=name.rsplit('}',1)[-1];keep(n)
            if attr_kind(n,val)[0]==3:keep(val)
    idx={s:i for i,s in enumerate(strings)}
    def node(kind,payload):return p('HHIII',kind,16,16+len(payload),1,NO)+payload
    def encode(elem):
        attrs=[]
        for name,val in elem.attrib.items():
            n=name.rsplit('}',1)[-1]; ns=idx[NS] if name.startswith('{') else NO
            typ,number=attr_kind(n,val)
            raw=idx[val] if typ==3 else NO
            attrs.append((IDS[n] if ns!=NO else 0,p('IIIHBBI',ns,idx[n],raw,8,0,typ,raw if typ==3 else number)))
        attrs.sort(key=lambda a:a[0])
        start=p('IIHHHHHH',NO,idx[elem.tag],20,20,len(attrs),0,0,0)+b''.join(a for _,a in attrs)
        return node(0x102,start)+b''.join(encode(c) for c in elem)+node(0x103,p('II',NO,idx[elem.tag]))
    m=p('HHI',0x180,8,8+4*len(IDS))+b''.join(p('I',a) for a in IDS.values())
    ns_data=p('II',idx['android'],idx[NS])
    payload=pool(strings)+m+node(0x100,ns_data)+encode(root)+node(0x101,ns_data)
    return p('HHI',3,8,len(payload)+8)+payload,package
