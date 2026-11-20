"""Draw Pocket Years' original pixel scenery, character portraits and launcher."""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'app/src/main'
ART = ROOT / 'assets/art'
ART.mkdir(parents=True, exist_ok=True)
W, H = 384, 138
TOWNS = ['cedar', 'briar', 'sunfield']

def color(a, b, t):
    def rgb(v): return tuple(int(v[i:i + 2], 16) for i in (1,3,5))
    return tuple(round(x+(y-x)*t) for x,y in zip(rgb(a), rgb(b)))

def landscape(town, evening):
    rng = random.Random(77 + TOWNS.index(town) * 600)
    im = Image.new('RGB', (W,H))
    d = ImageDraw.Draw(im)
    sky = ('#9cbab5','#ffe1a4') if not evening else ('#9a91aa','#f3bea0')
    for y in range(H):
        d.line((0,y,W,y), fill=color(*sky,min(1,y/72)))
    def rect(x,y,w,h,c):
        if w>0 and h>0: d.rectangle((x,y,x+w-1,y+h-1), fill=c)
    def poly(points,c): d.polygon(points,fill=c)
    def line(points,c,width=1): d.line(points,fill=c,width=width)
    def disk(cx,cy,r,c):
        for dy in range(-r,r+1):
            dx = int(math.sqrt(max(0,r*r-dy*dy)))
            rect(cx-dx,cy+dy,2*dx+1,1,c)
    def cloud(x,y,scale):
        s=scale
        for dx,dy,w,h in [(0,5,34,3),(5,2,21,5),(10,0,10,5),(19,3,11,3),(-4,7,38,1)]:
            rect(x+dx*s,y+dy*s,w*s,h*s,'#fae6bd' if evening else '#f7ebc9')
        rect(x+8*s,y+2*s,10*s,s,'#fff1d5')
    sun_x={'cedar':252,'briar':252,'sunfield':228}[town]
    disk(sun_x,31,17,'#f9dc9e')
    disk(sun_x,31,14,'#fff0b7')
    for x,y,s in [(30,17,1),(105,9,1),(155,30,1),(285,6,1),(319,27,2)]:
        cloud(x,y,s)
    def ridge(points,base,c):
        poly(points + [(W,base),(0,base)],c)
    ridge([(0,60),(20,56),(32,57),(51,49),(66,48),(83,37),(88,37),(97,42),(107,44),(126,57),(144,59),(161,48),(169,46),(184,36),(190,38),(202,46),(213,44),(236,55),(265,53),(288,38),(303,36),(325,47),(337,50),(359,42),(374,46),(384,48)],87,'#afa599' if evening else '#b4bba5')
    ridge([(0,62),(24,59),(43,63),(66,63),(90,52),(108,50),(128,55),(146,47),(154,46),(175,56),(196,62),(211,60),(228,55),(250,59),(276,49),(289,50),(312,59),(331,58),(350,53),(368,59),(384,54)],89,'#95969a' if evening else '#98aca0')
    ridge([(0,71),(19,65),(36,67),(61,63),(85,70),(108,65),(127,67),(143,62),(162,65),(182,63),(201,68),(220,64),(245,68),(263,61),(280,60),(309,67),(334,61),(353,66),(384,59)],89,'#788884' if evening else '#769797')
    # Far shoreline, pines and scattered window lights.
    for x in range(0,W,4):
        yy=74+round(3*math.sin(x/23))
        h=rng.randint(2,9)
        poly([(x-2,yy),(x,yy-h),(x+2,yy)],'#647e78')
    rect(0,76,W,32,'#81a49d' if not evening else '#8b9297')
    for i in range(185):
        y=rng.randrange(77,106);x=rng.randrange(W)
        rect(x,y,rng.randrange(2,14),1,rng.choice(['#a8beb0','#bfd0ae','#d5d2ac','#6e9894']))
    if town=='cedar':
        # A little lighthouse stands across the bay.
        poly([(286,74),(288,53),(294,53),(297,74)],'#f2dcaf')
        rect(288,59,7,4,'#bd6f53');rect(289,51,5,4,'#4e6466')
        poly([(287,51),(291,47),(296,51)],'#9b614e');rect(289,66,2,3,'#64726e')
        poly([(271,76),(281,73),(299,72),(310,76)],'#718572')
        # Sail and reflection.
        poly([(196,84),(201,75),(201,84)],'#fff0c9')
        rect(202,76,1,10,'#767b76');poly([(194,85),(207,85),(204,87),(197,87)],'#765b50')
    elif town=='briar':
        for x in range(210,325,7):
            h=rng.randint(9,22);poly([(x-5,77),(x,77-h),(x+5,77)],'#537d71')
        rect(232,72,40,3,'#90775b')
        for x in range(234,270,8): rect(x,74,2,5,'#716856')
    else:
        for x in (239,287):
            rect(x-2,55,5,20,'#d5b892');rect(x-2,53,5,3,'#947b66')
            for dx,dy in [(9,5),(-9,-5),(5,-9),(-5,9)]:
                line([(x,55),(x+dx,55+dy)],'#826e5d',2)
                line([(x+dx//2,55+dy//2-1),(x+dx,55+dy-1)],'#e8d6ac',2)
        poly([(208,75),(230,68),(262,67),(274,70),(305,64),(340,69),(344,77)],'#b5a66d')
    # Bank and winding footpath.
    poly([(0,88),(30,85),(57,92),(94,96),(126,94),(164,95),(193,93),(225,92),(260,95),(286,93),(320,83),(358,78),(384,80),(384,138),(0,138)],'#687e61')
    poly([(0,92),(39,92),(72,97),(104,99),(141,98),(167,99),(193,95),(226,96),(255,98),(279,98),(311,88),(353,85),(384,84),(384,138),(0,138)],'#93a96e' if not evening else '#8c9971')
    poly([(0,113),(42,111),(84,115),(133,113),(174,111),(198,109),(232,109),(260,104),(284,102),(316,96),(363,94),(384,94),(384,99),(333,102),(309,105),(275,109),(243,116),(211,118),(184,121),(164,127),(145,138),(73,138),(108,127),(150,119),(85,121),(33,117),(0,118)],'#c7b588')
    poly([(0,114),(42,113),(84,117),(134,115),(176,112),(202,110),(234,111),(267,105),(308,100),(356,95),(384,95),(384,97),(326,101),(276,108),(245,113),(215,117),(184,119),(159,126),(136,138),(83,138),(114,127),(160,117),(89,119),(31,116),(0,116)],'#e8cf9d')
    # Tufts with clusters of chamomile, poppies and buttercups.
    for i in range(255):
        x,y=rng.randrange(W),rng.randrange(97,H)
        px=im.getpixel((x,y))
        if px[1] <= px[0]: continue
        c=rng.choice(['#667d56','#9bad6b','#c1c37a','#7f985e'])
        rect(x,y,rng.randrange(1,5),1,c)
        if rng.random()<0.22:
            rect(x+1,y-1,1,2,'#6d885f')
            rect(x,y-2,2,1,rng.choice(['#fae3a9','#f1c172','#de8d72']))
    def house(x,y,w,wall,roof,trim):
        # Foundation and two gables, shutters, glass reflections, chimney.
        hh=int(w*.49);rh=int(w*.43)
        rect(x-2,y-1,w+8,3,'#72815b')
        rect(x,y-hh,w,hh,wall);rect(x+w-7,y-hh,7,hh,trim)
        rect(x+w-11,y-hh-rh+3,5,rh//2+3,'#8a6655')
        rect(x+w-12,y-hh-rh+3,7,2,'#71594c')
        poly([(x-4,y-hh+1),(x+rh-3,y-hh-rh),(x+w-rh+4,y-hh-rh),(x+w+5,y-hh+1)],roof)
        line([(x+rh-2,y-hh-rh),(x+w-rh+3,y-hh-rh),(x+w+5,y-hh+1)],'#80584c')
        for a in range(3,rh-1,3):
            rect(x+rh-a-2,y-hh-rh+a,max(2,w-2*rh+2*a+4),1,'#b37859' if roof!='#717e79' else '#818f81')
        poly([(x+1,y-hh+2),(x+w//3,y-hh-rh+1),(x+2*w//3,y-hh+2)],trim)
        poly([(x+4,y-hh),(x+w//3,y-hh-rh+5),(x+2*w//3-3,y-hh)],wall)
        line([(x-1,y-hh),(x+w//3,y-hh-rh),(x+2*w//3+1,y-hh)],'#795948',2)
        rect(x+w//3-1,y-hh-4,3,4,'#557472')
        rect(x+5,y-hh+6,6,7,'#566766');rect(x+6,y-hh+6,4,5,'#b1cac0')
        rect(x+7,y-hh+6,1,6,'#f1d6a6');rect(x+5,y-hh+9,6,1,'#e5cb9e')
        rect(x+w//2-1,y-10,6,10,'#80634d');rect(x+w//2,y-9,3,4,'#b1c8ae')
        rect(x+w-8,y-hh+4,4,6,'#617672');rect(x+w-7,y-hh+4,2,3,'#e8ce91')
        rect(x-1,y-1,w+2,2,'#9d9075');rect(x+w//2-2,y+1,8,1,'#cfbf97')
    house(76,103,33,'#e3c99a','#917360','#cfb18a')
    house(103,101,23,'#d8ae88','#717e79','#c89b7c')
    house(27,111,46,'#fad7a2','#ac6d53','#e8bb8d')
    def tree(x,y,r,autumn=False):
        trunk='#705a4b'
        rect(x-2,y-r,5,r+2,trunk);rect(x+1,y-r,2,r+1,'#9c7859')
        line([(x,y-4),(x-r//2,y-r+2)],trunk,2);line([(x,y-8),(x+r//2,y-r-2)],trunk,2)
        pal = (['#916e52','#b58153','#cd965d','#e6b16d','#ecd18a'] if autumn
               else ['#4e705b','#63855e','#7e9b67','#9dad6f','#b9bf79'])
        blobs=[(-.64,-.20,.53),(-.43,-.65,.65),(.02,-.91,.68),(.55,-.60,.64),(.72,-.14,.52),(.22,.05,.65),(-.26,.08,.6)]
        cy=y-r
        for dx,dy,sz in blobs:
            cx,yy,rad=x+int(dx*r),cy+int(dy*r),max(2,int(sz*r))
            disk(cx,yy,rad,pal[0]);disk(cx-1,yy-2,rad-1,pal[1])
        for dx,dy,sz in blobs[:-1]:
            cx,yy,rad=x+int(dx*r),cy+int(dy*r)-1,max(2,int(sz*r))
            disk(cx-2,yy-3,max(1,rad-2),pal[2]);disk(cx-3,yy-4,max(1,rad-4),pal[3])
        for _ in range(r*3):
            xx=rng.randrange(max(0,x-r), min(W,x+r+1)); yy=rng.randrange(max(0,cy-r),min(H,cy+r//3+1))
            current=im.getpixel((xx, yy))
            if current in [tuple(bytes.fromhex(c[1:])) for c in pal]:
                rect(xx,yy,rng.choice([1,2,3]),1,rng.choice(pal[1:]))
    tree(12,107,20);tree(130,101,11)
    tree(343,101,20,town!='briar');tree(378,106,24,town=='sunfield')
    # Fence rhythm, stone posts and a tiny red letterbox.
    for a,b,yy in [(0,22,113),(83,99,108),(211,246,102),(290,324,100)]:
        for j in (0,3):rect(a,yy+j,b-a,1,'#dbc7a0')
        for xx in range(a,b,7):
            rect(xx,yy-2,2,7,'#b6a17d');rect(xx,yy-2,1,6,'#f0d8af')
    rect(74,102,2,10,'#8b795d');rect(71,101,7,4,'#bc7257');rect(74,100,3,1,'#e6aa78')
    for bx,by in [(166,24),(172,22),(222,35)]:
        line([(bx-2,by-1),(bx,by),(bx+2,by-1)],'#74847e')
    # Low textured foreground makes a distinct frame at the corners.
    for xx in list(range(-1,54,3))+list(range(294,388,3)):
        yy=H-round(3+6*abs(xx-W/2)/(W/2))+rng.randint(-3,5)
        if xx<0: continue
        rect(xx,yy,4,H-yy,'#6a875d');rect(xx,yy,2,1,'#a9b378')
        if xx%4==0:
            rect(xx+1,yy-3,1,4,'#627d57');rect(xx,yy-4,3,2,'#e8b980')
    im.save(ART/f'{town}{"-evening" if evening else ""}.png', optimize=True)

def pixel_image(pattern,palette):
    im=Image.new('RGBA',(len(pattern[0]),len(pattern)))
    for y,row in enumerate(pattern):
        for x,letter in enumerate(row):
            if letter!='.':im.putpixel((x,y),tuple(bytes.fromhex(palette[letter][1:]))+(255,))
    return im

def portraits():
    shades=[('#925e46','#b97652','#edb486','#523f3c'),('#bb7e5f','#e4a47e','#f4c8a3','#715349'),('#805342','#a26b50','#cd9068','#353b3d'),('#bc815e','#e3a574','#f2c395','#a86f43')]
    baby=['................','.....hhhh.......','....hssslhh.....','...hssslslhh....','...dllllllld....','..dlllcllclld...','..dllllllllld...','...dslllllsd....','....dssllsd.....','..bbttttttbb....','.bttttwwttttb...','.bttwwwwwwttb...','.bttttwwttttb...','..bttttttttb....','...bbttttbb.....','.....bbbb.......']
    grown=['.....hhhh.......','...hhHHHHhh.....','..hHHHHHHHHh....','..hHHHHHssHh....','..hHHsslllsh....','..dhllllllhd....','..dlllcllcld....','...slllllls.....','...dsllllsd.....','....dssssd......','....blllsb......','..bbttslt tbb...'.replace(' ',''),'.bttttstttttb...','bttwttttttwttb..','bttwttttttwttb..','bbbwwwwwwwwbbb..']
    for skin,(dark,mid,light,hair) in enumerate(shades):
        for stage in range(4):
            pal={'d':dark,'s':mid,'l':light,'h':hair if stage<3 else '#777a78','H':('#8c6c55' if skin in (1,3) else '#574747') if stage<3 else '#b8b6a4','c':'#3a3c42','b':'#526d6a','t':['#a4c4aa','#e6a769','#8bafb5','#bd9aa6'][stage],'w':['#d8e5c4','#f6d78d','#d5dcd0','#e1c4b2'][stage]}
            pat=baby if stage==0 else list(grown)
            if stage==1: pat[0]='................'
            image=pixel_image(pat,pal)
            image.save(ART/f'person-{skin}-{stage}.png')
    # Brand mark: open book in cream, a warm spark between the pages.
    im=Image.new('RGBA',(32,32)); d=ImageDraw.Draw(im)
    d.rounded_rectangle((0,0,31,31),radius=7,fill='#204f48')
    d.polygon([(5,13),(8,12),(11,12),(14,14),(15,15),(15,25),(12,23),(8,22),(5,22)],fill='#f4e6c7')
    d.polygon([(17,15),(21,12),(26,12),(26,22),(22,22),(17,25)],fill='#f0c982')
    d.line([(5,24),(9,24),(14,26)],fill='#99b599');d.line([(18,26),(22,24),(26,24)],fill='#99b599')
    for x,y in [(15,4),(14,5),(15,5),(16,5),(15,6),(21,6),(20,7),(21,7),(22,7),(21,8)]:
        d.point((x,y),fill='#ecb56f')
    d.rectangle((12,9,13,10),fill='#fff3c9')
    im.save(ART/'mark.png')
    # Keep the mark inside the launcher's safe zone for launchers that mask icons.
    icon = Image.new('RGBA',(96,96))
    di=ImageDraw.Draw(icon);di.rounded_rectangle((5,5,90,90),radius=21,fill='#204f48')
    ico=im.resize((72,72),Image.Resampling.NEAREST)
    icon.alpha_composite(ico,(12,12))
    icon.resize((192,192),Image.Resampling.NEAREST).save(ROOT/'res/drawable-nodpi/ic_launcher.png')

if __name__=='__main__':
    for town in TOWNS:
        for evening in (False,True): landscape(town,evening)
    portraits()
