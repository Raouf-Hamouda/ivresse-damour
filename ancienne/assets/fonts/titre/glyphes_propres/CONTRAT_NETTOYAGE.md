# CONTRAT DE NETTOYAGE, IVRESSE TITRE

Etat au 16 aout 2026. Ce fichier est l'autorite. Les seize nettoyeurs le suivent
a la lettre. Les valeurs qui suivent sont relevees sur les glyphes actuels de
`assets/fonts/titre/alphabet_titre.js`, pas estimees.

Le defaut a corriger : les contours tremblent. La cause est connue, les lettres
viennent d'une vectorisation automatique d'une image du sceau, et ce bruit a
ensuite ete recopie dans les lettres dessinees a la main. Le tremblement d'une
gravure imprimee n'est pas le bruit d'un scan. On enleve le bruit, on garde le
dessin.

La question a poser sur chaque bord : est-ce que quelqu'un a decide cela, ou
est-ce que l'algorithme a mal lu un pixel ? Les chiffres du chapitre 3 repondent.

---

## 1. Le repere, non negociable

| | |
|---|---|
| cadratin | 1000 |
| hauteur de capitale | 700 |
| ligne de pied | 0, une seule pour tout l'alphabet |
| debord des rondes | 9 unites, donc de -9 a 709 |
| y | vers le HAUT, comme dans `alphabet_titre.js` et `build_font.py` |

Debords releves aujourd'hui, tous a recaler sur 9 :
O -8 / 708, C -8 / 707, G -13 / 706, U -8 / 705, S -8 / 695, D -7 / 697,
V -6 / 691, T 0 / 704, A -3 / 700, M -1 / 702, I -1 / 700.

Une lettre a bord plat (B E F H I K L M N P R T V W X Y Z) se pose exactement
sur 0 et monte exactement a 700. Une lettre a bord rond ou pointu
(A C G J O Q S U) descend a -9 et monte a 709 la ou elle est ronde, et a 0 / 700
la ou elle est plate. Le V n'est pas une exception : son pied est une dalle
plate, il se pose sur 0.

---

## 2. Les poids releves

### 2.1 Le fut vertical

Mediane de la famille : **153.2**. Ecart interquartile 150.8 a 155.4.
Extremes admis : 145 a 158.

| lettre | fut, mediane | releve hors empattement et hors renflement |
|---|---|---|
| I | 145.9 | 144.3 a 152.3 |
| U | 150.8 | 149.5 a 156.6 |
| V (coupe horizontale) | 151.6 | 150.4 a 153.8 |
| T | 152.2 | 148.7 a 158.3 |
| E | 153.1 | 151.7 a 159.8 |
| M | 153.1 | 150.8 a 155.9 |
| R | 153.3 | 150.4 a 157.1 |
| D | 154.6 | 149.3 a 174.0 |
| L | 155.2 | 155.0 a 157.2 |
| H | 156.7 | 152.9 a 161.1 |

Chaque lettre garde SON poids. On ne ramene pas le I a 153 ni le H a 153 :
l'ecart de 11 unites entre le I et le H est dans le sceau, il reste. Ce qu'on
supprime, c'est la variation le long d'un meme fut : elle doit tomber sous
**2 unites** sur toute la hauteur (elle vaut aujourd'hui 3 a 8).

### 2.2 Les rondes, epaisseur perpendiculaire hors renflement

G 157.4, O 156.3, C 155.5, U 152.9, D 151.3, S 143.2.

**Contraste du O : il n'y en a pas.** Mesure perpendiculaire secteur par
secteur : flanc 156.3, sommet 155.3, pied 154.2. Rapport 1.01. Le O du sceau est
monolineaire, epaisseur 156 plus ou moins 3. La valeur de 178 qui circule dans
`LISEZ_MOI.txt` est une coupe horizontale prise dans le renflement de
mi-hauteur, ce n'est pas l'epaisseur du trait. Ne fabriquez pas de contraste :
il n'y en a pas dans cette main.

### 2.3 L'oblique

V, epaisseur perpendiculaire : bras gauche 149.0, bras droit 148.6.
Angles depuis la verticale : exterieur gauche 15.78, exterieur droit 14.51,
interieur gauche 16.40, interieur droit 14.93. Moyennes retenues :
**15.1 degres a l'exterieur, 15.7 degres a l'interieur**.

### 2.4 Les barres horizontales

| barre | epaisseur | position |
|---|---|---|
| traverse du H | 106 | centre a y = 330 |
| bras median du E | 99 | bord bas plat a y = 295 |
| bras haut du E | 146 a 150 | bord haut a 700 |
| bras bas du E | 144 a 150 | bord bas a 0 |
| pied du L | 144, 156 a l'extremite | |
| traverse du A | 120 | |

---

## 3. L'empattement en dalle

Profil exact, releve sur les deux empattements du I, demi-coupes horizontales.
Origine des y a l'extremite de l'empattement.

| distance depuis l'extremite | largeur totale |
|---|---|
| 0 | 156.6 |
| 3 | 210.3 |
| 6 | 216.7 |
| 11 | **219.4**, le maximum |
| 20 | 216.0 |
| 30 | 205.4 |
| 40 | 191.2 |
| 50 | 179.3 |
| 70 | 163.3 |
| 100 | 152.3 |
| 140 | 147.6 |
| 170 et au dela | 147.0, c'est le fut |

Donc :

- **largeur** 219 au plus large, atteinte a 11 unites de la face.
- **debord** 35.6 unites a gauche du fut, 36.4 a droite. Symetrique a une unite pres.
- **hauteur de la gorge** 170 : c'est la ou l'empattement a fini de rejoindre le fut.
- **la face est PLATE.** Mesure : de x = 148 a x = 308 le bord bas du I varie de
  -1.31 a +0.12, soit 1.4 unite sur 160. Elle doit devenir rigoureusement plate.
- **les deux angles exterieurs de la face sont arrondis**, rayon environ 10.
  La face nette mesure donc environ 156, encadree par deux arrondis de 10, ce qui
  fait bien 219 avec les debords. C'est ce que voulait dire "l'extremite meme est
  retrecie, c'est un coin, pas un rectangle" : ce n'est pas une face bombee, ce
  sont deux coins casses.
- **la face n'est pas concave.** Toute concavite mesuree est sous 1.5 unite,
  c'est du bruit.

Geste : `aplatir_empattement(chemin)`. La face devient une seule droite, posee
exactement sur 0 ou sur 700.

---

## 4. Le renflement de mi-hauteur, la signature de la famille

C'est la trouvaille de ce releve, et elle change la consigne. Le "cran a
mi-hauteur du I" n'est pas propre au I : **il est sur les quinze lettres de la
famille, a la meme hauteur, sur tous les bords**.

Excursion vers l'exterieur, mesuree bord par bord :

| bord | amplitude | sommet |
|---|---|---|
| I gauche / droite | 24.9 / 26.9 | y 324 / 330 |
| O gauche / droite | 25.5 / 22.3 | y 330 / 326 |
| G gauche | 25.5 | y 322 |
| C gauche | 22.9 | y 328 |
| R gauche | 20.3 | y 324 |
| V exterieur gauche / droit | 20.0 / 19.1 | y 320 |
| L gauche | 19.2 | y 326 |
| H gauche | 18.5 | y 330 |
| T gauche / droite | 18.0 / 17.5 | y 322 / 326 |
| U gauche / droite | 18.0 / 15.2 | y 336 / 314 |
| M gauche | 17.5 | y 324 |
| D gauche | 17.2 | y 330 |
| E gauche | 16.9 | y 328 |

Profil fin, releve sur l'oblique exterieure gauche du V, ecart a la droite du
corps : zero a y = 273, -6.2 a y = 290, -13.4 a y = 302, **-18.8 a y = 320**,
-13.1 a y = 335, -3.9 a y = 345, zero a y = 366. Une cloche lisse, pas un angle.

**Preuve que ce n'est pas un artefact du scan** : les lettres de l'arc ont ete
tournees jusqu'a 84 degres pour etre redressees. Une salissure horizontale de
l'image ne se retrouverait pas a la meme ordonnee apres rotation. Elle y est.
C'est donc intrinseque a chaque lettre, c'est une decision de la main, elle
reste.

Valeurs canoniques a reposer, identiques pour tous :

    debut       y = 275
    sommet      y = 322
    fin         y = 368
    amplitude   19.5 unites vers l'exterieur
    forme       deux cubiques, tangentes paralleles au bord aux trois bouts

Geste : redresser le bord avec `redresser(..., hors_bande=True)`, ce qui efface
le renflement en meme temps que le bruit, puis le reposer propre avec
`poser_bande(chemin)`. On ne conserve JAMAIS le renflement d'origine tel quel :
il porte le bruit. On le remesure, on le refait.

Le renflement se pose sur les bords exterieurs. Sur une lettre a deux bords
paralleles il est des deux cotes. Sur le V il est sur les deux obliques
exterieures seulement, l'interieur du V commence trop haut pour le porter.

---

## 5. L'amplitude du bruit, le chiffre qui tranche

Ecart des points a la droite locale, sur des bords qui devraient etre droits,
hors empattement et hors renflement, echantillon a l'unite :

| bord | ecart-type | ecart maximal |
|---|---|---|
| L, fut gauche, y 390 a 600 | 0.01 | 0.05 |
| E, fut gauche, y 390 a 600 | 0.02 | 0.05 |
| U, fut gauche, y 390 a 600 | 0.02 | 0.09 |
| M, fut gauche, y 390 a 600 | 0.02 | 0.07 |
| H, fut gauche, y 390 a 600 | 0.03 | 0.11 |
| T, fut, quatre bords | 0.03 a 0.06 | 0.21 |
| I, fut, quatre bords | 0.05 a 0.13 | 0.46 |
| R, fut gauche | 0.15 a 0.17 | 0.54 |
| D, fut gauche | 0.32 | 0.95 |
| V, obliques exterieures | 0.33 | 1.50 |

**Le seuil est 1.5 unite.**

- Un ecart de moins de 1.5 unite est du bruit. On l'efface sans discuter.
- Un ecart de 1.5 a 5 unites, lisse, etale sur plus de 60 unites de longueur,
  se juge a l'oeil et se documente dans le champ `garde` du JSON.
- Un ecart de plus de 5 unites qui se retrouve sur plusieurs lettres est une
  decision de la main. On le garde, mais on le refait proprement.

Et voici le point important : **les futs verticaux du sceau ne tremblent
presque pas** (0.02 a 0.33 d'ecart-type). Ce qui se voit a l'ecran ne vient pas
de l'amplitude, il vient du NOMBRE DE NOEUDS. Dix a treize noeuds sur un bord
droit, chacun avec sa petite inversion de courbure, font une ligne qui ondule a
l'oeil meme quand elle ne s'ecarte que d'une unite. Le vrai travail est la.

---

## 6. Les noeuds : combien il y en a, combien il en faut

Compte actuel, par lettre. `inversions` est le nombre de changements de sens de
courbure par contour, mesure par `inversions_de_courbure()`.

| lettre | segments | droites | inversions | | lettre | segments | droites | inversions |
|---|---|---|---|---|---|---|---|---|
| A | 47 | 2 | 38, 12 | | N | 44 | 5 | 42 |
| B | 43 | 6 | 14, 6, 6 | | O | 30 | 0 | 10, 6 |
| C | 37 | 0 | 12 | | P | 32 | 4 | 18, 6 |
| D | 57 | 0 | 28, 10 | | Q | 47 | 1 | 38, 8 |
| E | 36 | 4 | 18 | | R | 62 | 2 | 42, 8 |
| F | 35 | 2 | 24 | | S | 43 | 1 | 18 |
| G | 45 | 4 | 10, 8 | | T | 25 | 2 | 14 |
| H | 44 | 16 | 24 | | U | 36 | 2 | 20 |
| I | 21 | 2 | 22 | | V | 53 | 3 | 56 |
| J | 32 | 6 | 28 | | W | 52 | 9 | 50 |
| K | 51 | 5 | 52 | | X | 59 | 6 | 60 |
| L | 29 | 12 | 16 | | Y | 42 | 4 | 32 |
| M | 54 | 10 | 36 | | Z | 52 | 4 | 60 |

Le budget se calcule, il ne s'invente pas :

    un bord droit qui ne traverse pas le renflement ....... 1 segment
    un bord droit qui traverse le renflement .............. 4 segments
    un empattement en dalle, un bout de fut ............... 5 segments
      (deux gorges, deux arrondis d'angle, une face plate)
    un quart de ronde ..................................... 1 cubique
    un coin de terminaison en biais ....................... 1 a 2 segments

Ce qui donne, en cible :

| lettre | cible | | lettre | cible |
|---|---|---|---|---|
| I | 18 | | O | 16 |
| T | 20 | | C | 20 |
| L | 20 | | S | 24 |
| U | 22 | | G | 26 |
| E | 26 | | D | 28 |
| H | 28 | | R | 32 |
| V | 32 | | A | 28 |
| M | 38 | | W | 40 |
| X | 30 | | les autres | au plus 34 |

Regle simple si vous hesitez : **jamais plus de trois noeuds sur une courbe qui
tourne dans le meme sens, jamais deux noeuds a moins de 25 unites l'un de
l'autre.**

Sur le contour exterieur d'une ronde (O, C, G, la panse du D, du P, du R, du B),
hors renflement, le nombre d'inversions de courbure doit tomber a **zero**. Une
panse ne rebrousse pas.

---

## 7. Les gestes, dans l'ordre

Tout est dans `outils_nettoyage.py`, meme dossier.

L'ordre n'est pas negociable, c'est celui du V etalon. `symetriser` passe par un
reechantillonnage et defait un peu ce qui a ete redresse : il vient donc AVANT le
redressement, jamais apres. `poser_bande` vient en dernier, sinon le renflement
se fait avaler par le redressement suivant.

```python
from outils_nettoyage import *

g = lire_glyphe('V', 'origine')

# 1. oter le bruit fin, avant tout le reste
d = simplifier(g['d'], tolerance=1.5, lissage=6)

# 2. la symetrie, si la lettre la demande
d = symetriser(d, 'x', tolerance=1.2)

# 3. redresser ce qui doit etre droit, un appel par axe
d = redresser(d, 'v', 3.0, hors_bande=True)               # futs
for a in (15.1, -15.1, 15.7, -15.7):                      # obliques mesurees
    d = redresser(d, a, 6.0, 180.0, hors_bande=True)
d = redresser(d, 'h', 3.0, 60.0)                          # bras et faces

# 4. les empattements
d = aplatir_empattement(d, 4.0)

# 5. le calage sur la ligne de pied et la capitale
d = poser(d, bas=0, haut=700)          # ou bas=-9, haut=709 pour une ronde
d = aplatir_empattement(d, 3.0, colle=8.0)

# 6. reposer le renflement de la famille
d = poser_bande(d)

# 7. controler, regarder, ecrire
print(mesurer(d), verifier('V', d))
rendre_html('V', [('avant', g['d']), ('apres', d)], 'V')
ecrire_glyphe('V', d, avance=g['a'], notes='...', garde=[...])
```

Ce que ce passage donne sur le V : 53 segments et 56 inversions de courbure
deviennent 32 et 24, le fut passe d'une variation de 3.4 unites a 0.2, le defaut
de symetrie de 7.4 a 1.1, `verifier` rend une liste vide.

Un avertissement : `simplifier` seul peut AJOUTER des noeuds sur un glyphe qui
avait deja de bonnes droites, parce qu'il refait tout le contour. C'est le
redressement qui rend les noeuds. Ne jugez jamais sur le compte apres l'etape 1.

### Tolerances

| geste | valeur | quand |
|---|---|---|
| `simplifier`, tolerance | 1.5 | par defaut |
| | 0.8 | sur un empattement ou un detail de moins de 60 unites |
| | 2.0 | sur une longue oblique ou un grand arc |
| | jamais plus de 2.5 | au dela, on deforme le dessin |
| `simplifier`, lissage | 6 | par defaut, c'est la longueur d'onde du bruit |
| | 0 | sur un glyphe deja net |
| `redresser`, tolerance | 3.0 | un fut vertical |
| | 6.0 | une oblique, ou 3.0 en second passage |
| | 2.0 | une horizontale d'empattement |
| `redresser`, longueur_min | 40 | par defaut |
| | 180 | une oblique de V, W, X, pour ne pas avaler les coins |

### Ce qui doit etre parfaitement droit

Les futs de B E F H I K L M N P R T. Les deux montants du U au-dessus du
raccord. Les quatre obliques du V, du W, du X, du A, du Y, du Z, du K, du N, du M.
Les faces d'empattement. Les bras du E, du F, du L, du T, du Z, dessus et
dessous. La traverse du H, du A. Le fond du L.

### Ce qui doit rester courbe

Les panses du B, du D, du P, du R. Les anneaux du C, du G, du O, du Q, du S, du U.
Les gorges d'empattement, ces quarts de cercle qui relient la dalle au fut. Les
arrondis d'angle de rayon 10 aux quatre coins de chaque dalle. Le renflement de
mi-hauteur. Le crochet du J.

### Une diagonale

1. Mesurer son angle sur le glyphe actuel, aux deux extremites du bord, en
   ignorant les 60 premieres unites de chaque bout (elles appartiennent a
   l'empattement).
2. Arrondir a un dixieme de degre. Les deux bords d'une meme oblique ne sont pas
   paralleles dans cette main : l'exterieur du V est a 15.1, l'interieur a 15.7.
   Gardez l'ecart, il donne l'affinement du trait.
3. `redresser(d, angle, 6.0, 180.0, hors_bande=True)` sur chacun des quatre
   bords, un appel par angle, signe compris.
4. `poser_bande` a la fin.
5. Verifier que l'epaisseur perpendiculaire n'a pas bouge de plus de 3 unites.

### Un empattement

1. `aplatir_empattement` pour la face.
2. Verifier le debord : 35 a 37 unites de chaque cote du fut, symetrique a une
   unite pres.
3. Verifier la largeur maximale : 219, atteinte a 11 unites de la face.
4. Verifier la hauteur de gorge : 170.
5. Deux arrondis d'angle de rayon 10, pas un de plus.

### La symetrie

Lettres qui doivent etre symetriques autour de leur axe vertical :
**A H I M O T U V W X Y**.

Defaut mesure aujourd'hui sur le V : 7.4 unites, dont 1.3 degre d'ecart entre le
bras gauche et le bras droit. C'est un residu de la rotation qui a redresse la
lettre depuis l'arc, pas un dessin. `symetriser(d, 'x')` doit ramener le defaut
sous **2 unites**.

Le B, le E, le K, le P, le R, le S, le Z ne sont pas symetriques et ne doivent
pas le devenir.

---

## 8. Ce qu'on ne touche jamais

Liste nominative. Si vous supprimez une de ces irregularites, la lettre n'est
plus de la meme main et le travail est a refaire.

1. **Le renflement de mi-hauteur, sur les quinze lettres de la famille.**
   Sommet y 322, 19.5 unites vers l'exterieur, de y 275 a y 368. Chapitre 4.
   On le refait propre, on ne le supprime pas.

2. **L'ergot sous la panse du D.** Le bord bas de la panse remonte a y = 37.8
   entre x = 332 et x = 352, alors qu'il est a 0 avant et a -6 apres. Une
   encoche d'environ 32 unites de haut sur 35 de large, centree x = 340. Elle
   reste, redressee mais pas effacee.

3. **L'encoche du bras median du E.** Le bord haut du bras est a 393 a 396 sur
   toute sa longueur, sauf entre x = 340 et x = 370 ou il monte a 410.7, soit
   16 unites de bosse, sommet x = 355. Le bord bas, lui, est droit a 295. On
   garde la bosse du haut, on redresse le bas.

4. **La terminaison evasee des bras du E.** Le bras median passe de 97 a
   132 d'epaisseur sur ses 40 dernieres unites. C'est l'evasement de la main,
   pas du bruit.

5. **Le pied plat du V.** Le V de la famille n'a pas de pointe. Il a une dalle
   de 210 unites de large posee sur la ligne de pied, comme un empattement. On
   ne lui fabrique pas d'apex.

6. **Le sommet du V et du W sous la capitale.** Les deux sommets du milieu
   s'arretent sous 700 dans le dessin d'origine. Cette decision reste, mais les
   deux empattements du haut, eux, se posent sur 700 : aujourd'hui l'un est a
   684.5 et l'autre a 689.5, ce n'est pas une decision, c'est un decalage.

7. **La largeur du D et du R.** Ces deux lettres viennent de l'arc et sont
   sensiblement plus larges que leurs voisines. C'est leur dessin. On ne les
   resserre pas.

8. **L'ecart de poids entre le I (146) et le H (157).** Chaque lettre garde son
   fut. Chapitre 2.1.

9. **Le S plus maigre que les autres rondes** : 143 contre 156 pour le O.
   C'est dans le sceau.

10. **Le contre du O.** Attention, la consigne courante parle d'un contre
    decentre : la mesure ne le confirme pas. Centre du contour exterieur
    (419.7, 350.2), centre du contre (419.6, 349.6), soit 0.1 en x et 0.6 en y.
    Ce qui est vrai et qui doit rester, c'est que le contre est un rectangle
    arrondi et non une ellipse (ecart a l'ellipse jusqu'a 9 unites, regulier des
    quatre cotes) et que l'epaisseur de l'anneau varie de 153.5 a 161.6. On
    garde la forme carree du contre et cette respiration de 8 unites. On ne
    recentre pas, il l'est deja ; on ne decentre pas non plus.

11. **Les approches.** Elles sont calees sur les blancs du sceau, mesures un par
    un. Le nettoyage ne change pas la chasse : `ecrire_glyphe` reprend l'avance
    du glyphe d'origine. Si votre lettre a maigri ou grossi de plus de 4 unites
    en largeur, vous etes alle trop loin.

---

## 9. Le fichier a rendre

Un seul fichier par lettre, `glyphes_propres/<lettre>.json`, ecrit par
`ecrire_glyphe`. Il contient le chemin, l'avance, les bornes, le compte de
noeuds, la mesure de fut, la liste `garde` des irregularites conservees, et une
note qui dit ce qui a ete enleve.

N'ecrivez nulle part ailleurs. Ni `alphabet_titre.js`, ni `build_font.py`, ni le
`.otf`, ni `SPECIMEN.html`. Quinze autres agents travaillent en parallele.

Avant de rendre :

```python
verifier('V', d)        # doit rendre une liste vide
```

et regardez le glyphe, avant et apres, a 400 px et a 24 px, avec
`rendre_html`. Un glyphe qu'on n'a pas regarde n'est pas fini.

L'etalon est `ETALON_V.html` et `V.json`, meme dossier. Tenez ce niveau.
