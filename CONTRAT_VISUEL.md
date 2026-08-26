# CONTRAT VISUEL

**Ivresse d'Amour, Toloache Legitimo. Villa Sola de Vega, Oaxaca.**
Direction artistique du site. Version du 16 août 2026.

Ce document est la loi, pas une inspiration. Une page qui s'en écarte est refusée et refaite.
Il ne contient aucune valeur inventée : tout vient de la structure envoyée au client le 3 août 2026,
du cahier de style des emblèmes, du brief des emblèmes, de la page La Historia déjà construite, et
du sceau dessiné par la famille.

Trois fichiers appliquent ce contrat, un constructeur ne réécrit aucun des trois :

| fichier | rôle |
|---|---|
| `assets/css/site.css` | la feuille unique. Toute page la charge, aucune page n'écrit de `<style>`. |
| `assets/js/site.js` | la porte d'âge, l'entête, le menu, la langue, le pied de page, le mouvement. |
| `GABARIT.html` | la page de référence. On la copie, on efface ce dont on n'a pas besoin, on remplit. |

`la-historia.html` est une page à part, déjà construite, autonome, avec son propre monde de papier.
**Elle ne se réécrit pas et elle ne sert pas de modèle.** Le modèle est `GABARIT.html`.

---

## 1. LE CONTRAT HTML

Une page contient ceci, et rien de plus. L'entête, le menu et le pied de page sont posés par
`site.js` : les recopier dans une page les ferait diverger d'une page à l'autre.

```html
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>El Mito. Ivresse d'Amour, Toloache Legitimo</title>
  <link rel="stylesheet" href="assets/css/site.css">
  <script src="assets/js/logo.js"></script>
  <script src="assets/js/sceau_anime.js"></script>
  <script src="assets/js/emblemes.js"></script>
  <script src="assets/js/site.js"></script>
</head>
<body data-page="mito"
      data-titre-fr="El Mito. Ivresse d'Amour, Toloache Legitimo"
      data-titre-es="El Mito. Ivresse d'Amour, Toloache Legitimo">

  <main class="page">
    <!-- les sections de la page, prises dans la liste du chapitre 7 -->
  </main>

  <script>siteChrome.init();</script>
</body>
</html>
```

`data-page` vaut exactement l'une de ces sept valeurs, elle marque l'entrée courante du menu :

| data-page | fichier | emblème |
|---|---|---|
| `botella` | `index.html` | `botella`, dessiné |
| `historia` | `la-historia.html` | **manquant** |
| `palenque` | `el-palenque.html` | `palenque`, dessiné |
| `mito` | `el-mito.html` | `mito`, dessiné |
| `registro` | `el-registro.html` | `registro`, dessiné |
| `ritual` | `el-ritual.html` | `ritual`, dessiné |
| `eventos` | `eventos.html` | `eventos`, **provisoire** |

Chemins relatifs uniquement. Tout doit s'ouvrir en double cliquant le fichier, depuis `file://`,
sans serveur, sans étape de fabrication, sans CDN, sans framework.

### La convention des deux langues

Le site est bilingue français et espagnol, à poids égal. Une page livrée dans une seule langue
est refusée.

**(a) Texte simple, le cas de 95 % des copies.** L'élément est vide dans le fichier, `site.js`
écrit son contenu.

```html
<p data-fr="Le texte français." data-es="El texto español."></p>
```

Marche sur n'importe quelle balise : `h1`, `h2`, `p`, `span`, `a`, `li`, `dt`, `dd`, `figcaption`.

**(b) Contenu riche** (un paragraphe qui contient un lien, une liste, un bloc entier). Les deux
versions existent dans le fichier, `site.js` affiche celle de la langue active.

```html
<div data-lang="fr"><p>Un texte avec un <a class="lien" href="...">lien</a>.</p></div>
<div data-lang="es"><p>Un texto con un <a class="lien" href="...">enlace</a>.</p></div>
```

**(c) Titre du document** : `data-titre-fr` et `data-titre-es` sur `<body>`.

**(d) Attribut** (le `alt` d'une image, un `aria-label`) : `data-fr-alt` et `data-es-alt`.
Le motif général est `data-<langue>-<attribut>`.

La langue est retenue dans `localStorage` sous `ida.lang`. Au premier passage, la langue du
navigateur décide : espagnol si le navigateur est espagnol, français sinon.
L'anglais est demandé par la famille (appel du 27 juillet, lignes 1344 à 1372) mais **n'est pas
dans ce contrat** : les copies anglaises n'existent pas encore. Le mécanisme est prêt à le
recevoir, la décision d'ouvrir la troisième langue n'est pas la nôtre.

### Ce que `site.js` expose

```js
siteChrome.init()                  // à appeler une fois, en fin de <body>
siteChrome.langue()                // 'fr' ou 'es'
siteChrome.changerLangue('es')
siteChrome.appliquerLangue('fr', racine)   // après avoir injecté du HTML soi-même
siteChrome.embleme('mito')         // la chaîne <svg>, ou null si l'emblème n'existe pas
siteChrome.menu                    // les sept entrées
```

---

## 2. LA PALETTE

Une encre, des papiers, quatre couleurs de dessin, cinq accents. Chaque couleur a un métier.
Une couleur employée hors de son métier fait refuser la page.

| variable | hex | nom | métier |
|---|---|---|---|
| `--encre` | `#2B2118` | encre | **la seule encre du site.** Tout le texte, le sceau, tous les emblèmes. |
| `--papier` | `#FEF9F3` | papier | le fond par défaut de toute page. |
| `--creme` | `#F5F0DC` | crème codex | second fond calme : pied de page, section en retrait. |
| `--papier-olive` | `#C9C48D` | papier olive | fond d'une section, **une seule par page**. |
| `--olive-scroll` | `#ADAD70` | olive de La Historia | le fond de `la-historia.html` **et de nulle part ailleurs**. |
| `--etiquette` | `#FED5A3` | papier étiquette | le papier relevé au pixel sur l'étiquette réelle. Fiche de lot, table de faits. |
| `--vert-agave` | `#A2A768` | vert agave | la plante dans les illustrations. |
| `--olive-etiquette` | `#8F9035` | olive étiquette | l'olive relevée sur l'étiquette. La fleur, l'accent végétal. |
| `--vert-etiquette` | `#58705A` | vert étiquette | l'état d'un lot : ouvert. |
| `--ocre` | `#D89A2E` | ocre soleil | le soleil, le médaillon de cuivre. Illustration seulement. |
| `--brique` | `#A63D24` | rouge brique | le rouge de la maison : clé de champ, page courante, numéro de station, l'éclair. **Jamais une grande surface.** |
| `--brun` | `#4E3524` | brun terre | texte secondaire, capitales espacées, filet d'un lien. |
| `--filet` | `#ECEAE5` | filet | tous les filets, et rien d'autre. |
| `--turquesa` | `#40E0D0` | turquesa | accent vif de la maison, ajouté par Raouf le 16 août. |
| `--rosa` | `#E4007C` | rosa mexicano | accent vif de la maison, ajouté par Raouf le 16 août. |

**La règle des deux accents vifs.** Turquesa et rosa mexicano sont des accents, pas des couleurs
de page. **Un seul des deux par écran, jamais les deux ensemble, jamais un fond, jamais sur le
sceau, jamais dans le dessin d'un emblème.** Un filet, un mot, un état, une surface de moins de
5 % de l'écran. `#D1217C` est la référence d'impression du rosa, elle ne sert pas à l'écran.

**Pas de mode sombre.** Jamais, sur aucune page, sous aucun réglage. Cette règle vient du dossier
et ne se discute pas.

---

## 3. LA TYPOGRAPHIE

### Les deux familles

```css
--serif: "Iowan Old Style","Palatino Linotype","Book Antiqua",Palatino,Georgia,serif;
--slab:  Rockwell,Clarendon,"Roboto Slab",Georgia,serif;
```

Le serif porte les titres et le texte courant. C'est la pile de `la-historia.html`, elle est
**provisoire** : la famille a demandé un serif proche de celui de la bouteille et du restaurant,
achetable 20 à 30 euros (appel du 27 juillet, lignes 1377 à 1470). Quand il sera acheté, une seule
variable change et tout le site suit. Ne posez aucune police ailleurs.

Le slab porte les capitales : c'est la lettre du sceau. Kicker, menu, clé de champ, numéro de
station, pied de page, mention légale. **Le slab n'écrit jamais une phrase**, seulement des
capitales courtes.

### L'échelle

| variable | taille | emploi | interlettrage | casse |
|---|---|---|---|---|
| `--t-h1` | `clamp(34px, 5.2vw, 72px)` | le titre de page, un seul | `.02em` | normale |
| `--t-phrase` | `clamp(24px, 3.4vw, 46px)` | le bloc d'une seule phrase | `.02em` | normale |
| `--t-h2` | `clamp(26px, 2.6vw, 38px)` | titre de section | `.02em` | normale |
| `--t-h3` | `clamp(19px, 1.6vw, 24px)` | sous titre | `.02em` | normale |
| `--t-lead` | `clamp(19px, 1.5vw, 22px)` | le chapô, sous le titre de page | 0 | normale |
| `--t-base` | `17px` (16px sous 860) | texte courant, interligne 1.55 | 0 | normale |
| `--t-petit` | `13px` | kicker, menu, pied de page | `.14em` à `.2em` | **capitales** |
| `--t-micro` | `11px` | clé de champ, légende, mention légale | `.2em` | **capitales** |

`--t-h1` est relevé sur `la-historia.html`, `--t-base` et la mesure sur le cahier de style.

### Les capitales

Les capitales sont **toujours** en slab, **toujours** interlettrées, **jamais** en dessous de
`.14em`, **jamais** au dessus de `.2em`, **jamais** au delà de quatre mots.
Une phrase en capitales est refusée. Un titre en capitales est refusé.

### La longueur de ligne

| bloc | mesure |
|---|---|
| texte courant | **62 ch** (`--mesure`) |
| plafond absolu, hérité du cahier | **70 ch** (`--mesure-max`), jamais dépassé |
| chapô | 46 ch |
| bloc d'une seule phrase | **26 ch** (`--mesure-phrase`) |
| citation | 30 ch |

Un paragraphe qui traverse toute la largeur de l'écran est refusé.

---

## 4. LA GRILLE, LES MARGES, LE RYTHME

| variable | valeur bureau | valeur téléphone | rôle |
|---|---|---|---|
| `--largeur` | `1180px` | `1180px` | la boîte de contenu, centrée |
| `--marge` | `8vw` | `22px` (18px sous 560) | la marge latérale de toute section |
| `--u` | `8px` | `8px` | l'unité verticale, **tout est un multiple de 8** |
| `--section` | `96px` | `56px` | haut et bas de chaque section |
| `--tete-h` | `124px` | `60px` | la hauteur de l'entête |

Toute section est `padding: var(--section) var(--marge)` et contient une `.boite`
(`max-width:1180px; margin:0 auto`). À 1440 px, le texte commence donc à 130 px du bord, et le
menu commence exactement au même endroit. **Rien ne s'aligne à la main.**

Deux ruptures, pas trois :

- **860 px** : la rupture principale, valeur de la structure envoyée au client. Le menu devient un
  panneau, les grilles passent à une colonne, l'entête retombe à 60 px.
- **560 px** : petit téléphone. La marge tombe à 18 px et l'entête ne porte plus qu'un nom.

Le site doit être vérifié à **1440** et à **390** de large. Ces deux largeurs sont les deux
vérités. Le reste doit se comporter, mais c'est là qu'on juge.

---

## 5. LE MOUVEMENT

Le devis dit la loi en une ligne : *fondus, parallaxe légère, rien qui rebondit. Le calme est le
style.* Voici ce que cela veut dire, en valeurs.

### Une seule courbe pour tout le site

```css
--courbe: cubic-bezier(.2,.7,.2,1);   /* toute translation, toute échelle */
--lineaire: linear;                   /* tout fondu d'opacité pur */
```

### Quatre durées, toutes nommées

| variable | durée | emploi |
|---|---|---|
| `--t-court` | `180ms` | un état discret : un filet de lien, un souligné |
| `--t-menu` | `280ms` | **le mot devient l'emblème.** Valeur du cahier de style, une seule pour tout le site |
| `--t-long` | `520ms` | l'apparition d'un bloc au défilement |
| le sceau | `3100ms`, maintien à `2900ms` | l'animation retenue par Raouf, `sceauAnime`. Une fois, à la porte d'âge, jamais ailleurs |

### Autorisé

1. **Le fondu à l'apparition.** Classe `.fondu` sur un bloc, `site.js` ajoute `.est-vu` quand il
   entre dans l'écran. Opacité 0 vers 1, translation de 14 px vers le haut. Une fois, jamais rejoué.
2. **La parallaxe légère.** `data-parallaxe="40"` sur un élément. Le chiffre est le déplacement
   maximal en pixels, **plafonné à 60**. Au delà, `site.js` ramène à 60.
3. **L'animation du sceau**, une fois, à la porte d'âge.
4. **L'échange du menu**, le mot contre l'emblème, 280 ms, sans que rien d'autre ne bouge.
5. **Une animation propre à un emblème** (l'éclair du mito qui frappe, par exemple) si Raouf l'a
   validée pour cet emblème. Jamais en boucle, jamais au chargement, seulement au survol ou à
   l'entrée dans l'écran.

### Interdit

Rebond, ressort, dépassement d'échelle, élasticité. Rotation gratuite. Défilement détourné.
Curseur personnalisé. Compteur qui monte. Machine à écrire. Marquee. Carrousel automatique.
Vidéo qui démarre avec du son. Apparition lettre par lettre. Ombre portée sur du texte.
Dégradé animé. Tout mouvement qui attire l'attention sur lui même plutôt que sur ce qu'il montre.

`prefers-reduced-motion: reduce` coupe tout : la feuille ramène les transitions à 1 ms et
`site.js` désactive fondu, parallaxe et animation du sceau. Ce n'est pas une option.

---

## 6. LE TON

**La maison documente, archive et alloue. Elle ne vend pas dans ses pages de récit, et elle ne
solde jamais.** C'est la phrase de la structure envoyée au client, et elle gouverne chaque mot.

- Le prix ne fait que monter. Un lot épuisé reste affiché, épuisé et daté. **Jamais un prix barré,
  jamais une promotion, jamais un compte à rebours, jamais une rareté fabriquée.** Si la plante ne
  donne pas, le registre le dit : la plante décide.
- **Point ouvert, ne le tranchez pas dans une page.** La famille a fermé le principe d'une vente
  directe sur le site (appel du 27 juillet, lignes 74 à 78) et a demandé une boutique. La vente,
  quand elle arrivera, vit dans ses propres pages. **Elle n'entre jamais dans une page de récit.**
  Le code de réduction de 20 % gagné aux jeux est un désaccord de fond non tranché par Raouf : un
  constructeur de page ne l'implémente pas et ne l'évoque pas.
- Les faits avant les adjectifs. Tout ce qui est affirmé est lisible quelque part : sur l'étiquette,
  sur le registre, dans le lot. Un adjectif que le lecteur ne peut pas vérifier se supprime.
- **Pas de tiret cadratin.** Nulle part, dans aucune langue, dans aucun fichier, ni dans le code,
  ni dans les commentaires, ni dans la copie.
- Pas de formule « ce n'est pas X, c'est Y ». Pas de conclusion triomphante. Pas de mot prétentieux.
- Culturellement proche du Mexique, jamais le cliché. **Interdits absolus, en image comme en mot :**
  sombrero, cactus, coucher de soleil, calavera, piment, maracas, papel picado, mariachi, Frida,
  le registre du ver, l'indigénéité inventée, la fête mexicaine.
- Le mythe se raconte en gardienne, pas en propriétaire. **Jamais « la légende aztèque dit ».**
  La légende raconte l'éclair, l'étymologie raconte le four. **Les deux ne se mélangent jamais.**
- L'espagnol est une langue de la marque, pas une garniture exotique.

---

## 7. LES BLOCS AUTORISÉS

Un constructeur n'invente pas de bloc. Il prend dans cette liste, elle est dans `GABARIT.html`
avec un exemplaire de chacun.

| classe | ce que c'est | règle |
|---|---|---|
| `.entete-page` | kicker, `h1`, chapô | **une seule par page**, tout en haut |
| `.bloc-image` `.bloc-image--haut` | image pleine largeur, 72 vh au bureau, 56 vh au téléphone | **aucun texte sur l'image**, jamais |
| `.legende` | la légende sous une image | capitales micro, brun |
| `.bloc-phrase` | une seule phrase, centrée | 26 ch, **une seule phrase**, jamais deux |
| `.colonne` | colonne de texte | 62 ch |
| `.colonnes-2` | deux colonnes | **jamais trois** |
| `.avec-cote` `.avec-cote__cote` | colonne latérale collante plus texte | le modèle de la structure client |
| `.faits` `.faits__l` `.faits__k` `.faits__v` | la table de faits, ce que porte l'étiquette | clé en slab brique, valeur en encre |
| `.faits--etiquette` | la même, posée sur le papier de l'étiquette | pour une fiche de lot |
| `.procede` `.procede__e/__n/__t/__d` | le procédé numéroté | **cinq stations au maximum**, elles sont nommées |
| `.citation` | le dicho, la devise | **pas de guillemets dessinés** |
| `.lien` | un lien dans le texte | filet brun, brique au survol |
| `.lien-discret` | le lien de fin de page | **la maison n'a pas de bouton** |
| `.embleme` | un emblème posé dans la page | `data-embleme="mito"` |
| `.etat` `.etat--ouvert` `.etat--epuise` | l'état d'un lot | vert étiquette ou brun |
| `.section--creme` `.section--olive` `.section--etiquette` | une section sur un autre papier | **une seule par page, jamais deux de suite** |
| `.fondu` | le bloc apparaît au défilement | voir chapitre 5 |
| `.kicker` `.chapo` `.mention` `.mesure` `.centre` | les utilitaires de texte | |

**Un bloc absent de cette liste se demande, il ne s'invente pas.**

---

## 8. LES EMBLÈMES

Le sceau est l'oeuvre de la famille. On s'y soumet. Les emblèmes sont dessinés dans sa langue
exacte : une encre `#2B2118`, des pleins découpés au pochoir, aucun contour, aucun dégradé,
aucune ombre, aucun trait fin isolé, les blancs sont des découpes. Aucun texte dans un emblème.
Aucune couleur dans un emblème.

### Les six qui existent

`botella`, `mito`, `palenque`, `registro`, `ritual`, `eventos`.
Ils sont dans `assets/js/emblemes.js`, chacun exposé comme `window.embleme_<nom>({color})` et
renvoyant la chaîne SVG interne d'un `viewBox="-120 -120 240 240"`.

`eventos` est **provisoire**. Il n'a pas le mot final de Raouf, il peut changer. Ne construisez
rien qui en dépende visuellement.

### Les quatre qui n'existent pas

**`historia`, `espadin`, `tobala`, `coyote` ne sont pas dessinés.**

### Ce qu'une page fait quand son emblème manque

**Elle montre le mot, seul.** Rien d'autre.

Pas de point d'interrogation, pas de carré, pas de rond, pas de sceau à la place, pas d'emblème
d'une autre page, pas d'icône trouvée ailleurs, pas de silhouette dessinée à la va vite dans le
code. `site.js` applique déjà cette règle dans le menu : `La Historia` n'a pas de marqueur
`data-a-embleme`, son mot reste au survol, et sur téléphone sa case d'emblème reste vide pour que
les mots restent alignés. Une case vide n'est pas une icône de remplacement.

### La taille d'un emblème

Les six emblèmes n'ont pas la même étendue d'encre dans leur disque : la bouteille fait 90 sur 196,
le ticket du registre fait 180 sur 104. Posés tels quels, l'un écrase l'autre. `site.js` recadre
donc chaque emblème sur son encre, avec 4 % d'air, puis lui donne la même **hauteur optique** :
52 px au bureau, 26 px au téléphone, largeur plafonnée à 112 px. C'est ce que veut dire
« à la hauteur du mot ». Ne posez jamais un emblème à une taille arbitraire dans le menu.

Dans une page, `.embleme[data-embleme]` reçoit la taille que vous lui donnez en CSS. Restez entre
80 et 160 px : en dessous la gravure se perd, au dessus l'emblème concurrence le titre.

---

## 9. LA PORTE D'ÂGE

La première chose que l'on voit, donc le premier geste de la maison, pas une formalité légale.
Elle vit dans `site.js`, donc **toutes les pages la font respecter**, quelle que soit celle par
laquelle on entre. `index.html` est sa page dédiée mais elle n'en a pas le monopole.

Ce qu'elle est : plein écran sur le papier de la maison, le sceau qui se referme une fois
(`sceauAnime`, 3,1 s), une seule question, deux réponses sobres en capitales, la ligne légale
alcool en bas. La réponse est retenue dans `localStorage` sous `ida.age`. Un non affiche un refus
sobre sur la même page, sans bouton pour revenir en arrière.

Tant que la porte n'a pas répondu, la page ne défile pas et rien de son contenu n'apparaît :
`site.js` pose `ida-attente` sur `<html>` dès l'analyse du document, il n'y a donc aucun
clignotement de la page avant la question.

**Une contradiction assumée, notée ici pour que personne ne la découvre plus tard.** La structure
du 3 août décrit la porte comme « une question, la typographie de la maison, rien qui bouge ».
L'animation du sceau, retenue par Raouf le 16 août, la remplace. Le sceau joue une fois, puis plus
rien ne bouge. Si Raouf tranche pour l'immobilité totale, c'est une ligne à changer dans `site.js`.

---

## 10. LISTE DE REFUS

Une page qui contient l'une de ces choses est refusée, sans discussion.

1. Un tiret cadratin, où que ce soit.
2. Une seule langue. Un texte français sans son espagnol.
3. Un `<style>` dans la page, ou une couleur écrite en dur au lieu de la variable.
4. Un entête, un menu ou un pied de page recopié dans la page au lieu de `siteChrome.init()`.
5. Un chemin absolu, un CDN, une police distante, une bibliothèque, une étape de fabrication.
   Si la page ne s'ouvre pas en double cliquant depuis le bureau, elle est refusée.
6. Un placeholder à la place d'un emblème manquant.
7. Turquesa ou rosa mexicano en fond de page, ou les deux sur le même écran, ou dans un emblème.
8. Un fond sombre. Un mode sombre.
9. Un texte posé sur une image.
10. Une phrase entière en capitales, ou des capitales sans interlettrage.
11. Un paragraphe qui dépasse 70 ch.
12. Un rebond, un ressort, un compteur qui monte, un carrousel automatique, une vidéo avec du son.
13. Un bouton d'appel à l'action, un prix barré, une promotion, un compte à rebours, une rareté
    fabriquée, le mot « offre ».
14. Un sombrero, un cactus, un coucher de soleil, une calavera, un piment, des maracas, un papel
    picado, un mariachi.
15. « La légende aztèque dit ». Le mélange de la foudre et du four.
16. Une affirmation que le lecteur ne peut vérifier nulle part sur le site.
17. Un bloc absent du chapitre 7, inventé sans le demander.
18. Une page qui n'a pas été regardée, à 1440 et à 390, avant d'être livrée.

---

## 11. CE QUI EST FAIBLE, HONNÊTEMENT

À dire à Raouf, pas à cacher.

- **La police n'est pas achetée.** Tout le site est composé dans une pile de secours. Le jour de
  l'achat, une variable change et la maison change de visage. Ce contrat est juste, sa lettre ne
  l'est pas encore.
- **Quatre emblèmes sur dix manquent** et l'un des six livrés est provisoire. La page La Historia
  et les trois fiches de bouteille n'auront donc pas de marque propre tant que ce n'est pas fait.
- **Il n'y a aucune photographie.** Les blocs image existent, leur contenu n'existe pas. Les
  constructeurs mettront des aplats. Le site ne peut pas être jugé avant les images du Mexique.
- **La vente n'est pas cadrée.** Le contrat interdit de vendre dans les pages de récit, ce qui est
  juste, mais la boutique demandée par la famille n'a ni page, ni gabarit, ni décision technique.
- **L'anglais est demandé et n'est pas là.**
- **La bouteille en 360 degrés**, pièce maîtresse de l'accueil au devis, n'a ni modèle ni bloc.
