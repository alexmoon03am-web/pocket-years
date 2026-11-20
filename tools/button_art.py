"""Draw the game's full-color, 16-pixel button sprites on a transparent canvas."""
from contextlib import contextmanager
from PIL import Image, ImageDraw

INK = '#2e4542'
PAPER, LIGHT, GOLD = '#fbebc4', '#fff5dc', '#e6b85e'
OCHRE, BROWN, LEATHER = '#a16d3b', '#815448', '#c5835f'
CORAL, RED, ROSE = '#dd8b79', '#b65c55', '#f3c1a2'
MINT, TEAL, GREEN = '#a4c9b2', '#5a9284', '#547d5e'
SKY, BLUE, LILAC = '#a5c5ce', '#64849e', '#a69ab8'
STEEL = '#819592'


def draw_buttons(directory):
    @contextmanager
    def sprite(name):
        image = Image.new('RGBA', (16, 16))
        yield ImageDraw.Draw(image)
        image.save(directory / (name + '.png'), optimize=True)

    with sprite('age-up') as d:
        d.rounded_rectangle((1,3,14,14), radius=2, fill=PAPER, outline=INK)
        d.rectangle((2,4,13,6), fill=CORAL)
        d.line((2,7,13,7), fill=BROWN)
        for x in (4,10):
            d.rectangle((x,1,x+1,4), fill=INK)
        d.line((6,10,10,10), fill=GREEN, width=2)
        d.line((8,8,8,12), fill=GREEN, width=2)

    with sprite('school') as d:
        d.polygon([(3,8),(8,10),(12,8),(12,11),(8,13),(3,11)], fill=BLUE, outline=INK)
        d.polygon([(0,6),(7,2),(9,2),(15,5),(9,9),(7,9)], fill=TEAL, outline=INK)
        d.line([(4,5),(8,3),(11,4)], fill=MINT)
        d.line([(8,5),(14,6),(14,11)], fill=OCHRE)
        d.rectangle((13,10,15,12), fill=GOLD)

    with sprite('bag') as d:
        d.rounded_rectangle((5,2,10,6), radius=1, outline=INK, width=2)
        d.rounded_rectangle((1,5,14,13), radius=2, fill=BROWN, outline=INK)
        d.rounded_rectangle((1,5,14,10), radius=2, fill=LEATHER, outline=INK)
        d.line((3,6,12,6), fill=ROSE)
        d.rectangle((7,8,8,10), fill=GOLD)

    with sprite('wallet') as d:
        d.polygon([(2,6),(10,1),(12,2),(13,6)], fill=MINT, outline=INK)
        d.line((6,5,10,3), fill=GREEN)
        d.rounded_rectangle((1,5,14,13), radius=2, fill=LEATHER, outline=INK)
        d.line((3,7,12,7), fill=ROSE)
        d.rectangle((10,8,15,11), fill=BROWN, outline=INK)
        d.point((12,9), fill=GOLD)

    with sprite('people') as d:
        d.rounded_rectangle((8,8,15,13), radius=2, fill=TEAL, outline=INK)
        d.ellipse((9,3,14,8), fill=ROSE, outline=INK)
        d.line([(10,4),(11,3),(13,4)], fill=BROWN)
        d.rounded_rectangle((0,9,10,14), radius=2, fill=BLUE, outline=INK)
        d.ellipse((2,2,8,9), fill=GOLD, outline=INK)
        d.line([(3,5),(3,4),(4,3),(7,3)], fill=BROWN)
        d.line((2,11,6,11), fill=SKY)

    with sprite('compass') as d:
        d.ellipse((1,1,14,14), fill=GOLD, outline=INK)
        d.ellipse((3,3,12,12), fill=PAPER, outline=OCHRE)
        d.polygon([(11,4),(9,9),(6,7)], fill=RED)
        d.polygon([(4,11),(6,7),(9,9)], fill=TEAL)
        d.point((7,8), fill=INK)

    with sprite('home') as d:
        d.rectangle((3,7,12,14), fill=PAPER, outline=INK)
        d.rectangle((10,3,12,6), fill=LEATHER, outline=INK)
        d.polygon([(0,8),(7,1),(8,1),(15,8),(13,9),(8,5),(7,5),(2,9)], fill=CORAL, outline=INK)
        d.rectangle((8,9,10,14), fill=TEAL, outline=INK)
        d.rectangle((4,10,6,12), fill=SKY, outline=INK)

    with sprite('sprout') as d:
        d.line([(7,12),(7,8),(10,6)], fill=INK, width=2)
        d.polygon([(7,9),(3,9),(1,7),(1,4),(5,4),(7,6)], fill=MINT, outline=INK)
        d.polygon([(8,7),(8,4),(11,2),(14,2),(13,6),(10,8)], fill=TEAL, outline=INK)
        d.polygon([(2,14),(4,12),(7,11),(10,12),(13,14)], fill=LEATHER, outline=INK)

    with sprite('journal') as d:
        d.rounded_rectangle((2,1,13,14), radius=2, fill=PAPER, outline=INK)
        d.rectangle((3,2,12,11), fill=TEAL, outline=INK)
        d.line((5,2,5,11), fill=MINT)
        d.rectangle((7,5,11,7), fill=PAPER)
        d.line((4,13,11,13), fill=OCHRE)
        d.polygon([(9,11),(11,11),(11,15),(10,14),(9,15)], fill=RED)

    with sprite('book') as d:
        d.polygon([(0,3),(4,3),(7,5),(8,5),(11,3),(15,3),(15,12),(11,12),(8,14),(7,14),(4,12),(0,12)], fill=BLUE, outline=INK)
        d.polygon([(1,2),(4,2),(7,4),(7,12),(4,10),(1,10)], fill=PAPER, outline=INK)
        d.polygon([(8,4),(11,2),(14,2),(14,10),(11,10),(8,12)], fill=LIGHT, outline=INK)
        d.line((2,5,5,6), fill=OCHRE)
        d.line((10,7,13,6), fill=OCHRE)

    with sprite('coin') as d:
        d.ellipse((2,2,14,14), fill=OCHRE, outline=INK)
        d.ellipse((1,1,13,13), fill=GOLD, outline=INK)
        d.arc((3,3,11,11), 160, 270, fill=LIGHT)
        d.line([(5,6),(7,4),(7,10)], fill=OCHRE, width=2)
        d.line((5,10,9,10), fill=OCHRE)

    with sprite('sun') as d:
        for a,b in [((7,0),(7,2)),((7,13),(7,15)),((0,7),(2,7)),((13,7),(15,7)),((2,2),(3,3)),((12,12),(13,13)),((12,3),(13,2)),((3,12),(2,13))]:
            d.line([a,b], fill=OCHRE, width=2)
        d.ellipse((3,3,12,12), fill=GOLD, outline=INK)
        d.arc((5,5,10,10), 165, 275, fill=LIGHT)

    with sprite('heart') as d:
        d.polygon([(1,4),(3,2),(5,2),(7,4),(8,4),(10,2),(12,2),(14,4),(14,7),(8,14),(7,14),(1,8)], fill=CORAL, outline=INK)
        d.line([(3,6),(3,4),(5,4)], fill=LIGHT)
        d.line([(8,12),(12,8)], fill=RED)

    with sprite('broken-heart') as d:
        d.polygon([(0,4),(2,2),(5,2),(7,4),(5,7),(7,9),(5,12),(0,7)], fill=CORAL, outline=INK)
        d.polygon([(9,5),(11,3),(13,3),(15,5),(15,8),(8,14),(9,9),(7,7)], fill=ROSE, outline=INK)
        d.point((3,4),fill=LIGHT)

    with sprite('spark') as d:
        d.polygon([(7,0),(9,5),(14,7),(9,9),(7,15),(5,10),(0,7),(5,5)], fill=GOLD, outline=INK)
        d.line((7,4,7,9), fill=LIGHT)
        d.rectangle((13,1,14,2), fill=OCHRE)

    with sprite('gift') as d:
        d.rectangle((3,7,12,14), fill=TEAL, outline=INK)
        d.rectangle((1,5,14,8), fill=MINT, outline=INK)
        d.rectangle((7,6,8,13), fill=GOLD)
        d.polygon([(7,5),(4,4),(3,2),(5,1),(7,3),(8,4),(10,1),(12,2),(11,4),(9,5)], fill=CORAL, outline=INK)

    with sprite('camera') as d:
        d.rectangle((4,2,9,5), fill=STEEL, outline=INK)
        d.rounded_rectangle((0,4,15,13), radius=2, fill=TEAL, outline=INK)
        d.line((1,6,14,6), fill=MINT)
        d.ellipse((5,5,11,11), fill=PAPER, outline=INK)
        d.ellipse((7,7,9,9), fill=BLUE, outline=INK)
        d.point((12,6), fill=LIGHT)

    with sprite('music') as d:
        d.polygon([(5,4),(13,2),(13,11),(12,12),(11,12),(11,5),(6,6),(6,12),(5,13),(4,13)], fill=TEAL, outline=INK)
        d.ellipse((1,10,6,14), fill=TEAL, outline=INK)
        d.ellipse((9,8,13,12), fill=MINT, outline=INK)

    with sprite('car') as d:
        d.polygon([(0,9),(3,8),(5,4),(10,4),(13,8),(15,9),(15,12),(0,12)], fill=CORAL, outline=INK)
        d.polygon([(4,8),(6,5),(9,5),(11,8)], fill=SKY, outline=INK)
        d.line((8,5,8,8),fill=INK)
        for x in (2,10):
            d.ellipse((x,10,x+3,14), fill=INK)
            d.point((x+1,12), fill=SKY)
        d.point((14,10), fill=GOLD)

    with sprite('van') as d:
        d.polygon([(1,4),(10,4),(12,5),(15,9),(15,12),(0,12),(0,6)], fill=MINT, outline=INK)
        d.rectangle((1,5,7,8), fill=SKY, outline=INK)
        d.polygon([(9,5),(11,6),(13,8),(9,8)], fill=BLUE, outline=INK)
        d.line((1,10,13,10), fill=TEAL)
        for x in (2,10):
            d.ellipse((x,10,x+3,14), fill=INK)
            d.point((x+1,12),fill=PAPER)

    with sprite('grid') as d:
        for x,y,c in [(1,1,MINT),(8,1,GOLD),(1,8,SKY),(8,8,CORAL)]:
            d.rounded_rectangle((x,y,x+5,y+5),radius=1,fill=c,outline=INK)

    with sprite('tools') as d:
        d.polygon([(2,12),(9,5),(9,3),(11,1),(13,1),(11,4),(12,5),(15,3),(15,6),(13,8),(11,8),(4,15),(2,15),(1,14)], fill=STEEL, outline=INK)
        d.line([(2,2),(4,2),(7,5),(5,7),(2,4)], fill=OCHRE, width=2)
        d.line((6,6,13,13), fill=INK, width=3)
        d.line((9,9,13,13), fill=CORAL, width=2)

    with sprite('back') as d:
        d.line([(7,3),(2,8),(7,13)], fill=INK, width=2)
        d.line((3,8,14,8), fill=INK, width=2)

    with sprite('save') as d:
        d.polygon([(2,1),(11,1),(14,4),(14,14),(2,14)], fill=TEAL, outline=INK)
        d.rectangle((4,2,10,6),fill=SKY,outline=INK)
        d.rectangle((8,3,9,5),fill=INK)
        d.rectangle((4,8,12,13),fill=PAPER,outline=INK)
        d.line((6,10,10,10),fill=OCHRE)

    with sprite('coffee') as d:
        d.arc((3,0,6,3), 0,170,fill=STEEL)
        d.line([(8,1),(7,2),(8,3)],fill=STEEL)
        d.rounded_rectangle((10,5,15,10),radius=2,outline=INK,width=2)
        d.polygon([(1,4),(11,4),(11,10),(8,13),(5,13),(2,10)],fill=CORAL,outline=INK)
        d.line((3,5,9,5),fill=BROWN)
        d.line((3,7,3,9),fill=ROSE)
        d.line((1,14,13,14),fill=INK)

    with sprite('newspaper') as d:
        d.rectangle((11,5,15,12),fill=STEEL,outline=INK)
        d.rounded_rectangle((1,2,13,13),radius=1,fill=LIGHT,outline=INK)
        d.line((3,4,11,4),fill=BLUE,width=2)
        d.rectangle((3,7,6,10),fill=TEAL,outline=INK)
        for y in (7,9,11):
            d.line((8,y,11,y),fill=STEEL)

    with sprite('flask') as d:
        d.polygon([(5,1),(10,1),(10,3),(9,3),(9,6),(14,12),(13,14),(2,14),(1,12),(6,6),(6,3),(5,3)],fill=SKY,outline=INK)
        d.polygon([(5,9),(10,9),(13,12),(12,13),(3,13),(2,12)],fill=TEAL)
        d.rectangle((5,10,6,11),fill=LIGHT)
        d.point((9,12),fill=MINT)

    with sprite('bike') as d:
        d.ellipse((0,8,6,14),fill=PAPER,outline=INK)
        d.ellipse((9,8,15,14),fill=PAPER,outline=INK)
        d.line([(3,11),(6,6),(8,11),(3,11),(9,6),(12,11)], fill=TEAL,width=2)
        d.line([(10,6),(9,3),(12,3)], fill=INK)
        d.line((4,5,7,5),fill=BROWN,width=2)

    with sprite('keyboard') as d:
        d.rounded_rectangle((0,3,15,12),radius=2,fill=TEAL,outline=INK)
        d.rectangle((2,6,13,11),fill=LIGHT,outline=INK)
        for x in (4,7,10):
            d.line((x,6,x,10),fill=STEEL)
            d.line((x,6,x,8),fill=INK,width=2)
        d.point((2,4),fill=GOLD)

    with sprite('baby') as d:
        d.polygon([(1,8),(4,4),(12,4),(15,8),(13,12),(8,15),(3,12)],fill=MINT,outline=INK)
        d.ellipse((4,1,12,9),fill=ROSE,outline=INK)
        d.line([(7,3),(8,2),(9,3)],fill=BROWN)
        d.point((6,5),fill=INK)
        d.point((10,5),fill=INK)
        d.line([(2,7),(8,11),(13,8)],fill=TEAL,width=2)

    with sprite('pencil') as d:
        d.polygon([(1,14),(2,10),(10,2),(12,1),(15,4),(6,13)],fill=GOLD,outline=INK)
        d.polygon([(10,3),(12,1),(15,4),(13,6)],fill=CORAL,outline=INK)
        d.line((4,10,10,4),fill=LIGHT)
        d.polygon([(2,10),(5,13),(1,14)],fill=PAPER,outline=INK)

    with sprite('chat') as d:
        d.rounded_rectangle((1,2,14,11),radius=3,fill=MINT,outline=INK)
        d.polygon([(4,10),(4,14),(8,10)],fill=MINT,outline=INK)
        d.line((5,10,7,10),fill=MINT)
        for x in (4,7,10):
            d.point((x,6),fill=INK)

    with sprite('mic') as d:
        d.rounded_rectangle((5,1,10,9),radius=2,fill=SKY,outline=INK)
        d.line((6,3,9,3),fill=BLUE)
        d.line((6,5,9,5),fill=BLUE)
        d.line([(3,6),(3,9),(5,11),(10,11),(12,9),(12,6)],fill=INK,width=2)
        d.line((8,11,8,14),fill=INK,width=2)
        d.line((5,14,11,14),fill=INK,width=2)

    with sprite('bread') as d:
        d.rounded_rectangle((1,4,14,12),radius=4,fill=OCHRE,outline=INK)
        d.rounded_rectangle((2,4,13,10),radius=3,fill=GOLD)
        for x in (4,7,10):
            d.line((x,7,x+1,5),fill=PAPER,width=2)

    with sprite('letter') as d:
        d.rounded_rectangle((1,3,14,12),radius=1,fill=PAPER,outline=INK)
        d.line([(2,11),(6,8)],fill=OCHRE)
        d.line([(13,11),(9,8)],fill=OCHRE)
        d.line([(1,4),(7,8),(8,8),(14,4)], fill=INK)
        d.rectangle((7,8,8,9),fill=RED)

    with sprite('flag') as d:
        d.line((3,1,3,14),fill=INK,width=2)
        d.polygon([(4,2),(8,2),(10,4),(14,3),(13,9),(9,10),(7,7),(4,7)],fill=CORAL,outline=INK)
        d.line((5,3,7,3),fill=ROSE)

    with sprite('palette') as d:
        d.polygon([(2,4),(5,2),(10,2),(13,4),(15,7),(14,9),(11,9),(10,11),(11,13),(8,14),(4,13),(1,10),(0,7)],fill=PAPER,outline=INK)
        for x,y,c in [(3,5,CORAL),(7,3,TEAL),(11,5,BLUE),(3,9,GOLD)]:
            d.rectangle((x,y,x+1,y+1),fill=c)
        d.ellipse((7,9,9,11),fill=(0,0,0,0),outline=INK)

    with sprite('bowl') as d:
        d.ellipse((0,5,15,9),fill=PAPER,outline=INK)
        d.polygon([(1,8),(14,8),(12,12),(10,14),(5,14),(3,12)],fill=TEAL,outline=INK)
        d.line((2,9,12,9),fill=MINT)
        d.line((9,7,13,2),fill=BROWN,width=2)

    with sprite('shop') as d:
        d.rectangle((2,6,13,14),fill=PAPER,outline=INK)
        d.polygon([(3,2),(12,2),(15,6),(15,8),(0,8),(0,6)],fill=CORAL,outline=INK)
        d.line((5,3,4,7),fill=LIGHT,width=2)
        d.line((9,3,10,7),fill=LIGHT,width=2)
        d.rectangle((4,9,7,12),fill=SKY,outline=INK)
        d.rectangle((9,9,11,14),fill=TEAL,outline=INK)

    with sprite('code') as d:
        d.rounded_rectangle((1,2,14,11),radius=1,fill=INK)
        d.rectangle((2,3,13,10),fill=BLUE)
        d.line([(6,5),(4,6),(6,8)],fill=LIGHT)
        d.line([(9,5),(11,6),(9,8)],fill=MINT)
        d.line((7,12,8,12),fill=INK,width=2)
        d.line((4,14,11,14),fill=INK)

    with sprite('bolt') as d:
        d.polygon([(8,0),(13,0),(10,6),(14,6),(5,15),(7,9),(2,9)],fill=GOLD,outline=INK)
        d.line((6,7,9,3),fill=LIGHT)

    with sprite('guitar') as d:
        d.polygon([(6,7),(11,2),(12,1),(14,3),(13,5),(12,5),(8,9),(8,12),(6,14),(3,14),(1,12),(1,10),(3,8)],fill=LEATHER,outline=INK)
        d.ellipse((4,9,6,11),fill=INK)
        d.line((7,8,12,3),fill=GOLD)

    with sprite('basket') as d:
        d.line([(3,7),(5,3),(7,2),(9,2),(12,7)],fill=INK,width=2)
        d.polygon([(1,7),(14,7),(12,13),(10,14),(4,14),(2,12)],fill=GOLD,outline=INK)
        d.line((2,8,13,8),fill=OCHRE)
        d.line((5,10,6,12),fill=OCHRE)
        d.line((10,10,9,12),fill=OCHRE)

    with sprite('tag') as d:
        d.polygon([(1,9),(8,2),(13,2),(14,3),(14,8),(7,15)],fill=GOLD,outline=INK)
        d.ellipse((10,4,12,6),fill=PAPER,outline=INK)
        d.line([(12,4),(14,1),(15,1)],fill=INK)

    with sprite('pause') as d:
        for x in (3,9):
            d.rounded_rectangle((x,2,x+3,13),radius=1,fill=TEAL,outline=INK)

    with sprite('exit') as d:
        d.rectangle((1,2,8,13),fill=LEATHER,outline=INK)
        d.line((4,3,4,12),fill=ROSE)
        d.line((6,8,14,8),fill=INK,width=2)
        d.line([(11,5),(14,8),(11,11)],fill=INK,width=2)

    with sprite('archive') as d:
        d.rounded_rectangle((2,5,13,13),radius=1,fill=TEAL,outline=INK)
        d.rectangle((1,3,14,6),fill=MINT,outline=INK)
        d.rectangle((5,8,10,10),fill=PAPER,outline=INK)

    with sprite('frame') as d:
        d.rectangle((1,2,14,13),fill=PAPER,outline=INK)
        d.rectangle((3,4,12,10),fill=SKY)
        d.rectangle((4,5,5,6),fill=GOLD)
        d.polygon([(3,10),(6,7),(8,9),(10,6),(12,9),(12,10)],fill=GREEN)

    with sprite('phone') as d:
        d.rounded_rectangle((3,0,12,15),radius=2,fill=STEEL,outline=INK)
        d.rectangle((5,3,10,10),fill=SKY,outline=INK)
        d.line((6,6,8,4),fill=LIGHT)
        d.line((7,13,8,13),fill=PAPER)

    with sprite('family-tree') as d:
        d.line([(8,4),(8,8),(3,8),(3,11)], fill=GREEN, width=2)
        d.line([(8,8),(12,8),(12,11)], fill=GREEN, width=2)
        for x,y,color in [(7,1,GOLD),(2,10,MINT),(11,10,ROSE)]:
            d.rounded_rectangle((x-1,y,x+3,y+4), radius=1, fill=color, outline=INK)

    with sprite('passport') as d:
        d.rounded_rectangle((2,1,13,14), radius=2, fill=TEAL, outline=INK)
        d.ellipse((5,3,11,9), fill=MINT, outline=INK)
        d.line((7,4,8,8), fill=GREEN)
        d.line((6,11,10,11), fill=GOLD)

    with sprite('world-index') as d:
        d.ellipse((1,1,12,12), fill=SKY, outline=INK)
        d.polygon([(3,4),(6,2),(8,5),(5,8)], fill=GREEN)
        d.polygon([(8,8),(11,7),(10,11),(8,10)], fill=TEAL)
        d.line([(5,14),(8,11),(10,12),(14,7)], fill=BROWN, width=2)
        d.line([(11,7),(14,7),(14,10)], fill=GOLD)

    with sprite('dog') as d:
        d.ellipse((3,2,12,14), fill=GOLD, outline=INK)
        d.polygon([(2,2),(5,3),(4,8),(2,10),(1,8)], fill=LEATHER, outline=INK)
        d.polygon([(13,2),(10,3),(11,8),(13,10),(14,8)], fill=LEATHER, outline=INK)
        d.ellipse((5,8,10,13), fill=PAPER)
        for x in (5,10):
            d.point((x,7), fill=INK)
        d.line((7,9,8,9), fill=INK)
        d.line((7,10,7,11), fill=INK)
        d.point((8,12), fill=CORAL)

    with sprite('cat') as d:
        d.polygon([(2,2),(6,5),(9,5),(13,2),(13,9),(12,12),(9,14),(6,14),(3,12),(2,9)], fill=LEATHER, outline=INK)
        d.polygon([(3,4),(5,6),(3,7)], fill=ROSE)
        d.polygon([(12,4),(10,6),(12,7)], fill=ROSE)
        for x in (5,9):
            d.line((x,8,x+1,8), fill=INK)
        d.point((7,10), fill=PAPER)
        d.point((8,10), fill=ROSE)
        d.line((0,10,4,11), fill=INK)
        d.line((11,11,15,10), fill=INK)
