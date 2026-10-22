#!/usr/bin/env python3
"""Reporte dans les pages HTML les modifications faites en MODE TEXTE sur le site (fichiers textes_<page>_<date>.json
telecharges depuis le navigateur). Usage : python3 outils/appliquer_textes.py textes_index_2026-10-22.json [autres.json]
Chaque modification remplace l'attribut data-<langue>="ancien" par data-<langue>="nouveau" dans la page nommee."""
import json, sys, html, os
racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for chemin in sys.argv[1:]:
    d = json.load(open(chemin, encoding='utf-8'))
    for m in d.get('modifications', []):
        page = os.path.join(racine, os.path.basename(m['page']))
        if not os.path.exists(page): print('page absente :', m['page']); continue
        s = open(page, encoding='utf-8').read()
        vieux = 'data-%s="%s"' % (m['langue'], html.escape(m['ancien'], quote=True))
        neuf = 'data-%s="%s"' % (m['langue'], html.escape(m['nouveau'], quote=True))
        if vieux not in s: vieux = vieux.replace('&#x27;', "'")
        n = s.count(vieux)
        if n == 0: print('introuvable dans', m['page'], ':', m['ancien'][:60]); continue
        if n > 1: print('ambigu (%d fois) dans %s : %s' % (n, m['page'], m['ancien'][:60]), '-> premier remplace')
        s = s.replace(vieux, neuf, 1); open(page, 'w', encoding='utf-8').write(s)
        print('ok', m['page'], m['langue'], ':', m['ancien'][:40], '->', m['nouveau'][:40])
print('fini. Pensez a changer le ?v= des pages.')
