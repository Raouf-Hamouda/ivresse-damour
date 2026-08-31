# -*- coding: utf-8 -*-
"""
Compile IVRESSE TEXTE en un vrai fichier de fonte, .otf et .woff2.

    python3 build_font.py            -> IvresseTexte-Regular.otf (+ .woff2)
    python3 build_font.py --verifier -> ne compile pas, controle seulement

Dependance : fontTools, teste avec 4.60.2. Aucune autre. Aucun reseau.
Le dessin vient de glyphes_texte.py, qui travaille deja dans le repere de la
fonte : 1000 par cadratin, y vers le haut, ligne de pied a zero. Il n'y a donc
aucune conversion de coordonnees ici.

DEUX CHOSES A SAVOIR AVANT DE S'EN SERVIR

1. Les contours se RECOUVRENT. Un H est trois rectangles poses l'un sur
   l'autre, un o est deux ovales de sens contraire. C'est voulu, c'est ce qui
   tient la regularite du dessin sans booleen. Le rasteriseur, qui applique la
   regle non nulle, s'en accommode : Quartz, DirectWrite, FreeType et tous les
   navigateurs affichent juste. En revanche un logiciel de fonte qui exige des
   contours simples rale. Pour un vrai envoi, passer un aplatissement de
   recouvrement (removeOverlaps de fontTools >= 4.30 avec skia-pathops, ou
   l'operation Union d'un editeur). Le drapeau --aplatir tente le premier si
   skia-pathops est installe.
2. Il n'y a NI CRENAGE NI HINTING. La fonte pose chaque signe a sa chasse.
   C'est suffisant pour juger un dessin, ce n'est pas suffisant pour un envoi.
   La liste de ce qui manque est dans LISEZ_MOI.txt.
"""

import os
import sys
import unicodedata

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import glyphes_texte as GT                                   # noqa: E402

NOM_FAMILLE = "Ivresse Texte"
NOM_STYLE = "Regular"
NOM_PS = "IvresseTexte-Regular"
VERSION = "0.100"
SORTIE_OTF = os.path.join(ICI, NOM_PS + ".otf")
SORTIE_WOFF2 = os.path.join(ICI, NOM_PS + ".woff2")

M = GT.METRIQUES

# Metriques verticales. hhea doit couvrir l'accent le plus haut, qui est
# l'accent de capitale : Y_CAP + ACC_H.
ASC_HHEA = int(GT.Y_CAP + GT.ACC_H + 24)
DESC_HHEA = int(GT.DESC - 24)
LIGNE = 0


def nom_glyphe(ch):
    """Un nom de glyphe conforme : lettres, chiffres, point, tiret bas."""
    fixes = {
        ' ': 'space', '.': 'period', ',': 'comma', ':': 'colon',
        ';': 'semicolon', '!': 'exclam', '?': 'question',
        '(': 'parenleft', ')': 'parenright', '/': 'slash',
        '%': 'percent', '&': 'ampersand', '-': 'hyphen',
        '’': 'quoteright', '‘': 'quoteleft',
        '“': 'quotedblleft', '”': 'quotedblright',
        '«': 'guillemotleft', '»': 'guillemotright',
        '–': 'endash', '¡': 'exclamdown', '¿': 'questiondown',
        '°': 'degree', 'º': 'ordmasculine', '€': 'Euro',
        '·': 'periodcentered', ' ': 'uni00A0', ' ': 'uni202F',
        "'": 'quotesingle', '"': 'quotedbl',
    }
    if ch in fixes:
        return fixes[ch]
    if ch.isascii() and (ch.isalpha() or ch.isdigit()):
        return ('%s' % ch) if not ch.isdigit() else {
            '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
            '5': 'five', '6': 'six', '7': 'seven', '8': 'eight',
            '9': 'nine'}[ch]
    try:
        return unicodedata.name(ch).lower().replace(' ', '').replace('-', '')
    except ValueError:
        return 'uni%04X' % ord(ch)


def dessiner(d, pen):
    """Rejoue une chaine de chemin (M, L, C, Z seulement) dans un pen."""
    i = 0
    cmd = None
    ouvert = False
    nb = []
    tok = []
    j = 0
    while j < len(d):
        c = d[j]
        if c in 'MLCZ':
            tok.append(c); j += 1
        elif c in ' ,':
            j += 1
        else:
            k = j
            if d[k] in '+-':
                k += 1
            while k < len(d) and (d[k].isdigit() or d[k] == '.'):
                k += 1
            tok.append(float(d[j:k])); j = k
    i = 0
    while i < len(tok):
        t = tok[i]
        if isinstance(t, str):
            cmd = t; i += 1
            if cmd == 'Z':
                if ouvert:
                    pen.closePath(); ouvert = False
                continue
        if cmd == 'M':
            if ouvert:
                pen.closePath()
            pen.moveTo((tok[i], tok[i + 1])); ouvert = True; i += 2; cmd = 'L'
        elif cmd == 'L':
            pen.lineTo((tok[i], tok[i + 1])); i += 2
        elif cmd == 'C':
            pen.curveTo((tok[i], tok[i + 1]), (tok[i + 2], tok[i + 3]),
                        (tok[i + 4], tok[i + 5])); i += 6
        else:
            raise ValueError('commande inattendue %r' % cmd)
    if ouvert:
        pen.closePath()
    return nb


def construire(aplatir=False):
    from fontTools.fontBuilder import FontBuilder
    from fontTools.pens.t2CharStringPen import T2CharStringPen

    rep = GT.repertoire()
    ordre = ['.notdef'] + [nom_glyphe(c) for c in sorted(rep)]
    par_nom = {nom_glyphe(c): (c, rep[c]) for c in rep}

    fb = FontBuilder(M['upm'], isTTF=False)
    fb.setupGlyphOrder(ordre)
    fb.setupCharacterMap({ord(c): nom_glyphe(c) for c in rep})

    charstrings = {}
    metriques = {}

    pen = T2CharStringPen(M['espace'], None)
    charstrings['.notdef'] = pen.getCharString()
    metriques['.notdef'] = (M['espace'], 0)

    for nom in ordre[1:]:
        ch, g = par_nom[nom]
        pen = T2CharStringPen(g['adv'], None)
        if g['d']:
            dessiner(g['d'], pen)
        charstrings[nom] = pen.getCharString()
        metriques[nom] = (g['adv'], 0)

    fb.setupCFF(NOM_PS,
                {'FullName': NOM_FAMILLE + ' ' + NOM_STYLE,
                 'FamilyName': NOM_FAMILLE,
                 'Weight': NOM_STYLE},
                charstrings, {})
    fb.setupHorizontalMetrics(metriques)
    fb.setupHorizontalHeader(ascent=ASC_HHEA, descent=DESC_HHEA, lineGap=LIGNE)

    fb.setupNameTable({
        'familyName': NOM_FAMILLE,
        'styleName': NOM_STYLE,
        'uniqueFontIdentifier': '%s %s; Ivresse d Amour' % (NOM_PS, VERSION),
        'fullName': NOM_FAMILLE + ' ' + NOM_STYLE,
        'psName': NOM_PS,
        'version': 'Version ' + VERSION,
        'copyright': "Ivresse d'Amour, Toloache Legitimo. Dessine pour la "
                     "maison, d'apres le sceau de la famille.",
        'description': "Caractere de labeur de la maison. Lineale, une seule "
                       "graisse, coupee a plat. Compagnon du sceau, dont elle "
                       "reprend la charpente et rien d'autre.",
    })
    fb.setupOS2(sTypoAscender=M['asc'], sTypoDescender=M['desc'],
                sTypoLineGap=0, usWinAscent=ASC_HHEA, usWinDescent=-DESC_HHEA,
                sxHeight=M['xh'], sCapHeight=M['cap'],
                achVendID='IVDA', fsType=0,
                panose=dict(bFamilyType=2, bSerifStyle=11, bWeight=5,
                            bProportion=3, bContrast=2, bStrokeVariation=0,
                            bArmStyle=0, bLetterForm=0, bMidline=0,
                            bXHeight=0))
    fb.setupPost(isFixedPitch=0, underlinePosition=-120, underlineThickness=70)

    if aplatir:
        try:
            from fontTools.ttLib.removeOverlaps import removeOverlaps
            removeOverlaps(fb.font)
            print('recouvrements aplatis (skia-pathops)')
        except Exception as e:
            print('aplatissement impossible, on garde les recouvrements :', e)

    fb.save(SORTIE_OTF)
    print('ecrit', SORTIE_OTF)

    try:
        from fontTools.ttLib import TTFont
        f = TTFont(SORTIE_OTF)
        f.flavor = 'woff2'
        f.save(SORTIE_WOFF2)
        print('ecrit', SORTIE_WOFF2)
    except Exception as e:
        print('woff2 non produit (brotli manquant ?) :', e)

    return len(ordre) - 1


def verifier():
    """Controle le dessin sans compiler : chemins relisibles, chasses > 0,
    noms de glyphes uniques, couverture des trois langues."""
    rep = GT.repertoire()
    pbs = []
    noms = {}
    for c, g in sorted(rep.items()):
        nm = nom_glyphe(c)
        if nm in noms:
            pbs.append('nom en double : %s pour %r et %r' % (nm, noms[nm], c))
        noms[nm] = c
        if g['adv'] <= 0:
            pbs.append('chasse nulle ou negative : %r' % c)
        if g['d']:
            try:
                class Muet(object):
                    def moveTo(self, p): pass
                    def lineTo(self, p): pass
                    def curveTo(self, *p): pass
                    def closePath(self): pass
                dessiner(g['d'], Muet())
            except Exception as e:
                pbs.append('chemin illisible %r : %s' % (c, e))

    requis = ("ABCDEFGHIJKLMNOPQRSTUVWXYZ"
              "abcdefghijklmnopqrstuvwxyz0123456789"
              "àâäéèêëîïôöùûüçáíóúñü"
              "ÀÂÄÉÈÊËÎÏÔÖÙÛÜÇÁÍÓÚÑÜ"
              ".,:;’“”«»-?!¿¡()%°&€ ")
    manque = [c for c in requis if c not in rep]
    if manque:
        pbs.append('signes manquants : ' + ' '.join(manque))

    print('%d signes' % len(rep))
    if pbs:
        for p in pbs:
            print('  PROBLEME :', p)
    else:
        print('  aucun probleme')
    return not pbs


if __name__ == '__main__':
    args = sys.argv[1:]
    ok = verifier()
    if '--verifier' in args:
        sys.exit(0 if ok else 1)
    try:
        nb = construire(aplatir='--aplatir' in args)
        print('%d glyphes compiles' % nb)
    except ImportError:
        print("fontTools absent. pip3 install fonttools")
        sys.exit(1)
