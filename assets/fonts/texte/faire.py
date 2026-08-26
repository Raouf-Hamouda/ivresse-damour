# -*- coding: utf-8 -*-
"""
Fabrique les deux livrables lisibles a partir de glyphes_texte.py :
    alphabet_texte.js   les signes en donnees SVG plus le poseur de texte
    SPECIMEN.html       l'epreuve, autonome, ouvrable en double cliquant

    python3 faire.py

Rien d'autre n'est ecrit. Le dessin est dans glyphes_texte.py, la fonte dans
build_font.py.
"""

import json
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import glyphes_texte as GT                                   # noqa: E402

SITE = os.path.abspath(os.path.join(ICI, '..', '..', '..'))
LOGO_JS = os.path.join(SITE, 'assets', 'js', 'logo.js')

R = GT.repertoire()
M = GT.METRIQUES


# ---------------------------------------------------------------------------
# le sceau de la famille, pour la comparaison en tete d'epreuve
# ---------------------------------------------------------------------------

def lire_sceau():
    """Extrait LOGO.toloache et LOGO.legitimo de assets/js/logo.js.
    Ce sont les lettres de la famille, vectorisees, pas une imitation."""
    src = open(LOGO_JS, encoding='utf-8').read()
    i = src.index('var LOGO')
    j = src.index('{', i)
    prof = 0
    for k in range(j, len(src)):
        if src[k] == '{':
            prof += 1
        elif src[k] == '}':
            prof -= 1
            if prof == 0:
                fin = k + 1
                break
    logo = json.loads(src[j:fin])
    return logo['toloache'], logo['legitimo']


def bbox(ds):
    """Boite englobante approchee d'une liste de chaines d, en echantillonnant
    les points de controle. Suffit pour cadrer."""
    xs, ys = [], []
    for d in ds:
        for m in re.finditer(r'(-?\d*\.?\d+)[ ,]+(-?\d*\.?\d+)', d):
            xs.append(float(m.group(1)))
            ys.append(float(m.group(2)))
    return min(xs), min(ys), max(xs), max(ys)


# ---------------------------------------------------------------------------
# alphabet_texte.js
# ---------------------------------------------------------------------------

ENTETE_JS = '''/* alphabet_texte.js : IVRESSE TEXTE, le caractere de labeur de la maison.
   Meme forme d'interface que logo.js.

   ALPHABET_TEXTE.glyphes[c] = {d: "...", adv: 624}
     d   : donnee de chemin SVG, repere de la fonte, 1000 par cadratin,
           y vers le HAUT, ligne de pied a y = 0. Un poseur retourne l'axe.
     adv : chasse, en unites de fonte.

   alphabetTexte({texte, x, y, taille, color, lettrage, mesure, interligne})
     renvoie une chaine SVG a coller dans un <svg>. Sans mesure, une seule
     ligne. Avec mesure (en pixels), le texte se coupe en lignes.
   alphabetTexte.largeur(texte, taille, lettrage)   la largeur en pixels
   alphabetTexte.lignes(texte, taille, mesure, lettrage)  le decoupage
   alphabetTexte.metriques   les mesures du caractere

   Genere par faire.py depuis glyphes_texte.py. Ne pas editer a la main.
*/
(function () {
'''

PIED_JS = '''
  function ech(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function largeurU(texte, lettrage) {
    var w = 0, i, g;
    for (i = 0; i < texte.length; i++) {
      g = ALPHABET_TEXTE.glyphes[texte[i]];
      if (!g) { g = ALPHABET_TEXTE.glyphes[' ']; }
      w += g.adv + (lettrage || 0) * ALPHABET_TEXTE.meta.upm;
    }
    return w;
  }

  function lignes(texte, taille, mesure, lettrage) {
    var upm = ALPHABET_TEXTE.meta.upm;
    var mots = String(texte).split(' ');
    var maxU = mesure * upm / taille;
    var espU = ALPHABET_TEXTE.glyphes[' '].adv + (lettrage || 0) * upm;
    var out = [], cur = '', curW = 0, i, w;
    for (i = 0; i < mots.length; i++) {
      w = largeurU(mots[i], lettrage);
      if (cur && curW + espU + w > maxU) { out.push(cur); cur = mots[i]; curW = w; }
      else { curW += cur ? espU + w : w; cur = cur ? cur + ' ' + mots[i] : mots[i]; }
    }
    if (cur) { out.push(cur); }
    return out;
  }

  window.alphabetTexte = function (o) {
    o = o || {};
    var upm = ALPHABET_TEXTE.meta.upm;
    var taille = o.taille || 17;
    var s = taille / upm;
    var lettrage = o.lettrage || 0;
    var x0 = o.x || 0, y0 = o.y || 0;
    var col = o.color || 'currentColor';
    var inter = (o.interligne || 1.55) * taille;
    var lg = o.mesure ? lignes(o.texte, taille, o.mesure, lettrage) : [String(o.texte)];
    var out = ['<g fill="' + col + '">'], li, i, g, x, y, t;
    for (li = 0; li < lg.length; li++) {
      t = lg[li];
      y = y0 + li * inter;
      x = x0;
      if (o.align === 'centre' && o.mesure) {
        x = x0 + (o.mesure - largeurU(t, lettrage) * s) / 2;
      } else if (o.align === 'droite' && o.mesure) {
        x = x0 + o.mesure - largeurU(t, lettrage) * s;
      }
      for (i = 0; i < t.length; i++) {
        g = ALPHABET_TEXTE.glyphes[t[i]] || ALPHABET_TEXTE.glyphes[' '];
        if (g.d) {
          out.push('<path transform="translate(' + x.toFixed(2) + ' ' + y.toFixed(2) +
                   ') scale(' + s.toFixed(6) + ' ' + (-s).toFixed(6) + ')" d="' + g.d + '"/>');
        }
        x += (g.adv + lettrage * upm) * s;
      }
    }
    out.push('</g>');
    return out.join('');
  };

  window.alphabetTexte.largeur = function (texte, taille, lettrage) {
    return largeurU(texte, lettrage) * (taille || 17) / ALPHABET_TEXTE.meta.upm;
  };
  window.alphabetTexte.lignes = lignes;
  window.alphabetTexte.metriques = ALPHABET_TEXTE.meta;
  window.ALPHABET_TEXTE = ALPHABET_TEXTE;
})();
'''


def ecrire_js():
    meta = dict(M)
    meta['nom'] = "Ivresse Texte"
    meta['version'] = "0.1"
    glyphes = {ch: {'d': g['d'], 'adv': g['adv']} for ch, g in R.items()}
    js = ENTETE_JS
    js += '  var ALPHABET_TEXTE = ' + json.dumps(
        {'meta': meta, 'glyphes': glyphes}, ensure_ascii=False,
        separators=(',', ':'), sort_keys=True) + ';\n'
    js += PIED_JS
    open(os.path.join(ICI, 'alphabet_texte.js'), 'w', encoding='utf-8').write(js)
    return len(glyphes)


# ---------------------------------------------------------------------------
# SPECIMEN.html
# ---------------------------------------------------------------------------

FR = ("Le mezcal vient de Villa Sola de Vega, dans l’Oaxaca. La maison suit la "
      "plante de la semence a la bouteille : elle seme, elle recolte, elle cuit "
      "dans le four de terre, elle laisse fermenter, elle distille. Le maestro "
      "mezcalero Gilberto Vasquez signe chaque lot. Un lot epuise reste "
      "affiche, epuise et date, avec son annee, sa parcelle et le nombre de "
      "bouteilles tirees. Si la plante ne donne pas cette annee la, le registre "
      "le dit : c’est la plante qui decide, et le prix ne fait que monter.")

ES = ("El mezcal viene de Villa Sola de Vega, en Oaxaca. La casa sigue la planta "
      "desde la semilla hasta la botella : siembra, cosecha, cuece en el horno "
      "de tierra, deja fermentar, destila. El maestro mezcalero Gilberto "
      "Vasquez firma cada lote. Un lote agotado sigue publicado, agotado y "
      "fechado, con su año, su parcela y el numero de botellas tiradas. ¿ Y si "
      "la planta no da este año ? El registro lo dice : decide la planta.")

EN = ("The mezcal comes from Villa Sola de Vega, in Oaxaca. The house follows "
      "the plant from the seed to the bottle : it sows, it harvests, it cooks "
      "in the earth oven, it lets the must ferment, it distils. The maestro "
      "mezcalero Gilberto Vasquez signs every lot. A sold out lot stays on the "
      "page, sold out and dated, with its year, its plot and the number of "
      "bottles drawn. If the plant gives nothing this year, the register says "
      "so : the plant decides, and the price only goes up.")

FAITS = [
    ("Agave", "Agave potatorum, tobalá"),
    ("Catégorie", "Mezcal artesanal, joven"),
    ("Degré", "50 %"),
    ("Village", "Villa Sola de Vega, Oaxaca"),
    ("Maestro", "Gilberto Vasquez"),
    ("Contenant", "700 ml"),
    ("Lot", "N° 12 / 300, 2026, 140 €"),
]

JEUX = [
    ("Capitales", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    ("Bas de casse", "abcdefghijklmnopqrstuvwxyz"),
    ("Chiffres", "0123456789"),
    ("Ponctuation", ". , : ; ’ ‘ “ ” « » - – ! ¡ ? ¿ ( ) / · & % ° º €"),
    ("Accents français", "à â ä é è ê ë î ï ô ö ù û ü ç"),
    ("Accents espagnols", "á í ó ú ñ ü ¿ ¡"),
    ("Capitales accentuées", "À Â Ä É È Ê Ë Î Ï Ô Ö Ù Û Ü Ç Á Í Ó Ú Ñ"),
]

ECHELLE = [
    ("--t-h1", 72, "Le registre des lots"),
    ("--t-phrase", 46, "La plante decide"),
    ("--t-h2", 38, "El palenque, cinq stations"),
    ("--t-h3", 24, "Villa Sola de Vega, Oaxaca"),
    ("--t-lead", 22, "Le chapo, sous le titre de page, quarante six signes"),
    ("--t-base", 17, "Le texte courant : la maison documente, archive et alloue."),
    ("--t-petit", 13, "MEZCAL ARTESANAL, JOVEN, 50 %, 700 ML"),
    ("--t-micro", 11, "AGAVE POTATORUM, LOT N° 12 / 300, 2026"),
]


def gab():
    tolo, legi = lire_sceau()
    ds = [p['d'] for p in tolo] + [p['d'] for p in legi]
    x0, y0, x1, y1 = bbox(ds)
    sceau_paths = ''.join('<path d="%s"/>' % d for d in ds)
    sceau_vb = '%.1f %.1f %.1f %.1f' % (x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12)
    sceau_ratio = (y1 - y0 + 12) / (x1 - x0 + 12)

    meta = dict(M)
    meta['nom'] = "Ivresse Texte"
    donnees = json.dumps({'meta': meta,
                          'glyphes': {c: {'d': g['d'], 'adv': g['adv']}
                                      for c, g in R.items()}},
                         ensure_ascii=False, separators=(',', ':'), sort_keys=True)

    jeux = json.dumps(JEUX, ensure_ascii=False)
    faits = json.dumps(FAITS, ensure_ascii=False)
    echelle = json.dumps(ECHELLE, ensure_ascii=False)
    textes = json.dumps({'fr': FR, 'es': ES, 'en': EN}, ensure_ascii=False)

    m = M
    return TEMPLATE.format(
        donnees=donnees, jeux=jeux, faits=faits, echelle=echelle, textes=textes,
        sceau_paths=sceau_paths, sceau_vb=sceau_vb,
        sceau_pct='%.4f' % (sceau_ratio * 100),
        nsignes=len(R),
        upm=m['upm'], cap=m['cap'], xh=m['xh'], asc=m['asc'], desc=m['desc'],
        fig=m['fig'], espace=m['espace'],
        stem_u=m['stem_u'], thin_u=m['thin_u'], stem_l=m['stem_l'],
        thin_l=m['thin_l'], hair=m['hair'],
        xh_pct='%.3f' % (m['xh'] / float(m['cap'])),
        contraste='%.2f' % (m['stem_l'] / float(m['hair'])),
        graisse='%.3f' % (m['stem_u'] / float(m['cap'])),
    )


TEMPLATE = r"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ivresse Texte. Epreuve du caractere de labeur</title>
<style>
  :root {{
    --encre:#2B2118; --papier:#FEF9F3; --creme:#F5F0DC; --etiquette:#FED5A3;
    --brique:#A63D24; --brun:#4E3524; --filet:#ECEAE5; --olive:#8F9035;
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--papier); color:var(--encre);
    font:15px/1.6 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif; }}
  .boite {{ max-width:1180px; margin:0 auto; padding:0 8vw; }}
  section {{ padding:76px 0; border-top:1px solid var(--filet); }}
  section:first-of-type {{ border-top:0; }}
  h2 {{ font:13px/1.5 Rockwell,Clarendon,"Roboto Slab",Georgia,serif;
    letter-spacing:.2em; text-transform:uppercase; color:var(--brique);
    margin:0 0 26px; font-weight:normal; }}
  h3 {{ font:11px/1.5 Rockwell,Clarendon,"Roboto Slab",Georgia,serif;
    letter-spacing:.2em; text-transform:uppercase; color:var(--brun);
    margin:0 0 8px; font-weight:normal; }}
  p.note {{ max-width:62ch; color:var(--brun); font-size:14px; margin:0 0 22px; }}
  svg {{ display:block; max-width:100%; height:auto; overflow:visible; }}
  .rang {{ margin:0 0 30px; }}
  .duo {{ display:grid; grid-template-columns:1fr 1fr; gap:44px; }}
  .trio {{ display:grid; grid-template-columns:1fr; gap:40px; }}
  table {{ border-collapse:collapse; width:100%; max-width:640px; }}
  td, th {{ text-align:left; padding:9px 14px 9px 0; vertical-align:baseline;
    border-bottom:1px solid var(--filet); font-size:14px; }}
  th {{ font:11px/1.5 Rockwell,Clarendon,Georgia,serif; letter-spacing:.2em;
    text-transform:uppercase; color:var(--brique); font-weight:normal; }}
  .ech td {{ border-bottom:1px solid var(--filet); }}
  .ech td:first-child {{ width:110px; color:var(--brun);
    font:11px Rockwell,Clarendon,Georgia,serif; letter-spacing:.14em;
    text-transform:uppercase; }}
  .geo {{ font:17px/1.55 Georgia,serif; width:62ch; max-width:100%; }}
  @font-face {{ font-family:"Ivresse Texte";
    src:url("IvresseTexte-Regular.woff2") format("woff2"),
        url("IvresseTexte-Regular.otf") format("opentype");
    font-display:swap; }}
  .vraie {{ font-family:"Ivresse Texte","Courier New",monospace; }}
  .cadre {{ background:var(--creme); padding:34px 30px; }}
  .cadre--etiq {{ background:var(--etiquette); }}
  .grille {{ display:flex; flex-wrap:wrap; gap:4px 4px; }}
  .case {{ width:64px; height:78px; border:1px solid var(--filet);
    display:flex; align-items:flex-end; justify-content:center;
    background:#fff; }}
  .lg {{ color:var(--brun); font-size:11px; letter-spacing:.14em;
    text-transform:uppercase; margin:0 0 6px; }}
  @media (max-width:860px) {{
    .boite {{ padding:0 22px; }}
    .duo {{ grid-template-columns:1fr; }}
    section {{ padding:52px 0; }}
  }}
</style>
</head>
<body>

<section>
  <div class="boite">
    <h2>Ivresse d’Amour, Toloache Legitimo. Le caractere de labeur</h2>

    <!-- LE TEST : le sceau de la famille, puis le caractere de texte dessous -->
    <div style="margin:8px 0 6px">
      <div class="lg">Les lettres de la famille, vectorisees depuis logo.js. Ce sont les siennes, pas une imitation.</div>
      <svg viewBox="{sceau_vb}" style="width:100%;max-width:760px" fill="#2B2118">{sceau_paths}</svg>
    </div>
    <div style="margin:22px 0 0" id="sous-sceau"></div>
    <p class="note" style="margin-top:26px">
      Deux caracteres, une maison, deux metiers. Le sceau est une egyptienne de
      bois : graisse 0.225 de la capitale, empattements en dalle, contour
      tremblant. Ivresse Texte est lineale, d’une seule graisse, coupee a plat,
      graisse {graisse} de la capitale. Ce qu’ils ont en commun n’est aucun
      ornement : c’est la charpente. Rondes presque circulaires, carrees
      etroites, sommet plat du A, traverse basse du A, V central du M arrete a
      mi hauteur, barre droite du G, contre plus carre que le dehors.
    </p>
  </div>
</section>

<section>
  <div class="boite">
    <h2>Le jeu complet, {nsignes} signes</h2>
    <div id="jeux"></div>
  </div>
</section>

<section>
  <div class="boite">
    <h2>Signe par signe</h2>
    <div class="grille" id="grille"></div>
  </div>
</section>

<section>
  <div class="boite">
    <h2>L’echelle du contrat visuel</h2>
    <table class="ech"><tbody id="echelle"></tbody></table>
  </div>
</section>

<section>
  <div class="boite">
    <h2>Texte courant, 17 px, 62 signes par ligne</h2>
    <p class="note">La mesure reelle du site. Trois langues, meme corps, meme
      interligne 1.55.</p>
    <div class="trio">
      <div><h3>Français</h3><div id="p-fr"></div></div>
      <div><h3>Español</h3><div id="p-es"></div></div>
      <div><h3>English</h3><div id="p-en"></div></div>
    </div>
  </div>
</section>

<section>
  <div class="boite">
    <h2>Contre epreuve : Ivresse Texte et Georgia, meme corps, meme mesure</h2>
    <p class="note">Georgia est la pile de secours que ce caractere remplace.
      Le bloc de gris doit etre plus clair a gauche : c’est la consigne.</p>
    <div><h3>Ivresse Texte 17 px</h3><div id="cmp-nous"></div></div>
    <div style="height:34px"></div>
    <div><h3>Georgia 17 px</h3><div class="geo">{{GEO}}</div></div>
  </div>
</section>

<section>
  <div class="boite">
    <h2>La table de faits</h2>
    <p class="note">Ce que porte l’etiquette. Chiffres tabulaires : une colonne
      de lots s’aligne toute seule.</p>
    <div class="cadre cadre--etiq" style="max-width:660px">
      <div id="faits"></div>
    </div>
  </div>
</section>

<section>
  <div class="boite">
    <h2>Les chiffres du site</h2>
    <div id="chiffres"></div>
    <div style="margin-top:26px" id="colonne"></div>
  </div>
</section>

<section>
  <div class="boite">
    <h2>La fonte compilee</h2>
    <p class="note">Tout le reste de cette page est dessine en SVG, donc juste
      partout et sans dependance. Ce bloc ci, lui, appelle le fichier
      <code>IvresseTexte-Regular.woff2</code> pose a cote : s'il s'affiche dans
      le caractere de la maison, c'est que build_font.py a produit une fonte
      qui marche. S'il s'affiche en Courier, le fichier n'est pas la.</p>
    <div class="vraie" style="font-size:34px;line-height:1.25">
      ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>
      0123456789 50 % 700 ml 140 € N° 12 / 300
    </div>
    <p class="vraie" style="font-size:17px;line-height:1.55;width:62ch;max-width:100%">{{GEO}}</p>
  </div>
</section>

<section>
  <div class="boite">
    <h2>Les mesures</h2>
    <table>
      <tr><th>Mesure</th><th>Valeur</th><th>Note</th></tr>
      <tr><td>Cadratin</td><td>{upm}</td><td>unites par em</td></tr>
      <tr><td>Capitale</td><td>{cap}</td><td></td></tr>
      <tr><td>Hauteur d’x</td><td>{xh}</td><td>{xh_pct} de la capitale</td></tr>
      <tr><td>Ascendante</td><td>{asc}</td><td>a peine au dessus de la capitale</td></tr>
      <tr><td>Descendante</td><td>{desc}</td><td></td></tr>
      <tr><td>Chiffres</td><td>{fig}</td><td>alignes, tabulaires, chasse 556</td></tr>
      <tr><td>Fut, capitale</td><td>{stem_u}</td><td>{graisse} de la capitale. Le sceau : 0.225</td></tr>
      <tr><td>Fut, bas de casse</td><td>{stem_l}</td><td></td></tr>
      <tr><td>Horizontales</td><td>{thin_l}</td><td>allegement optique seulement</td></tr>
      <tr><td>Jonctions, rondes</td><td>{hair}</td><td>contraste {contraste}</td></tr>
      <tr><td>Blanc de mot</td><td>{espace}</td><td>0.268 cadratin</td></tr>
    </table>
  </div>
</section>

<script>
var ALPHABET_TEXTE = {donnees};
var JEUX = {jeux}, FAITS = {faits}, ECHELLE = {echelle}, TEXTES = {textes};

(function () {{
  var upm = ALPHABET_TEXTE.meta.upm;

  function G(c) {{ return ALPHABET_TEXTE.glyphes[c] || ALPHABET_TEXTE.glyphes[' ']; }}

  function largeurU(t, lettrage) {{
    var w = 0;
    for (var i = 0; i < t.length; i++) {{ w += G(t[i]).adv + (lettrage || 0) * upm; }}
    return w;
  }}

  function poser(t, taille, lettrage) {{
    var s = taille / upm, x = 0, out = [];
    for (var i = 0; i < t.length; i++) {{
      var g = G(t[i]);
      if (g.d) {{
        out.push('<path transform="translate(' + x.toFixed(2) + ' 0) scale(' +
                 s.toFixed(6) + ' ' + (-s).toFixed(6) + ')" d="' + g.d + '"/>');
      }}
      x += (g.adv + (lettrage || 0) * upm) * s;
    }}
    return {{svg: out.join(''), w: x}};
  }}

  /* une ligne, dans un svg a sa mesure */
  function ligne(t, taille, lettrage, couleur) {{
    var p = poser(t, taille, lettrage || 0);
    var h = (ALPHABET_TEXTE.meta.asc - ALPHABET_TEXTE.meta.desc) * taille / upm;
    var haut = ALPHABET_TEXTE.meta.asc * taille / upm;
    return '<svg viewBox="0 ' + (-haut).toFixed(2) + ' ' + Math.max(p.w, 1).toFixed(2) +
      ' ' + h.toFixed(2) + '" width="' + p.w.toFixed(2) + '" height="' + h.toFixed(2) +
      '" fill="' + (couleur || '#2B2118') + '">' + p.svg + '</svg>';
  }}

  function couper(texte, taille, mesure, lettrage) {{
    var mots = String(texte).split(' '), maxU = mesure * upm / taille;
    var espU = G(' ').adv + (lettrage || 0) * upm;
    var out = [], cur = '', curW = 0;
    for (var i = 0; i < mots.length; i++) {{
      var w = largeurU(mots[i], lettrage);
      if (cur && curW + espU + w > maxU) {{ out.push(cur); cur = mots[i]; curW = w; }}
      else {{ curW += cur ? espU + w : w; cur = cur ? cur + ' ' + mots[i] : mots[i]; }}
    }}
    if (cur) {{ out.push(cur); }}
    return out;
  }}

  function paragraphe(texte, taille, mesure, interligne) {{
    var lg = couper(texte, taille, mesure, 0), s = taille / upm;
    var lh = taille * (interligne || 1.55);
    var out = [], y = taille * 0.80;
    for (var li = 0; li < lg.length; li++) {{
      var x = 0, t = lg[li];
      for (var i = 0; i < t.length; i++) {{
        var g = G(t[i]);
        if (g.d) {{
          out.push('<path transform="translate(' + x.toFixed(2) + ' ' + y.toFixed(2) +
                   ') scale(' + s.toFixed(6) + ' ' + (-s).toFixed(6) + ')" d="' + g.d + '"/>');
        }}
        x += g.adv * s;
      }}
      y += lh;
    }}
    var H = y - lh + taille * 0.42;
    return '<svg viewBox="0 0 ' + mesure.toFixed(1) + ' ' + H.toFixed(1) +
      '" width="' + mesure.toFixed(1) + '" height="' + H.toFixed(1) +
      '" fill="#2B2118">' + out.join('') + '</svg>';
  }}

  /* la mesure du site : 62 fois la chasse du zero */
  var MESURE = 62 * G('0').adv * 17 / upm;

  document.getElementById('sous-sceau').innerHTML =
    '<div class="lg">Ivresse Texte, le caractere de labeur, dessous</div>' +
    ligne('Toloache Legitimo', 46) +
    '<div style="height:12px"></div>' +
    ligne('Villa Sola de Vega, Oaxaca. Mezcal artesanal, 50 %, 700 ml, 140 €.', 17);

  var h = '';
  for (var i = 0; i < JEUX.length; i++) {{
    h += '<div class="rang"><div class="lg">' + JEUX[i][0] + '</div>' +
         ligne(JEUX[i][1], JEUX[i][1].length > 40 ? 30 : 40) + '</div>';
  }}
  document.getElementById('jeux').innerHTML = h;

  var tous = Object.keys(ALPHABET_TEXTE.glyphes).filter(function (c) {{
    return ALPHABET_TEXTE.glyphes[c].d;
  }}).sort();
  h = '';
  for (i = 0; i < tous.length; i++) {{
    h += '<div class="case">' + ligne(tous[i], 42) + '</div>';
  }}
  document.getElementById('grille').innerHTML = h;

  h = '';
  for (i = 0; i < ECHELLE.length; i++) {{
    h += '<tr><td>' + ECHELLE[i][0] + '<br>' + ECHELLE[i][1] + ' px</td><td>' +
         ligne(ECHELLE[i][2], ECHELLE[i][1], ECHELLE[i][1] <= 13 ? 0.16 : 0) +
         '</td></tr>';
  }}
  document.getElementById('echelle').innerHTML = h;

  document.getElementById('p-fr').innerHTML = paragraphe(TEXTES.fr, 17, MESURE);
  document.getElementById('p-es').innerHTML = paragraphe(TEXTES.es, 17, MESURE);
  document.getElementById('p-en').innerHTML = paragraphe(TEXTES.en, 17, MESURE);
  document.getElementById('cmp-nous').innerHTML = paragraphe(TEXTES.fr, 17, MESURE);

  h = '';
  for (i = 0; i < FAITS.length; i++) {{
    h += '<div style="display:flex;gap:20px;align-items:baseline;padding:7px 0;' +
         (i ? 'border-top:1px solid rgba(43,33,24,.16)' : '') + '">' +
         '<div style="width:190px;flex:none">' + ligne(FAITS[i][0].toUpperCase(), 11, 0.2, '#A63D24') + '</div>' +
         '<div>' + ligne(FAITS[i][1], 17) + '</div></div>';
  }}
  document.getElementById('faits').innerHTML = h;

  document.getElementById('chiffres').innerHTML =
    ligne('0123456789', 60) + '<div style="height:14px"></div>' +
    ligne('50 % 700 ml 140 € N° 12 / 300 2026', 30) +
    '<div style="height:10px"></div>' +
    ligne('50 % 700 ml 140 € N° 12 / 300 2026', 17);

  var lots = ['N° 004 / 300', 'N° 012 / 300', 'N° 117 / 300', 'N° 298 / 300'];
  h = '<div class="lg">Chasse tabulaire : la colonne s’aligne sans reglage</div>';
  for (i = 0; i < lots.length; i++) {{ h += ligne(lots[i], 20) + '<div style="height:5px"></div>'; }}
  document.getElementById('colonne').innerHTML = h;
}}());
</script>
</body>
</html>
"""


def main():
    nb = ecrire_js()
    html = gab().replace('{GEO}', FR)
    open(os.path.join(ICI, 'SPECIMEN.html'), 'w', encoding='utf-8').write(html)
    print('alphabet_texte.js : %d signes' % nb)
    print('SPECIMEN.html     : ecrit')


if __name__ == '__main__':
    main()
