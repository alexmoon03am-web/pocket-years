#!/usr/bin/env python3
"""Build this offline Android prototype from its Java, XML and bundled assets.

Requires a JDK (17+) and Python with cryptography. Normal Android Studio builds
use app/build.gradle and the standard Android SDK instead.
"""
import argparse
import base64
import datetime as dt
import hashlib
import io
import os
from pathlib import Path
import struct
import tempfile
import zipfile

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.serialization import pkcs12, pkcs7
from cryptography.x509.oid import NameOID

from backup_dex import compile_files
from android_resources import manifest, resource_table
from jvm_to_dex import compile_java, dex

ROOT=Path(__file__).resolve().parents[1]
def p(fmt,*v):return struct.pack('<'+fmt,*v)
def lp(data):return p('I',len(data))+data
def get_identity(directory):
    directory.mkdir(mode=0o700,parents=True,exist_ok=True)
    identity=directory/'development.p12'
    secret=directory/'development.pass'
    if identity.exists() or secret.exists():
        pwd=secret.read_bytes()
        key,cert,_=pkcs12.load_key_and_certificates(identity.read_bytes(),pwd)
        return key,cert
    key=rsa.generate_private_key(public_exponent=65537,key_size=3072)
    name=x509.Name([x509.NameAttribute(NameOID.COMMON_NAME,'Pocket Years Prototype')])
    now=dt.datetime.now(dt.timezone.utc)
    cert=(x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
          .serial_number(x509.random_serial_number()).not_valid_before(now-dt.timedelta(days=1))
          .not_valid_after(now+dt.timedelta(days=7300)).sign(key,hashes.SHA256()))
    pwd=base64.urlsafe_b64encode(os.urandom(36))
    key_data=pkcs12.serialize_key_and_certificates(b'pocketyears',key,cert,None,serialization.BestAvailableEncryption(pwd))
    for dest,data in [(secret,pwd),(identity,key_data)]:
        with os.fdopen(os.open(dest,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as f:f.write(data)
    return key,cert

def jar_sign(files,key,cert):
    def digest(data):return base64.b64encode(hashlib.sha256(data).digest())
    def section(name,h):return b'Name: '+name.encode()+b'\r\nSHA-256-Digest: '+h+b'\r\n\r\n'
    sections={name:section(name,digest(data)) for name,data in files.items()}
    mf=b'Manifest-Version: 1.0\r\nCreated-By: Pocket Years\r\n\r\n'+b''.join(sections.values())
    sf=(b'Signature-Version: 1.0\r\nX-Android-APK-Signed: 2\r\nSHA-256-Digest-Manifest: '+digest(mf)+b'\r\n\r\n'+
        b''.join(section(n,digest(s)) for n,s in sections.items()))
    sig=(pkcs7.PKCS7SignatureBuilder().set_data(sf).add_signer(cert,key,hashes.SHA256())
         .sign(serialization.Encoding.DER,[pkcs7.PKCS7Options.DetachedSignature,pkcs7.PKCS7Options.Binary,pkcs7.PKCS7Options.NoAttributes]))
    return {'META-INF/MANIFEST.MF':mf,'META-INF/POCKET.SF':sf,'META-INF/POCKET.RSA':sig}

def zip_bytes(files):
    buf=io.BytesIO()
    with zipfile.ZipFile(buf,'w') as z:
        for name,data in files.items():
            zi=zipfile.ZipInfo(name,(2026,1,1,0,0,0));zi.external_attr=0o100644<<16;zi.create_system=3
            stored=name in ('resources.arsc','classes.dex','classes2.dex') or name.endswith('.png')
            zi.compress_type=zipfile.ZIP_STORED if stored else zipfile.ZIP_DEFLATED
            if stored:
                # Align data directly, carrying padding in a well-formed private ZIP extra field.
                extra=(-(buf.tell()+30+len(name.encode())))%4
                if extra:zi.extra=p('HH',0xcafe,extra)+bytes(extra)
            z.writestr(zi,data)
    return buf.getvalue()

def apk_sign(raw,key,cert):
    eocd=raw.rfind(b'PK\x05\x06')
    cd=struct.unpack_from('<I',raw,eocd+16)[0]
    assert eocd+22==len(raw)
    sections=[raw[:cd],raw[cd:eocd],raw[eocd:]]
    digests=[]
    for section in sections:
        for i in range(0,len(section),1024*1024):
            chunk=section[i:i+1024*1024];digests.append(hashlib.sha256(b'\xa5'+p('I',len(chunk))+chunk).digest())
    digest=hashlib.sha256(b'\x5a'+p('I',len(digests))+b''.join(digests)).digest()
    alg=p('I',0x0103)
    signed=lp(lp(alg+lp(digest)))+lp(lp(cert.public_bytes(serialization.Encoding.DER)))+lp(b'')
    signature=key.sign(signed,padding.PKCS1v15(),hashes.SHA256())
    spki=key.public_key().public_bytes(serialization.Encoding.DER,serialization.PublicFormat.SubjectPublicKeyInfo)
    signers=lp(lp(lp(signed)+lp(lp(alg+lp(signature)))+lp(spki)))
    pair=p('QI',4+len(signers),0x7109871a)+signers
    size=24+len(pair)
    block=p('Q',size)+pair+p('Q',size)+b'APK Sig Block 42'
    end=bytearray(sections[2]);struct.pack_into('<I',end,16,cd+len(block))
    return sections[0]+block+sections[1]+end

def build(out,identity_dir):
    main=ROOT/'app/src/main'
    xml,package=manifest(main,ROOT/'app/build.gradle')
    with tempfile.TemporaryDirectory() as temp:
        java=next((main/'java').rglob('MainActivity.java'));bytecode=dex(compile_java(java,temp))
        picker=compile_files(java.with_name('SaveFiles.java'),temp)
    files={'AndroidManifest.xml':xml,'resources.arsc':resource_table(package),'classes.dex':bytecode,'classes2.dex':picker}
    for folder in ('res','assets'):
        for file in sorted((main/folder).rglob('*')):
            if file.is_file():files[file.relative_to(main).as_posix()]=file.read_bytes()
    key,cert=get_identity(identity_dir);files={**jar_sign(files,key,cert),**files}
    out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(apk_sign(zip_bytes(files),key,cert))
    print('Built',out.name,'from MainActivity.java,',len(bytecode),'DEX bytes,',len(files),'package entries.')
    print('APK size',out.stat().st_size,'bytes. SHA-256',hashlib.sha256(out.read_bytes()).hexdigest())
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=ROOT/'build/PocketYears.apk')
    parser.add_argument('--identity-dir',type=Path,default=Path.home()/'.android/pocketyears-prototype')
    args=parser.parse_args();build(args.out,args.identity_dir)
