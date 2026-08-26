#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""compile_otf.py : assemble un vrai fichier de police a partir des memes
contours que alphabet_titre.js. Appele par build_font.py. Hors ligne."""

import os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.recordingPen import RecordingPen

HERE = os.path.dirname(os.path.abspath(__file__))

FAMILY  = 'Ivresse Titre'
STYLE   = 'Regular'
PS_NAME = 'IvresseTitre-Regular'
VERSION = '1.000'
UPM, CAP, DESCENDER, ASC = 1000, 700, -240, 960


def gname(ch):
    if ch == ' ': return 'space'
    return 'uni%04X' % ord(ch)


def compile_otf(G, kern=None, out_dir=None):
    out_dir = out_dir or HERE
    order = ['.notdef', 'space'] + [gname(c) for c in sorted(G) if c != ' ']
    fb = FontBuilder(UPM, isTTF=False)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({ord(c): gname(c) for c in G})

    charstrings, metrics = {}, {}
    pen = T2CharStringPen(600, None)
    pen.moveTo((60, 0)); pen.lineTo((540, 0)); pen.lineTo((540, CAP))
    pen.lineTo((60, CAP)); pen.closePath()
    charstrings['.notdef'] = pen.getCharString()
    metrics['.notdef'] = (600, 60)

    for ch, g in sorted(G.items()):
        n = gname(ch)
        p = g.get('p')
        cs = T2CharStringPen(g['adv'], None)
        if p is not None:
            rp = RecordingPen(); p.draw(rp); rp.replay(cs)
        charstrings[n] = cs.getCharString()
        metrics[n] = (g['adv'], g['x0'] if p is not None else 0)

    fb.setupCFF(PS_NAME, {'FullName': FAMILY, 'FamilyName': FAMILY,
                          'Weight': STYLE}, charstrings, {})
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC, descent=DESCENDER, lineGap=0)
    fb.setupNameTable({
        'familyName': FAMILY, 'styleName': STYLE,
        'uniqueFontIdentifier': '%s;%s' % (FAMILY, VERSION),
        'fullName': '%s %s' % (FAMILY, STYLE),
        'version': 'Version ' + VERSION,
        'psName': PS_NAME,
        'copyright': "Lettrage du sceau de la maison Ivresse d'Amour / Toloache "
                     "Legitimo. Les quinze lettres du sceau sont le dessin de la "
                     "famille. Usage reserve a la maison.",
        'designer': "d'apres le sceau de la famille",
        'description': 'La capitale de titre de la maison.',
    })
    fb.setupOS2(sTypoAscender=760, sTypoDescender=-200, sTypoLineGap=0,
                usWinAscent=ASC, usWinDescent=abs(DESCENDER),
                sCapHeight=CAP, sxHeight=CAP, achVendID='IVRS',
                fsType=0, usWeightClass=700, panose=dict(
                    bFamilyType=2, bSerifStyle=8, bWeight=9, bProportion=3,
                    bContrast=0, bStrokeVariation=0, bArmStyle=0, bLetterForm=0,
                    bMidline=0, bXHeight=0))
    fb.setupPost(isFixedPitch=0, underlinePosition=-130, underlineThickness=90)
    if kern:
        try:
            from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
            lines = ['feature kern {']
            for (a, b), v in sorted(kern.items()):
                if a in G and b in G:
                    lines.append('    pos %s %s %d;' % (gname(a), gname(b), v))
            lines.append('} kern;')
            addOpenTypeFeaturesFromString(fb.font, '\n'.join(lines))
        except Exception as e:
            print('kern : %s' % e)

    otf = os.path.join(out_dir, PS_NAME + '.otf')
    fb.save(otf)
    made = [otf]
    try:
        from fontTools.ttLib import TTFont
        f = TTFont(otf)
        f.flavor = 'woff2'
        w = os.path.join(out_dir, PS_NAME + '.woff2')
        f.save(w)
        made.append(w)
    except Exception as e:
        print('woff2 : %s' % e)
    for m in made:
        print('%-34s %d octets' % (os.path.basename(m), os.path.getsize(m)))
    return made
