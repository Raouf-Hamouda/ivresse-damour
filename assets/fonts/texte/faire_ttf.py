# -*- coding: utf-8 -*-
"""faire_ttf.py : fabrique le .ttf a partir du .otf de la maison.

Photoshop, Illustrator, InDesign, Word et Figma lisent les deux formats. Raouf a
demande un .ttf, donc c est un .ttf qu on livre, et il doit tenir sous 50 ko.

Un .otf porte ses courbes en cubiques (table CFF). Un .ttf les porte en
quadratiques (table glyf). La conversion passe par cu2qu, avec une erreur maximale
exprimee en unites du cadratin de 1000 : plus l erreur toleree est grande, moins il
faut de points, plus le fichier est petit. On monte la tolerance par paliers
jusqu a passer sous la limite, et on s arrete au premier palier qui passe, pour
degrader le dessin le moins possible.

    python3 faire_ttf.py [chemin.otf] [ko max]
"""

import os
import sys

from fontTools.ttLib import TTFont, newTable
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen

ICI = os.path.dirname(os.path.abspath(__file__))
OTF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ICI, "IvresseTitre-Regular.otf")
KO_MAX = float(sys.argv[2]) if len(sys.argv) > 2 else 50.0
TTF = os.path.splitext(OTF)[0] + ".ttf"

# paliers d erreur, en unites sur un cadratin de 1000. 1.0 est deja invisible a
# l ecran, 4.0 commence a se voir sur une ronde a tres grande taille.
PALIERS = [0.6, 1.0, 1.5, 2.2, 3.0, 4.0, 5.5]


def convertir(otf_path, erreur):
    """Renvoie un TTFont en glyf, converti depuis le CFF, a l erreur donnee."""
    f = TTFont(otf_path)
    jeu = f.getGlyphSet()
    ordre = f.getGlyphOrder()

    glyfs = {}
    for nom in ordre:
        plume = TTGlyphPen(jeu)
        jeu[nom].draw(Cu2QuPen(plume, erreur, reverse_direction=True))
        glyfs[nom] = plume.glyph()

    f["glyf"] = newTable("glyf")
    f["glyf"].glyphOrder = ordre
    f["glyf"].glyphs = glyfs

    f["loca"] = newTable("loca")
    f["maxp"] = newTable("maxp")
    f["maxp"].tableVersion = 0x00010000
    f["maxp"].numGlyphs = len(ordre)
    # champs propres a une police quadratique, sans instructions de hinting
    f["maxp"].maxZones = 1
    f["maxp"].maxTwilightPoints = 0
    f["maxp"].maxStorage = 0
    f["maxp"].maxFunctionDefs = 0
    f["maxp"].maxInstructionDefs = 0
    f["maxp"].maxStackElements = 0
    f["maxp"].maxSizeOfInstructions = 0
    f["maxp"].maxComponentElements = 0
    f["maxp"].maxComponentDepth = 0

    # une police glyf n a pas de CFF, et head doit dire qu elle est quadratique
    if "CFF " in f:
        del f["CFF "]
    f["head"].indexToLocFormat = 0
    f["head"].glyphDataFormat = 0
    f.sfntVersion = "\x00\x01\x00\x00"

    # recalcul des bornes de chaque glyphe et de la police
    f["glyf"].compile(f)
    for nom in ordre:
        f["glyf"][nom].recalcBounds(f["glyf"])
    return f


def poids(f, chemin):
    f.save(chemin)
    return os.path.getsize(chemin) / 1024.0


def main():
    if not os.path.exists(OTF):
        print("otf introuvable :", OTF)
        return 1

    print("source :", OTF, "%.1f ko" % (os.path.getsize(OTF) / 1024.0))
    retenu = None
    for e in PALIERS:
        f = convertir(OTF, e)
        ko = poids(f, TTF)
        etat = "sous la limite" if ko <= KO_MAX else "trop lourd"
        print("  erreur %.1f u  ->  %.1f ko  (%s)" % (e, ko, etat))
        if ko <= KO_MAX:
            retenu = (e, ko)
            break

    if retenu is None:
        print()
        print("Aucun palier ne passe sous %.0f ko sans abimer le dessin." % KO_MAX)
        print("Le vrai levier n est pas la tolerance, c est le nombre de points :")
        print("des contours nettoyes pesent beaucoup moins que des contours bruites.")
        print("Fichier ecrit au palier le plus large : %.1f ko" % poids(convertir(OTF, PALIERS[-1]), TTF))
        return 2

    print()
    print("ecrit  :", TTF, "%.1f ko" % retenu[1], "a une erreur de %.1f unite" % retenu[0])
    print("Installation : double clic sur le .ttf, puis Livre des polices.")
    print("Photoshop, Illustrator, InDesign et Figma lisent aussi le .otf.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
