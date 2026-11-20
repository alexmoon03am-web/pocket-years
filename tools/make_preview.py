"""Write a standalone browser version of the same offline game."""
import argparse
import base64
import hashlib
import json
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def preview(out):
    assets=ROOT/'app/src/main/assets'
    source=(assets/'index.html').read_text()
    files={f.stem:'data:image/png;base64,'+base64.b64encode(f.read_bytes()).decode() for f in sorted((assets/'art').glob('*.png'))}
    scripts=[(assets/name).read_text() for name in re.findall(r'<script defer src="([^"]+)"></script>',source)]
    old="function art(name){return 'art/'+name+'.png';}"
    assert scripts[-1].count(old)==1
    scripts[-1]=scripts[-1].replace(old,'const embeddedArt='+json.dumps(files,separators=(',',':'))+';\n  function art(name){return embeddedArt[name];}')
    hashes=["'sha256-"+base64.b64encode(hashlib.sha256(s.encode()).digest()).decode()+"'" for s in scripts]
    source=source.replace("script-src 'self' file:","script-src "+' '.join(hashes))
    source=source.replace('<link rel="stylesheet" href="style.css">','<style>'+ (assets/'style.css').read_text()+'</style>')
    source=re.sub(r'<script defer src="[^"]+"></script>','',source)
    source=source.replace('</body>',''.join('<script>'+s+'</script>' for s in scripts)+'</body>')
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(source)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('out',type=Path);preview(p.parse_args().out)
