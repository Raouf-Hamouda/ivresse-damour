# -*- coding: utf-8 -*-
"""
IVRESSE TEXTE. Le dessin des lettres.

Repere : unites de fonte, 1000 par cadratin, y vers le HAUT, ligne de pied a
y = 0. C'est le repere de fontTools, donc build_font.py lit ce fichier tel
quel, et faire.py se contente de retourner l'axe y pour ecrire du SVG.

CE QUE CE CARACTERE EST, ET POURQUOI
------------------------------------
Le sceau de la famille est une egyptienne de bois : graisse 0.225 de la
capitale, empattements en dalle, futs renfles au milieu, contours tremblants,
encoches de taille aux jonctions. C'est une lettre de sceau, faite pour etre
vue a 300 px, une fois, en haut d'une page.

Celle ci est son contraire de temperature et sa parente de squelette. Elle est
LINEALE, sans empattement, d'une seule graisse, terminaisons coupees a plat,
contres ouverts, aucun ornement. Raison en une ligne : a 17 px un empattement
ne se voit plus, il ne fait que salir le contour, donc ce qui reste d'une
famille a cette taille c'est sa charpente, et on ne garde que la charpente.

CE QUI VIENT DU SCEAU, MESURE SUR assets/js/logo.js
(mots TOLOACHE et LEGITIMO, hauteur de capitale 40 unites natives) :
  largeur / capitale     I 0.314   E 0.637   L 0.643   T 0.680   H 0.739
                         A 0.794   C 0.829   G 0.849   O 0.948   M 1.049
  Cette echelle est le squelette de la maison : rondes tres larges, presque un
  cercle, carrees etroites. Reprise telle quelle dans les capitales, seul
  endroit ou elle a ete relevee.
  Le contre du O est nettement plus carre que son dehors : garde.
  Le A a un sommet PLAT et une traverse BASSE, 0.265 de la capitale : gardes.
  Le M a un V central qui s'arrete a mi hauteur : garde, pose a 0.26.
  Les futs du M et du N sont verticaux, sans ecartement : garde.
  Le G porte une barre droite a mi hauteur : gardee, sans la spirale.

CE QUI EST JETE, ET C'EST LE SUJET :
  l'empattement, le renflement du fut, le tremblement du contour, l'encoche de
  taille, le bec en spirale, le contraste, la graisse. Tout cela appartient au
  sceau et y reste.
"""

# ---------------------------------------------------------------------------
# 1. LES MESURES
# ---------------------------------------------------------------------------

UPM  = 1000
CAP  = 700      # hauteur de capitale
XH   = 505      # hauteur d'x, 0.721 de la capitale. Georgia 0.68, Helvetica 0.73.
ASC  = 738      # ascendantes, a peine au dessus de la capitale
DESC = -212     # descendantes
FIG  = 672      # hauteur des chiffres, 0.96 de la capitale
OVS  = 9        # depassement des rondes

# Graisse. Le sceau est a 0.225 de la capitale : une graisse d'affiche. Ici
# 0.117. Contraste 1.08, c'est a dire aucun contraste de dessin : les
# horizontales sont seulement allegees de 7 % pour PARAITRE egales aux
# verticales, ce qui est une correction optique et non un effet.
STEM_U = 82     # fut de capitale
THIN_U = 76     # horizontales de capitale
STEM_L = 76     # fut de bas de casse, 0.150 de la hauteur d'x
THIN_L = 71     # horizontales de bas de casse
HAIR   = 68     # haut et bas des rondes, jonctions

# Les rondes. Le O du sceau : dehors quasi circulaire, contre nettement plus
# carre. C'est une proportion, pas un ornement, donc gardee, adoucie.
K_OUT = 0.5523  # dehors : cercle
K_IN  = 0.600   # dedans : rectangle arrondi

ESPACE = 268    # blanc de mot, 0.268 cadratin


# ---------------------------------------------------------------------------
# 2. LA BOITE A OUTILS
# ---------------------------------------------------------------------------

import math as _m

CREUX = ('H',)      # marqueur de fin de contour : ce contour est un trou


def M(x, y):             return ('M', x, y)
def L(x, y):             return ('L', x, y)
def C(a, b, c, d, e, f): return ('C', a, b, c, d, e, f)


def _sep(c):
    if c and c[-1] == CREUX:
        return list(c[:-1]), True
    return list(c), False


def n(v):
    v = round(v, 1)
    return str(int(v)) if v == int(v) else str(v)


def _aire(c0):
    """Aire signee approchee. Negative = sens horaire, repere y vers le haut.
    Les points de controle entrent dans le polygone : seul le SIGNE compte."""
    c, _ = _sep(c0)
    pts = [(c[0][1], c[0][2])]
    for s in c[1:]:
        if s[0] == 'L':
            pts.append((s[1], s[2]))
        else:
            pts += [(s[1], s[2]), (s[3], s[4]), (s[5], s[6])]
    a = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        a += x1 * y2 - x2 * y1
    return a / 2.0


def rev(c0):
    c, trouee = _sep(c0)
    if not c:
        return c0
    start = (c[0][1], c[0][2])
    prev = start
    segs = []
    for s in c[1:]:
        if s[0] == 'L':
            segs.append(('L', prev, (s[1], s[2]))); prev = (s[1], s[2])
        else:
            segs.append(('C', prev, (s[1], s[2]), (s[3], s[4]), (s[5], s[6])))
            prev = (s[5], s[6])
    if prev != start:
        segs.append(('L', prev, start))
    res = [M(*segs[-1][-1])]
    for s in reversed(segs):
        if s[0] == 'L':
            res.append(L(*s[1]))
        else:
            res.append(C(s[3][0], s[3][1], s[2][0], s[2][1], s[1][0], s[1][1]))
    if res[-1][0] == 'L' and (res[-1][1], res[-1][2]) == (res[0][1], res[0][2]):
        res.pop()
    return res + [CREUX] if trouee else res


def plein(c0):
    """Sens horaire : ce contour POSE de l'encre."""
    c, _ = _sep(c0)
    return c if _aire(c) < 0 else rev(c)


def creux(c0):
    """Sens antihoraire : ce contour RETIRE de l'encre."""
    c, _ = _sep(c0)
    c = c if _aire(c) > 0 else rev(c)
    return c + [CREUX]


def d_of(contours):
    """Chaine SVG. Remplissage non nul : les contours se superposent sans
    booleen. Le sens est impose ici, une fois pour toutes."""
    out = []
    for c0 in contours:
        c, trouee = _sep(c0)
        if not c:
            continue
        c, _ = _sep(creux(c) if trouee else plein(c))
        for s in c:
            if s[0] == 'M':
                out.append('M%s %s' % (n(s[1]), n(s[2])))
            elif s[0] == 'L':
                out.append('L%s %s' % (n(s[1]), n(s[2])))
            else:
                out.append('C%s %s %s %s %s %s' % tuple(n(v) for v in s[1:]))
        out.append('Z')
    return ''.join(out)


def rect(x0, y0, x1, y1):
    return plein([M(x0, y0), L(x1, y0), L(x1, y1), L(x0, y1)])


def poly(pts, vide=False):
    c = [M(*pts[0])] + [L(*p) for p in pts[1:]]
    return creux(c) if vide else plein(c)


def fut(xc, y0, y1, w):
    """Un fut : un rectangle, coupe a plat en haut et en bas. Rien d'autre.
    C'est ici que le sceau a ete quitte."""
    return rect(xc - w / 2.0, y0, xc + w / 2.0, y1)


def diag(x0, y0, x1, y1, w):
    """Une oblique d'epaisseur HORIZONTALE w, donc coupee a plat en haut et en
    bas, comme les obliques du A et du M du sceau."""
    h = w / 2.0
    return plein([M(x0 - h, y0), L(x0 + h, y0), L(x1 + h, y1), L(x1 - h, y1)])


def trait(x0, y0, x1, y1, w):
    """Un trait droit d'epaisseur PERPENDICULAIRE w. diag() coupe a plat en
    haut et en bas, ce qui est juste pour une oblique dressee (le A, le V, le
    M) et faux pour une oblique couchee (le bras de l'esperluette, la barre du
    2). Ici la coupe est droite dans les deux cas."""
    dx, dy = x1 - x0, y1 - y0
    ln = _m.hypot(dx, dy) or 1.0
    nx, ny = -dy / ln * w / 2.0, dx / ln * w / 2.0
    return plein([M(x0 + nx, y0 + ny), M(x0 + nx, y0 + ny)][:1] +
                 [L(x1 + nx, y1 + ny), L(x1 - nx, y1 - ny), L(x0 - nx, y0 - ny)])


def _arcseg(cx, cy, rx, ry, a0, a1):
    """Segments cubiques d'un arc d'ellipse, angles en radians, sans le M."""
    d = a1 - a0
    nseg = max(1, int(abs(d) / (_m.pi / 2.0) - 1e-9) + 1)
    out = []
    for i in range(nseg):
        b0 = a0 + d * i / nseg
        b1 = a0 + d * (i + 1) / nseg
        k = 4.0 / 3.0 * _m.tan((b1 - b0) / 4.0)
        p0 = (cx + rx * _m.cos(b0), cy + ry * _m.sin(b0))
        p3 = (cx + rx * _m.cos(b1), cy + ry * _m.sin(b1))
        c1 = (p0[0] - k * rx * _m.sin(b0), p0[1] + k * ry * _m.cos(b0))
        c2 = (p3[0] + k * rx * _m.sin(b1), p3[1] - k * ry * _m.cos(b1))
        out.append(C(c1[0], c1[1], c2[0], c2[1], p3[0], p3[1]))
    return out


def pt_arc(cx, cy, rx, ry, a):
    return (cx + rx * _m.cos(_m.radians(a)), cy + ry * _m.sin(_m.radians(a)))


def arc(cx, cy, rx, ry, tc, tb, a0, a1):
    """Un arc epais ouvert, coupe PERPENDICULAIREMENT au trait a chaque bout.
    Sert au C, au c, au e, au s, au G, aux epaules du n, aux chiffres.
    a0 et a1 en degres, sens trigonometrique."""
    rxi, ryi = rx - tc, ry - tb
    A0, A1 = _m.radians(a0), _m.radians(a1)
    c = [M(cx + rx * _m.cos(A0), cy + ry * _m.sin(A0))]
    c += _arcseg(cx, cy, rx, ry, A0, A1)
    c.append(L(cx + rxi * _m.cos(A1), cy + ryi * _m.sin(A1)))
    c += _arcseg(cx, cy, rxi, ryi, A1, A0)
    return plein(c)


def ovale(cx, cy, rx, ry, k_h=K_OUT, k_v=None, dedans=False):
    k_v = k_h if k_v is None else k_v
    ax, ay = rx * k_h, ry * k_v
    c = [M(cx, cy + ry),
         C(cx + ax, cy + ry, cx + rx, cy + ay, cx + rx, cy),
         C(cx + rx, cy - ay, cx + ax, cy - ry, cx, cy - ry),
         C(cx - ax, cy - ry, cx - rx, cy - ay, cx - rx, cy),
         C(cx - rx, cy + ay, cx - ax, cy + ry, cx, cy + ry)]
    return creux(c) if dedans else plein(c)


def anneau(cx, cy, rx, ry, cote, haut):
    """La ronde de la maison : dehors circulaire, dedans plus carre."""
    return [ovale(cx, cy, rx, ry, K_OUT),
            ovale(cx, cy, rx - cote, ry - haut, K_IN, dedans=True)]


def _miroir(contours, axe):
    out = []
    for c0 in contours:
        c, trouee = _sep(c0)
        nc = []
        for s in c:
            if s[0] == 'C':
                nc.append(C(2 * axe - s[1], s[2], 2 * axe - s[3], s[4],
                            2 * axe - s[5], s[6]))
            else:
                nc.append((s[0], 2 * axe - s[1], s[2]))
        out.append(creux(nc) if trouee else plein(nc))
    return out


def _renverse(contours, ax, ay):
    out = []
    for c0 in contours:
        c, trouee = _sep(c0)
        nc = []
        for s in c:
            if s[0] == 'C':
                nc.append(C(2 * ax - s[1], 2 * ay - s[2], 2 * ax - s[3],
                            2 * ay - s[4], 2 * ax - s[5], 2 * ay - s[6]))
            else:
                nc.append((s[0], 2 * ax - s[1], 2 * ay - s[2]))
        out.append(creux(nc) if trouee else plein(nc))
    return out


# ---------------------------------------------------------------------------
# 3. LES CAPITALES
# ---------------------------------------------------------------------------
# Les largeurs d'encre sont celles du sceau, rapport pour rapport. Les lettres
# absentes du sceau (B D F J K N P Q R S U V W X Y Z) sont posees dans la meme
# echelle : rondes larges, carrees etroites.

SU, TU = STEM_U, THIN_U
SBU = 52      # approche des droites
SBR = 41      # approche des rondes
SBD = 31      # approche des obliques

LARG_U = {
    'A': 556, 'B': 480, 'C': 580, 'D': 606, 'E': 446, 'F': 434, 'G': 594,
    'H': 517, 'I': STEM_U, 'J': 372, 'K': 512, 'L': 450, 'M': 734, 'N': 536,
    'O': 664, 'P': 468, 'Q': 664, 'R': 486, 'S': 470, 'T': 476, 'U': 522,
    'V': 556, 'W': 796, 'X': 528, 'Y': 512, 'Z': 460,
}


def _ba(ch, a=None, b=None):
    ink = LARG_U[ch]
    a = SBU if a is None else a
    b = a if b is None else b
    return a, ink, b


def cap_A():
    a, ink, b = _ba('A', SBD)
    xa = a + ink / 2.0
    plat = SU * 0.62                 # sommet PLAT : c'est le A du sceau
    c = [diag(xa - plat / 2.0, CAP, a + SU * 0.5, 0, SU),
         diag(xa + plat / 2.0, CAP, a + ink - SU * 0.5, 0, SU),
         rect(xa - plat / 2.0 - SU * 0.5, CAP - TU * 0.92,
              xa + plat / 2.0 + SU * 0.5, CAP)]
    yb = CAP * 0.265                 # traverse BASSE : c'est le A du sceau
    c.append(rect(a + SU * 0.62, yb - TU * 0.5, a + ink - SU * 0.62, yb + TU * 0.5))
    return c, a + ink + b


def _panse(x_fut, x_jonc, y0, y1, x_ext, tc, tb):
    """Une panse accrochee au fut : le B, le D, le P, le R. Elle part droite,
    puis tourne sur un rayon egal a sa demi hauteur. C'est ce qui la distingue
    d'un demi cercle et ce qui donne au B du texte son epaule plate."""
    r = (y1 - y0) / 2.0
    cxa = max(x_jonc + 8, x_ext - r)
    return [rect(x_fut, y1 - tb, cxa, y1),
            rect(x_fut, y0, cxa, y0 + tb),
            arc(cxa, (y0 + y1) / 2.0, r, r, tc, tb, -90, 90)]


def cap_B():
    a, ink, b = _ba('B')
    ym = CAP * 0.523
    xj = a + SU
    c = [fut(a + SU / 2.0, 0, CAP, SU)]
    c += _panse(a, xj, ym - TU * 0.5, CAP, a + ink - 26, SU, TU)
    c += _panse(a, xj, 0, ym + TU * 0.5, a + ink, SU, TU)
    return c, a + ink + SBR


def cap_C():
    a, ink, b = _ba('C', SBR)
    cx, cy = a + ink / 2.0, CAP / 2.0
    return [arc(cx, cy, ink / 2.0, CAP / 2.0 + OVS, SU, TU, 54, 306)], a + ink + b * 0.86


def cap_D():
    a, ink, b = _ba('D')
    c = [fut(a + SU / 2.0, 0, CAP, SU)]
    c += _panse(a, a + SU, 0, CAP, a + ink, SU, TU)
    return c, a + ink + SBR


def cap_E():
    a, ink, b = _ba('E')
    ym = CAP * 0.512
    return [fut(a + SU / 2.0, 0, CAP, SU),
            rect(a, CAP - TU, a + ink, CAP),
            rect(a, 0, a + ink, TU),
            rect(a, ym - TU * 0.5, a + ink * 0.90, ym + TU * 0.5)], a + ink + SBU * 0.82


def cap_F():
    a, ink, b = _ba('F')
    ym = CAP * 0.512
    return [fut(a + SU / 2.0, 0, CAP, SU),
            rect(a, CAP - TU, a + ink, CAP),
            rect(a, ym - TU * 0.5, a + ink * 0.92, ym + TU * 0.5)], a + ink + SBU * 0.72


def cap_G():
    a, ink, b = _ba('G', SBR)
    cx, cy = a + ink / 2.0, CAP / 2.0
    rx, ry = ink / 2.0, CAP / 2.0 + OVS
    # l'arc monte du 3 heures, fait le tour et s'arrete a 46 degres : le creux
    # est en haut a droite. La barre droite du G du sceau ferme le 3 heures.
    return [arc(cx, cy, rx, ry, SU, TU, 34, 360),
            rect(cx + rx * 0.10, cy - TU * 0.5, cx + rx, cy + TU * 0.5)], a + ink + b


def cap_H():
    a, ink, b = _ba('H')
    return [fut(a + SU / 2.0, 0, CAP, SU), fut(a + ink - SU / 2.0, 0, CAP, SU),
            rect(a, CAP * 0.5 - TU * 0.5, a + ink, CAP * 0.5 + TU * 0.5)], a + ink + b


def cap_I():
    a, ink, b = _ba('I', 92)
    return [fut(a + ink / 2.0, 0, CAP, SU)], a + ink + b


def cap_J():
    a, ink, b = _ba('J')
    xd = a + ink - SU / 2.0
    ry = CAP * 0.19
    cx = xd - (ink - SU) / 2.0
    return [fut(xd, ry, CAP, SU),
            arc(cx, ry, xd - cx, ry + OVS, SU, TU, 180, 360)], a + ink + SBU * 0.74


def cap_K():
    a, ink, b = _ba('K')
    xg = a + SU / 2.0
    ym = CAP * 0.385
    return [fut(xg, 0, CAP, SU),
            diag(a + ink - SU * 0.46, CAP, xg + SU * 0.22, ym, SU),
            diag(xg + SU * 0.10, ym + TU * 0.60, a + ink - SU * 0.40, 0, SU)], a + ink + SBD


def cap_L():
    a, ink, b = _ba('L')
    return [fut(a + SU / 2.0, 0, CAP, SU),
            rect(a, 0, a + ink, TU)], a + ink + SBU * 0.82


def cap_M():
    a, ink, b = _ba('M')
    xg, xd = a + SU / 2.0, a + ink - SU / 2.0
    xm = a + ink / 2.0
    yv = CAP * 0.26          # le V central s'arrete haut : c'est le M du sceau
    return [fut(xg, 0, CAP, SU), fut(xd, 0, CAP, SU),
            diag(xg, CAP, xm, yv, SU), diag(xd, CAP, xm, yv, SU)], a + ink + b


def cap_N():
    a, ink, b = _ba('N')
    xg, xd = a + SU / 2.0, a + ink - SU / 2.0
    return [fut(xg, 0, CAP, SU), fut(xd, 0, CAP, SU),
            diag(xg, CAP, xd, 0, SU * 1.04)], a + ink + b


def cap_O():
    a, ink, b = _ba('O', SBR)
    return anneau(a + ink / 2.0, CAP / 2.0, ink / 2.0, CAP / 2.0 + OVS,
                  SU, TU), a + ink + b


def cap_P():
    a, ink, b = _ba('P')
    yb = CAP * 0.452
    c = [fut(a + SU / 2.0, 0, CAP, SU)]
    c += _panse(a, a + SU, yb, CAP, a + ink, SU, TU)
    return c, a + ink + SBR


def cap_Q():
    c, w = cap_O()
    a, ink, b = _ba('Q', SBR)
    cx = a + ink / 2.0
    return list(c) + [diag(cx + ink * 0.13, CAP * 0.250,
                           cx + ink * 0.43, -CAP * 0.085, SU * 1.30)], w


def cap_R():
    a, ink, b = _ba('R')
    yb = CAP * 0.478
    c = [fut(a + SU / 2.0, 0, CAP, SU)]
    c += _panse(a, a + SU, yb, CAP, a + ink - 20, SU, TU)
    c.append(diag(a + ink * 0.42, yb + TU * 1.5, a + ink - SU * 0.46, 0, SU))
    return c, a + ink + SBD


def _forme_S(x, y, W, H, tc, tb):
    """Le S : deux arcs de sens contraire, decales lateralement, prolonges
    l'un vers l'autre jusqu'a se croiser au milieu. Pas de piece de raccord :
    le noeud est la ou les deux arcs se recouvrent. Coupes a plat, sans bec."""
    cx = x + W / 2.0
    rx = W / 2.0
    dx = W * 0.042
    ry = H * 0.281
    rxb = rx - dx
    cyU = y + H - ry
    cyB = y + ry
    return [arc(cx - dx, cyU, rxb, ry + OVS, tc, tb, -8, 292),
            arc(cx + dx, cyB, rxb, ry + OVS, tc, tb, 188, 472)]


def cap_S():
    a, ink, b = _ba('S', SBR)
    return _forme_S(a, 0, ink, CAP, SU, TU), a + ink + b


def cap_T():
    a, ink, b = _ba('T', SBD)
    return [fut(a + ink / 2.0, 0, CAP, SU),
            rect(a, CAP - TU, a + ink, CAP)], a + ink + b


def cap_U():
    a, ink, b = _ba('U')
    xg, xd = a + SU / 2.0, a + ink - SU / 2.0
    cx = a + ink / 2.0
    ry = CAP * 0.315
    return [fut(xg, ry, CAP, SU), fut(xd, ry, CAP, SU),
            arc(cx, ry, (ink - SU) / 2.0 + SU / 2.0, ry + OVS,
                SU, TU, 180, 360)], a + ink + b


def cap_V():
    a, ink, b = _ba('V', SBD)
    xa = a + ink / 2.0
    return [diag(a + SU * 0.5, CAP, xa - SU * 0.06, 0, SU),
            diag(a + ink - SU * 0.5, CAP, xa + SU * 0.06, 0, SU)], a + ink + b


def cap_W():
    a, ink, b = _ba('W', SBD)
    x1, x2 = a + ink * 0.282, a + ink * 0.718
    xm = a + ink / 2.0
    return [diag(a + SU * 0.5, CAP, x1, 0, SU),
            diag(xm, CAP * 0.96, x1, 0, SU),
            diag(xm, CAP * 0.96, x2, 0, SU),
            diag(a + ink - SU * 0.5, CAP, x2, 0, SU)], a + ink + b


def cap_X():
    a, ink, b = _ba('X', SBD)
    return [diag(a + SU * 0.5, CAP, a + ink - SU * 0.5, 0, SU),
            diag(a + ink - SU * 0.5, CAP, a + SU * 0.5, 0, SU)], a + ink + b


def cap_Y():
    a, ink, b = _ba('Y', SBD)
    xa = a + ink / 2.0
    ym = CAP * 0.44
    return [diag(a + SU * 0.5, CAP, xa - SU * 0.06, ym, SU),
            diag(a + ink - SU * 0.5, CAP, xa + SU * 0.06, ym, SU),
            fut(xa, 0, ym + 6, SU)], a + ink + b


def cap_Z():
    a, ink, b = _ba('Z', SBU * 0.86)
    return [rect(a, CAP - TU, a + ink, CAP),
            rect(a, 0, a + ink, TU),
            diag(a + ink - SU * 0.42, CAP - TU * 0.5,
                 a + SU * 0.42, TU * 0.5, SU * 1.04)], a + ink + b


# ---------------------------------------------------------------------------
# 4. LE BAS DE CASSE
# ---------------------------------------------------------------------------
# Le sceau n'en a pas. Chaque piece de celui ci vient d'une capitale de la
# famille :
#   le fut du I  -> tous les futs, meme coupe a plat, meme largeur relative ;
#   la ronde du O -> le o, le c, le e, le b, le d, le p, le q, la panse du a et
#                    du g : meme dehors circulaire, meme contre plus carre ;
#   la panse du D et du B -> l'epaule du n, du m, du h, du r, du u ;
#   les obliques du A, du V, du M -> le v, le w, le x, le y, le k, le z.
# L'echelle des largeurs est en revanche ASSOUPLIE : au sceau une carree fait
# 0.68 d'une ronde, et transpose tel quel au bas de casse a 17 px cela fermait
# le n. Le n vaut ici 0.93 du o. C'est le seul endroit ou la mesure du sceau a
# ete relachee, et c'est pour la lisibilite.

SL, TL = STEM_L, THIN_L
SBL  = 74     # approche des droites
SBLR = 53     # approche des rondes
SBLD = 28     # approche des obliques

LARG_L = {
    'a': 460, 'b': 470, 'c': 452, 'd': 470, 'e': 466, 'f': 288, 'g': 470,
    'h': 452, 'i': STEM_L, 'j': STEM_L, 'k': 438, 'l': STEM_L, 'm': 726,
    'n': 452, 'o': 484, 'p': 470, 'q': 470, 'r': 292, 's': 418, 't': 292,
    'u': 452, 'v': 438, 'w': 664, 'x': 438, 'y': 438, 'z': 402,
}


def _bl(ch, a=None, b=None):
    ink = LARG_L[ch]
    a = SBL if a is None else a
    b = a if b is None else b
    return a, ink, b


def _epaule(xg, xd, w, t, haut, sens=+1):
    """L'epaule du n, du m, du h, du r, du u : la panse du D, reduite.
    Renvoie (contour, y de jonction avec les futs)."""
    cx = (xg + xd) / 2.0
    rx = (xd - xg) / 2.0 + w / 2.0
    ry = XH * 0.435
    if sens > 0:
        cy = haut + OVS - ry
        return arc(cx, cy, rx, ry, w, t, 0, 180), cy
    cy = haut - OVS + ry
    return arc(cx, cy, rx, ry, w, t, 180, 360), cy


def bdc_n():
    a, ink, b = _bl('n')
    xg, xd = a + SL / 2.0, a + ink - SL / 2.0
    ep, cy = _epaule(xg, xd, SL, HAIR, XH)
    return [fut(xg, 0, cy + 4, SL), fut(xd, 0, cy + 4, SL), ep], a + ink + b


def bdc_m():
    a, ink, b = _bl('m')
    xg, xm, xd = a + SL / 2.0, a + ink / 2.0, a + ink - SL / 2.0
    e1, cy = _epaule(xg, xm, SL, HAIR, XH)
    e2, _ = _epaule(xm, xd, SL, HAIR, XH)
    return [fut(xg, 0, cy + 4, SL), fut(xm, 0, cy + 4, SL),
            fut(xd, 0, cy + 4, SL), e1, e2], a + ink + b


def bdc_h():
    a, ink, b = _bl('h')
    xg, xd = a + SL / 2.0, a + ink - SL / 2.0
    ep, cy = _epaule(xg, xd, SL, HAIR, XH)
    return [fut(xg, 0, ASC, SL), fut(xd, 0, cy + 4, SL), ep], a + ink + b


def bdc_u():
    a, ink, b = _bl('u')
    xg, xd = a + SL / 2.0, a + ink - SL / 2.0
    ep, cy = _epaule(xg, xd, SL, HAIR, 0, sens=-1)
    return [fut(xg, cy - 4, XH, SL), fut(xd, 0, XH, SL), ep], a + ink + b


def bdc_r():
    a, ink, b = _bl('r')
    xg = a + SL / 2.0
    rx = XH * 0.34
    ry = XH * 0.365
    cy = XH + OVS - ry
    return [fut(xg, 0, cy + 4, SL),
            arc(xg + rx, cy, rx + SL / 2.0, ry, SL, HAIR, 80, 180)], a + ink + SBL * 0.56


def bdc_o():
    a, ink, b = _bl('o', SBLR)
    return anneau(a + ink / 2.0, XH / 2.0, ink / 2.0, XH / 2.0 + OVS,
                  SL, HAIR), a + ink + b


def _bdp(ch, haut, bas):
    """Le b, le d, le p, le q : un fut plus la ronde de la maison, dont le
    flanc epouse exactement le fut."""
    a, ink, b = _bl(ch, SBL, SBLR)
    return ([fut(a + SL / 2.0, bas, haut, SL)] +
            anneau(a + ink / 2.0, XH / 2.0, ink / 2.0, XH / 2.0 + OVS, SL, HAIR),
            a + ink + b)


def bdc_b():
    return _bdp('b', ASC, 0)


def bdc_p():
    return _bdp('p', XH, DESC)


def bdc_d():
    c, w = _bdp('d', ASC, 0)
    return _miroir(c, w / 2.0 + (SBLR - SBL) / 2.0), w


def bdc_q():
    c, w = _bdp('q', XH, DESC)
    return _miroir(c, w / 2.0 + (SBLR - SBL) / 2.0), w


def bdc_c():
    a, ink, b = _bl('c', SBLR)
    return [arc(a + ink / 2.0, XH / 2.0, ink / 2.0, XH / 2.0 + OVS,
                SL, HAIR, 56, 304)], a + ink + b * 0.86


def bdc_e():
    a, ink, b = _bl('e', SBLR)
    cx, cy = a + ink / 2.0, XH / 2.0
    rx, ry = ink / 2.0, XH / 2.0 + OVS
    yb = cy + ry * 0.115
    return [arc(cx, cy, rx, ry, SL, HAIR, 6, 316),
            rect(cx - rx, yb - HAIR * 0.5, cx + rx * 0.995,
                 yb + HAIR * 0.5)], a + ink + b * 0.92


def bdc_a():
    a, ink, b = _bl('a', SBL * 0.94, SBL * 0.88)
    rxb = ink / 2.0
    cxb = a + rxb
    c = anneau(cxb, XH * 0.288, rxb, XH * 0.288 + OVS, SL, HAIR)
    c.append(fut(a + ink - SL / 2.0, 0, XH * 0.74, SL))
    # l'arche : la moitie haute de la ronde du O, coupee a plat a gauche
    c.append(arc(cxb, XH * 0.708, rxb, XH * 0.292 + OVS, SL, HAIR, 0, 178))
    return c, a + ink + b


def bdc_g():
    a, ink, b = _bl('g', SBLR)
    cx = a + ink / 2.0
    c = anneau(cx, XH / 2.0, ink / 2.0, XH / 2.0 + OVS, SL, HAIR)
    xd = a + ink - SL / 2.0
    ryq = XH * 0.30
    yq = DESC + ryq
    rxq = (ink - SL) / 2.0 - 12
    c.append(fut(xd, yq, XH * 0.60, SL))
    c.append(arc(xd - rxq, yq, rxq + SL / 2.0, ryq, SL, HAIR, 202, 340))
    return c, a + ink + b


def bdc_i(point=True):
    a, ink, b = _bl('i', 84)
    xc = a + ink / 2.0
    c = [fut(xc, 0, XH, SL)]
    if point:
        c.append(ovale(xc, XH + 128, SL * 0.5, SL * 0.5))
    return c, a + ink + b


def bdc_l():
    a, ink, b = _bl('l', 84)
    return [fut(a + ink / 2.0, 0, ASC, SL)], a + ink + b


def bdc_j():
    a, ink, b = _bl('j', 46, 84)
    xc = a + ink / 2.0 + 88
    ryq = XH * 0.28
    yq = DESC + ryq
    rxq = 126
    return [fut(xc, yq, XH, SL),
            arc(xc - rxq, yq, rxq + SL / 2.0, ryq, SL, HAIR, 202, 340),
            ovale(xc, XH + 128, SL * 0.5, SL * 0.5)], a + ink + b + 88 - 46


def bdc_s():
    a, ink, b = _bl('s', SBLR + 4)
    return _forme_S(a, 0, ink, XH, SL, HAIR), a + ink + b - 4


def bdc_t():
    a, ink, b = _bl('t', 40, SBL * 0.44)
    xc = a + SL / 2.0 + 72
    ry = XH * 0.205
    rx = 100
    return [fut(xc, ry, XH * 1.30, SL),
            arc(xc + rx, ry, rx + SL / 2.0, ry + OVS, SL, HAIR, 180, 266),
            rect(a, XH * 0.86, a + ink, XH * 0.86 + HAIR)], a + ink + b


def bdc_f():
    a, ink, b = _bl('f', 40, SBL * 0.40)
    xc = a + SL / 2.0 + 72
    ry = XH * 0.225
    rx = 98
    return [fut(xc, 0, ASC - ry, SL),
            arc(xc + rx, ASC - ry, rx + SL / 2.0, ry, SL, HAIR, 94, 180),
            rect(a, XH * 0.86, a + ink, XH * 0.86 + HAIR)], a + ink + b


def bdc_v():
    a, ink, b = _bl('v', SBLD)
    xa = a + ink / 2.0
    return [diag(a + SL * 0.5, XH, xa - SL * 0.06, 0, SL),
            diag(a + ink - SL * 0.5, XH, xa + SL * 0.06, 0, SL)], a + ink + b


def bdc_w():
    a, ink, b = _bl('w', SBLD)
    x1, x2 = a + ink * 0.282, a + ink * 0.718
    xm = a + ink / 2.0
    return [diag(a + SL * 0.5, XH, x1, 0, SL),
            diag(xm, XH * 0.95, x1, 0, SL),
            diag(xm, XH * 0.95, x2, 0, SL),
            diag(a + ink - SL * 0.5, XH, x2, 0, SL)], a + ink + b


def bdc_x():
    a, ink, b = _bl('x', SBLD)
    return [diag(a + SL * 0.5, XH, a + ink - SL * 0.5, 0, SL),
            diag(a + ink - SL * 0.5, XH, a + SL * 0.5, 0, SL)], a + ink + b


def bdc_y():
    a, ink, b = _bl('y', SBLD)
    xa = a + ink / 2.0
    x1 = a + ink - SL * 0.5
    pente = (xa - x1) / XH
    return [diag(a + SL * 0.5, XH, xa - SL * 0.06, 0, SL),
            diag(x1, XH, xa + pente * (-DESC) + SL * 0.06, DESC, SL)], a + ink + b


def bdc_z():
    a, ink, b = _bl('z', SBLD + 8)
    return [rect(a, XH - HAIR, a + ink, XH),
            rect(a, 0, a + ink, HAIR),
            diag(a + ink - SL * 0.40, XH - HAIR * 0.5,
                 a + SL * 0.40, HAIR * 0.5, SL * 1.04)], a + ink + b


def bdc_k():
    a, ink, b = _bl('k')
    xg = a + SL / 2.0
    ym = XH * 0.385
    return [fut(xg, 0, ASC, SL),
            diag(a + ink - SL * 0.44, XH, xg + SL * 0.20, ym, SL),
            diag(xg + SL * 0.10, ym + HAIR * 0.62,
                 a + ink - SL * 0.40, 0, SL)], a + ink + SBLD


# ---------------------------------------------------------------------------
# 5. LES CHIFFRES
# ---------------------------------------------------------------------------
# Alignes et TABULAIRES, tous la meme chasse. Ce site est un registre : N° 12 /
# 300, 50 %, 700 ml, 140 €. Une colonne de lots doit s'aligner toute seule.

CH_ADV = 556
CH_INK = 440
CH_A = (CH_ADV - CH_INK) / 2.0
SF, TF = STEM_U, THIN_U


def ch_0():
    return anneau(CH_ADV / 2.0, FIG / 2.0, CH_INK / 2.0 - 14,
                  FIG / 2.0 + OVS, SF, TF), CH_ADV


def ch_1():
    cx = CH_ADV / 2.0 + 18
    return [fut(cx, 0, FIG, SF),
            poly([(cx - SF / 2.0, FIG), (cx - SF / 2.0, FIG - 46),
                  (CH_A + 4, FIG * 0.758), (CH_A + 4, FIG * 0.868)])], CH_ADV


def ch_2():
    a, w = CH_A, CH_INK
    cx = a + w / 2.0
    ryt = FIG * 0.320
    cyt = FIG - ryt + OVS
    rxt = w / 2.0
    c = [arc(cx, cyt, rxt, ryt + OVS, SF, TF, -46, 196)]
    p = pt_arc(cx, cyt, rxt - SF / 2.0, ryt + OVS - TF / 2.0, -46)
    c.append(trait(p[0], p[1] + 6, a + w * 0.15, TF * 0.55, SF))
    c.append(rect(a, 0, a + w, TF))
    return c, CH_ADV


def ch_3():
    a, w = CH_A, CH_INK
    cx = a + w / 2.0
    ryU, ryB = FIG * 0.285, FIG * 0.300
    return [arc(cx + 8, FIG - ryU + OVS, w / 2.0 - 10, ryU + OVS, SF, TF, 174, -78),
            arc(cx, ryB - OVS, w / 2.0, ryB + OVS, SF, TF, 92, -174)], CH_ADV


def ch_4():
    a, w = CH_A, CH_INK
    xs = a + w * 0.70
    yb = FIG * 0.255
    return [fut(xs, 0, FIG, SF),
            rect(a - 6, yb, a + w + 6, yb + TF),
            poly([(xs - SF / 2.0, FIG), (xs - SF / 2.0, FIG - 40),
                  (a + w * 0.00, yb), (a + w * 0.00 + SF * 1.30, yb)])], CH_ADV


def ch_5():
    a, w = CH_A, CH_INK
    cx = a + w / 2.0
    ryB = FIG * 0.325
    c = [arc(cx, ryB - OVS, w / 2.0, ryB + OVS, SF, TF, 104, -170),
         rect(a, FIG * 0.520, a + SF, FIG - TF),
         rect(a, FIG - TF, a + w * 0.98, FIG)]
    p = pt_arc(cx, ryB - OVS, w / 2.0 - SF / 2.0, ryB + OVS - TF / 2.0, 104)
    c.append(trait(a + SF / 2.0, FIG * 0.520 + 14, p[0], p[1], SF))
    return c, CH_ADV


def ch_6():
    a, w = CH_A, CH_INK
    cx = a + w / 2.0
    ryb = FIG * 0.318
    return (anneau(cx, ryb - OVS, w / 2.0, ryb + OVS, SF, TF) +
            [arc(cx, FIG * 0.50, w / 2.0, FIG * 0.50 + OVS, SF, TF, 54, 181)]), CH_ADV


def ch_7():
    a, w = CH_A, CH_INK
    return [rect(a, FIG - TF, a + w, FIG),
            poly([(a + w, FIG - TF), (a + w - SF * 1.32, FIG - TF),
                  (a + w * 0.22, 0), (a + w * 0.22 + SF * 1.20, 0)])], CH_ADV


def ch_8():
    a, w = CH_A, CH_INK
    cx = a + w / 2.0
    ryU, ryB = FIG * 0.272, FIG * 0.290
    return (anneau(cx, FIG - ryU + OVS, w / 2.0 - 22, ryU + OVS, SF, TF) +
            anneau(cx, ryB - OVS, w / 2.0, ryB + OVS, SF, TF)), CH_ADV


def ch_9():
    c, w = ch_6()
    return _renverse(c, CH_ADV / 2.0, FIG / 2.0), w


# ---------------------------------------------------------------------------
# 6. PONCTUATION ET SIGNES
# ---------------------------------------------------------------------------
# Geometriques eux aussi : un point est un disque, une virgule est ce disque
# plus une queue droite, une apostrophe est cette virgule dressee en haut.

PT = SL * 1.02      # diametre du point


def _disque(cx, cy, r=None):
    r = (PT / 2.0) if r is None else r
    return ovale(cx, cy, r, r)


def _queue(cx, y0, y1, w0, w1, dx=0.0):
    return poly([(cx - w0 / 2.0, y0), (cx + w0 / 2.0, y0),
                 (cx + dx + w1 / 2.0, y1), (cx + dx - w1 / 2.0, y1)])


def sg_point():
    a = 104
    return [_disque(a + PT / 2.0, PT / 2.0)], a * 2 + PT


def sg_virgule():
    a = 104
    cx = a + PT / 2.0
    return [_disque(cx, PT / 2.0),
            _queue(cx, PT * 0.20, -PT * 1.10, PT * 0.86, PT * 0.30,
                   -PT * 0.14)], a * 2 + PT


def sg_deuxpoints():
    a = 104
    cx = a + PT / 2.0
    return [_disque(cx, PT / 2.0), _disque(cx, XH - PT / 2.0)], a * 2 + PT


def sg_pointvirgule():
    c, w = sg_virgule()
    return list(c) + [_disque(104 + PT / 2.0, XH - PT / 2.0)], w


def _apostrophe(cx, haut):
    return [_disque(cx, haut - PT * 0.52),
            _queue(cx, haut - PT * 0.82, haut - PT * 1.95, PT * 0.86, PT * 0.30,
                   -PT * 0.14)]


def _apostrophe_ouvrante(cx, haut):
    return _renverse(_apostrophe(cx, haut), cx, haut - PT * 1.08)


def sg_apostrophe():
    a = 92
    return _apostrophe(a + PT / 2.0, ASC), a * 2 + PT


def sg_simple_ouvrant():
    a = 92
    return _apostrophe_ouvrante(a + PT / 2.0, ASC), a * 2 + PT


def sg_guillemet_d():
    a = 82
    d = PT * 1.42
    return (_apostrophe(a + PT / 2.0, ASC) +
            _apostrophe(a + PT / 2.0 + d, ASC)), a * 2 + PT + d


def sg_guillemet_g():
    a = 82
    d = PT * 1.42
    return (_apostrophe_ouvrante(a + PT / 2.0, ASC) +
            _apostrophe_ouvrante(a + PT / 2.0 + d, ASC)), a * 2 + PT + d


def _chevron(x, ypc, t, sens, ep):
    pointe = x if sens > 0 else x + t * 0.80
    base = x + t * 0.80 if sens > 0 else x
    return poly([(pointe, ypc), (base, ypc + t * 0.60),
                 (base + sens * ep * 1.30, ypc + t * 0.60),
                 (pointe + sens * ep * 1.20, ypc),
                 (base + sens * ep * 1.30, ypc - t * 0.60),
                 (base, ypc - t * 0.60)])


def sg_guillemet_fr_g():
    a = 74
    t = XH * 0.52
    return [_chevron(a, XH * 0.45, t, +1, HAIR * 0.90),
            _chevron(a + t * 0.84, XH * 0.45, t, +1, HAIR * 0.90)], a * 2 + t * 1.68


def sg_guillemet_fr_d():
    a = 74
    t = XH * 0.52
    return [_chevron(a + t * 0.84, XH * 0.45, t, -1, HAIR * 0.90),
            _chevron(a, XH * 0.45, t, -1, HAIR * 0.90)], a * 2 + t * 1.68


def sg_trait():
    a = 76
    w = 268
    return [rect(a, XH * 0.44 - TL * 0.5, a + w, XH * 0.44 + TL * 0.5)], a * 2 + w


def sg_tiret_demi():
    a = 64
    w = 372
    return [rect(a, XH * 0.44 - TL * 0.5, a + w, XH * 0.44 + TL * 0.5)], a * 2 + w


def sg_exclam():
    a = 108
    cx = a + SL * 0.54
    return [poly([(cx - SL * 0.54, CAP), (cx + SL * 0.54, CAP),
                  (cx + SL * 0.34, PT * 1.55), (cx - SL * 0.34, PT * 1.55)]),
            _disque(cx, PT / 2.0)], a * 2 + SL * 1.08


def sg_exclam_inv():
    c, w = sg_exclam()
    return _renverse(c, w / 2.0, XH / 2.0), w


def sg_interro():
    a = 96
    w = 360
    cx = a + w / 2.0
    xp = cx - w * 0.14
    r = w * 0.50
    ry = CAP * 0.222
    cy = CAP - ry + OVS
    p = pt_arc(cx, cy, r - SL * 0.52, ry + OVS - HAIR * 0.52, -14)
    return [_disque(xp, PT / 2.0),
            arc(cx, cy, r, ry + OVS, SL * 1.04, HAIR * 1.04, 192, -14),
            trait(p[0], p[1], xp, PT * 1.70, SL * 1.04)], a * 2 + w


def sg_interro_inv():
    c, w = sg_interro()
    return _renverse(c, w / 2.0, XH / 2.0), w


def sg_paren_g():
    a = 82
    w = 176
    yb, yt = DESC * 0.94, CAP * 1.04
    cy = (yb + yt) / 2.0
    return [arc(a + w + 88, cy, w + 88, (yt - yb) / 2.0,
                SL * 0.94, SL * 0.30, 152, 208)], a + w + 46


def sg_paren_d():
    c, w = sg_paren_g()
    return _miroir(c, w / 2.0), w


def sg_pourcent():
    w = 740
    r = XH * 0.290
    t = SL * 0.86
    c = []
    for (cx, cy) in ((r + 58, FIG - r - 4), (w - r - 58, r + 4)):
        c += [ovale(cx, cy, r, r), ovale(cx, cy, r - t, r - t, dedans=True)]
    c.append(diag(w - 96, FIG, 96, 0, SL * 0.92))
    return c, w + 46


def sg_degre():
    a = 84
    r = XH * 0.275
    cy = CAP - r - 8
    t = SL * 0.80
    return [ovale(a + r, cy, r, r),
            ovale(a + r, cy, r - t, r - t, dedans=True)], a * 2 + r * 2


def sg_ordinal():
    """Le o superieur de N° 12 / 300 et de 1º."""
    a = 66
    r = XH * 0.292
    cy = CAP - r - 14
    t = SL * 0.82
    return [ovale(a + r, cy, r, r * 1.02),
            ovale(a + r, cy, r - t, r * 1.02 - t, K_IN, dedans=True)], a * 2 + r * 2


def sg_esperluette():
    w = 640
    t = SU
    r1 = CAP * 0.198
    cx1, cy1 = 202, CAP - r1 - 8
    r2 = CAP * 0.294
    cx2, cy2 = 238, r2 - 4
    c = [ovale(cx1, cy1, r1, r1),
         ovale(cx1, cy1, r1 - t, r1 - t, dedans=True),
         arc(cx2, cy2, r2, r2, t, t, 46, 330)]
    # l'oblique qui traverse la panse, puis le bras qui ressort a droite
    p1 = (cx1 - r1 * 0.70, cy1 - r1 * 0.60)
    p2 = pt_arc(cx2, cy2, r2 - t / 2.0, r2 - t / 2.0, 326)
    c.append(trait(p1[0], p1[1], p2[0] + 10, p2[1] - 8, t))
    p3 = pt_arc(cx2, cy2, r2 - t / 2.0, r2 - t / 2.0, 52)
    c.append(trait(p3[0] - 20, p3[1] - 18, w - 104, CAP * 0.300, t))
    return c, w


def sg_euro():
    a = 66
    ink = 552
    cx = a + ink / 2.0 + 22
    cy = CAP / 2.0
    rx, ry = ink / 2.0, CAP / 2.0 + OVS
    c = [arc(cx, cy, rx, ry, SU, TU, 46, 314)]
    for yy in (cy + CAP * 0.092, cy - CAP * 0.092):
        c.append(rect(a - 6, yy - TU * 0.46, cx + rx * 0.30, yy + TU * 0.46))
    return c, a + ink + 34


def sg_slash():
    a = 46
    w = 272
    return [diag(a + w, CAP * 1.04, a, DESC * 0.78, SL * 0.90)], a * 2 + w


def sg_puce():
    a = 104
    r = PT * 0.56
    return [_disque(a + r, XH * 0.46, r)], a * 2 + r * 2


SIGNES = {
    '.': sg_point, ',': sg_virgule, ':': sg_deuxpoints, ';': sg_pointvirgule,
    '’': sg_apostrophe, '‘': sg_simple_ouvrant,
    '“': sg_guillemet_g, '”': sg_guillemet_d,
    '«': sg_guillemet_fr_g, '»': sg_guillemet_fr_d,
    '-': sg_trait, '–': sg_tiret_demi,
    '!': sg_exclam, '¡': sg_exclam_inv,
    '?': sg_interro, '¿': sg_interro_inv,
    '(': sg_paren_g, ')': sg_paren_d,
    '%': sg_pourcent, '°': sg_degre, 'º': sg_ordinal,
    '&': sg_esperluette, '€': sg_euro, '/': sg_slash,
    '·': sg_puce,
}


# ---------------------------------------------------------------------------
# 7. LES ACCENTS
# ---------------------------------------------------------------------------

ACC_T = 66      # epaisseur d'un accent, un peu sous le fut du bas de casse
ACC_W = 252
ACC_H = 130     # hauteur d'un accent


def acc_aigu(cx, y):
    w = ACC_W * 0.70
    return [trait(cx - w * 0.5, y, cx + w * 0.5, y + ACC_H, ACC_T)]


def acc_grave(cx, y):
    w = ACC_W * 0.70
    return [trait(cx + w * 0.5, y, cx - w * 0.5, y + ACC_H, ACC_T)]


def acc_circ(cx, y):
    w = ACC_W * 0.96
    return [trait(cx - w * 0.5, y, cx, y + ACC_H, ACC_T),
            trait(cx + w * 0.5, y, cx, y + ACC_H, ACC_T)]


def acc_trema(cx, y):
    r = PT * 0.46
    d = ACC_W * 0.285
    return [_disque(cx - d, y + ACC_H * 0.42, r), _disque(cx + d, y + ACC_H * 0.42, r)]


def acc_tilde(cx, y):
    w = ACC_W * 0.94
    t = ACC_T
    yc = y + ACC_H * 0.44
    return [plein([M(cx - w / 2.0, yc - t * 0.24),
                   C(cx - w * 0.42, yc + t * 1.26, cx - w * 0.20, yc + t * 1.36,
                     cx - w * 0.02, yc + t * 0.54),
                   C(cx + w * 0.10, yc - t * 0.06, cx + w * 0.24, yc - t * 0.40,
                     cx + w * 0.34, yc - t * 0.08),
                   C(cx + w * 0.42, yc + t * 0.18, cx + w * 0.44, yc + t * 0.50,
                     cx + w * 0.44, yc + t * 0.72),
                   L(cx + w / 2.0, yc + t * 0.62),
                   C(cx + w * 0.48, yc - t * 0.84, cx + w * 0.27, yc - t * 1.28,
                     cx + w * 0.07, yc - t * 0.50),
                   C(cx - w * 0.06, yc + t * 0.12, cx - w * 0.22, yc + t * 0.50,
                     cx - w * 0.32, yc + t * 0.18),
                   C(cx - w * 0.40, yc - t * 0.10, cx - w * 0.42, yc - t * 0.50,
                     cx - w * 0.42, yc - t * 0.78)])]


def acc_cedille(cx, y=0):
    t = HAIR * 0.92
    return [plein([M(cx - t * 0.54, y),
                   L(cx + t * 0.54, y),
                   C(cx + t * 0.54, y - 42, cx + t * 2.20, y - 38, cx + t * 2.20, y - 88),
                   C(cx + t * 2.20, y - 142, cx + t * 0.56, y - 166, cx - t * 1.56, y - 152),
                   L(cx - t * 1.28, y - 200),
                   C(cx + t * 2.50, y - 218, cx + t * 3.95, y - 170, cx + t * 3.95, y - 92),
                   C(cx + t * 3.95, y - 24, cx - t * 0.54, y - 20, cx - t * 0.54, y)])]


ACCENTS = {'aigu': acc_aigu, 'grave': acc_grave, 'circ': acc_circ,
           'trema': acc_trema, 'tilde': acc_tilde}

Y_BDC = XH + 46
Y_CAP = CAP + 24

COMPOSES = [
    ('a', 'grave', 'à'), ('a', 'circ', 'â'), ('a', 'trema', 'ä'), ('a', 'aigu', 'á'),
    ('e', 'aigu', 'é'), ('e', 'grave', 'è'), ('e', 'circ', 'ê'), ('e', 'trema', 'ë'),
    ('i', 'circ', 'î'), ('i', 'trema', 'ï'), ('i', 'aigu', 'í'), ('i', 'grave', 'ì'),
    ('o', 'circ', 'ô'), ('o', 'trema', 'ö'), ('o', 'aigu', 'ó'), ('o', 'grave', 'ò'),
    ('u', 'grave', 'ù'), ('u', 'circ', 'û'), ('u', 'trema', 'ü'), ('u', 'aigu', 'ú'),
    ('n', 'tilde', 'ñ'),
    ('A', 'grave', 'À'), ('A', 'circ', 'Â'), ('A', 'trema', 'Ä'), ('A', 'aigu', 'Á'),
    ('E', 'aigu', 'É'), ('E', 'grave', 'È'), ('E', 'circ', 'Ê'), ('E', 'trema', 'Ë'),
    ('I', 'circ', 'Î'), ('I', 'trema', 'Ï'), ('I', 'aigu', 'Í'), ('I', 'grave', 'Ì'),
    ('O', 'circ', 'Ô'), ('O', 'trema', 'Ö'), ('O', 'aigu', 'Ó'), ('O', 'grave', 'Ò'),
    ('U', 'grave', 'Ù'), ('U', 'circ', 'Û'), ('U', 'trema', 'Ü'), ('U', 'aigu', 'Ú'),
    ('N', 'tilde', 'Ñ'),
]

# Ou poser l'accent : l'axe optique n'est pas toujours l'axe de la chasse.
DEC_ACC = {'A': -0.015, 'a': 0.010, 'y': -0.020, 'v': -0.010}


# ---------------------------------------------------------------------------
# 8. LA CONSTRUCTION
# ---------------------------------------------------------------------------

CAPS     = {k[4:]: v for k, v in sorted(globals().items()) if k.startswith('cap_')}
BDC      = {k[4:]: v for k, v in sorted(globals().items()) if k.startswith('bdc_')}
CHIFFRES = {k[3:]: v for k, v in sorted(globals().items()) if k.startswith('ch_')}

BRUT = {}


def construire():
    BRUT.clear()
    for tab in (CAPS, BDC, CHIFFRES, SIGNES):
        for ch, f in tab.items():
            BRUT[ch] = f()

    for base, cible in (('c', 'ç'), ('C', 'Ç')):
        c, w = BRUT[base]
        BRUT[cible] = (list(c) + acc_cedille(w * (0.46 if base == 'c' else 0.44)), w)

    for base, acc, cible in COMPOSES:
        if base == 'i':
            c, w = bdc_i(point=False)
        else:
            c, w = BRUT[base]
            c = list(c)
        cx = w * (0.50 + DEC_ACC.get(base, 0.0))
        y = Y_CAP if base.isupper() else Y_BDC
        BRUT[cible] = (list(c) + ACCENTS[acc](cx, y), w)

    # alias : une copie qui contient l'apostrophe droite ou les guillemets
    # droits doit quand meme se composer.
    BRUT["'"] = BRUT['\u2019']
    BRUT['"'] = BRUT['\u201d']

    BRUT[' '] = ([], ESPACE)              # blanc de mot
    BRUT[' '] = ([], ESPACE)         # insecable
    BRUT[' '] = ([], ESPACE * 0.52)  # fine insecable : 50 %, 140 €
    return BRUT


def repertoire():
    """caractere -> {'d': ..., 'adv': ...}, unites de fonte, y vers le haut."""
    construire()
    return {ch: {'d': d_of(co), 'adv': round(adv)} for ch, (co, adv) in BRUT.items()}


METRIQUES = {
    'upm': UPM, 'cap': CAP, 'xh': XH, 'asc': ASC, 'desc': DESC, 'fig': FIG,
    'espace': ESPACE, 'stem_u': STEM_U, 'thin_u': THIN_U,
    'stem_l': STEM_L, 'thin_l': THIN_L, 'hair': HAIR,
}


if __name__ == '__main__':
    r = repertoire()
    print(len(r), 'signes')
