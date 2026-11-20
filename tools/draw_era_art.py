"""Draw the original, offline chapter illustrations at the journal's pixel-art scale."""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw, ImageColor

ART = Path(__file__).resolve().parents[1] / 'app/src/main/assets/art'
WIDTH, HEIGHT = 288, 80
PALETTES = {
    'medieval': ('#3b3223','#735932','#ddad5c','#fff0b9'),
    'renaissance': ('#302b41','#765651','#c79a6b','#f1e4be'),
    'industrial': ('#2b3641','#66716f','#b48757','#e8dfbf'),
    'press': ('#3b312c','#816c58','#cea77d','#f2e6c9'),
    'midcentury': ('#204644','#5c9590','#edaa74','#fbe6ac'),
    'terminal': ('#092c2c','#224e43','#66bc97','#b2e2a7'),
    'web': ('#143a69','#4d89ad','#8bd3df','#e0f9f2'),
    'future': ('#202b4c','#48527a','#94cacf','#dec9f3')
}


def draw(name, colors):
    ink, mid, accent, shine = colors
    rng = random.Random(name)
    img = Image.new('RGB',(WIDTH,HEIGHT))
    d = ImageDraw.Draw(img)
    first, last = map(ImageColor.getrgb, (ink, mid))
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        d.line((0,y,WIDTH,y), fill=tuple(round(a*(1-t)+b*t) for a,b in zip(first,last)))
    for _ in range(205):
        x,y=rng.randrange(WIDTH),rng.randrange(HEIGHT)
        r,g,b=img.getpixel((x,y))
        d.point((x,y),fill=(min(255,r+8),min(255,g+8),min(255,b+6)))
    if name=='medieval':
        # Terraces and ripe grain.
        for i in range(4):
            line=[(x,38+i*9+round(4*math.sin(x/45+i*.8))) for x in range(-4,WIDTH+7,5)]
            d.line(line, fill=accent if i%2 else mid,width=2)
            d.line([(x,y+3) for x,y in line],fill=ink)
        for x,h,lean in [(115,44,-7),(126,53,3),(139,48,12),(179,45,7),(212,54,4),(230,49,-6),(249,46,8)]:
            d.line((x,82,x+lean,77-h),fill=shine,width=2)
            for j in range(6):
                y=77-h+j*3;s=x+lean-round(lean*j*.045)
                for side in (-1,1):
                    d.polygon([(s,y+6),(s+side*5,y+2),(s+side*7,y-4),(s+side*3,y-2)],fill=accent if side<0 else shine)
    elif name=='renaissance':
        for x in range(20,WIDTH,30):
            d.arc((x-19,11,x+58,100),210,300,fill=mid)
        for cx,cy,r in [(125,51,29),(219,35,24)]:
            d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=accent,width=2)
            d.ellipse((cx-r+4,cy-r+4,cx+r-4,cy+r-4),outline=accent)
            for i in range(16):
                a=i*math.pi/8
                d.line((cx+(r-4)*math.cos(a),cy+(r-4)*math.sin(a),cx+r*math.cos(a),cy+r*math.sin(a)),fill=shine)
            for i in range(8):
                a=i*math.pi/4
                d.polygon([(cx,cy),(cx+5*math.cos(a+.85),cy+5*math.sin(a+.85)),(cx+(r-8)*math.cos(a),cy+(r-8)*math.sin(a))],fill=shine if i%2 else accent)
        d.line((76,73,272,13),fill=accent)
    elif name=='industrial':
        for x in range(0,WIDTH,29):
            d.line((x,74,x+20,66,x+29,74),fill=accent,width=2)
        d.line((0,64,288,64),fill=shine,width=2)
        for x in (110,177):
            d.rectangle((x,43,x+43,60),fill=ink,outline=accent)
            for i in range(4):d.rectangle((x+4+i*9,46,x+9+i*9,51),fill=shine)
        d.rounded_rectangle((222,42,259,58),radius=6,fill=ink,outline=accent)
        d.rectangle((219,32,233,59),fill=ink,outline=accent)
        d.rectangle((247,29,252,42),fill=ink,outline=accent)
        for x in (117,146,184,212,225,240,253):
            d.ellipse((x-3,57,x+3,63),fill=ink,outline=shine)
        for x,y,r in [(247,24,4),(239,20,5),(227,16,7),(213,15,6),(199,12,4)]:
            d.ellipse((x-r,y-r,x+r,y+r),fill=mid)
    elif name=='press':
        # A folded morning newspaper in two columns.
        for x,y,w in [(102,18,86),(180,10,78)]:
            d.polygon([(x,y+5),(x+w,y),(x+w+8,62),(x+5,70)],fill=accent,outline=ink)
            d.line((x+6,y+13,x+w-5,y+9),fill=ink,width=3)
            for n in range(7):
                for ofs in (8,w//2+3):
                    d.line((x+ofs+n//3,y+20+5*n,x+ofs+w//2-8,y+18+5*n),fill=ink)
            d.rectangle((x+10,y+18,x+w//2-2,y+33),fill=mid)
            d.polygon([(x+10,y+33),(x+19,y+23),(x+24,y+28),(x+28,y+25),(x+w//2-2,y+33)],fill=shine)
    elif name=='midcentury':
        for x,y,r in [(72,24,9),(140,11,5),(260,42,14),(104,60,6)]:
            d.line((x-r,y,x+r,y),fill=shine);d.line((x,y-r,x,y+r),fill=shine)
        d.line((152,25,200,2),fill=shine,width=2)
        d.rounded_rectangle((137,25,236,69),radius=8,fill=accent,outline=ink,width=3)
        d.rectangle((145,33,197,60),fill=ink)
        for y in range(35,60,3):d.line((148,y,194,y),fill=mid)
        d.rectangle((202,34,227,41),fill=shine);d.line((212,34,212,40),fill=ink)
        for x in (208,222):d.ellipse((x-5,48,x+5,58),fill=mid,outline=ink)
        d.rectangle((146,69,153,72),fill=ink);d.rectangle((216,69,222,72),fill=ink)
    elif name=='terminal':
        for x in range(0,WIDTH,16):
            d.line((144,46,x*2-144,80),fill=mid)
        for y in (48,51,56,64,78):d.line((0,y,WIDTH,y),fill=mid)
        d.rounded_rectangle((151,9,216,56),radius=4,fill=mid,outline=shine,width=2)
        d.rounded_rectangle((157,14,210,48),radius=5,fill=ink,outline=accent)
        d.line((163,21,167,24,163,27),fill=shine,width=2)
        d.line((170,27,178,27),fill=shine,width=2)
        d.rectangle((176,57,192,62),fill=mid,outline=accent)
        d.polygon([(155,62),(211,62),(224,72),(144,72)],fill=mid,outline=shine)
        for j in range(3):
            for x in range(157-j,211,6):d.line((x,64+j*2,x+3,64+j*2),fill=ink)
    elif name=='web':
        for r in (47,34,22):d.arc((66-r,38-r,66+r,38+r),190,339,fill=mid,width=2)
        d.rounded_rectangle((140,9,224,64),radius=5,fill=shine,outline=ink,width=2)
        d.rectangle((144,13,220,21),fill=mid)
        for x in (207,213):d.rectangle((x,15,x+3,18),fill=shine)
        d.ellipse((164,25,193,54),outline=mid,width=2)
        for inset in (6,11):d.ellipse((164+inset,26,193-inset,53),outline=mid)
        for y in (34,44):d.line((166,y,191,y),fill=mid)
        d.polygon([(201,42),(201,65),(207,59),(212,68),(216,65),(210,57),(219,57)],fill=ink,outline=shine)
    else:
        for _ in range(95):
            x,y=rng.randrange(WIDTH),rng.randrange(HEIGHT)
            d.point((x,y),fill=accent)
        d.ellipse((189,15,219,45),fill=mid,outline=shine)
        d.arc((165,24,244,42),0,359,fill=accent,width=2)
        for x,y in [(82,49),(151,30),(243,48)]:
            d.line((x-13,y+6,x+15,y-7),fill=shine,width=2)
            d.rectangle((x-4,y-4,x+4,y+4),fill=accent,outline=ink)
            d.polygon([(x-23,y+7),(x-10,y),(x-6,y+5),(x-20,y+12)],fill=mid,outline=accent)
            d.polygon([(x+7,y-4),(x+21,y-11),(x+24,y-6),(x+10,y+1)],fill=mid,outline=accent)
    img.save(ART/('era-'+name+'.png'), optimize=True)


if __name__=='__main__':
    for theme, palette in PALETTES.items():
        draw(theme, palette)
