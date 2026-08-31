#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_font.py  --  IVRESSE TITRE
La capitale de la maison IVRESSE D'AMOUR / TOLOACHE LEGITIMO.

C'est le lettrage du sceau de la famille, releve tel quel dans
assets/js/logo.js, complete en alphabet utilisable. Les quinze lettres que le
sceau porte (A C D E G H I L M O R S T U V) et l'apostrophe sont les contours
de la famille, redresses et cales, rien d'autre. Les onze qui manquent
(B F J K N P Q W X Y Z), les chiffres, la ponctuation et les accents sont
dessines a la main dans la meme main : meme fut, meme empattement en coin, meme
poids, memes courbes un peu bancales. Le detail glyphe par glyphe est dans
LISEZ_MOI.txt.

Aucun reseau. Rien n'est ecrit hors de assets/fonts/titre/.

    python3 build_font.py

Sorties dans ce dossier :
    alphabet_titre.js   les glyphes en donnees de chemin SVG, window.alphabetTitre()
    SPECIMEN.html       la planche, autonome, s'ouvre au double clic
    IvresseTitre-Regular.otf / .woff2   si la compilation passe
"""

import os, json, math, sys

HERE    = os.path.dirname(os.path.abspath(__file__))
LOGO_JS = os.path.normpath(os.path.join(HERE, '..', '..', 'js', 'logo.js'))

# =========================================================== 0. le systeme
# Valeurs relevees au scan sur les quinze lettres du sceau, ramenees a une
# capitale de 700 unites pour un cadratin de 1000. Elles servent a dessiner ce
# que le sceau n'a pas, dans le poids exact de ce qu'il a.

UPM        = 1000
CAP        = 700     # hauteur de capitale (TOLOACHE et LEGITIMO : 40.0 natif)
OVER       = 9       # debord des rondes
DESC       = -190
ACC_TOP    = 900

STEM       = 175     # fut, au renflement de mi-hauteur
STEM_BODY  = 152     # fut, hors renflement. releve : E 159, L 155, T 153, R 152
STEM_WAIST = 149
SERIF_W    = 216     # empattement. releve : I 209, A 211, M 171
SERIF_H    = 88
SERIF_TIP  = 112
BAR        = 118     # traverse fine. releve : H 116, A 118
ARM        = 158     # bras du E, pied du L. releve : 152 a 176
ARM_MID    = 112     # bras median du E. releve : 102
SPUR       = 62
SPUR_W     = 96
RND_V      = 178     # flanc d'une ronde. releve O : 176 et 179
RND_H      = 154     # haut d'une ronde. releve O : 155 et 156
ORND_V     = RND_V
ORND_H     = RND_H
DIAG       = 164     # oblique. releve V : 165, A : 158
DOT_R      = 94

# =========================================================== 1. outils de dessin

from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.misc.transform import Identity
import pathops


def _mkpath(rp):
    p = pathops.Path(); rp.replay(p.getPen()); return p


def cr_contour(pts, k=6.0):
    """Contour lisse (Catmull-Rom converti en cubiques) passant par les points.
    (x, y) = point lisse, (x, y, 'c') = coin dur. La main du sceau est molle :
    aucun de ses contours n'est un polygone."""
    n = len(pts)
    P = [(p[0], p[1]) for p in pts]
    C = [len(p) > 2 and p[2] == 'c' for p in pts]
    segs = []
    for i in range(n):
        i0, i1, i2, i3 = (i - 1) % n, i, (i + 1) % n, (i + 2) % n
        p0, p1, p2, p3 = P[i0], P[i1], P[i2], P[i3]
        c1 = p1 if C[i1] else (p1[0] + (p2[0] - p0[0]) / k, p1[1] + (p2[1] - p0[1]) / k)
        c2 = p2 if C[i2] else (p2[0] - (p3[0] - p1[0]) / k, p2[1] - (p3[1] - p1[1]) / k)
        segs.append((p1, c1, c2, p2))
    return segs


def shape(*contours):
    p = pathops.Path(); pen = p.getPen()
    for pts in contours:
        segs = cr_contour(pts)
        pen.moveTo(segs[0][0])
        for (_a, c1, c2, b) in segs:
            pen.curveTo(c1, c2, b)
        pen.closePath()
    p.simplify(fix_winding=True, keep_starting_points=False)
    return p


def U(*paths):
    cs = []
    for p in paths:
        q = pathops.Path(); pathops.union(list(p.contours), q.getPen())
        cs.extend(list(q.contours))
    out = pathops.Path(); pathops.union(cs, out.getPen())
    out.simplify(fix_winding=True, keep_starting_points=False)
    return out


def SUB(a, b):
    out = pathops.Path()
    pathops.difference(list(a.contours), list(b.contours), out.getPen())
    out.simplify(fix_winding=True, keep_starting_points=False)
    return out


def ISECT(a, b):
    out = pathops.Path()
    pathops.intersection(list(a.contours), list(b.contours), out.getPen())
    out.simplify(fix_winding=True, keep_starting_points=False)
    return out


def rect(x0, y0, x1, y1):
    p = pathops.Path(); pen = p.getPen()
    pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1))
    pen.closePath(); return p


def poly(pts):
    p = pathops.Path(); pen = p.getPen()
    pen.moveTo(pts[0])
    for q in pts[1:]:
        pen.lineTo(q)
    pen.closePath(); return p


def pbounds(p):
    rp = RecordingPen(); p.draw(rp)
    b = BoundsPen(None); rp.replay(b); return b.bounds


def move(p, dx, dy):
    rp = RecordingPen(); p.draw(rp)
    r2 = RecordingPen(); rp.replay(TransformPen(r2, Identity.translate(dx, dy)))
    return _mkpath(r2)


def scale_p(p, sx, sy=None):
    sy = sx if sy is None else sy
    rp = RecordingPen(); p.draw(rp)
    r2 = RecordingPen(); rp.replay(TransformPen(r2, Identity.scale(sx, sy)))
    return _mkpath(r2)


def clip(p, x0=-4000, y0=-4000, x1=4000, y1=4000):
    return ISECT(p, rect(x0, y0, x1, y1))


def _ntos(v, prec=0):
    s = '%.*f' % (prec, v)
    if '.' in s:
        s = s.rstrip('0').rstrip('.')
    if s in ('-0', ''):
        s = '0'
    return s


def d_of(p, prec=0):
    rp = RecordingPen(); p.draw(rp)
    sp = SVGPathPen(None, ntos=lambda v: _ntos(v, prec))
    rp.replay(sp)
    return sp.getCommands()



# alias hérités du premier jet
path_from_contours = lambda cs: shape(*cs)
def scale(p, sx, sy=None, ox=0.0, oy=0.0):
    return scale_p(p, sx, sy)

def _rng(seed):
    st = [seed * 2654435761 % 2147483647 or 12345]
    def r():
        st[0] = (st[0] * 48271) % 2147483647
        return st[0] / 2147483647.0
    return r

# ---------------------------------------------------------------- 1. la source

def load_logo():
    s = open(LOGO_JS, 'r', encoding='utf-8').read()
    i = s.index('var LOGO')
    j = s.index('{', i)
    depth = 0
    for k in range(j, len(s)):
        if s[k] == '{': depth += 1
        elif s[k] == '}':
            depth -= 1
            if depth == 0: break
    return json.loads(s[j:k + 1])

LOGO = load_logo()
SEAL_CX, SEAL_CY = 443.0, 290.0

# l'arc se lit I V R E S S E  D ' A M O U R ; index du chemin -> lettre
ARC_ORDER = {1:'I', 2:'V', 3:'R', 4:'E', 5:'S', 6:'S2', 7:'E2', 8:'D',
             9:'quote', 10:'A', 11:'M', 12:'O', 13:'U', 0:'R2'}

from fontTools.svgLib.path import parse_path
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Identity
import pathops

def _record(d, transform=None):
    rp = RecordingPen()
    if transform is None:
        parse_path(d, rp)
    else:
        parse_path(d, TransformPen(rp, transform))
    return rp

SRC = {}
for i, p in enumerate(LOGO['arc']):
    # chaque lettre de l'arc est tournee pour se poser sur le cercle : on la redresse
    ang = math.degrees(math.atan2(p['cy'] - SEAL_CY, p['cx'] - SEAL_CX)) + 90.0
    t = (Identity.translate(SEAL_CX, SEAL_CY)
                 .rotate(math.radians(-ang))
                 .translate(-SEAL_CX, -SEAL_CY))
    SRC['arc_' + ARC_ORDER[i]] = _record(p['d'], t)
for i, ch in enumerate('TOLOACHE'):
    SRC['tol_%d%s' % (i, ch)] = _record(LOGO['toloache'][i]['d'])
for i, ch in enumerate('LEGITIMO'):
    SRC['leg_%d%s' % (i, ch)] = _record(LOGO['legitimo'][i]['d'])

def src_bounds(name):
    b = BoundsPen(None); SRC[name].replay(b); return b.bounds

# Reperes mesures dans le repere natif du sceau (y vers le bas).
#   nom source -> (y de la ligne de pied, hauteur de capitale de reference)
# TOLOACHE : pied 496.48, LEGITIMO : pied 545.24, capitale 40.0 dans les deux mots.
# L'arc est dessine plus grand : capitale 45.9. Les pieds sont releves lettre par
# lettre apres redressement (les rondes debordent, les plates non).
FLAT_CAP = 40.0
ARC_CAP  = 45.9
SRC_REF = {
    'tol_0T': (496.48, FLAT_CAP), 'tol_1O': (496.48, FLAT_CAP), 'tol_2L': (496.48, FLAT_CAP),
    'tol_3O': (496.48, FLAT_CAP), 'tol_4A': (496.48, FLAT_CAP), 'tol_5C': (496.48, FLAT_CAP),
    'tol_6H': (496.48, FLAT_CAP), 'tol_7E': (496.48, FLAT_CAP),
    'leg_0L': (545.24, FLAT_CAP), 'leg_1E': (545.24, FLAT_CAP), 'leg_2G': (545.24, FLAT_CAP),
    'leg_3I': (545.24, FLAT_CAP), 'leg_4T': (545.24, FLAT_CAP), 'leg_5I': (545.24, FLAT_CAP),
    'leg_6M': (545.24, FLAT_CAP), 'leg_7O': (545.24, FLAT_CAP),
    'arc_I':  (106.93, ARC_CAP), 'arc_V': (106.10, ARC_CAP), 'arc_R': (103.73, ARC_CAP),
    'arc_S':  ( 99.46, ARC_CAP), 'arc_D': ( 96.52, ARC_CAP), 'arc_U': (107.60, ARC_CAP),
    'arc_quote': (99.02, ARC_CAP),   # pied fictif : l'apostrophe est calee par le haut
    # variantes non retenues, gardees pour la planche de comparaison
    'arc_R2': (108.53, 47.73), 'arc_E2': (98.70, ARC_CAP), 'arc_S2': (97.30, ARC_CAP),
    'arc_A':  ( 99.60, 47.07), 'arc_M': (102.90, ARC_CAP), 'arc_O': (104.50, ARC_CAP),
    'arc_E':  (100.10, ARC_CAP),
}

def _mkpath(rp):
    p = pathops.Path()
    rp.replay(p.getPen())
    return p

def seal_glyph(name, align_left=True):
    """Retourne un pathops.Path en unites de police : y vers le haut, pied a 0,
    capitale a CAP, bord gauche a x=0."""
    base, capref = SRC_REF[name]
    s = CAP / capref
    t = Identity.scale(s, -s).translate(0, -base)
    rp = RecordingPen()
    SRC[name].replay(TransformPen(rp, t))
    if align_left:
        b = BoundsPen(None); rp.replay(b)
        rp2 = RecordingPen()
        rp.replay(TransformPen(rp2, Identity.translate(-b.bounds[0], 0)))
        rp = rp2
    raw = _mkpath(rp)
    out = pathops.Path()
    pathops.union(list(raw.contours), out.getPen())
    out.simplify(fix_winding=True, keep_starting_points=False)
    return out


# ---- primitives de la main -------------------------------------------------

def _serif_profile(d):
    """demi-largeur du fut a la distance d de l'extremite empattee"""
    tab = [(0, SERIF_TIP / 2.), (14, 94), (32, SERIF_W / 2.), (58, 92),
           (SERIF_H, 80), (170, STEM_BODY / 2.)]
    if d >= tab[-1][0]:
        return None
    for i in range(len(tab) - 1):
        a, b = tab[i], tab[i + 1]
        if d <= b[0]:
            t = (d - a[0]) / float(b[0] - a[0])
            t = t * t * (3 - 2 * t)
            return a[1] + (b[1] - a[1]) * t
    return STEM_BODY / 2.


def stem(xc, y0, y1, serif0=True, serif1=True, w=None):
    """Fut vertical. Empattement en coin, retreci a la pointe puis evase,
    puis resorbe dans un fut a peine renfle a mi-hauteur : c'est le I du sceau,
    debarrasse de l'ergot accidentel qu'il porte a mi-fut."""
    w = w or STEM_BODY
    H = float(y1 - y0)
    ys = sorted(set([0, 6, 14, 24, 32, 44, 58, 72, SERIF_H, 120, 170,
                     H * .5, H - 170, H - 120, H - SERIF_H, H - 72, H - 58,
                     H - 44, H - 32, H - 24, H - 14, H - 6, H]))
    ys = [y for y in ys if 0 <= y <= H]
    L, R = [], []
    for y in ys:
        hw = w / 2.
        if serif0:
            v = _serif_profile(y)
            if v is not None: hw = v if y <= 32 else max(hw, v)
        if serif1:
            v = _serif_profile(H - y)
            if v is not None: hw = v if (H - y) <= 32 else max(hw, v)
        if abs(y - H * .5) < 1e-6:
            hw = max(hw, STEM / 2. * (w / float(STEM_BODY)))
        corner = ('c',) if (y in (0, H) and ((y == 0 and serif0) or (y == H and serif1))) else ()
        L.append((xc - hw, y0 + y) + corner)
        R.append((xc + hw, y0 + y) + corner)
    return shape(L + list(reversed(R)))


def hbar(x0, x1, yc, h, flare=1.06):
    """Barre horizontale. Les bras du sceau s'evasent legerement au bout."""
    hh = h / 2.; e = hh * flare
    L = x1 - x0
    return shape([(x0, yc - e, 'c'), (x0 + L * .12, yc - hh * .98),
                  (x0 + L * .55, yc - hh * .99), (x1 - L * .12, yc - hh * .98),
                  (x1, yc - e, 'c'), (x1, yc + e, 'c'), (x1 - L * .12, yc + hh * .98),
                  (x0 + L * .55, yc + hh * .99), (x0 + L * .12, yc + hh * .98),
                  (x0, yc + e, 'c')])


def spur(xc, y_from, h, w=None):
    """Ergot vertical au bout d'un bras (bras du E, barre du T, barres du Z)."""
    w = w or SPUR_W
    y0, y1 = min(y_from, y_from + h), max(y_from, y_from + h)
    r = 16.
    return shape([(xc - w / 2., y0 + (r if h > 0 else 0), 'c'),
                  (xc - w / 2. * .84, y0), (xc + w / 2. * .84, y0),
                  (xc + w / 2., y0 + (r if h > 0 else 0), 'c'),
                  (xc + w / 2., y1 - (r if h < 0 else 0), 'c'),
                  (xc + w / 2. * .84, y1), (xc - w / 2. * .84, y1),
                  (xc - w / 2., y1 - (r if h < 0 else 0), 'c')])


def arm(x0, x1, yc, h=None, spur_dir=0, out_left=False):
    """Bras horizontal du E, du L, du T, du Z, avec son ergot au bout."""
    h = h or ARM
    b = hbar(x0, x1, yc, h)
    if spur_dir:
        xs = (x0 + SPUR_W / 2.) if out_left else (x1 - SPUR_W / 2.)
        b = U(b, spur(xs, yc + spur_dir * h / 2., spur_dir * SPUR))
    return b


def oval(cx, cy, rx, ry, tv=None, th=None, n=24, wob=0.0, seed=3, tilt=0.0,
         sq=1.0, sqi=None):
    """Ronde fermee. Le sceau ferme ses O sur une ellipse presque circulaire,
    flanc plus epais que le haut. sq < 1 carre la courbe : le O du sceau a des
    flancs presque droits et des angles arrondis, ce n'est pas un cercle."""
    tv = RND_V if tv is None else tv
    th = RND_H if th is None else th
    sqi = sq if sqi is None else sqi
    rnd = _rng(seed)
    out, inn = [], []
    rxi, ryi = rx - tv, ry - th
    for i in range(n):
        a = 2 * math.pi * i / n
        ca, sa = math.cos(a), math.sin(a)
        co = math.copysign(abs(ca) ** sq, ca); so = math.copysign(abs(sa) ** sq, sa)
        ci = math.copysign(abs(ca) ** sqi, ca); si = math.copysign(abs(sa) ** sqi, sa)
        j = 1.0 + (rnd() - .5) * wob
        out.append((cx + rx * co * j, cy + ry * so * j))
        k = 1.0 + (rnd() - .5) * wob * 1.6
        inn.append((cx + tilt + rxi * ci * k, cy + ryi * si * k))
    inn.reverse()
    return shape(out, inn)


def bowl(x_stem, y0, y1, x_out, cx0, cy0, cx1, cy1, flat=.66, cflat=.54):
    """Panse a droite d'un fut (B, D, P, R). Le sceau la ferme par un arc plein
    qui s'aplatit contre le fut."""
    ym, ry = (y0 + y1) / 2., (y1 - y0) / 2.
    out = [(x_stem, y1, 'c'),
           (x_stem + (x_out - x_stem) * .50, y1),
           (x_out - (x_out - x_stem) * .10, ym + ry * flat),
           (x_out, ym),
           (x_out - (x_out - x_stem) * .10, ym - ry * flat),
           (x_stem + (x_out - x_stem) * .50, y0),
           (x_stem, y0, 'c')]
    cym, cry = (cy0 + cy1) / 2., (cy1 - cy0) / 2.
    inn = [(cx0, cy1, 'c'),
           (cx0 + (cx1 - cx0) * .46, cy1),
           (cx1, cym + cry * cflat),
           (cx1, cym),
           (cx1, cym - cry * cflat),
           (cx0 + (cx1 - cx0) * .46, cy0),
           (cx0, cy0, 'c')]
    inn.reverse()
    return shape(out, inn)


def stroke(pts, w, taper=None, k=6.0, wob=0.0, seed=1):
    """Trait epais suivant une ligne lissee. w = epaisseur perpendiculaire.
    wob ajoute la petite irregularite du trace de la famille."""
    n = len(pts)
    if taper is None: taper = [1.0] * n
    rnd = _rng(seed)
    L, R = [], []
    for i, (x, y) in enumerate(pts):
        if i == 0:        dx, dy = pts[1][0] - x, pts[1][1] - y
        elif i == n - 1:  dx, dy = x - pts[-2][0], y - pts[-2][1]
        else:             dx, dy = pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]
        m = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / m, dx / m
        hw = w * taper[i] * (1.0 + (rnd() - .5) * wob * 2) / 2.
        c = ('c',) if i in (0, n - 1) else ()
        L.append((x + nx * hw, y + ny * hw) + c)
        R.append((x - nx * hw, y - ny * hw) + c)
    return shape(L + list(reversed(R)))


def wedge(xc, y, w=SERIF_W, tip=SERIF_TIP, h=SERIF_H, sign=1, rot=0.0):
    """Empattement en coin pose a l'horizontale : pied d'une oblique (A, K, V,
    W, X, Y), sommet du A, terminaison des bras obliques."""
    pts = [(-tip / 2., 0.0, 'c'), (-w / 2., h * .30), (-w * .47, h * .62),
           (-w * .36, h), (w * .36, h), (w * .47, h * .62),
           (w / 2., h * .30), (tip / 2., 0.0, 'c')]
    ca, sa = math.cos(rot), math.sin(rot)
    out = []
    for pt in pts:
        x, yy = pt[0], pt[1] * sign
        out.append((xc + x * ca - yy * sa, y + x * sa + yy * ca) + tuple(pt[2:]))
    return shape(out)


def dot(cx, cy, r=None, ry=None):
    r = r or DOT_R
    ry = ry or r * .97
    pts = []
    for i in range(14):
        a = 2 * math.pi * i / 14
        pts.append((cx + r * math.cos(a), cy + ry * math.sin(a)))
    return shape(pts)


# ---------------------------------------------------------------- 4. les lettres a dessiner

DRAWN = {}
WID   = {}      # largeur d'avance, remplie plus bas

def bowl_right(x0, y0, x1, y1, cx0, cy0, cx1, cy1, flat=.62, cflat=.50, seed=5):
    """Demi-panse a droite d'un fut (B, P, D). (x0,y0)-(x1,y1) = enveloppe exterieure,
    (cx0,cy0)-(cx1,cy1) = le contre. Le sceau ferme ses panses par un arc plein qui
    s'aplatit contre le fut, jamais par un demi-cercle."""
    ym = (y0 + y1) / 2.0; ry = (y1 - y0) / 2.0
    out = [(x0, y1, 'c'),
           (x0 + (x1 - x0) * .52, y1 - ry * .04),
           (x1 - (x1 - x0) * .10, ym + ry * flat),
           (x1, ym + ry * .06),
           (x1 - (x1 - x0) * .11, ym - ry * flat),
           (x0 + (x1 - x0) * .52, y0 + ry * .03),
           (x0, y0, 'c')]
    cym = (cy0 + cy1) / 2.0; cry = (cy1 - cy0) / 2.0
    inn = [(cx0, cy1, 'c'),
           (cx0 + (cx1 - cx0) * .48, cy1),
           (cx1, cym + cry * cflat),
           (cx1, cym),
           (cx1, cym - cry * cflat),
           (cx0 + (cx1 - cx0) * .48, cy0),
           (cx0, cy0, 'c')]
    inn.reverse()
    return path_from_contours([out, inn])

def slab(xc, yc, w, h, skew=0.0, rot=0.0):
    """Petite dalle a coins mous (jonctions, terminaisons carrees)."""
    hw, hh = w / 2.0, h / 2.0
    pts = [(-hw, -hh * .74), (-hw * .74, -hh), (hw * .74, -hh), (hw, -hh * .74),
           ( hw,  hh * .74), ( hw * .74,  hh), (-hw * .74,  hh), (-hw,  hh * .74)]
    ca, sa = math.cos(rot), math.sin(rot)
    out = []
    for (x, y) in pts:
        x = x + skew * y
        out.append((xc + x * ca - y * sa, yc + x * sa + y * ca))
    return path_from_contours([out])

def foot(xc, y, w=212, tipw=104, h=86, sign=1, rot=0.0, top=0.36):
    """Empattement en coin, comme au pied du A et sous les futs du sceau :
    pointe etroite au bord, evasement maximum juste au-dessus, puis retour au fut."""
    pts = [(-tipw / 2., 0.0, 'c'),
           (-w / 2., h * .30),
           (-w * .47, h * .62),
           (-w * top, h),
           ( w * top, h),
           ( w * .47, h * .62),
           ( w / 2., h * .30),
           ( tipw / 2., 0.0, 'c')]
    ca, sa = math.cos(rot), math.sin(rot)
    out = []
    for pt in pts:
        x, yy = pt[0], pt[1] * sign
        out.append((xc + x * ca - yy * sa, y + x * sa + yy * ca) + tuple(pt[2:]))
    return path_from_contours([out])

def blob(cx, cy, rx, ry, n=12, seed=7, wob=0.05):
    rnd = _rng(seed); pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        j = 1.0 + (rnd() - .5) * wob
        pts.append((cx + rx * math.cos(a) * j, cy + ry * math.sin(a) * j))
    return path_from_contours([pts])

def clip(p, x0=-3000, y0=-3000, x1=3000, y1=3000):
    return ISECT(p, rect(x0, y0, x1, y1))

# axe du fut des lettres du sceau, releve au scan (milieu du retrecissement)
# ---------------------------------------------------------------- 3. le materiel du sceau
# Choix de la variante quand la lettre existe plusieurs fois dans le sceau :
# on garde la plus nette, et pour les lettres presentes dans l'arc et dans les
# mots plats on garde la version plate, mieux tracee.
SEAL_PICK = {
    'A': 'tol_4A', 'C': 'tol_5C', 'D': 'arc_D', 'E': 'tol_7E', 'G': 'leg_2G',
    'H': 'tol_6H', 'I': 'leg_3I', 'L': 'leg_0L', 'M': 'leg_6M', 'O': 'tol_1O',
    'R': 'arc_R',  'S': 'arc_S',  'T': 'leg_4T', 'U': 'arc_U', 'V': 'arc_V',
    'quote': 'arc_quote',
}
SEAL = {k: seal_glyph(v) for k, v in SEAL_PICK.items()}

STEM_AXIS = {'I':109.5, 'E':107.0, 'L':109.5, 'T':240.5, 'R':121.0, 'H':109.5}

def Istem(xc, y0=None, y1=None):
    """Le fut du I du sceau, empattements compris, place a l'abscisse xc."""
    p = move(SEAL['I'], xc - STEM_AXIS['I'], 0)
    if y0 is not None or y1 is not None:
        p = clip(p, y0=(y0 if y0 is not None else -3000),
                    y1=(y1 if y1 is not None else 3000))
    return p


# ------------------------------------------------------- les onze lettres absentes
# Aucune n'est un etirement ni un miroir d'une lettre existante. Le fut empatte et,
# la ou c'est dit, un morceau reel (bras du E, fond du U) viennent du sceau ; tout le
# reste est dessine au poids releve sur le sceau : fut 175, barre 116, bras 145,
# flanc de ronde 179, haut de ronde 154, empattement 219 de large.

def build_B():
    st = Istem(109.5)
    up = bowl_right(150, 352, 494, 708,  200, 452, 356, 606, flat=.66, cflat=.52)
    lo = bowl_right(150, -8, 540, 366,   200,  92, 398, 262, flat=.68, cflat=.54)
    return U(st, up, lo)

def build_F():
    top = clip(SEAL['E'], y0=248)
    bot = Istem(STEM_AXIS['E'], y1=300)
    return U(top, bot)

def build_J():
    Uu = SEAL['U']
    b = pbounds(Uu)
    hook = clip(Uu, y1=252)                              # le fond du U du sceau
    hook = SUB(hook, path_from_contours([[(-80, 150, 'c'), (96, 168), (162, 214),
                                          (178, 252), (178, 430, 'c'), (-80, 430, 'c')]]))
    st = Istem(b[2] - 104, y0=196)
    j = U(hook, st)
    j = move(j, -pbounds(j)[0], 0)
    return scale(j, 0.90, 1.0)

def build_K():
    st = Istem(109.5)
    arm = stroke([(172, 344), (282, 438), (420, 560), (482, 618)], 166,
                 taper=[1.08, 1.02, .98, .90], wob=.012, seed=21)
    armserif = foot(498, 654, w=192, tipw=98, h=-84, sign=1, rot=-0.42)
    leg = stroke([(226, 366), (316, 268), (436, 128), (496, 56)], 174,
                 taper=[1.08, 1.02, .98, .88], wob=.012, seed=22)
    legserif = foot(500, 2, w=204, tipw=102, h=94, sign=1, rot=0.04)
    return U(st, arm, armserif, leg, legserif)

def build_N():
    a, b = 109.5, 458.0
    dg = stroke([(a + 4, 656), (a + 104, 428), (b - 92, 198), (b - 2, 40)], 182,
                taper=[1.0, .98, .98, 1.0], wob=.010, seed=23)
    dg = clip(dg, x0=16, x1=556)
    return U(Istem(a), Istem(b), dg)

def build_P():
    st = Istem(109.5)
    bw = bowl_right(150, 312, 512, 708,  200, 424, 372, 604, flat=.68, cflat=.54)
    return U(st, bw)

def build_Q():
    o = SEAL['O']
    tail = stroke([(330, 158), (392, 66), (458, -14), (528, -78)], 176,
                  taper=[.92, 1.02, 1.0, .92], wob=.006, seed=24)
    tip = slab(524, -74, 190, 150, rot=0.72)
    return U(o, tail, tip)

def build_W():
    s1 = stroke([(114, 646), (170, 350), (226, 22)], 166, taper=[.92, 1.04, .90],
                wob=.010, seed=25)
    s2 = stroke([(226, 22), (288, 320), (344, 604)], 150, taper=[.90, 1.04, .92],
                wob=.010, seed=26)
    s3 = stroke([(360, 646), (420, 340), (480, 22)], 162, taper=[.92, 1.04, .90],
                wob=.010, seed=27)
    s4 = stroke([(480, 22), (546, 320), (604, 646)], 156, taper=[.90, 1.04, .92],
                wob=.010, seed=28)
    sv = U(foot(116, 700, w=196, tipw=100, h=-86, rot=0.03),
           foot(606, 700, w=190, tipw= 98, h=-86, rot=-0.03),
           foot(352, 700, w=182, tipw= 94, h=-80, rot=0.0))
    return U(s1, s2, s3, s4, sv)

def build_X():
    d1 = stroke([(112, 656), (238, 434), (382, 190), (456, 56)], 172,
                taper=[.90, 1.04, 1.04, .90], wob=.010, seed=29)
    d2 = stroke([(456, 656), (332, 436), (188, 192), (110, 56)], 162,
                taper=[.90, 1.04, 1.04, .90], wob=.010, seed=30)
    sv = U(foot(116, 700, w=192, tipw= 98, h=-84, rot=0.03),
           foot(452, 700, w=186, tipw= 96, h=-84, rot=-0.03),
           foot(112,   0, w=198, tipw=100, h= 86, rot=-0.03),
           foot(456,   0, w=192, tipw= 98, h= 86, rot=0.03))
    return U(d1, d2, sv)

def build_Y():
    d1 = stroke([(100, 656), (176, 512), (262, 366)], 168, taper=[.90, 1.02, 1.06],
                wob=.008, seed=31)
    d2 = stroke([(444, 656), (370, 512), (290, 366)], 158, taper=[.90, 1.02, 1.06],
                wob=.008, seed=32)
    st = Istem(276, y1=408)
    sv = U(foot(104, 700, w=194, tipw= 98, h=-84, rot=0.03),
           foot(440, 700, w=188, tipw= 96, h=-84, rot=-0.03))
    return U(d1, d2, st, sv)

def build_Z():
    top = U(hbar(18, 498, 628, h=140, flare=1.14),
            slab(62, 526, 104, 64))
    bot = U(hbar(6,  512,  72, h=148, flare=1.14),
            slab(466, 176, 104, 66))
    dg = stroke([(398, 604), (288, 396), (152, 176), (110,  96)], 176,
                taper=[.94, 1.04, 1.04, .94], wob=.010, seed=33)
    return U(top, dg, bot)


# ------------------------------------------------------- l'alphabet complet
# Quinze lettres sortent du sceau tel quel, onze sont dessinees dans la meme main.

def _from_seal(k):
    def f(): return SEAL[k]
    f.__name__ = 'g_' + k
    return f

for _k in 'ACDEGHILMORSTUV':
    globals()['g_' + _k] = _from_seal(_k)
for _k, _fn in (('B', build_B), ('F', build_F), ('J', build_J), ('K', build_K),
                ('N', build_N), ('P', build_P), ('Q', build_Q), ('W', build_W),
                ('X', build_X), ('Y', build_Y), ('Z', build_Z)):
    globals()['g_' + _k] = _fn

SEAL_LETTERS  = set('ACDEGHILMORSTUV')   # la main de la famille, telle quelle
DRAWN_LETTERS = set('BFJKNPQWXYZ')       # dessinees dans la meme main


# =========================================================== 2 bis. LE BAS DE CASSE
# TOUT ce bloc est mon dessin. Le sceau de la famille ne porte aucune minuscule :
# pas un seul contour de la famille n'entre ici, contrairement aux quinze
# capitales. Chaque lettre est DEDUITE d'une capitale par la mesure (le fut et
# l'empattement du I, la panse et l'ergot du D, le contre decentre du O, les futs
# et l'epaule du M, les bras du E, les terminaisons du C, du S et du R, le fond du
# U, le pied du T) puis redessinee au poids releve sur le sceau, avec le meme
# tremblement de contour. Le detail lettre par lettre est dans LISEZ_MOI.txt.

XH        = 500      # hauteur d'x, sur une capitale de 700 (0.714)
LC_ASC    = 716      # hampe : 16 unites au-dessus de la capitale
LC_DESC   = -186     # jambage
LC_OVER   = 8        # debord des rondes du bas de casse
LC_ACC_TOP = 700     # sommet des accents du bas de casse (sous la hampe)

LC_STEM      = 142   # fut du bas de casse (capitale : 152)
LC_SWELL     = 152   # renflement a mi-fut  (capitale : 175)
LC_SERIF_W   = 214   # empattement, largeur (capitale : 216) : le meme coin
LC_SERIF_TIP = 112   # empattement, pointe  (capitale : 112)
LC_SERIF_H   = 86    # empattement, hauteur (capitale : 88)
LC_RND_V     = 150   # flanc d'une ronde    (capitale : 178)
LC_RND_H     = 126   # haut d'une ronde     (capitale : 154)
LC_SQ        = .80   # carrure des rondes : le O du sceau n'est pas un cercle
LC_BAR       = 104   # traverse du e, du t, du f
LC_ARM       = 138
LC_SPUR_H    = 50
LC_DOT_R     = 86
LC_WOB       = 6.0   # amplitude du tremblement du fut, en unites


def _gprofile(d, sw, tip, sh, body):
    """Le profil d'empattement releve sur le I du sceau, exprime en proportions
    pour pouvoir etre redessine a l'echelle du bas de casse : pointe retrecie au
    bord, evasement maximum juste au-dessus, puis resorption dans le fut."""
    tab = [(0.0, tip / 2.), (sh * .16, sw * .435), (sh * .36, sw / 2.),
           (sh * .66, sw * .426), (sh * 1.0, body * .526), (sh * 1.93, body / 2.)]
    if d >= tab[-1][0]:
        return None
    for i in range(len(tab) - 1):
        a, b = tab[i], tab[i + 1]
        if d <= b[0]:
            t = (d - a[0]) / float(b[0] - a[0])
            t = t * t * (3 - 2 * t)
            return a[1] + (b[1] - a[1]) * t
    return body / 2.


def gstem(xc, y0, y1, serif0=True, serif1=True, body=None, swell=None,
          sw=None, tip=None, sh=None, wob=None, seed=1, waist_y=None, waist=True):
    """Le fut du bas de casse. Meme profil d'empattement que le fut du sceau,
    meme renflement a mi-hauteur, meme contour qui tremble."""
    body = LC_STEM if body is None else body
    swell = LC_SWELL if swell is None else swell
    sw = LC_SERIF_W if sw is None else sw
    tip = LC_SERIF_TIP if tip is None else tip
    sh = LC_SERIF_H if sh is None else sh
    wob = LC_WOB if wob is None else wob
    H = float(y1 - y0)
    q = sh / 88.
    wy = (H * .5) if waist_y is None else (waist_y - y0)
    ys = set([0.0, H])
    if waist and 0 < wy < H:
        ys.add(wy)
    for v in (0, 6, 14, 24, 32, 44, 58, 72, 88, 120, 170):
        ys.add(v * q); ys.add(H - v * q)
    ys = sorted(y for y in ys if 0 <= y <= H)
    rnd = _rng(seed)
    L, R = [], []
    for y in ys:
        hw = body / 2.
        if serif0:
            v = _gprofile(y, sw, tip, sh, body)
            if v is not None: hw = v if y <= 32 * q else max(hw, v)
        if serif1:
            v = _gprofile(H - y, sw, tip, sh, body)
            if v is not None: hw = v if (H - y) <= 32 * q else max(hw, v)
        if waist and abs(y - wy) < 1e-6:
            hw = max(hw, swell / 2.)
        corner = ('c',) if ((y == 0 and serif0) or (abs(y - H) < 1e-9 and serif1)) else ()
        L.append((xc - hw - (rnd() - .5) * wob, y0 + y) + corner)
        R.append((xc + hw + (rnd() - .5) * wob, y0 + y) + corner)
    return shape(L + list(reversed(R)))


def noear(p, xc, y_top, body=None, depth=210):
    """Coupe l'oreille droite de l'empattement du haut : le n, le m et le r
    sortent leur epaule de ce cote-la, l'empattement n'y a pas sa place."""
    body = LC_STEM if body is None else body
    return SUB(p, rect(xc + body / 2., y_top - depth, xc + 2400, y_top + 60))


def sector(cx, cy, a0, a1, r=1600.0, n=10):
    pts = [(cx, cy)]
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / float(n))
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return poly(pts)


def bowl_left(x0, y0, x1, y1, cx0, cy0, cx1, cy1, flat=.64, cflat=.52):
    """Demi-panse a gauche d'un fut (le d, le q). Retracee, pas retournee : le
    sommet de la courbe tombe plus haut que dans la panse de droite et
    l'aplatissement contre le fut est plus court, comme dans le sceau ou la panse
    du D n'est pas symetrique de haut en bas."""
    ym = (y0 + y1) / 2.0; ry = (y1 - y0) / 2.0
    out = [(x1, y1, 'c'),
           (x1 - (x1 - x0) * .50, y1 - ry * .05),
           (x0 + (x1 - x0) * .10, ym + ry * flat),
           (x0, ym + ry * .04),
           (x0 + (x1 - x0) * .12, ym - ry * flat),
           (x1 - (x1 - x0) * .50, y0 + ry * .02),
           (x1, y0, 'c')]
    cym = (cy0 + cy1) / 2.0; cry = (cy1 - cy0) / 2.0
    inn = [(cx1, cy1, 'c'),
           (cx1 - (cx1 - cx0) * .48, cy1),
           (cx0, cym + cry * cflat),
           (cx0, cym),
           (cx0, cym - cry * cflat),
           (cx1 - (cx1 - cx0) * .48, cy0),
           (cx1, cy0, 'c')]
    inn.reverse()
    return path_from_contours([out, inn])


def shoulder(xa, xb, y_spring, y_top, w=None, seed=1, thin=.80, wob=.012,
             end_a=.94, end_b=.94):
    """L'epaule du n, du m, du h, et le fond du u. Elle quitte le fut d'un coup,
    monte presque droit, puis s'aplatit : le haut du O du sceau est plat, ses
    flancs sont droits, et les epaules du M partent du fut sans arrondi. Une
    epaule en demi-cercle ferait une autre police."""
    w = LC_RND_V + 4 if w is None else w
    up = 1.0 if y_top > y_spring else -1.0
    dx = float(xb - xa); dy = y_top - y_spring
    pts = [(xa, y_spring),
           (xa + dx * .012, y_spring + dy * .56),
           (xa + dx * .13, y_top - up * 22),
           (xa + dx * .34, y_top),
           (xb - dx * .34, y_top),
           (xb - dx * .13, y_top - up * 22),
           (xb - dx * .012, y_spring + dy * .56),
           (xb, y_spring)]
    tp = [end_a, 1.0, .93, thin, thin, .93, 1.0, end_b]
    return stroke(pts, w, taper=tp, wob=wob, seed=seed)


def _sqpt(rx, ry, sq, A):
    """Le point de la ronde carree qui tombe sur le rayon d'angle A."""
    best = None
    for i in range(401):
        t = A - 1.0 + 2.0 * i / 400.0
        ct, st_ = math.cos(t), math.sin(t)
        x = rx * math.copysign(abs(ct) ** sq, ct)
        y = ry * math.copysign(abs(st_) ** sq, st_)
        d = abs(math.atan2(y, x) - A)
        if best is None or d < best[0]:
            best = (d, x, y)
    return best[1], best[2]


def ring_end(cx, cy, rx, ry, tv, th, ang, side=1, h=78, sq=1.0, sqi=None,
             swell=1.14):
    """La terminaison que le C et le S du sceau posent au bout de leur courbe :
    le trait est coupe net au bord, et il enfle juste en arriere de la coupe.
    Le coin est pose a l'interieur du trait, il ne deborde jamais la coupe."""
    a = math.radians(ang)
    ox, oy = _sqpt(rx, ry, sq, a)
    ix, iy = _sqpt(rx - tv, ry - th, sq if sqi is None else sqi, a)
    px, py = cx + (ox + ix) / 2., cy + (oy + iy) / 2.
    wall = math.hypot(ox - ix, oy - iy)
    return foot(px, py, w=wall * swell, tipw=wall, h=side * h, sign=1, rot=a)


def dspur(x, y, w=64, h=46, seed=77):
    """L'ergot que la famille laisse sous la panse du D, reporte sous les panses
    du bas de casse."""
    return blob(x, y, w, h, n=10, seed=seed, wob=.12)


# ---- les vingt-six ----------------------------------------------------------

OX, OY, ORX, ORY = 250., 246., 250., 254.        # la ronde de reference du bas de casse
SQI = .88                                         # le contre est moins carre que le dehors


def lc_ring(cx=OX, cy=OY, rx=ORX, ry=ORY, tv=None, th=None, seed=61, tilt=5,
            n=28, wob=.020):
    return oval(cx, cy, rx, ry, tv=LC_RND_V if tv is None else tv,
                th=LC_RND_H if th is None else th, n=n, wob=wob, seed=seed,
                tilt=tilt, sq=LC_SQ, sqi=SQI)


def l_o():
    # le contre decentre du O du sceau (tilt), ses flancs droits (sq), ses
    # epaisseurs de flanc et de haut ramenees au bas de casse, son tremblement
    return lc_ring(seed=61)


def _arch(xa, xb, seed, w=154, spring=286):
    return shoulder(xa, xb, spring, XH + LC_OVER - LC_RND_H / 2., w=w,
                    seed=seed, thin=LC_RND_H / float(w),
                    end_a=LC_STEM / float(w) + .02, end_b=LC_STEM / float(w) + .02)


def l_n():
    xa, xb = 110, 402
    st = noear(gstem(xa, 0, XH, seed=63), xa, XH)
    rs = gstem(xb, 0, 340, serif1=False, waist_y=XH * .5, seed=65)
    return U(st, rs, _arch(xa, xb, 64))


def l_m():
    xa, xb, xc = 110, 372, 634
    st = noear(gstem(xa, 0, XH, seed=66), xa, XH)
    m2 = noear(gstem(xb, 0, 344, serif1=False, waist_y=XH * .5, seed=68), xb, 344, depth=64)
    rs = gstem(xc, 0, 340, serif1=False, waist_y=XH * .5, seed=70)
    return U(st, m2, rs, _arch(xa, xb, 67, w=150), _arch(xb, xc, 69, w=148))


def l_h():
    xa, xb = 110, 402
    st = noear(gstem(xa, 0, LC_ASC, waist_y=LC_ASC * .5, seed=75), xa, XH, depth=170)
    rs = gstem(xb, 0, 340, serif1=False, waist_y=XH * .5, seed=81)
    return U(st, rs, _arch(xa, xb, 76))


def l_u():
    xa, xb = 110, 402
    ls = gstem(xa, 196, XH, serif0=False, waist=False, seed=82)
    rs = gstem(xb, 0, XH, waist_y=XH * .5, seed=83)
    bo = shoulder(xa, xb, 214, -LC_OVER + LC_RND_H / 2., w=154, seed=84,
                  thin=LC_RND_H / 154., end_a=LC_STEM / 154. + .02,
                  end_b=LC_STEM / 154. + .02)
    return U(ls, rs, bo)


def l_b():
    st = gstem(110, 0, LC_ASC, waist_y=LC_ASC * .5, seed=71)
    bw = bowl_right(154, -LC_OVER, 502, XH, 196, 118, 356, 372, flat=.66, cflat=.52)
    return U(st, bw, dspur(202, 22))


def l_d():
    st = gstem(438, 0, LC_ASC, waist_y=LC_ASC * .5, seed=72)
    bw = bowl_left(46, -LC_OVER, 512, XH, 194, 118, 354, 372, flat=.66, cflat=.52)
    return U(st, bw, dspur(348, 22, seed=78))


def l_p():
    st = noear(gstem(110, LC_DESC, XH, waist_y=XH * .40, seed=73), 110, XH)
    bw = bowl_right(154, -LC_OVER, 502, XH, 196, 118, 356, 372, flat=.66, cflat=.52)
    return U(st, bw, dspur(202, 22, seed=79))


def l_q():
    st = gstem(438, LC_DESC, XH, waist_y=XH * .40, seed=74)
    st = SUB(st, rect(438 - 2400, XH - 200, 438 - LC_STEM / 2., XH + 60))
    bw = bowl_left(46, -LC_OVER, 512, XH, 194, 118, 354, 372, flat=.66, cflat=.52)
    return U(st, bw, dspur(348, 22, seed=80))


def l_r():
    xa = 110
    st = noear(gstem(xa, 0, XH, seed=85), xa, XH)
    sh = stroke([(xa, 282), (xa + 8, 372), (xa + 54, 430), (xa + 148, 450),
                 (xa + 220, 430)], 152, taper=[.94, 1.0, .92, .82, .82],
                wob=.012, seed=86)
    tm = blob(xa + 246, 408, 90, 84, n=11, seed=87, wob=.08)
    return U(st, sh, tm)


def l_i():
    return U(gstem(110, 0, XH, seed=88), dot(110, 628, LC_DOT_R, LC_DOT_R * .96))


def l_dotlessi():
    return gstem(110, 0, XH, seed=88)


def l_j():
    st = gstem(156, 66, XH, serif0=False, waist_y=XH * .5, seed=89)
    hk = stroke([(156, 200), (156, -46), (116, -136), (12, -168), (-64, -128)], 146,
                taper=[1.0, 1.0, .96, .88, .70], wob=.012, seed=90)
    return U(st, hk, dot(156, 628, LC_DOT_R, LC_DOT_R * .96))


def l_l():
    return gstem(110, 0, LC_ASC, waist_y=LC_ASC * .5, seed=91)


def l_k():
    st = gstem(110, 0, LC_ASC, waist_y=LC_ASC * .5, seed=92)
    ar = stroke([(146, 244), (240, 316), (358, 410), (410, 456)], 146,
                taper=[1.08, 1.02, .98, .88], wob=.012, seed=93)
    as_ = foot(424, 484, w=176, tipw=94, h=-76, sign=1, rot=-0.42)
    lg = stroke([(192, 258), (270, 188), (374, 88), (426, 38)], 152,
                taper=[1.08, 1.02, .98, .88], wob=.012, seed=94)
    ls = foot(430, 0, w=190, tipw=98, h=86, sign=1, rot=0.04)
    return U(st, ar, as_, lg, ls)


def l_t():
    st = gstem(164, 0, 606, serif1=False, waist_y=XH * .42, seed=95)
    st = SUB(st, poly([(40, 556), (310, 606), (310, 790), (40, 790)]))
    br = hbar(0, 348, XH - LC_BAR / 2., LC_BAR, flare=1.12)
    s1 = spur(44, XH - LC_BAR, -LC_SPUR_H, w=86)
    s2 = spur(304, XH - LC_BAR, -LC_SPUR_H, w=86)
    return U(st, br, s1, s2)


def l_f():
    st = gstem(158, 0, 476, serif1=False, waist_y=XH * .42, seed=96)
    hk = stroke([(158, 396), (158, 556), (192, 628), (268, 652), (344, 622),
                 (370, 566)], 146, taper=[1.0, 1.0, .94, .84, .90, .96],
                wob=.012, seed=97)
    tm = blob(380, 550, 80, 76, n=11, seed=98, wob=.08)
    br = hbar(-8, 340, XH - LC_BAR / 2., LC_BAR, flare=1.12)
    s1 = spur(36, XH - LC_BAR, -LC_SPUR_H, w=86)
    s2 = spur(296, XH - LC_BAR, -LC_SPUR_H, w=86)
    return U(st, hk, tm, br, s1, s2)


def l_c():
    # le C du sceau : la meme ronde ouverte sur le flanc droit, les memes
    # terminaisons coupees net et renflees juste en arriere de la coupe
    A = 66.
    ring = SUB(lc_ring(seed=99, tilt=4), sector(OX, OY, -A, A))
    e1 = ring_end(OX, OY, ORX, ORY, LC_RND_V, LC_RND_H, A, side=1, h=84,
                  sq=LC_SQ, sqi=SQI)
    e2 = ring_end(OX, OY, ORX, ORY, LC_RND_V, LC_RND_H, -A, side=-1, h=84,
                  sq=LC_SQ, sqi=SQI)
    return U(ring, e1, e2)


def l_e():
    # les proportions du E du sceau refermees en panse : une traverse
    # horizontale a la hauteur de son bras median, le bout coupe net comme le
    # bras du bas du E
    tv, th = LC_RND_V - 8, LC_RND_H - 8
    yb = 256.                       # milieu de la traverse
    bx1 = 416.
    ybot = yb - LC_BAR / 2.
    ring = lc_ring(seed=100, tilt=4, tv=tv, th=th)
    a_top = math.degrees(math.atan2(ybot - OY, bx1 - OX))
    A = 62.
    ring = SUB(ring, sector(OX, OY, -A, a_top))
    br = hbar(76, bx1, yb, LC_BAR, flare=1.06)
    e2 = ring_end(OX, OY, ORX, ORY, tv, th, -A, side=-1, h=80,
                  sq=LC_SQ, sqi=SQI)
    return U(ring, br, e2)


def l_a():
    # le O pour la panse, le pied du I pour le fut. La panse est courte et son
    # contre est petit : a cette graisse c'est la seule facon de garder un a a
    # deux etages lisible. Le bec du haut s'arrete court, la baie reste ouverte
    # en bas a gauche, comme dans les grasses de bois.
    xs = 410.
    st = gstem(xs, 0, 350, serif1=False, waist=False, seed=101)
    bo = oval(263.5, 150, 187.5, 158, tv=112, th=88, n=26, wob=.020, seed=104,
              tilt=4, sq=.86, sqi=.92)
    ar = stroke([(xs, 292), (xs + 2, 388), (xs - 28, 438), (xs - 108, 454),
                 (xs - 188, 444), (xs - 228, 420)], 148,
                taper=[.96, 1.0, .94, .81, .88, .92], wob=.012, seed=102)
    tm = blob(xs - 240, 404, 80, 76, n=11, seed=103, wob=.08)
    return U(st, bo, ar, tm)


def l_g():
    # la ronde du bas de casse posee sur le crochet du U du sceau
    bo = lc_ring(cx=246, cy=250, rx=246, ry=250, seed=105, tilt=4)
    xs = 246 + 246 - LC_RND_V / 2.
    ds = stroke([(xs, 220), (xs, 20), (xs - 26, -92), (xs - 140, -156),
                 (xs - 272, -142), (xs - 336, -98)], 146,
                taper=[1.0, 1.0, .98, .92, .84, .66], wob=.012, seed=106)
    return U(bo, ds)


def l_s():
    sp = stroke([(406, 378), (352, 452), (246, 482), (140, 458), (100, 396),
                 (136, 336), (244, 294), (338, 248), (370, 180), (324, 102),
                 (206, 66), (108, 96), (62, 158)], 132,
                taper=[.92, 1.02, 1.08, 1.04, 1.0, 1.0, 1.0, 1.0, 1.04, 1.08,
                       1.04, 1.02, .94], wob=.014, seed=107)
    t1 = foot(406, 378, w=142, tipw=122, h=76, sign=1, rot=math.radians(36.1))
    t2 = foot(62, 158, w=142, tipw=122, h=76, sign=1, rot=math.radians(216.6))
    return U(sp, t1, t2)


def l_v():
    return U(stroke([(88, 458), (166, 240), (244, 14)], 152, taper=[.94, 1.04, .88],
                    wob=.010, seed=108),
             stroke([(244, 14), (322, 240), (400, 458)], 142, taper=[.88, 1.04, .94],
                    wob=.010, seed=109),
             foot(92, XH, w=196, tipw=104, h=-82, sign=1, rot=0.03),
             foot(396, XH, w=190, tipw=100, h=-82, sign=1, rot=-0.03))


def l_w():
    s1 = stroke([(92, 456), (132, 240), (174, 16)], 144, taper=[.92, 1.04, .90],
                wob=.010, seed=110)
    s2 = stroke([(174, 16), (220, 226), (264, 428)], 128, taper=[.90, 1.04, .92],
                wob=.010, seed=111)
    s3 = stroke([(276, 428), (322, 238), (366, 16)], 140, taper=[.92, 1.04, .90],
                wob=.010, seed=112)
    s4 = stroke([(366, 16), (414, 226), (460, 456)], 132, taper=[.90, 1.04, .92],
                wob=.010, seed=113)
    sv = U(foot(94, XH, w=188, tipw=100, h=-80, sign=1, rot=0.03),
           foot(462, XH, w=182, tipw=96, h=-80, sign=1, rot=-0.03),
           foot(270, XH - 62, w=166, tipw=90, h=-72, sign=1, rot=0.0))
    return U(s1, s2, s3, s4, sv)


def l_x():
    d1 = stroke([(88, 458), (190, 300), (302, 140), (358, 46)], 150,
                taper=[.90, 1.04, 1.04, .90], wob=.010, seed=114)
    d2 = stroke([(358, 458), (258, 302), (146, 142), (88, 46)], 142,
                taper=[.90, 1.04, 1.04, .90], wob=.010, seed=115)
    sv = U(foot(92, XH, w=188, tipw=100, h=-80, sign=1, rot=0.03),
           foot(354, XH, w=182, tipw=96, h=-80, sign=1, rot=-0.03),
           foot(88, 0, w=192, tipw=102, h=80, sign=1, rot=-0.03),
           foot(360, 0, w=188, tipw=100, h=80, sign=1, rot=0.03))
    return U(d1, d2, sv)


def l_y():
    d1 = stroke([(88, 456), (166, 290), (246, 120)], 148, taper=[.94, 1.02, 1.04],
                wob=.010, seed=116)
    d2 = stroke([(400, 456), (304, 248), (200, 22), (146, -100)], 142,
                taper=[.94, 1.02, 1.0, .92], wob=.010, seed=117)
    sv = U(foot(92, XH, w=192, tipw=102, h=-80, sign=1, rot=0.03),
           foot(396, XH, w=186, tipw=98, h=-80, sign=1, rot=-0.03),
           foot(138, LC_DESC + 6, w=180, tipw=96, h=84, sign=1, rot=0.36))
    return U(d1, d2, sv)


def l_z():
    top = U(hbar(16, 404, XH - 58, h=116, flare=1.14), slab(56, XH - 118, 92, 58))
    bot = U(hbar(4, 416, 58, h=122, flare=1.14), slab(376, 132, 92, 58))
    dg = stroke([(324, 442), (234, 302), (126, 148), (94, 82)], 152,
                taper=[.94, 1.04, 1.04, .94], wob=.010, seed=118)
    return U(top, dg, bot)


LOWER = {}
for _c in 'abcdefghijklmnopqrstuvwxyz':
    LOWER[_c] = globals()['l_' + _c]

LC_SB = {
    'a': (74, 70), 'b': (92, 72), 'c': (78, 72), 'd': (72, 92), 'e': (78, 74),
    'f': (66, 50), 'g': (74, 70), 'h': (92, 90), 'i': (94, 94), 'j': (56, 84),
    'k': (92, 58), 'l': (94, 92), 'm': (92, 90), 'n': (92, 90), 'o': (76, 76),
    'p': (92, 72), 'q': (72, 92), 'r': (92, 54), 's': (78, 78), 't': (54, 60),
    'u': (90, 88), 'v': (54, 54), 'w': (52, 52), 'x': (58, 58), 'y': (54, 54),
    'z': (72, 72),
}


# =========================================================== 3. chiffres
# Chiffres alignes sur la capitale et tous de meme chasse : la maison numerote
# ses lots et ses bouteilles, les colonnes doivent s'aligner.

def g_zero():
    return oval(268, 350, 268, 359, tv=170, th=150, n=26, wob=.020, seed=41, tilt=5)

def g_one():
    return U(Istem(280),
             stroke([(78, 516), (166, 574), (258, 642)], 156, [1.06, 1.0, 1.0],
                    wob=.02, seed=42))

def g_two():
    a = stroke([(64, 490), (104, 592), (242, 624), (386, 562), (392, 448),
                (300, 352), (150, 204), (88, 132)], 168,
               [.86, 1.0, 1.04, 1.02, 1.0, 1.0, 1.0, 1.0], wob=.018, seed=43)
    return U(a, arm(24, 492, ARM / 2., ARM, spur_dir=+1))

def g_three():
    up = stroke([(60, 534), (118, 612), (262, 624), (364, 546), (334, 450),
                 (232, 412)], 156, [.84, 1.0, 1.04, 1.02, 1.0, 1.0],
                wob=.018, seed=44)
    lo = stroke([(232, 412), (372, 386), (432, 262), (370, 130), (222, 78),
                 (88, 124), (46, 206)], 168,
                [1.0, 1.02, 1.04, 1.04, 1.02, 1.0, .86], wob=.018, seed=45)
    return U(up, lo)

def g_four():
    return U(stroke([(330, 656), (222, 476), (104, 280), (58, 202)], 166,
                    [.96, 1.02, 1.02, 1.0], wob=.016, seed=46),
             hbar(44, 508, 206, BAR + 10, flare=1.08),
             clip(Istem(354), y1=552),
             stroke([(354, 692), (354, 420)], 152))

def g_five():
    return U(arm(60, 458, CAP - ARM / 2., ARM, spur_dir=-1),
             stroke([(146, 620), (128, 512), (114, 434)], 162, [1.0, 1.0, .98],
                    wob=.014, seed=47),
             stroke([(114, 436), (270, 462), (402, 356), (392, 196), (252, 76),
                     (96, 118), (48, 200)], 172,
                    [.98, 1.02, 1.04, 1.04, 1.02, 1.0, .86], wob=.018, seed=48))

def g_six():
    body = oval(268, 222, 246, 231, tv=168, th=148, n=24, wob=.020, seed=49, tilt=4)
    arc = stroke([(76, 296), (98, 480), (206, 610), (356, 630)], 164,
                 [1.0, 1.02, 1.02, .94], wob=.016, seed=50)
    return U(body, arc)

def g_seven():
    return U(arm(18, 502, CAP - ARM / 2., ARM, spur_dir=-1, out_left=True),
             stroke([(432, 588), (352, 394), (268, 176), (238, 62)], 174,
                    [.98, 1.02, 1.02, .98], wob=.016, seed=51),
             wedge(236, 0, w=198, tip=104, h=92))

def g_eight():
    return U(oval(272, 514, 214, 195, tv=156, th=132, n=22, wob=.022, seed=52, tilt=4),
             oval(272, 182, 256, 191, tv=166, th=140, n=22, wob=.022, seed=53, tilt=-4))

def g_nine():
    body = oval(268, 478, 246, 231, tv=168, th=148, n=24, wob=.020, seed=54, tilt=-4)
    arc = stroke([(460, 404), (438, 220), (330,  90), (180,  70)], 164,
                 [1.0, 1.02, 1.02, .94], wob=.016, seed=55)
    return U(body, arc)


DIGITS = {str(i): globals()['g_' + n] for i, n in enumerate(
    ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'])}


# =========================================================== 4. ponctuation

def p_period():    return dot(DOT_R, DOT_R - 6)
def p_comma():
    return U(dot(DOT_R, DOT_R - 6),
             stroke([(DOT_R + 8, 46), (DOT_R - 6, -70), (DOT_R - 66, -164)], 106,
                    [1.0, .84, .52]))
def p_colon():     return U(dot(DOT_R, DOT_R - 6), dot(DOT_R, 424))
def p_semicolon(): return U(p_comma(), dot(DOT_R, 424))
def p_exclam():
    body = shape([(-106, CAP, 'c'), (-52, CAP), (52, CAP), (106, CAP, 'c'),
                  (88, 500), (74, 340), (66, 236, 'c'),
                  (-66, 236, 'c'), (-74, 340), (-88, 500)])
    return U(move(body, 108, 0), dot(108, DOT_R - 6))
def p_question():
    h = stroke([(38, 496), (80, 596), (222, 628), (348, 580), (360, 470),
                (272, 400), (218, 336), (216, 268)], 154,
               [.90, 1.02, 1.04, 1.02, 1.0, 1.0, 1.0, 1.0])
    return U(h, dot(216, DOT_R - 6))
def p_exclamdown():
    p = p_exclam(); b = pbounds(p)
    return move(scale_p(p, 1, -1), 0, b[3] - 160)
def p_questiondown():
    p = p_question(); b = pbounds(p)
    return move(scale_p(p, -1, -1), b[2], b[3] - 160)

def p_hyphen():     return hbar(0, 250, 330, 130, flare=1.08)
def p_endash():     return hbar(0, 420, 330, 124, flare=1.06)
def p_emdash():     return hbar(0, 700, 330, 124, flare=1.04)
def p_underscore(): return hbar(0, 620, -130, 108, flare=1.02)

def p_parenleft():
    return stroke([(258, 762), (108, 528), (68, 292), (114, 50), (266, -188)], 140,
                  [.78, 1.02, 1.06, 1.02, .78])
def p_parenright():
    p = p_parenleft(); b = pbounds(p)
    return move(scale_p(p, -1, 1), b[2] + b[0], 0)
def p_bracketleft():
    return U(hbar(64, 306, 706, 110, flare=1.0), hbar(64, 306, -134, 110, flare=1.0),
             stroke([(122, 720), (122, -148)], 132))
def p_bracketright():
    p = p_bracketleft(); b = pbounds(p)
    return move(scale_p(p, -1, 1), b[2] + b[0], 0)

def p_slash():
    return stroke([(30, -120), (152, 220), (300, 620), (348, 754)], 156,
                  [.94, 1.02, 1.02, .94])
def p_backslash():
    p = p_slash(); b = pbounds(p)
    return move(scale_p(p, -1, 1), b[2] + b[0], 0)
def p_bar(): return stroke([(76, -160), (76, 740)], 128)

def p_quotesingle():
    return shape([(56, CAP, 'c'), (150, CAP, 'c'), (128, 470), (48, 470, 'c')])
def p_quotedbl():
    q = p_quotesingle(); return U(q, move(q, 172, 0))
def p_quoteright():
    return shape([(48, CAP, 'c'), (162, CAP, 'c'), (150, 596), (116, 512),
                  (44, 452, 'c'), (40, 528), (44, 610)])
def p_quoteleft():
    p = p_quoteright(); b = pbounds(p)
    return move(scale_p(p, -1, -1), b[2], b[3] + b[1])
def p_quotedblright():
    q = p_quoteright(); return U(q, move(q, 176, 0))
def p_quotedblleft():
    q = p_quoteleft();  return U(q, move(q, 176, 0))

def _chev(x, y, w, h, left=True):
    s = -1 if left else 1
    return stroke([(x - s * w / 2., y + h / 2.), (x + s * w / 2., y),
                   (x - s * w / 2., y - h / 2.)], 112, [.92, 1.08, .92])
def p_guillemotleft():  return U(_chev(150, 340, 168, 292, True),  _chev(340, 340, 168, 292, True))
def p_guillemotright(): return U(_chev(150, 340, 168, 292, False), _chev(340, 340, 168, 292, False))
def p_guilsinglleft():  return _chev(150, 340, 168, 292, True)
def p_guilsinglright(): return _chev(150, 340, 168, 292, False)

def p_ellipsis():
    return U(dot(DOT_R, DOT_R - 6), dot(DOT_R + 300, DOT_R - 6), dot(DOT_R + 600, DOT_R - 6))
def p_bullet():           return dot(118, 340, 118, 116)
def p_periodcentered():   return dot(94, 340, 92, 90)
def p_degree():           return oval(148, 570, 148, 148, tv=100, th=96, n=18)

def p_percent():
    return U(oval(166, 534, 166, 156, tv=108, th=100, n=18),
             oval(542, 156, 166, 156, tv=108, th=100, n=18),
             stroke([(66, 34), (356, 372), (642, 668)], 128, [.94, 1.02, .94]))
def p_perthousand():
    return U(p_percent(), move(oval(542, 156, 166, 156, tv=108, th=100, n=18), 384, 0))

def p_asterisk():
    cx, cy, r = 250., 520., 178.
    arms = []
    for i in range(5):
        a = math.pi / 2 + i * 2 * math.pi / 5
        arms.append(stroke([(cx, cy), (cx + r * math.cos(a), cy + r * math.sin(a))],
                           118, [1.30, .78]))
    return U(*arms)
def p_plus():   return U(hbar(0, 420, 350, 124, flare=1.0), stroke([(210, 142), (210, 558)], 132))
def p_minus():  return hbar(0, 420, 350, 124, flare=1.04)
def p_equal():  return U(hbar(0, 420, 452, 116, flare=1.02), hbar(0, 420, 248, 116, flare=1.02))
def p_less():   return _chev(196, 350, 264, 400, True)
def p_greater(): return _chev(196, 350, 264, 400, False)
def p_multiply():
    return U(stroke([(60, 500), (400, 200)], 122), stroke([(60, 200), (400, 500)], 122))

def p_numbersign():
    return U(stroke([(146, 20), (218, 680)], 116), stroke([(330, 20), (402, 680)], 116),
             hbar(24, 516, 240, 108, flare=1.0), hbar(46, 538, 466, 108, flare=1.0))

def p_ampersand():
    return stroke([(572, 52), (438, 188), (306, 348), (196, 466), (166, 566),
                   (252, 640), (340, 562), (302, 442), (192, 300), (154, 172),
                   (272, 56), (422, 66), (528, 182)], 148,
                  [.86, 1.0, 1.02, 1.0, 1.0, 1.02, 1.0, 1.0, 1.0, 1.02, 1.02,
                   1.0, .86])

def p_at():
    outer = oval(360, 340, 356, 348, tv=120, th=110, n=28)
    outer = SUB(outer, rect(346, -80, 820, 24))
    inner = oval(370, 312, 152, 156, tv=108, th=100, n=20)
    st = stroke([(516, 452), (508, 196), (598, 138)], 106, [1.0, 1.0, .88])
    return U(outer, inner, st)

def p_dollar():
    s = move(scale_p(g_S(), .88, .88), 0, 44)
    b = pbounds(s)
    return U(s, stroke([((b[0] + b[2]) / 2., -46), ((b[0] + b[2]) / 2., 748)], 106))

def p_euro():
    c = move(scale_p(g_C(), .94, .94), 22, 20)
    return U(c, hbar(-30, 366, 404, 108, flare=1.0), hbar(-30, 340, 272, 108, flare=1.0))

def p_sterling():
    c = clip(move(scale_p(g_C(), .92, .92), 10, 20), y0=260)
    return U(c, stroke([(150, 400), (150, 96)], 148),
             arm(28, 476, ARM / 2. - 6, ARM - 10),
             hbar(56, 336, 300, 100, flare=1.0))

def p_copyright():
    o = oval(350, 350, 348, 348, tv=94, th=90, n=28)
    c = scale_p(g_C(), .50, .50); cb = pbounds(c)
    return U(o, move(c, 350 - (cb[0] + cb[2]) / 2., 350 - (cb[1] + cb[3]) / 2.))
def p_registered():
    o = oval(350, 350, 348, 348, tv=94, th=90, n=28)
    r = scale_p(g_R(), .50, .50); rb = pbounds(r)
    return U(o, move(r, 350 - (rb[0] + rb[2]) / 2., 350 - (rb[1] + rb[3]) / 2.))


# =========================================================== 5. accents

def a_grave():      return stroke([(-82, 856), (82, 742)], 116, [.92, .92])
def a_acute():      return stroke([(-82, 742), (82, 856)], 116, [.92, .92])
def a_circumflex(): return stroke([(-120, 740), (0, 838), (120, 740)], 120, [.86, 1.08, .86])
def a_tilde():      return stroke([(-142, 772), (-64, 846), (58, 758), (140, 830)], 104,
                                  [.82, 1.04, 1.04, .82])
def a_dieresis():   return U(dot(-108, 812, 82, 80), dot(108, 812, 82, 80))
def a_ring():       return oval(0, 786, 114, 114, tv=82, th=78, n=18)
def a_cedilla():    return stroke([(0, 12), (28, -66), (-32, -112), (-98, -170)], 90,
                                  [1.0, .96, .84, .58])


# =========================================================== 6. le repertoire

BASE = {}
for _c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
    BASE[_c] = globals()['g_' + _c]
for _c in 'abcdefghijklmnopqrstuvwxyz':
    BASE[_c] = LOWER[_c]
for _c, _n in zip('0123456789',
                  ['zero', 'one', 'two', 'three', 'four', 'five', 'six',
                   'seven', 'eight', 'nine']):
    BASE[_c] = globals()['g_' + _n]

PUNCT = {
    '.': 'period', ',': 'comma', ':': 'colon', ';': 'semicolon',
    '!': 'exclam', '?': 'question', '¡': 'exclamdown', '¿': 'questiondown',
    '-': 'hyphen', '–': 'endash', '—': 'emdash', '_': 'underscore',
    '(': 'parenleft', ')': 'parenright', '[': 'bracketleft', ']': 'bracketright',
    '/': 'slash', '\\': 'backslash', '|': 'bar',
    "'": 'quotesingle', '"': 'quotedbl', '‘': 'quoteleft', '’': 'quoteright',
    '“': 'quotedblleft', '”': 'quotedblright',
    '«': 'guillemotleft', '»': 'guillemotright',
    '‹': 'guilsinglleft', '›': 'guilsinglright',
    '…': 'ellipsis', '•': 'bullet', '·': 'periodcentered',
    '°': 'degree', '%': 'percent', '‰': 'perthousand',
    '*': 'asterisk', '+': 'plus', '−': 'minus', '=': 'equal',
    '<': 'less', '>': 'greater', '×': 'multiply',
    '#': 'numbersign', '&': 'ampersand', '@': 'at',
    '$': 'dollar', '€': 'euro', '£': 'sterling',
    '©': 'copyright', '®': 'registered',
}
for _ch, _n in PUNCT.items():
    BASE[_ch] = globals()['p_' + _n]

ACCENTS = {'grave': a_grave, 'acute': a_acute, 'circumflex': a_circumflex,
           'tilde': a_tilde, 'dieresis': a_dieresis, 'ring': a_ring}

# lettre accentuee -> (base, accent).
COMPOSED = {
    'À': ('A', 'grave'), 'Á': ('A', 'acute'), 'Â': ('A', 'circumflex'),
    'Ã': ('A', 'tilde'), 'Ä': ('A', 'dieresis'), 'Å': ('A', 'ring'),
    'È': ('E', 'grave'), 'É': ('E', 'acute'), 'Ê': ('E', 'circumflex'),
    'Ë': ('E', 'dieresis'),
    'Ì': ('I', 'grave'), 'Í': ('I', 'acute'), 'Î': ('I', 'circumflex'),
    'Ï': ('I', 'dieresis'),
    'Ñ': ('N', 'tilde'),
    'Ò': ('O', 'grave'), 'Ó': ('O', 'acute'), 'Ô': ('O', 'circumflex'),
    'Õ': ('O', 'tilde'), 'Ö': ('O', 'dieresis'),
    'Ù': ('U', 'grave'), 'Ú': ('U', 'acute'), 'Û': ('U', 'circumflex'),
    'Ü': ('U', 'dieresis'),
    'Ý': ('Y', 'acute'),
}

# Le bas de casse accentue. Le site parle francais, espagnol et anglais :
# a a a a a a, c cedille, e e e e, i i i i, n tilde, o o o o o, u u u u, y aigu.
# Les accents sont les memes dessins que sur les capitales, ramenes a 92 % et
# poses sous la hampe (sommet a 700) pour qu'un e accentue ne depasse jamais un l.
COMPOSED_LC = {
    'à': ('a', 'grave'), 'á': ('a', 'acute'), 'â': ('a', 'circumflex'),
    'ã': ('a', 'tilde'), 'ä': ('a', 'dieresis'), 'å': ('a', 'ring'),
    'è': ('e', 'grave'), 'é': ('e', 'acute'), 'ê': ('e', 'circumflex'),
    'ë': ('e', 'dieresis'),
    'ì': ('i', 'grave'), 'í': ('i', 'acute'), 'î': ('i', 'circumflex'),
    'ï': ('i', 'dieresis'),
    'ñ': ('n', 'tilde'),
    'ò': ('o', 'grave'), 'ó': ('o', 'acute'), 'ô': ('o', 'circumflex'),
    'õ': ('o', 'tilde'), 'ö': ('o', 'dieresis'),
    'ù': ('u', 'grave'), 'ú': ('u', 'acute'), 'û': ('u', 'circumflex'),
    'ü': ('u', 'dieresis'),
    'ý': ('y', 'acute'),
}
# le i et le j perdent leur point sous un accent
LC_ACC_BASE = {'i': l_dotlessi}

# ---- chasses ---------------------------------------------------------------
# Approches laterales par famille de forme : plate, ronde, oblique, bras sortant.
# Approches relevees sur le sceau lui-meme : les blancs entre les lettres de
# TOLOACHE et de LEGITIMO valent 152 a 222 unites, 193 en moyenne.
# T|O 178  O|L 206  L|O 169  O|A 153  A|C 156  C|H 219  H|E 207
# L|E 207  E|G 191  G|I 222  I|T 207  T|I 207  I|M 205  M|O 199
SB = {
    'A': ( 64,  64), 'B': (106,  96), 'C': ( 88, 108), 'D': (106,  90),
    'E': (106,  96), 'F': (106,  92), 'G': ( 88, 112), 'H': (106, 106),
    'I': (106, 106), 'J': ( 78, 106), 'K': (106,  76), 'L': (106,  80),
    'M': (100, 100), 'N': (106, 106), 'O': ( 88,  88), 'P': (106,  88),
    'Q': ( 88,  88), 'R': (106,  76), 'S': ( 90,  90), 'T': ( 96,  96),
    'U': (102, 102), 'V': ( 66,  66), 'W': ( 66,  66), 'X': ( 72,  72),
    'Y': ( 66,  66), 'Z': ( 86,  86),
}
SB.update(LC_SB)
DIGIT_ADV = 700
PUNCT_SB = {
    'period': (72, 72), 'comma': (72, 72), 'colon': (78, 78), 'semicolon': (78, 78),
    'exclam': (80, 80), 'question': (74, 74), 'exclamdown': (80, 80),
    'questiondown': (74, 74), 'hyphen': (74, 74), 'endash': (60, 60),
    'emdash': (40, 40), 'underscore': (0, 0), 'parenleft': (72, 46),
    'parenright': (46, 72), 'bracketleft': (74, 48), 'bracketright': (48, 74),
    'slash': (40, 40), 'backslash': (40, 40), 'bar': (96, 96),
    'quotesingle': (78, 78), 'quotedbl': (78, 78), 'quoteleft': (78, 78),
    'quoteright': (78, 78), 'quotedblleft': (78, 78), 'quotedblright': (78, 78),
    'guillemotleft': (72, 72), 'guillemotright': (72, 72),
    'guilsinglleft': (72, 72), 'guilsinglright': (72, 72),
    'ellipsis': (72, 72), 'bullet': (100, 100), 'periodcentered': (100, 100),
    'degree': (74, 74), 'percent': (60, 60), 'perthousand': (60, 60),
    'asterisk': (80, 80), 'plus': (80, 80), 'minus': (80, 80), 'equal': (80, 80),
    'less': (80, 80), 'greater': (80, 80), 'multiply': (90, 90),
    'numbersign': (60, 60), 'ampersand': (66, 66), 'at': (56, 56),
    'dollar': (66, 66), 'euro': (60, 60), 'sterling': (62, 62),
    'copyright': (54, 54), 'registered': (54, 54),
}
SPACE_ADV = 330

# ---- crenage ---------------------------------------------------------------
KERN = {
    ('A', 'V'): -46, ('V', 'A'): -46, ('A', 'W'): -40, ('W', 'A'): -40,
    ('A', 'T'): -60, ('T', 'A'): -60, ('A', 'Y'): -52, ('Y', 'A'): -52,
    ('L', 'T'): -66, ('L', 'V'): -60, ('L', 'W'): -54, ('L', 'Y'): -62,
    ('T', 'O'): -34, ('T', 'C'): -34, ('T', 'G'): -34, ('T', 'S'): -22,
    ('T', 'U'): -18, ('T', 'W'): -18, ('T', 'Y'): -14,
    ('P', 'A'): -44, ('F', 'A'): -44, ('V', 'O'): -20, ('O', 'V'): -20,
    ('W', 'O'): -18, ('O', 'W'): -18, ('Y', 'O'): -26, ('O', 'Y'): -26,
    ('R', 'V'): -22, ('R', 'W'): -20, ('R', 'Y'): -26, ('R', 'T'): -20,
    ('D', 'V'): -16, ('D', 'W'): -14, ('D', 'Y'): -20, ('D', 'A'): -16,
    ('K', 'O'): -20, ('K', 'C'): -20, ('K', 'G'): -20,
    ('O', 'A'): -14, ('A', 'O'): -14, ('C', 'A'): -10,
    ('V', 'V'): -20, ('W', 'W'): -18, ('Y', 'V'): -18,
    ('T', '.'): -76, ('T', ','): -76, ('V', '.'): -66, ('V', ','): -66,
    ('W', '.'): -58, ('W', ','): -58, ('Y', '.'): -74, ('Y', ','): -74,
    ('A', "'"): -34, ('A', '’'): -34,
    ('1', '1'): -34, ('7', '1'): -26, ('7', '4'): -30, ('1', '4'): -20,
    ('2', '4'): -16, ('4', '1'): -16, ('1', '7'): -16, ('0', '1'): -14,
    # bas de casse
    ('T', 'o'): -74, ('T', 'a'): -74, ('T', 'e'): -74, ('T', 'u'): -66,
    ('T', 'r'): -62, ('T', 'i'): -34, ('T', 'y'): -60,
    ('V', 'a'): -46, ('V', 'e'): -42, ('V', 'o'): -42, ('V', 'i'): -22,
    ('W', 'a'): -38, ('W', 'e'): -34, ('W', 'o'): -34,
    ('Y', 'a'): -56, ('Y', 'e'): -52, ('Y', 'o'): -52, ('Y', 'u'): -44,
    ('P', 'a'): -30, ('P', 'e'): -26, ('P', 'o'): -26,
    ('F', 'a'): -30, ('F', 'e'): -26, ('F', 'o'): -26,
    ('L', 'a'): -14, ('L', 'e'): -14, ('L', 'o'): -14,
    ('r', 'a'): -22, ('r', 'c'): -18, ('r', 'd'): -18, ('r', 'e'): -18,
    ('r', 'g'): -18, ('r', 'o'): -18, ('r', 'q'): -18, ('r', 's'): -14,
    ('r', 'v'): -18, ('r', 'y'): -18, ('r', '.'): -52, ('r', ','): -52,
    ('v', 'a'): -14, ('v', 'e'): -14, ('v', 'o'): -14,
    ('y', 'a'): -14, ('y', 'e'): -14, ('y', 'o'): -14,
    ('a', 'v'): -14, ('a', 'w'): -12, ('a', 'y'): -14,
    ('o', 'v'): -14, ('o', 'w'): -12, ('o', 'y'): -14, ('o', 'x'): -12,
    ('e', 'v'): -14, ('e', 'w'): -12, ('e', 'y'): -14, ('e', 'x'): -12,
    ('v', '.'): -46, ('v', ','): -46, ('y', '.'): -50, ('y', ','): -50,
    ('w', '.'): -40, ('w', ','): -40, ('f', '.'): -30, ('f', ','): -30,
    ('t', '.'): -20, ('t', ','): -20,
    ('l', "'"): -20, ('d', "'"): -20, ('n', "'"): -18, ('s', "'"): -18,
    ('D', "'"): -20, ('L', "'"): -14,
}


def build_all():
    """Retourne {caractere: {'d':..., 'adv':..., 'lsb':..., 'x0','x1','y0','y1'}}"""
    out = {}
    for ch, fn in sorted(BASE.items()):
        p = fn()
        b = pbounds(p)
        if ch in SB:
            l, r = SB[ch]
        elif ch in '0123456789':
            w = b[2] - b[0]
            l = r = (DIGIT_ADV - w) / 2.
        else:
            l, r = PUNCT_SB.get(PUNCT.get(ch, ''), (80, 80))
        p = move(p, l - b[0], 0)
        b2 = pbounds(p)
        adv = round(l + (b[2] - b[0]) + r)
        out[ch] = dict(d=d_of(p), adv=adv, x0=round(b2[0]), x1=round(b2[2]),
                       y0=round(b2[1]), y1=round(b2[3]), p=p)
    # accentuees
    for ch, (base, acc) in sorted(COMPOSED.items()):
        bp = BASE[base]()
        bb = pbounds(bp)
        l, r = SB[base]
        bp = move(bp, l - bb[0], 0)
        bb = pbounds(bp)
        ap = ACCENTS[acc]()
        cx = (bb[0] + bb[2]) / 2.
        if base in 'AVW':   cx += 6
        p = U(bp, move(ap, cx, 0))
        b2 = pbounds(p)
        out[ch] = dict(d=d_of(p), adv=out[base]['adv'], x0=round(b2[0]),
                       x1=round(b2[2]), y0=round(b2[1]), y1=round(b2[3]), p=p)
    # C cedille
    cp = BASE['C']()
    cb = pbounds(cp); l, r = SB['C']
    cp = move(cp, l - cb[0], 0); cb = pbounds(cp)
    p = U(cp, move(a_cedilla(), (cb[0] + cb[2]) / 2. + 22, 0))
    b2 = pbounds(p)
    out['Ç'] = dict(d=d_of(p), adv=out['C']['adv'], x0=round(b2[0]),
                    x1=round(b2[2]), y0=round(b2[1]), y1=round(b2[3]), p=p)
    # bas de casse accentue
    for ch, (base, acc) in sorted(COMPOSED_LC.items()):
        fn = LC_ACC_BASE.get(base) or BASE[base]
        bp = fn()
        bb = pbounds(bp)
        l, r = SB[base]
        bp = move(bp, l - bb[0], 0)
        bb = pbounds(bp)
        ap = scale_p(ACCENTS[acc](), .92, .92)
        ab = pbounds(ap)
        ap = move(ap, 0, LC_ACC_TOP - ab[3])
        cx = (bb[0] + bb[2]) / 2.
        if base in 'vwy': cx += 4
        p = U(bp, move(ap, cx, 0))
        b2 = pbounds(p)
        out[ch] = dict(d=d_of(p), adv=out[base]['adv'], x0=round(b2[0]),
                       x1=round(b2[2]), y0=round(b2[1]), y1=round(b2[3]), p=p)
    # c cedille
    cp = BASE['c']()
    cb = pbounds(cp); l, r = SB['c']
    cp = move(cp, l - cb[0], 0); cb = pbounds(cp)
    p = U(cp, move(scale_p(a_cedilla(), .90, .90), (cb[0] + cb[2]) / 2. + 14, 0))
    b2 = pbounds(p)
    out['ç'] = dict(d=d_of(p), adv=out['c']['adv'], x0=round(b2[0]),
                    x1=round(b2[2]), y0=round(b2[1]), y1=round(b2[3]), p=p)
    out[' '] = dict(d='', adv=SPACE_ADV, x0=0, x1=0, y0=0, y1=0, p=None)
    out[' '] = out[' ']
    return out


GLYPHS = None


def layout(text, glyphs=None, tracking=0):
    """Retourne (liste de (char, x, glyphe), largeur totale) en unites de police."""
    g = glyphs or GLYPHS
    x = 0.0; items = []
    prev = None
    for ch in text:
        gl = g.get(ch) or g.get(ch.upper())
        if gl is None:
            x += SPACE_ADV; prev = None; continue
        if prev is not None:
            x += KERN.get((prev, ch), 0)
        items.append((ch, x, gl))
        x += gl['adv'] + tracking
        prev = ch
    return items, x


# =========================================================== 7. sorties

ASC, DESCENDER = 960, -240
FAMILY, STYLE = 'Ivresse Titre', 'Regular'
PS_NAME = 'IvresseTitre-Regular'

INK   = '#2b2118'
PAPER = '#FEF9F3'
CARD  = '#FED5A3'
RED   = '#A63D24'
OLIVE = '#8F9035'
RULE  = '#e3ded4'


def write_js(G):
    kern = {a + b: v for (a, b), v in KERN.items()}
    glyphs = {}
    for ch, g in G.items():
        glyphs[ch] = {'d': g['d'], 'a': g['adv'],
                      'b': [g['x0'], g['y0'], g['x1'], g['y1']]}
    seal = ''.join(sorted(SEAL_LETTERS)) + "'"
    drawn = ''.join(sorted(DRAWN_LETTERS))
    js = """/* alphabet_titre.js : IVRESSE TITRE, la capitale de la maison.
   Les quinze lettres %s viennent du sceau de la famille, relevees dans
   assets/js/logo.js et redressees ; les onze lettres %s, les chiffres, la
   ponctuation et les accents sont dessines dans la meme main. Voir
   assets/fonts/titre/LISEZ_MOI.txt.

   window.alphabetTitre()  -> { metrics, glyphs, kern }
       glyphs[c] = { d: chemin SVG, a: chasse, b: [x0,y0,x1,y1] }
       repere : cadratin 1000, pied a y=0, capitale a y=700, y vers le HAUT.
   window.titreTexte({text, x, y, size, color, tracking, align, id})
       -> une chaine '<g>...</g>' a coller dans un <svg>. size = hauteur de
       capitale en px. (x, y) = origine sur la ligne de pied.
   window.titreLargeur(text, size, tracking) -> largeur en px.
   Aucune dependance, aucun fichier de police. */
(function(){
  var M = %s;
  var G = %s;
  var K = %s;
  function items(text, tracking){
    var x = 0, out = [], prev = null;
    for (var i = 0; i < text.length; i++){
      var c = text[i], g = G[c] || G[c.toUpperCase()];
      if (!g){ x += M.space; prev = null; continue; }
      if (prev !== null && K[prev + c]) x += K[prev + c];
      out.push({c:c, x:x, g:g});
      x += g.a + (tracking || 0);
      prev = c;
    }
    return {items: out, width: x};
  }
  window.alphabetTitre = function(){ return {metrics: M, glyphs: G, kern: K}; };
  window.titreLargeur = function(text, size, tracking){
    return items(text, tracking || 0).width * (size || M.cap) / M.cap;
  };
  window.titreTexte = function(o){
    o = o || {};
    var text = o.text == null ? '' : String(o.text);
    var size = o.size || M.cap, s = size / M.cap;
    var col = o.color || 'currentColor';
    var r = items(text, o.tracking || 0);
    var dx = 0;
    if (o.align === 'center') dx = -r.width / 2;
    else if (o.align === 'right') dx = -r.width;
    var g = ['<g transform="translate(' + (o.x || 0) + ' ' + (o.y || 0) +
             ') scale(' + s + ' ' + (-s) + ') translate(' + dx + ' 0)" fill="' +
             col + '"' + (o.id ? ' id="' + o.id + '"' : '') + '>'];
    for (var i = 0; i < r.items.length; i++){
      var it = r.items[i];
      if (!it.g.d) continue;
      g.push('<path transform="translate(' + it.x + ' 0)" d="' + it.g.d + '"/>');
    }
    g.push('</g>');
    return g.join('');
  };
})();
""" % (seal, drawn,
       json.dumps({'upm': UPM, 'cap': CAP, 'baseline': 0, 'over': OVER,
                   'ascender': ASC, 'descender': DESCENDER, 'space': SPACE_ADV,
                   'family': FAMILY}, ensure_ascii=False),
       json.dumps(glyphs, ensure_ascii=False, separators=(',', ':')),
       json.dumps(kern, ensure_ascii=False, separators=(',', ':')))
    open(os.path.join(HERE, 'alphabet_titre.js'), 'w', encoding='utf-8').write(js)
    return js


def svg_text(G, text, size, x=0, y=0, color=INK, tracking=0, align='left'):
    """Meme calcul que le helper JS, cote Python, pour la planche."""
    its, w = layout(text, G, tracking)
    s = size / float(CAP)
    dx = 0
    if align == 'center': dx = -w / 2.
    elif align == 'right': dx = -w
    out = ['<g transform="translate(%.2f %.2f) scale(%.5f %.5f) translate(%.1f 0)" fill="%s">'
           % (x, y, s, -s, dx, color)]
    for ch, gx, gl in its:
        if not gl['d']: continue
        out.append('<path transform="translate(%.1f 0)" d="%s"/>' % (gx, gl['d']))
    out.append('</g>')
    return ''.join(out), w * s


# ---- la planche -------------------------------------------------------------

def _orig_word(group, baseline, x0, x1, cap_px, y_base):
    """Le mot de la famille, chemins bruts de logo.js, pose sur une ligne de pied."""
    s = cap_px / 40.0
    ds = ''.join('<path d="%s"/>' % it['d'] for it in LOGO[group])
    g = ('<g transform="translate(%.2f %.2f) scale(%.5f) translate(%.2f %.2f)" fill="%s">%s</g>'
         % (0, y_base, s, -x0, -baseline, INK, ds))
    return g, (x1 - x0) * s


def _orig_arc(cx_px, cy_px, scale_px):
    ds = ''.join('<path d="%s"/>' % it['d'] for it in LOGO['arc'])
    return ('<g transform="translate(%.2f %.2f) scale(%.5f) translate(%.2f %.2f)" fill="%s">%s</g>'
            % (cx_px, cy_px, scale_px, -SEAL_CX, -SEAL_CY, INK, ds))


def _mine_arc(G, cx_px, cy_px, scale_px):
    """Les memes lettres, les miennes, posees sur le meme cercle aux memes angles."""
    order = [ARC_ORDER[i] for i in range(14)]
    out = ['<g transform="translate(%.2f %.2f) scale(%.5f) translate(%.2f %.2f)" fill="%s">'
           % (cx_px, cy_px, scale_px, -SEAL_CX, -SEAL_CY, INK)]
    s = ARC_CAP / float(CAP)
    for i, p in enumerate(LOGO['arc']):
        name = ARC_ORDER[i]
        ch = "'" if name == 'quote' else name[0]
        gl = G.get(ch)
        if gl is None: continue
        ang = math.degrees(math.atan2(p['cy'] - SEAL_CY, p['cx'] - SEAL_CX)) + 90.0
        # centre du glyphe, ramene dans le repere natif
        gcx = (gl['x0'] + gl['x1']) / 2. * s
        gcy = (gl['y0'] + gl['y1']) / 2. * s
        out.append('<g transform="rotate(%.3f %.2f %.2f) translate(%.3f %.3f) scale(%.6f %.6f)">'
                   '<path d="%s"/></g>'
                   % (ang, p['cx'], p['cy'], p['cx'] - gcx, p['cy'] + gcy, s, -s, gl['d']))
    out.append('</g>')
    return ''.join(out)


def _row(G, text, size, tracking=0, color=INK, pad=0):
    g, w = svg_text(G, text, size, 0, 0, color, tracking)
    h = size * 1.34
    return ('<svg class="ln" viewBox="%.1f %.1f %.1f %.1f" width="%.1f" height="%.1f">'
            '<g transform="translate(0 %.1f)">%s</g></svg>'
            % (-pad, -size * 1.06, w + 2 * pad, h, w + 2 * pad, h, 0, g)), w


def write_specimen(G):
    S = []
    A = S.append

    def block(title, note=''):
        A('<h2>%s</h2>' % title)
        if note: A('<p class="note">%s</p>' % note)

    # --- 1. l'epreuve : les mots du sceau -----------------------------------
    CAPPX = 96
    parts = []
    for label, grp, base, x0, x1, word in [
            ('TOLOACHE', 'toloache', 496.48, 278.96, 601.23, 'TOLOACHE'),
            ('LEGITIMO', 'legitimo', 545.24, 294.32, 594.31, 'LEGITIMO')]:
        og, ow = _orig_word(grp, base, x0, x1, CAPPX, 0)
        mg, mw = svg_text(G, word, CAPPX, 0, 0)
        w = max(ow, mw) + 20
        parts.append(
            '<div class="cmp"><div class="cmplab">le sceau de la famille</div>'
            '<svg viewBox="-10 %.1f %.1f %.1f" width="%.1f" height="%.1f">'
            '<line x1="-10" y1="0" x2="%.1f" y2="0" stroke="%s" stroke-width="1"/>%s</svg>'
            '<div class="cmplab">IVRESSE TITRE</div>'
            '<svg viewBox="-10 %.1f %.1f %.1f" width="%.1f" height="%.1f">'
            '<line x1="-10" y1="0" x2="%.1f" y2="0" stroke="%s" stroke-width="1"/>%s</svg>'
            '</div>'
            % (-CAPPX - 14, w, CAPPX + 30, w, CAPPX + 30, w, RULE, og,
               -CAPPX - 14, w, CAPPX + 30, w, CAPPX + 30, w, RULE, mg))
    arcs = ('<div class="cmp"><div class="cmplab">le sceau de la famille</div>'
            '<svg viewBox="0 0 460 300" width="460" height="300">%s</svg>'
            '<div class="cmplab">IVRESSE TITRE, memes angles, meme cercle</div>'
            '<svg viewBox="0 0 460 300" width="460" height="300">%s</svg></div>'
            % (_orig_arc(230, 250, 0.62), _mine_arc(G, 230, 250, 0.62)))

    # --- assemblage ---------------------------------------------------------
    A('<header><div class="kicker">assets/fonts/titre</div>')
    A('<div class="mast">%s</div>' % _row(G, "IVRESSE TITRE", 128, tracking=8)[0])
    A('<p class="lede">La capitale de la maison IVRESSE D\'AMOUR / TOLOACHE LEGITIMO. '
      'Quinze lettres sont le trace de la famille, releve dans le sceau et redresse. '
      'Onze lettres, les chiffres, la ponctuation et les accents sont dessines dans '
      'la meme main.</p></header>')

    block("L'epreuve",
          "Les mots du sceau, le trace de la famille et le mien, a la meme force de corps. "
          "Si les miens ne ressemblent pas aux siens, la police est fausse.")
    A('<div class="cmpwrap">' + ''.join(parts) + '</div>')
    A('<div class="cmpwrap">' + arcs + '</div>')

    block("L'alphabet", "Capitale 700 sur cadratin 1000. Pas de bas de casse : "
                        "les codes minuscules renvoient a la capitale.")
    A('<div class="grid">')
    for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
        tag = 'famille' if ch in SEAL_LETTERS else 'dessine'
        g, w = _row(G, ch, 108, pad=6)
        A('<div class="cell"><div class="gl">%s</div><div class="tag %s">%s</div></div>'
          % (g, tag, ch))
    A('</div>')

    block("Chiffres", "Alignes sur la capitale et tous de meme chasse, pour que les "
                      "numeros de lot et de bouteille s'alignent en colonne.")
    A('<div class="grid">')
    for ch in '0123456789':
        g, w = _row(G, ch, 108, pad=6)
        A('<div class="cell"><div class="gl">%s</div><div class="tag dessine">%s</div></div>' % (g, ch))
    A('</div>')

    block("Ponctuation et signes")
    A('<div class="grid small">')
    for ch in ('. , : ; ! ? ¡ ¿ - – — _ ( ) [ ] / \\ | \' " ‘ ’ '
               '“ ” « » ‹ › … • · ° % ‰ '
               '* + − = < > × # & @ $ € £ © ®').split(' '):
        g, w = _row(G, ch, 72, pad=6)
        A('<div class="cell"><div class="gl">%s</div></div>' % g)
    A('</div>')

    block("Accents", "Le site parle francais, espagnol et anglais.")
    A('<div class="grid small">')
    for ch in 'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ':
        g, w = _row(G, ch, 72, pad=6)
        A('<div class="cell"><div class="gl">%s</div></div>' % g)
    A('</div>')

    block("Provenance", "Noir : le trace de la famille. Rouge : dessine par moi dans sa main.")
    A('<div class="prov">')
    for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
        col = INK if ch in SEAL_LETTERS else RED
        g, w = _row(G, ch, 64, pad=4, color=col)
        A('<span class="pv">%s</span>' % g)
    A('</div>')

    block("Au titre", "Ce que la police doit tenir sur le site.")
    for t, sz, tr in [("IVRESSE D'AMOUR", 84, 4), ("TOLOACHE LEGITIMO", 62, 6),
                      ("ESPADIN", 74, 10), ("TOBALA", 74, 10), ("COYOTE", 74, 10)]:
        A('<div class="ttl">%s</div>' % _row(G, t, sz, tracking=tr)[0])

    block("Le menu")
    A('<div class="menu">')
    for t in ['LA BOTELLA', 'LA HISTORIA', 'EL PALENQUE', 'EL MITO', 'EL RITUAL',
              'EL REGISTRO']:
        A('<span class="mi">%s</span>' % _row(G, t, 30, tracking=14)[0])
    A('</div>')

    block("A l'echelle", "La meme ligne de 96 a 13 pixels de capitale.")
    for sz in [96, 64, 44, 30, 22, 16, 13]:
        A('<div class="scl"><span class="px">%d</span>%s</div>'
          % (sz, _row(G, "VILLA SOLA DE VEGA", sz, tracking=max(0, (20 - sz) * 0.6))[0]))

    block("Trois langues")
    for lang, t in [
        ('FR', "MEZCAL ARTESANAL JOVEN. LA PLANTE DECIDE : S'IL N'Y A PAS DE TOBALA "
               "CETTE ANNEE, LE REGISTRE LE DIT."),
        ('FR', "50 % ALC. VOL., 700 ML. BOUTEILLE N° 084 SUR 300, ECRITE A LA MAIN."),
        ('ES', "EN ESTE MUNDO TERRENAL ES ORO LIQUIDO EL MEZCAL. AGAVE POTATORUM, "
               "MAESTRO MEZCALERO GILBERTO VASQUEZ."),
        ('EN', "NEVER DISCOUNTED. THE PRICE ONLY GOES UP, NEVER THE OTHER WAY. "
               "A SOLD OUT LOT STAYS ON THE REGISTER, DATED."),
    ]:
        A('<div class="cp"><span class="px">%s</span>%s</div>'
          % (lang, _row(G, t, 21, tracking=6)[0]))

    block("Pour passer le site dessus",
          "Ecrit ici, PAS applique. Le basculement est la decision de Raouf. "
          "Deux choses a coller, dans cet ordre.")
    face = ("@font-face{\n"
            "  font-family:'Ivresse Titre';\n"
            "  src:url('assets/fonts/titre/IvresseTitre-Regular.woff2') format('woff2'),\n"
            "      url('assets/fonts/titre/IvresseTitre-Regular.otf') format('opentype');\n"
            "  font-weight:400; font-style:normal; font-display:swap;\n"
            "}")
    line = ("/* dans assets/css/site.css, la seule ligne a changer : */\n"
            ":root{ --font-titre:'Ivresse Titre', Georgia, serif; }")
    A('<pre class="code">%s</pre>' % face.replace('&', '&amp;').replace('<', '&lt;'))
    A('<pre class="code">%s</pre>' % line.replace('&', '&amp;').replace('<', '&lt;'))
    A('<p class="note">Sans fichier de police, la meme chose se fait en JavaScript : '
      '<code>&lt;script src="assets/fonts/titre/alphabet_titre.js"&gt;&lt;/script&gt;</code> '
      'puis <code>svg.innerHTML = titreTexte({text:"IVRESSE D\'AMOUR", size:72, x:0, y:80})</code>.</p>')

    block("Le detail du dessin", "Quatre lettres du sceau et quatre des miennes, "
                                 "au meme corps, empattements en vis-a-vis.")
    A('<div class="prov big">')
    for ch in 'ORESBKQW':
        col = INK if ch in SEAL_LETTERS else RED
        g, w = _row(G, ch, 150, pad=8, color=col)
        A('<span class="pv">%s</span>' % g)
    A('</div>')

    css = """
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:%(paper)s;color:%(ink)s;
     font:14px/1.55 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
     padding:48px 56px 90px;max-width:1360px}
header{border-bottom:2px solid %(ink)s;padding-bottom:26px;margin-bottom:34px}
.kicker{font:11px/1 ui-monospace,Menlo,monospace;letter-spacing:.16em;
        text-transform:uppercase;color:#8a7f70;margin-bottom:18px}
.mast svg{display:block;max-width:100%%;height:auto}
.lede{max-width:56em;font-size:15px;color:#4a4036;margin:20px 0 0}
h2{font:12px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;
   color:%(red)s;margin:52px 0 6px;padding-bottom:8px;border-bottom:1px solid %(rule)s}
.note{margin:0 0 20px;color:#7b7062;max-width:60em;font-size:13px}
svg.ln{display:block;overflow:visible;max-width:100%%}\n.scl svg.ln{max-width:none}\n.scl{overflow-x:auto}
.cmpwrap{display:flex;flex-wrap:wrap;gap:34px;align-items:flex-start;margin-bottom:8px}
.cmp{background:#fff;border:1px solid %(rule)s;padding:16px 18px 20px}
.cmplab{font:10px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;
        text-transform:uppercase;color:#9a8f80;margin:10px 0 4px}
.cmp svg{display:block;overflow:visible}
.grid{display:flex;flex-wrap:wrap;gap:10px}
.cell{background:#fff;border:1px solid %(rule)s;padding:10px 12px 6px;text-align:center}
.grid.small .cell{padding:8px 10px 4px}
.tag{font:10px/1.6 ui-monospace,Menlo,monospace;letter-spacing:.1em;color:#9a8f80}
.tag.dessine{color:%(red)s}
.prov{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end}
.prov.big{gap:26px}
.ttl{margin:18px 0}
.menu{display:flex;flex-wrap:wrap;gap:34px;align-items:baseline;
      border-top:1px solid %(rule)s;border-bottom:1px solid %(rule)s;padding:22px 0}
.scl,.cp{display:flex;align-items:baseline;gap:16px;margin:14px 0;
         border-bottom:1px dotted %(rule)s;padding-bottom:12px}
.px{font:10px/1 ui-monospace,Menlo,monospace;color:#9a8f80;min-width:34px;
    letter-spacing:.1em}
.code{background:#fff;border:1px solid %(rule)s;border-left:3px solid %(red)s;
      padding:14px 16px;font:12px/1.7 ui-monospace,Menlo,monospace;overflow-x:auto;
      white-space:pre;color:#3a332b}
code{font:12px/1.5 ui-monospace,Menlo,monospace;background:#fff;padding:1px 4px;
     border:1px solid %(rule)s}
footer{margin-top:60px;border-top:2px solid %(ink)s;padding-top:16px;
       font:11px/1.7 ui-monospace,Menlo,monospace;color:#8a7f70}
""" % dict(paper=PAPER, ink=INK, red=RED, rule=RULE)

    html = ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>Ivresse Titre, specimen</title><style>%s</style></head><body>%s'
            '<footer>IVRESSE TITRE %s glyphes. Cadratin 1000, capitale 700, '
            'debord des rondes 9. Genere par build_font.py depuis '
            'assets/js/logo.js. Aucun fichier de police necessaire : '
            'alphabet_titre.js suffit.</footer></body></html>'
            % (css, ''.join(S), len(G)))
    open(os.path.join(HERE, 'SPECIMEN.html'), 'w', encoding='utf-8').write(html)
    return html


if __name__ == '__main__':
    GLYPHS = build_all()
    write_js(GLYPHS)
    write_specimen(GLYPHS)
    print('alphabet_titre.js  %d glyphes' % len(GLYPHS))
    print('SPECIMEN.html      ecrit')
    try:
        sys.path.insert(0, HERE)
        from compile_otf import compile_otf
        compile_otf(GLYPHS, KERN)
    except Exception as e:
        print('otf : non compile (%s)' % e)
