#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
outils_nettoyage.py  --  IVRESSE TITRE, atelier de nettoyage des contours.

Module commun aux seize nettoyeurs. Il ne nettoie rien tout seul : il donne les
gestes, chiffres a l'appui, definis dans CONTRAT_NETTOYAGE.md, qui est la seule
autorite. Lisez le contrat avant de vous servir d'ici.

Aucun reseau. Aucune dependance hors bibliotheque standard et fontTools.
Rien n'est ecrit hors de assets/fonts/titre/glyphes_propres/.

Repere : cadratin 1000, pied a y = 0, capitale a y = 700, y vers le HAUT,
comme dans alphabet_titre.js et dans build_font.py.

    from outils_nettoyage import *

    g = lire_glyphe('V', 'origine')
    d = simplifier(g['d'], 1.5, lissage=6)   # oter le bruit fin
    d = symetriser(d, 'x', tolerance=1.2)    # si la lettre le demande
    d = redresser(d, 'v', 3.0, hors_bande=True)          # verticales
    d = redresser(d, 15.1, 6.0, 180.0, hors_bande=True)  # obliques mesurees
    d = redresser(d, 'h', 3.0, 60.0)                     # bras et faces
    d = aplatir_empattement(d, 4.0)          # faces d'empattement plates
    d = poser(d, bas=0, haut=700)            # calage
    d = aplatir_empattement(d, 3.0, colle=8.0)
    d = poser_bande(d)                       # renflement de mi-hauteur
    print(mesurer(d), verifier('V', d))
    rendre_html('V', [('avant', g['d']), ('apres', d)], 'V nettoye')
    ecrire_glyphe('V', d, avance=g['a'], notes='...')

L'ordre compte. symetriser reechantillonne et defait un peu le redressement :
il passe AVANT. poser_bande passe en DERNIER. Le detail est dans le contrat.

Les fonctions rendent toutes une chaine de chemin SVG et n'ont pas d'effet de
bord, sauf ecrire_glyphe et rendre_html qui ecrivent un fichier.
"""

import os
import json
import math
import unicodedata

from fontTools.svgLib.path import parse_path
from fontTools.pens.recordingPen import RecordingPen

# =========================================================== 0. le repere

UPM = 1000          # cadratin
CAP = 700           # hauteur de capitale
PIED = 0            # ligne de pied
DEBORD = 9          # debord des rondes au dessus de CAP et sous PIED

FUT = 153.2         # fut vertical, mediane relevee sur la famille
FUT_MIN = 145.0     # dispersion admise, lettre a lettre
FUT_MAX = 158.0
EMP_LARG = 219.0    # empattement en dalle, largeur totale au plus large
EMP_POINTE = 156.0  # largeur de la face meme, entre les deux arrondis d'angle
EMP_HAUT = 11.0     # hauteur a laquelle l'empattement atteint sa pleine largeur
EMP_FIN = 170.0     # hauteur ou la gorge rejoint le fut
EMP_RAYON = 10.0    # rayon d'arrondi des deux angles exterieurs de la face
BANDE_Y = 322       # sommet du renflement de mi-hauteur
BANDE_BAS = 275     # debut du renflement
BANDE_HAUT = 368    # fin du renflement
BANDE_AMPL = 19.5   # excursion vers l'exterieur, mediane relevee
ANNEAU = 156.0      # epaisseur d'une ronde, hors bande
BRUIT = 1.0         # au dela : c'est du dessin. en deca : c'est du bruit.

DOSSIER = os.path.dirname(os.path.abspath(__file__))
ALPHABET = os.path.normpath(os.path.join(DOSSIER, '..', 'alphabet_titre.js'))

# lettres du sceau, main de la famille, contour a respecter
FAMILLE = set("ACDEGHILMORSTUV'")
# lettres qui doivent etre symetriques autour de leur axe vertical
SYMETRIQUES = set('AHIMOTUVWXY')


# =========================================================== 1. lire et ecrire

_CACHE = {}


def _alphabet():
    """Le dictionnaire des glyphes d'origine, lu dans alphabet_titre.js."""
    if 'G' in _CACHE:
        return _CACHE['G']
    s = open(ALPHABET, 'r', encoding='utf-8').read()
    i = s.index('var G = ')
    j = s.index('{', i)
    prof = 0
    fin = j
    for k in range(j, len(s)):
        if s[k] == '{':
            prof += 1
        elif s[k] == '}':
            prof -= 1
            if prof == 0:
                fin = k
                break
    _CACHE['G'] = json.loads(s[j:fin + 1])
    return _CACHE['G']


def nom_fichier(caractere):
    """Nom de fichier sur pour un caractere : V -> V, ' -> u0027."""
    if caractere.isalnum() and caractere.isascii():
        return caractere
    return 'u%04X' % ord(caractere)


def chemin_json(caractere):
    return os.path.join(DOSSIER, nom_fichier(caractere) + '.json')


def lire_glyphe(caractere, source='auto'):
    """Rend {'c', 'd', 'a', 'b', 'origine'} pour un caractere.

    source = 'origine' : toujours alphabet_titre.js
             'propre'  : toujours glyphes_propres/<nom>.json
             'auto'    : le propre s'il existe, sinon l'origine.
    """
    p = chemin_json(caractere)
    if source in ('auto', 'propre') and os.path.exists(p):
        o = json.load(open(p, 'r', encoding='utf-8'))
        return {'c': caractere, 'd': o['d'], 'a': o.get('avance'),
                'b': o.get('bornes'), 'origine': 'propre', 'meta': o}
    if source == 'propre':
        raise IOError('pas de glyphe propre pour %r' % caractere)
    g = _alphabet()[caractere]
    return {'c': caractere, 'd': g['d'], 'a': g['a'], 'b': g['b'],
            'origine': 'alphabet_titre.js'}


def ecrire_glyphe(caractere, chemin, avance=None, notes='', garde=None):
    """Ecrit glyphes_propres/<nom>.json. Rend le chemin du fichier."""
    b = bornes(chemin)
    o = {
        'caractere': caractere,
        'code': ord(caractere),
        'nom_unicode': unicodedata.name(caractere, ''),
        'd': chemin,
        'avance': avance if avance is not None else _alphabet()[caractere]['a'],
        'bornes': [round(v, 1) for v in b],
        'noeuds': compter_noeuds(chemin),
        'largeur_de_fut': largeur_de_fut(chemin),
        'garde': garde or [],
        'notes': notes,
        'repere': {'upm': UPM, 'cap': CAP, 'pied': PIED, 'y': 'vers le haut'},
    }
    p = chemin_json(caractere)
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(o, f, ensure_ascii=False, indent=2)
        f.write('\n')
    return p


# =========================================================== 2. le format

# Un chemin est manipule sous forme de contours.
#   contour = liste de segments
#   segment = ('l', p0, p1)  ou  ('c', p0, c1, c2, p1)
#   point   = (x, y) en unites de police, y vers le haut


def contours(d):
    """Chaine de chemin SVG -> liste de contours fermes."""
    rp = RecordingPen()
    parse_path(d, rp)
    cs, cur, pt, dep = [], None, None, None
    for op, args in rp.value:
        if op == 'moveTo':
            cur = []
            cs.append(cur)
            pt = tuple(args[0])
            dep = pt
        elif op == 'lineTo':
            q = tuple(args[0])
            if q != pt:
                cur.append(('l', pt, q))
            pt = q
        elif op == 'curveTo':
            c1, c2, p1 = [tuple(a) for a in args]
            cur.append(('c', pt, c1, c2, p1))
            pt = p1
        elif op == 'qCurveTo':
            pts = [tuple(a) for a in args]
            prev = pt
            for i in range(len(pts) - 1):
                q = pts[i]
                if i == len(pts) - 2:
                    fin = pts[i + 1]
                else:
                    fin = ((pts[i][0] + pts[i + 1][0]) / 2.0,
                           (pts[i][1] + pts[i + 1][1]) / 2.0)
                c1 = (prev[0] + 2.0 / 3 * (q[0] - prev[0]),
                      prev[1] + 2.0 / 3 * (q[1] - prev[1]))
                c2 = (fin[0] + 2.0 / 3 * (q[0] - fin[0]),
                      fin[1] + 2.0 / 3 * (q[1] - fin[1]))
                cur.append(('c', prev, c1, c2, fin))
                prev = fin
            pt = prev
        elif op == 'closePath':
            if pt is not None and dep is not None and _loin(pt, dep, 1e-9):
                cur.append(('l', pt, dep))
            pt = dep
    return [c for c in cs if c]


def _loin(a, b, e=1e-9):
    return abs(a[0] - b[0]) > e or abs(a[1] - b[1]) > e


def _n(v, prec=1):
    s = '%.*f' % (prec, v)
    if '.' in s:
        s = s.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def chemin(cs, prec=1):
    """Liste de contours -> chaine de chemin SVG."""
    out = []
    for c in cs:
        if not c:
            continue
        p0 = c[0][1]
        out.append('M%s %s' % (_n(p0[0], prec), _n(p0[1], prec)))
        for s in c:
            if s[0] == 'l':
                out.append('L%s %s' % (_n(s[2][0], prec), _n(s[2][1], prec)))
            else:
                out.append('C%s %s %s %s %s %s' % (
                    _n(s[2][0], prec), _n(s[2][1], prec),
                    _n(s[3][0], prec), _n(s[3][1], prec),
                    _n(s[4][0], prec), _n(s[4][1], prec)))
        out.append('Z')
    return ''.join(out)


def points(seg, n=24):
    """Segment -> polyligne de n+1 points."""
    if seg[0] == 'l':
        (x0, y0), (x1, y1) = seg[1], seg[2]
        return [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)
                for i in range(n + 1)]
    _, p0, c1, c2, p1 = seg
    out = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        out.append((u * u * u * p0[0] + 3 * u * u * t * c1[0]
                    + 3 * u * t * t * c2[0] + t * t * t * p1[0],
                    u * u * u * p0[1] + 3 * u * u * t * c1[1]
                    + 3 * u * t * t * c2[1] + t * t * t * p1[1]))
    return out


def polyligne(c, n=24):
    """Contour -> polyligne fermee."""
    out = []
    for s in c:
        f = points(s, n)
        if out:
            f = f[1:]
        out.extend(f)
    if out and not _loin(out[0], out[-1], 1e-9):
        out.pop()
    return out


def polylignes(d, n=24):
    return [polyligne(c, n) for c in contours(d)]


# =========================================================== 3. mesures

def bornes(d):
    xs, ys = [], []
    for p in polylignes(d, 24):
        for a in p:
            xs.append(a[0])
            ys.append(a[1])
    return (min(xs), min(ys), max(xs), max(ys))


def compter_noeuds(d):
    cs = contours(d)
    return {'contours': len(cs), 'segments': sum(len(c) for c in cs),
            'droites': sum(1 for c in cs for s in c if s[0] == 'l')}


def coupe_x(d, y):
    """Abscisses des traversees du contour par l'horizontale y, triees."""
    r = []
    for p in polylignes(d, 48):
        for i in range(len(p)):
            x0, y0 = p[i]
            x1, y1 = p[(i + 1) % len(p)]
            if (y0 <= y < y1) or (y1 <= y < y0):
                r.append(x0 + (y - y0) / (y1 - y0) * (x1 - x0))
    return sorted(r)


def coupe_y(d, x):
    """Ordonnees des traversees du contour par la verticale x, triees."""
    r = []
    for p in polylignes(d, 48):
        for i in range(len(p)):
            x0, y0 = p[i]
            x1, y1 = p[(i + 1) % len(p)]
            if (x0 <= x < x1) or (x1 <= x < x0):
                r.append(y0 + (x - x0) / (x1 - x0) * (y1 - y0))
    return sorted(r)


def _med(v):
    v = sorted(v)
    if not v:
        return 0.0
    n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2.0


def largeur_de_fut(d, y0=200, y1=515, paire=(0, 1), pas=5):
    """Largeur du fut, mesuree hors empattement et hors bande de mi-hauteur.

    Rend {'mediane', 'min', 'max', 'etendue', 'mesures'}. paire designe les
    deux traversees a soustraire : (0, 1) le fut le plus a gauche, (-2, -1) le
    plus a droite.
    """
    v = []
    y = y0
    while y <= y1:
        if not (BANDE_BAS <= y <= BANDE_HAUT):
            r = coupe_x(d, y)
            i, j = paire
            if len(r) > max(abs(i), abs(j)):
                w = r[j] - r[i]
                if 60 < w < 260:
                    v.append(w)
        y += pas
    if not v:
        return {'mediane': None, 'min': None, 'max': None,
                'etendue': None, 'mesures': 0}
    return {'mediane': round(_med(v), 2), 'min': round(min(v), 2),
            'max': round(max(v), 2), 'etendue': round(max(v) - min(v), 2),
            'mesures': len(v)}


def bruit_de_bord(d, y0, y1, indice=0, fenetre=20, pas=1.0):
    """Ecart d'un bord a sa droite locale : la mesure qui separe le bruit du
    dessin. Rend {'sigma', 'max', 'bombe', 'pente'}."""
    ys, xs = [], []
    y = y0
    while y <= y1:
        r = coupe_x(d, y)
        if len(r) > abs(indice):
            ys.append(y)
            xs.append(r[indice])
        y += pas
    if len(ys) < 8:
        return None
    res = []
    for i in range(len(ys)):
        a = max(0, i - fenetre)
        b = min(len(ys), i + fenetre + 1)
        p, q = _droite(ys[a:b], xs[a:b])
        res.append(xs[i] - (p * ys[i] + q))
    p, q = _droite(ys, xs)
    g = [xs[i] - (p * ys[i] + q) for i in range(len(ys))]
    m = sum(res) / len(res)
    sig = math.sqrt(sum((v - m) ** 2 for v in res) / max(1, len(res) - 1))
    return {'sigma': round(sig, 3), 'max': round(max(abs(v) for v in res), 3),
            'bombe': round(max(g) - min(g), 2), 'pente': round(p, 4)}


def _droite(xs, ys):
    n = len(xs)
    mx = sum(xs) / n
    my = sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    sxy = sum((xs[i] - mx) * (ys[i] - my) for i in range(n))
    a = sxy / sxx if sxx > 1e-12 else 0.0
    return a, my - a * mx


def inversions_de_courbure(d, n=12):
    """Nombre de changements de sens de courbure, contour par contour. Sur un
    contour exterieur de ronde le compte doit tomber a zero ; ailleurs il doit
    tomber au nombre de coins voulus."""
    out = []
    for p in polylignes(d, n):
        sg = []
        for i in range(len(p)):
            a, b, c = p[i - 1], p[i], p[(i + 1) % len(p)]
            cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
            if abs(cr) > 1e-9:
                sg.append(1 if cr > 0 else -1)
        out.append(sum(1 for i in range(len(sg)) if sg[i] != sg[i - 1]))
    return out


def mesurer(d):
    """Fiche de mesure complete d'un chemin."""
    b = bornes(d)
    return {'bornes': [round(v, 1) for v in b],
            'hauteur': round(b[3] - b[1], 1),
            'largeur': round(b[2] - b[0], 1),
            'noeuds': compter_noeuds(d),
            'fut': largeur_de_fut(d),
            'inversions': inversions_de_courbure(d)}


# =========================================================== 4. simplifier

def _ajuste_cubique(P, t, g1, g2):
    """Une cubique au moindre carre sur les points P, tangentes imposees."""
    n = len(P)
    A = [[(0.0, 0.0), (0.0, 0.0)] for _ in range(n)]
    for i in range(n):
        u = t[i]
        v = 1 - u
        A[i][0] = (g1[0] * 3 * v * v * u, g1[1] * 3 * v * v * u)
        A[i][1] = (g2[0] * 3 * v * u * u, g2[1] * 3 * v * u * u)
    c11 = c12 = c22 = x1 = x2 = 0.0
    p0, p3 = P[0], P[-1]
    for i in range(n):
        u = t[i]
        v = 1 - u
        c11 += A[i][0][0] ** 2 + A[i][0][1] ** 2
        c12 += A[i][0][0] * A[i][1][0] + A[i][0][1] * A[i][1][1]
        c22 += A[i][1][0] ** 2 + A[i][1][1] ** 2
        bx = (P[i][0] - (p0[0] * (v ** 3 + 3 * v * v * u)
                         + p3[0] * (3 * v * u * u + u ** 3)))
        by = (P[i][1] - (p0[1] * (v ** 3 + 3 * v * v * u)
                         + p3[1] * (3 * v * u * u + u ** 3)))
        x1 += A[i][0][0] * bx + A[i][0][1] * by
        x2 += A[i][1][0] * bx + A[i][1][1] * by
    det = c11 * c22 - c12 * c12
    if abs(det) < 1e-12:
        seg = math.dist(p0, p3) / 3.0
        a1 = a2 = seg
    else:
        a1 = (x1 * c22 - c12 * x2) / det
        a2 = (c11 * x2 - x1 * c12) / det
    lim = math.dist(p0, p3) * 1e-6
    if a1 < lim or a2 < lim:
        a1 = a2 = math.dist(p0, p3) / 3.0
    return ('c', p0, (p0[0] + g1[0] * a1, p0[1] + g1[1] * a1),
            (p3[0] + g2[0] * a2, p3[1] + g2[1] * a2), p3)


def _err(seg, P, t):
    pire = 0.0
    ipire = len(P) // 2
    _, p0, c1, c2, p3 = seg
    for i in range(len(P)):
        u = t[i]
        v = 1 - u
        x = (v ** 3 * p0[0] + 3 * v * v * u * c1[0]
             + 3 * v * u * u * c2[0] + u ** 3 * p3[0])
        y = (v ** 3 * p0[1] + 3 * v * v * u * c1[1]
             + 3 * v * u * u * c2[1] + u ** 3 * p3[1])
        e = (x - P[i][0]) ** 2 + (y - P[i][1]) ** 2
        if e > pire:
            pire = e
            ipire = i
    return math.sqrt(pire), ipire


def _param(P):
    t = [0.0]
    for i in range(1, len(P)):
        t.append(t[-1] + math.dist(P[i], P[i - 1]))
    L = t[-1] or 1.0
    return [v / L for v in t]


def _unit(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy)
    return (dx / L, dy / L) if L > 1e-12 else (0.0, 0.0)


def _long(P):
    return sum(math.dist(P[i], P[i - 1]) for i in range(1, len(P)))


def _fit(P, g1, g2, tol, prof=0, mini=25.0):
    if len(P) < 3:
        return [('l', P[0], P[-1])]
    t = _param(P)
    seg = _ajuste_cubique(P, t, g1, g2)
    e, i = _err(seg, P, t)
    if e <= tol:
        return [seg]
    # jamais deux noeuds a moins de mini unites l'un de l'autre
    if _long(P) < 2 * mini or prof >= 10:
        return [seg]
    if i <= 0 or i >= len(P) - 1:
        i = len(P) // 2
    # on ne coupe pas trop pres d'un bout
    lo = 0
    while lo < len(P) - 1 and _long(P[:lo + 2]) < mini:
        lo += 1
    hi = len(P) - 1
    while hi > 1 and _long(P[hi - 1:]) < mini:
        hi -= 1
    if lo >= hi:
        return [seg]
    i = max(lo, min(hi, i))
    gm = _unit(P[i - 1], P[i + 1])
    return (_fit(P[:i + 1], g1, (-gm[0], -gm[1]), tol, prof + 1, mini)
            + _fit(P[i:], gm, g2, tol, prof + 1, mini))


def _est_droit(P, tol):
    a, b = P[0], P[-1]
    L = math.dist(a, b)
    if L < 1e-9:
        return False
    ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
    for p in P:
        if abs(-(p[0] - a[0]) * uy + (p[1] - a[1]) * ux) > tol:
            return False
    return True


def _coins(P, angle=32.0, saut=6):
    """Indices des coins durs d'une polyligne fermee."""
    n = len(P)
    out = []
    for i in range(n):
        a = P[(i - saut) % n]
        b = P[i]
        c = P[(i + saut) % n]
        u = _unit(a, b)
        v = _unit(b, c)
        d = u[0] * v[0] + u[1] * v[1]
        d = max(-1.0, min(1.0, d))
        if math.degrees(math.acos(d)) > angle:
            out.append(i)
    # un seul indice par grappe : celui du virage le plus dur
    grappes, cur = [], []
    for i in out:
        if cur and i - cur[-1] <= saut:
            cur.append(i)
        else:
            if cur:
                grappes.append(cur)
            cur = [i]
    if cur:
        grappes.append(cur)
    if len(grappes) > 1 and grappes[0][0] == 0 and grappes[-1][-1] == n - 1:
        grappes[0] = grappes[-1] + grappes[0]
        grappes.pop()
    res = []
    for g in grappes:
        pire, ipire = -1, g[0]
        for i in g:
            a = P[(i - saut) % n]
            b = P[i]
            c = P[(i + saut) % n]
            u = _unit(a, b)
            v = _unit(b, c)
            d = max(-1.0, min(1.0, u[0] * v[0] + u[1] * v[1]))
            ang = math.degrees(math.acos(d))
            if ang > pire:
                pire, ipire = ang, i
        res.append(ipire)
    return sorted(set(res))


def _lisser(P, coins, rayon, pas):
    """Passe-bas sur une polyligne fermee, sans franchir les coins.
    rayon en unites de police : c'est la longueur d'onde du bruit a effacer."""
    n = len(P)
    if rayon <= 0 or n < 5:
        return list(P)
    w = max(1, int(round(rayon / max(pas, 1e-6))))
    coupe = set(k % n for k in coins)
    out = []
    for i in range(n):
        if i in coupe:
            out.append(P[i])
            continue
        voisins = [(0, P[i])]
        for sens in (1, -1):
            j = i
            for t in range(1, w + 1):
                j = (j + sens) % n
                voisins.append((t, P[j]))
                if j in coupe:
                    break
        acc_x = acc_y = poids = 0.0
        for t, p in voisins:
            g = math.exp(-3.0 * (t / float(w)) ** 2)
            acc_x += p[0] * g
            acc_y += p[1] * g
            poids += g
        out.append((acc_x / poids, acc_y / poids))
    return out


def simplifier(d, tolerance=1.2, angle_coin=32.0, lissage=0.0, pas=1.5,
               ecart_min=25.0):
    """Reduit le nombre de noeuds en preservant la forme.

    tolerance = ecart maximal admis, en unites de police, entre l'ancien
    contour et le nouveau. Voir le contrat : 1.2 pour une courbe de ronde,
    0.8 pour un empattement, 2.0 au plus pour une longue oblique.
    lissage  = rayon du passe-bas applique avant l'ajustement, en unites.
    C'est lui qui efface les micro bosses ; il ne franchit jamais un coin.
    """
    sortie = []
    for c in contours(d):
        brut = polyligne(c, 24)
        if len(brut) < 8:
            sortie.append(c)
            continue
        L = sum(math.dist(brut[i], brut[i - 1]) for i in range(len(brut)))
        n = max(24, int(L / pas))
        P = _reechantillonne(brut, n)
        # les droites deja posees sont intouchables : on ancre leurs bouts
        ancres = []
        for s in c:
            if s[0] == 'l' and math.dist(s[1], s[2]) >= 30.0:
                for q in (s[1], s[2]):
                    k = min(range(n), key=lambda m: math.dist(P[m], q))
                    ancres.append(k)
        # les coins d'abord au gros grain : un vrai coin resiste au bruit
        gros = _coins(P, max(angle_coin, 42.0), max(4, int(round(18.0 / pas))))
        gros = sorted(set(gros) | set(ancres))
        if lissage > 0:
            P = _lisser(P, gros or [0], lissage, L / n)
        saut = max(3, int(round(12.0 / pas)))
        co = sorted(set(_coins(P, angle_coin, saut)) | set(ancres))
        if not co:
            co = gros or [0]
        segs = []
        for k in range(len(co)):
            i0 = co[k]
            i1 = co[(k + 1) % len(co)]
            long = ((i1 - i0) % n) or n
            morceau = [P[(i0 + j) % n] for j in range(long + 1)]
            if len(morceau) < 3:
                segs.append(('l', morceau[0], morceau[-1]))
                continue
            if _est_droit(morceau, tolerance):
                segs.append(('l', morceau[0], morceau[-1]))
                continue
            g1 = _unit(morceau[0], morceau[min(2, len(morceau) - 1)])
            g2 = _unit(morceau[-1], morceau[-min(3, len(morceau))])
            segs.extend(_fit(morceau, g1, g2, tolerance, 0, ecart_min))
        sortie.append(segs)
    return chemin(sortie)


# =========================================================== 5. redresser

def _tourne(p, ang, cx=500.0, cy=350.0):
    c, s = math.cos(ang), math.sin(ang)
    x, y = p[0] - cx, p[1] - cy
    return (cx + x * c - y * s, cy + x * s + y * c)


def tourner(d, degres, cx=500.0, cy=350.0):
    ang = math.radians(degres)
    cs = []
    for c in contours(d):
        cs.append([(s[0],) + tuple(_tourne(p, ang, cx, cy) for p in s[1:])
                   for s in c])
    return chemin(cs, prec=3)


def redresser(d, axe='v', tolerance=3.0, longueur_min=40.0, hors_bande=False):
    """Aligne sur une droite parfaite tout ce qui en est a moins de tolerance.

    axe = 'v' verticale, 'h' horizontale, ou un nombre : l'angle de la droite
    voulue, en degres depuis la verticale, positif vers la droite. Une
    oblique de V se redresse avec axe = 15.1 ou axe = -15.1.

    Un enchainement de segments dont tous les points tiennent dans un couloir
    de +/- tolerance autour de leur moyenne devient UN segment droit, pose sur
    cette moyenne. Les enchainements plus courts que longueur_min ne sont pas
    touches : ce sont des details, pas des futs.

    hors_bande = True : les points dont l'ordonnee tombe dans la bande de
    mi-hauteur sont exclus du couloir et de la moyenne. Le renflement de la
    famille ne fait alors plus obstacle au redressement ; on le repose ensuite
    avec poser_bande().
    """
    if axe == 'v':
        u = (0.0, 1.0)
    elif axe == 'h':
        u = (1.0, 0.0)
    else:
        a = math.radians(float(axe))
        u = (math.sin(a), math.cos(a))
    nrm = (-u[1], u[0])
    sortie = []
    for c in contours(d):
        n = len(c)
        pris = [False] * n
        runs = []
        for i0 in range(n):
            if pris[i0]:
                continue
            best = None
            for L in range(1, n + 1):
                idx = [(i0 + t) % n for t in range(L)]
                if len(set(idx)) < L or any(pris[t] for t in idx):
                    break
                P = []
                for t in idx:
                    f = points(c[t], 12)
                    if P:
                        f = f[1:]
                    P.extend(f)
                ref = P[0]
                cour = [(p[0] - ref[0]) * u[0] + (p[1] - ref[1]) * u[1]
                        for p in P]
                ecar = [(p[0] - ref[0]) * nrm[0] + (p[1] - ref[1]) * nrm[1]
                        for p in P]
                utiles = [ecar[m] for m, p in enumerate(P)
                          if not (hors_bande and BANDE_BAS <= p[1] <= BANDE_HAUT)]
                if len(utiles) < 4:
                    break
                if max(cour) - min(cour) < 1e-9:
                    break
                moy = sum(utiles) / len(utiles)
                if max(abs(v - moy) for v in utiles) > tolerance:
                    break
                mono = all((cour[m + 1] - cour[m]) * (cour[1] - cour[0]) >= -1e-9
                           for m in range(len(cour) - 1))
                if not mono:
                    break
                if abs(cour[-1] - cour[0]) >= longueur_min:
                    best = (list(idx), ref, cour[0], cour[-1], moy)
            if best:
                for t in best[0]:
                    pris[t] = True
                runs.append(best)
        if not runs:
            sortie.append(c)
            continue
        remplace = {}
        for idx, ref, t0, t1, moy in runs:
            a = (ref[0] + u[0] * t0 + nrm[0] * moy,
                 ref[1] + u[1] * t0 + nrm[1] * moy)
            b = (ref[0] + u[0] * t1 + nrm[0] * moy,
                 ref[1] + u[1] * t1 + nrm[1] * moy)
            remplace[idx[0]] = (('l', a, b), set(idx))
        segs = []
        fixes = []
        saut = set()
        for i in range(n):
            if i in saut:
                continue
            if i in remplace:
                s, idx = remplace[i]
                fixes.append(len(segs))
                segs.append(s)
                saut |= idx
            else:
                segs.append(c[i])
        sortie.append(_recoudre(segs, fixes))
    return chemin(sortie)


def poser_bande(d, amplitude=BANDE_AMPL, sommet=BANDE_Y,
                bas=BANDE_BAS, haut=BANDE_HAUT, pente_max=1.2):
    """Repose le renflement de mi-hauteur de la famille sur les bords droits.

    Tout segment droit qui traverse la bande et qui monte (pente inferieure a
    pente_max en dx/dy) recoit un renflement propre : la matiere s'ecarte de
    amplitude unites vers l'exterieur, sommet a l'ordonnee sommet, retour a
    zero en bas et en haut de la bande. Deux cubiques, quatre noeuds : la
    decision de la famille, sans le tremblement.
    """
    cs = contours(d)
    sortie = []
    for c in cs:
        P = polyligne(c, 12)
        aire = _aire(P)
        signe = 1.0 if aire > 0 else -1.0
        segs = []
        for s in c:
            if s[0] != 'l':
                segs.append(s)
                continue
            p0, p1 = s[1], s[2]
            dy = p1[1] - p0[1]
            dx = p1[0] - p0[0]
            if abs(dy) < 1e-6 or abs(dx / dy) > pente_max:
                segs.append(s)
                continue
            y0, y1 = min(p0[1], p1[1]), max(p0[1], p1[1])
            if not (y0 <= bas + 4 and y1 >= haut - 4):
                segs.append(s)
                continue
            L = math.hypot(dx, dy)
            ux, uy = dx / L, dy / L
            nx, ny = uy * signe, -ux * signe        # normale exterieure
            if dy < 0:                              # u toujours vers le haut
                ux, uy = -ux, -uy

            def sur(y):
                t = (y - p0[1]) / dy
                return (p0[0] + dx * t, y)

            a = sur(bas)
            b = sur(haut)
            m0 = sur(sommet)
            m = (m0[0] + nx * amplitude, m0[1] + ny * amplitude)
            la = math.dist(a, m0)
            lb = math.dist(m0, b)
            # poignee courte au pied du renflement, longue au sommet : le
            # sommet reste rond, comme dans le sceau, sans casser en pointe
            a1 = (a[0] + ux * la * 0.30, a[1] + uy * la * 0.30)
            a2 = (m[0] - ux * la * 0.52, m[1] - uy * la * 0.52)
            b1 = (m[0] + ux * lb * 0.52, m[1] + uy * lb * 0.52)
            b2 = (b[0] - ux * lb * 0.30, b[1] - uy * lb * 0.30)
            if p0[1] < p1[1]:
                segs.append(('l', p0, a))
                segs.append(('c', a, a1, a2, m))
                segs.append(('c', m, b1, b2, b))
                segs.append(('l', b, p1))
            else:
                segs.append(('l', p0, b))
                segs.append(('c', b, b2, b1, m))
                segs.append(('c', m, a2, a1, a))
                segs.append(('l', a, p1))
        sortie.append(segs)
    return chemin(sortie)


def _recoudre(segs, fixes=()):
    """Remet bout a bout des segments dont on vient de bouger les extremites.

    fixes = indices des segments qu'on vient de poser et qui ne doivent pas
    bouger : ce sont leurs voisins qui viennent les rejoindre.
    """
    n = len(segs)
    fixes = set(fixes)
    fin = []
    for i in range(n):
        s = segs[i]
        if i in fixes:
            fin.append(s)
            continue
        d0 = segs[i - 1][-1] if (i - 1) % n in fixes else s[1]
        d1 = segs[(i + 1) % n][1] if (i + 1) % n in fixes else s[-1]
        if s[0] == 'c':
            c1 = (s[2][0] + (d0[0] - s[1][0]), s[2][1] + (d0[1] - s[1][1]))
            c2 = (s[3][0] + (d1[0] - s[4][0]), s[3][1] + (d1[1] - s[4][1]))
            fin.append(('c', d0, c1, c2, d1))
        else:
            fin.append(('l', d0, d1))
    # deuxieme passe : les joints entre deux segments libres
    for i in range(n):
        a = fin[i]
        b = fin[(i + 1) % n]
        if _loin(a[-1], b[1], 1e-9):
            m = ((a[-1][0] + b[1][0]) / 2.0, (a[-1][1] + b[1][1]) / 2.0)
            if i in fixes:
                m = a[-1]
            elif (i + 1) % n in fixes:
                m = b[1]
            fin[i] = a[:-1] + (m,)
            fin[(i + 1) % n] = (b[0], m) + b[2:]
    return fin


def poser(d, bas=None, haut=None):
    """Cale le glyphe en hauteur : bas et haut sont les ordonnees voulues.
    Une lettre plate se pose sur 0 et monte a 700 ; une ronde sur -9 et 709."""
    b = bornes(d)
    if bas is None and haut is None:
        return d
    if bas is None:
        bas = b[1] + (haut - b[3])
    if haut is None:
        haut = b[3] + (bas - b[1])
    s = (haut - bas) / (b[3] - b[1])
    cs = []
    for c in contours(d):
        segs = []
        for seg in c:
            pts = [((p[0]), bas + (p[1] - b[1]) * s) for p in seg[1:]]
            segs.append((seg[0],) + tuple(pts))
        cs.append(segs)
    return chemin(cs)


# =========================================================== 6. empattements

def aplatir_empattement(d, tolerance=4.0, cales=(PIED, CAP), colle=6.0,
                        longueur_min=60.0):
    """Rend rigoureusement plates les faces d'empattement.

    Toute suite de segments horizontale a moins de tolerance devient une seule
    droite ; si sa hauteur moyenne tombe a moins de colle d'une des ordonnees
    cales (le pied, la capitale), elle y est posee exactement.
    """
    d = redresser(d, 'h', tolerance, longueur_min)
    if not cales:
        return d
    cs = []
    for c in contours(d):
        segs = []
        fixes = []
        for s in c:
            if s[0] == 'l':
                y0, y1 = s[1][1], s[2][1]
                if abs(y0 - y1) < 0.51 and abs(s[2][0] - s[1][0]) >= longueur_min:
                    y = (y0 + y1) / 2.0
                    for cible in cales:
                        if abs(y - cible) <= colle:
                            y = float(cible)
                            break
                    fixes.append(len(segs))
                    segs.append(('l', (s[1][0], y), (s[2][0], y)))
                    continue
            segs.append(s)
        cs.append(_recoudre(segs, fixes))
    return chemin(cs)


# =========================================================== 7. symetriser

def _aire(P):
    return 0.5 * sum(P[i][0] * P[i - 1][1] - P[i - 1][0] * P[i][1]
                     for i in range(len(P)))


def _reechantillonne(P, n):
    L = [0.0]
    for i in range(1, len(P) + 1):
        L.append(L[-1] + math.dist(P[i % len(P)], P[i - 1]))
    T = L[-1]
    out = []
    j = 0
    for i in range(n):
        s = T * i / n
        while j < len(L) - 2 and L[j + 1] < s:
            j += 1
        seg = L[j + 1] - L[j]
        u = (s - L[j]) / seg if seg > 1e-12 else 0.0
        a = P[j % len(P)]
        b = P[(j + 1) % len(P)]
        out.append((a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u))
    return out


def symetriser(d, axe='x', valeur=None, n=720, tolerance=1.0):
    """Rend la lettre symetrique autour de son axe vertical (axe='x') ou de
    son axe horizontal (axe='y').

    Le contour et son miroir sont reechantillonnes puis moyennes : la lettre
    garde sa forme, elle perd son gauchissement. A n'employer que sur les
    lettres que le contrat declare symetriques.
    """
    b = bornes(d)
    if valeur is None:
        valeur = (b[0] + b[2]) / 2.0 if axe == 'x' else (b[1] + b[3]) / 2.0
    cs = contours(d)
    polys = [polyligne(c, 24) for c in cs]

    def miroir(p):
        if axe == 'x':
            return [(2 * valeur - a[0], a[1]) for a in p]
        return [(a[0], 2 * valeur - a[1]) for a in p]

    sortie = []
    libres = list(range(len(polys)))
    for i, P in enumerate(polys):
        M = miroir(P)
        M.reverse()                       # le miroir inverse le sens
        # quel contour du glyphe correspond a ce miroir ?
        cible, best = i, None
        for j in libres:
            Q = polys[j]
            cq = (sum(a[0] for a in Q) / len(Q), sum(a[1] for a in Q) / len(Q))
            cm = (sum(a[0] for a in M) / len(M), sum(a[1] for a in M) / len(M))
            dd = math.dist(cq, cm) + abs(abs(_aire(Q)) - abs(_aire(M))) / 1000.0
            if best is None or dd < best:
                best, cible = dd, j
        A = _reechantillonne(polys[cible], n)
        B = _reechantillonne(M, n)
        # meilleur decalage circulaire
        pas = max(1, n // 180)
        bestk, bestd = 0, None
        for k in range(0, n, pas):
            s = 0.0
            for t in range(0, n, max(1, n // 90)):
                a = A[t]
                bb = B[(t + k) % n]
                s += (a[0] - bb[0]) ** 2 + (a[1] - bb[1]) ** 2
            if bestd is None or s < bestd:
                bestd, bestk = s, k
        for k in range(max(0, bestk - pas), bestk + pas + 1):
            s = 0.0
            for t in range(0, n, max(1, n // 180)):
                a = A[t]
                bb = B[k % n]
                bb = B[(t + k) % n]
                s += (a[0] - bb[0]) ** 2 + (a[1] - bb[1]) ** 2
            if s < bestd:
                bestd, bestk = s, k
        moy = [((A[t][0] + B[(t + bestk) % n][0]) / 2.0,
                (A[t][1] + B[(t + bestk) % n][1]) / 2.0) for t in range(n)]
        sortie.append(moy)
    dd = chemin([[('l', p[i], p[(i + 1) % len(p)]) for i in range(len(p))]
                 for p in sortie], prec=2)
    return simplifier(dd, tolerance)


# =========================================================== 8. regarder

_GABARIT = """<title>%(titre)s</title>
<style>
 body{margin:0;padding:22px;background:#fff;color:#111;
      font:13px/1.5 -apple-system,Helvetica,Arial,sans-serif}
 h1{font:600 15px/1.3 inherit;margin:0 0 16px}
 .rangee{display:flex;align-items:flex-end;gap:34px;margin:0 0 26px;
         padding:0 0 18px;border-bottom:1px solid #e6e6e6}
 .case{text-align:center}
 .case span{display:block;margin-top:6px;color:#777;font-size:11px}
 svg{display:block;background:#fff}
 .nom{width:96px;font-weight:600;padding-bottom:6px}
</style>
<h1>%(titre)s</h1>
%(corps)s
"""


def rendre_html(caractere, chemins, titre=None, fichier=None,
                tailles=(400, 96, 24)):
    """Ecrit un HTML de comparaison avant / apres, une ligne par chemin,
    chaque ligne aux tailles demandees. Rend le chemin du fichier.

    chemins = [('avant', d0), ('apres', d1), ...]
    """
    titre = titre or ('IVRESSE TITRE : %s' % caractere)
    lignes = []
    for nom, d in chemins:
        cases = []
        for t in tailles:
            cases.append(
                '<div class="case"><svg width="%d" height="%d" '
                'viewBox="-40 -760 1080 1080"><g transform="scale(1,-1)">'
                '<path d="%s" fill="#111"/></g></svg><span>%d px</span></div>'
                % (t, t, d, t))
        lignes.append('<div class="rangee"><div class="nom">%s</div>%s</div>'
                      % (nom, ''.join(cases)))
    html = _GABARIT % {'titre': titre, 'corps': ''.join(lignes)}
    p = fichier or os.path.join(DOSSIER, 'apercu_%s.html' % nom_fichier(caractere))
    open(p, 'w', encoding='utf-8').write(html)
    return p


def rendre_mot(mot, chemins_par_lettre, fichier, titre='mot'):
    """Compose un mot avec des chemins donnes, pour juger la lettre en voisinage.
    chemins_par_lettre = {lettre: (d, avance)}"""
    g = []
    x = 0
    for ch in mot:
        if ch == ' ':
            x += 330
            continue
        d, a = chemins_par_lettre[ch]
        g.append('<g transform="translate(%d,0)"><path d="%s" fill="#111"/></g>'
                 % (x, d))
        x += a
    svg = ('<svg width="%d" height="%d" viewBox="0 -780 %d 900">'
           '<g transform="scale(1,-1)">%s</g></svg>' % (min(1400, x // 2),
                                                        900 * min(1400, x // 2) // max(1, x),
                                                        x, ''.join(g)))
    html = _GABARIT % {'titre': titre, 'corps': '<div class="rangee">%s</div>' % svg}
    open(fichier, 'w', encoding='utf-8').write(html)
    return fichier


# =========================================================== 9. controle

def verifier(caractere, d, plat=True):
    """Passe le chemin au controle du contrat. Rend une liste de remarques.
    Liste vide = le glyphe est recevable."""
    r = []
    b = bornes(d)
    bas, haut = (PIED, CAP) if plat else (PIED - DEBORD, CAP + DEBORD)
    if abs(b[1] - bas) > 1.0:
        r.append('pied a %.1f au lieu de %d' % (b[1], bas))
    if abs(b[3] - haut) > 1.0:
        r.append('sommet a %.1f au lieu de %d' % (b[3], haut))
    f = largeur_de_fut(d)
    if f['mediane'] is not None:
        if not (FUT_MIN <= f['mediane'] <= FUT_MAX):
            r.append('fut a %.1f, hors de [%.0f, %.0f]'
                     % (f['mediane'], FUT_MIN, FUT_MAX))
        if f['etendue'] > 6.0:
            r.append('fut qui varie de %.1f unites sur sa hauteur' % f['etendue'])
    n = compter_noeuds(d)
    if n['segments'] > 40:
        r.append('%d segments : trop de noeuds' % n['segments'])
    if caractere in SYMETRIQUES:
        s = defaut_de_symetrie(d)
        if s > 2.0:
            r.append('symetrie fausse de %.1f unites' % s)
    return r


def defaut_de_symetrie(d, axe='x'):
    """Ecart moyen entre le glyphe et son miroir, en unites."""
    b = bornes(d)
    v = (b[0] + b[2]) / 2.0
    ecarts = []
    for y in range(20, CAP, 20):
        r = coupe_x(d, y)
        if len(r) < 2:
            continue
        m = sorted(2 * v - x for x in r)
        if len(m) != len(r):
            continue
        ecarts.extend(abs(r[i] - m[i]) for i in range(len(r)))
    return round(sum(ecarts) / len(ecarts), 2) if ecarts else 0.0


if __name__ == '__main__':
    import sys
    c = sys.argv[1] if len(sys.argv) > 1 else 'V'
    g = lire_glyphe(c, 'origine')
    print(c, json.dumps(mesurer(g['d']), ensure_ascii=False))
