# PUBLIER UN LOT

**Ivresse d'Amour, Toloache Legitimo. Le registre de la maison.**
Mode d'emploi du 16 août 2026. Écrit pour la famille, pas pour un développeur.

Le site est le registre. Chaque lot y a sa page, le visiteur entre par le numéro écrit à la main
sur sa bouteille, et il trouve l'histoire exacte de ce qu'il tient. **C'est vous qui publiez les
lots, sans nous.** Vous n'avez qu'un seul fichier à toucher.

---

## 1. Le seul fichier que vous éditez

```
assets/data/lots.json
```

Tout ce que la page El Registro affiche vient de là : les lots, les crus, les années sans lot.
La page elle même ne contient aucun chiffre. Vous ne touchez jamais à un autre fichier.

**Avant de commencer, faites une copie.** Dupliquez `lots.json` et appelez la copie
`lots_avant_le_16_aout.json`, gardez la ailleurs que dans le dossier du site. Si quelque chose se
passe mal, vous remettez la copie et tout revient.

---

## 2. Avec quoi l'ouvrir

- **Mac** : clic droit sur le fichier, Ouvrir avec, **TextEdit**. Puis menu Format, **Convertir au
  format Texte** si ce n'est pas déjà fait.
- **Windows** : clic droit, Ouvrir avec, **Bloc-notes**.

**N'ouvrez jamais ce fichier avec Word, Pages ou Google Docs.** Ces logiciels remplacent les
guillemets droits `"` par des guillemets courbes `“ ”`, et le registre ne sait plus lire son
fichier. Un éditeur de texte simple, rien d'autre.

---

## 3. Les trois règles qui évitent 95 % des ennuis

1. **Les guillemets sont droits** : `"` et jamais `“`. Tout texte est entre guillemets droits.
   Les nombres, eux, s'écrivent sans guillemets : `412`, pas `"412"`.
2. **Une virgule sépare deux lignes, et il n'y en a pas après la dernière.** C'est la faute la
   plus fréquente. Regardez toujours la ligne du dessus quand vous ajoutez une ligne.
3. **Chaque accolade ouverte `{` se referme `}`, chaque crochet ouvert `[` se referme `]`.**
   Le plus sûr est de copier un lot entier existant et de changer ce qu'il y a dedans.

Un apostrophe français dans un texte ne pose aucun problème : `"L'agave"` s'écrit tel quel.

---

## 4. Ajouter un lot

Ouvrez le fichier. Trouvez la ligne `"lots": [`. Juste en dessous commence le premier lot, entre
accolades. **Copiez un lot entier, du `{` au `}`, collez le juste après le `[`, ajoutez une virgule
après le `}` que vous venez de coller, puis changez ses valeurs.** Les lots se rangent du plus
récent au plus ancien.

Voici un lot complet, celui que vous copiez :

```json
    {
      "exemple": false,
      "reference": "ESP-2026-01",
      "cru": "espadin",
      "annee": 2026,
      "parcelle": "El Camarón",
      "sol": {
        "fr": "Argile rouge, pente exposée au sud",
        "es": "Arcilla roja, ladera expuesta al sur",
        "en": "Red clay, slope facing south"
      },
      "annee_plantation": 2019,
      "litres": 300,
      "bouteilles": 428,
      "date_distillation": "2026-11-08",
      "etat": "ouvert",
      "date_epuisement": "",
      "note": ""
    },
```

### Ce que veut dire chaque ligne

| ligne | ce que vous écrivez | exemple |
|---|---|---|
| `exemple` | `false` pour un vrai lot. `true` seulement pour un lot de démonstration. | `false` |
| `reference` | Le nom court du lot, celui que vous employez entre vous. Trois lettres de cru, l'année, le rang. | `"ESP-2026-01"` |
| `cru` | `"espadin"`, `"tobala"` ou `"coyote"`. En minuscules, sans accent. C'est un mot de machine, pas un mot d'affichage. | `"espadin"` |
| `annee` | L'année du lot, en chiffres, sans guillemets. | `2026` |
| `parcelle` | Le nom de la parcelle, comme vous l'appelez au village. Un nom propre ne se traduit pas, il s'écrit une seule fois. | `"El Camarón"` |
| `sol` | La terre, en une ligne. Une phrase se donne en trois langues, voir plus bas. | voir ci dessus |
| `annee_plantation` | L'année où l'agave a été mis en terre, en chiffres. | `2019` |
| `litres` | Les litres sortis du lot, en chiffres. | `300` |
| `bouteilles` | Le tirage du lot, c'est à dire le second nombre écrit à la main sur l'étiquette. | `428` |
| `date_distillation` | La date, **toujours année, mois, jour, avec des tirets**. Le site l'écrit ensuite en toutes lettres dans chaque langue. | `"2026-11-08"` |
| `etat` | `"ouvert"` tant qu'il reste des bouteilles, `"epuise"` quand il n'en reste plus. En minuscules, sans accent. | `"ouvert"` |
| `date_epuisement` | Vide tant que le lot est ouvert. Le jour où il est épuisé, la date, même écriture. | `""` puis `"2027-02-14"` |
| `note` | Ce qui n'entre dans aucune autre ligne. Laissez `""` s'il n'y a rien à dire. | `""` |

### Une phrase en trois langues

Le site parle français, espagnol et anglais. Un nom propre s'écrit une fois, comme
`"El Camarón"`. **Une phrase, elle, s'écrit trois fois** :

```json
      "sol": {
        "fr": "Argile rouge, pente exposée au sud",
        "es": "Arcilla roja, ladera expuesta al sur",
        "en": "Red clay, slope facing south"
      },
```

Si vous n'écrivez qu'un seul texte, comme `"sol": "Arcilla roja"`, il s'affichera tel quel dans
les trois langues. Ce n'est pas une faute, c'est un choix : pour un nom propre c'est ce qu'il
faut, pour une phrase c'est dommage.

### Ce que vous n'avez pas à réécrire à chaque lot

En haut du fichier il y a un bloc `valeurs_communes` :

```json
  "valeurs_communes": {
    "maestro": "Gilberto Vásquez",
    "village": "Villa Sola de Vega, Oaxaca",
    "degre": "50 %",
    "contenant": "700 ml",
    "categorie": { "fr": "...", "es": "...", "en": "..." }
  },
```

Ces cinq lignes valent pour tous les lots, vous ne les recopiez pas. Si **un** lot fait exception,
par exemple un 46 %, écrivez la ligne `"degre": "46 %",` à l'intérieur de ce lot : la ligne du lot
gagne toujours sur la ligne commune.

---

## 5. Épuiser un lot

Un lot épuisé **ne s'efface jamais**. L'archive ne se vide pas, elle s'allonge. Vous changez deux
lignes, rien d'autre :

```json
      "etat": "epuise",
      "date_epuisement": "2027-02-14",
```

Le registre l'affichera épuisé et daté, et il restera à sa place dans l'archive pour toujours.
Il ne sera jamais soldé, jamais barré, jamais mis en avant comme une dernière chance.

---

## 6. Dire qu'il n'y a pas eu de lot cette année

C'est la règle de la maison : si la plante n'a pas donné, le registre le dit, et on ne remplace
jamais un cru absent par un autre. Cherchez `"annees_sans_lot": [` et ajoutez un bloc :

```json
    {
      "cru": "tobala",
      "annee": 2027,
      "raison": {
        "fr": "La plante n'a pas donné.",
        "es": "La planta no dio.",
        "en": "The plant did not give."
      }
    },
```

`raison` ne porte que la raison. Le site écrit tout seul « En 2027, pas de lot. » devant.

---

## 7. Le jour du premier vrai lot

Le registre contient aujourd'hui **quatre lots d'exemple**. Ils portent `"exemple": true` et la
page le dit à l'écran, lot par lot, pour que personne ne les prenne pour des bouteilles réelles.

Le jour où vous publiez votre premier vrai lot :

1. ajoutez votre lot avec `"exemple": false` ;
2. **effacez les quatre lots d'exemple**, du `{` au `}` de chacun, virgules comprises ;
3. effacez aussi le bloc d'exemple dans `annees_sans_lot`.

Il n'en restera plus aucune trace, et le registre ne portera plus que du vrai.

---

## 8. Mettre en ligne

Le fichier modifié doit remplacer l'ancien sur le serveur, au même endroit :
`assets/data/lots.json`. Rien d'autre à faire, aucune reconstruction, aucun bouton à presser.
Rechargez la page El Registro et le lot est là.

---

## 9. Vérifier avant, en double clic

Si vous ouvrez `el-registro.html` en double cliquant dessus, sans passer par le site en ligne, le
navigateur **refuse** de lire `assets/data/lots.json`. Ce n'est pas un réglage à changer, c'est sa
sécurité : il ne laisse pas une page du disque lire un autre fichier du disque.

La page le dit à l'écran quand cela arrive, en une ligne sous le champ de recherche. Dans ce cas
elle lit une **copie de secours** rangée tout en bas de `el-registro.html`, entre les deux lignes :

```html
<script type="application/json" id="reg-secours">
   ... la copie ...
</script>
```

Deux façons de faire, choisissez la vôtre :

- **La simple.** Vous éditez seulement `assets/data/lots.json` et vous vérifiez une fois le site en
  ligne. La copie de secours devient un peu ancienne, elle ne sert qu'au double clic, elle ne gêne
  personne.
- **La complète.** Après avoir édité `lots.json`, vous ouvrez `el-registro.html` avec le même
  éditeur de texte, vous sélectionnez tout ce qui est entre les deux lignes ci dessus, et vous y
  collez le contenu entier de `lots.json`. Les deux disent alors la même chose, et le double clic
  montre exactement ce que montrera le site.

**En ligne, c'est toujours `lots.json` qui gagne.** La copie de secours n'est jamais lue par un
visiteur.

---

## 10. Si vous vous trompez

Rien n'est cassé pour de bon, et rien n'est perdu : le pire qui puisse arriver est que la page
n'affiche pas ce que vous vouliez. Voici ce que vous verrez, et quoi faire.

| ce que vous voyez | ce qui s'est passé | ce que vous faites |
|---|---|---|
| La page dit « Le registre n'a pas pu lire ses données » et l'archive est vide. | Une virgule en trop, une virgule qui manque, une accolade non refermée, ou des guillemets courbes venus d'un traitement de texte. | Reprenez le dernier bloc que vous avez collé. Comparez le, ligne à ligne, avec un lot qui marchait. Si vous ne trouvez pas, remettez la copie faite à l'étape 1. |
| Une ligne de la fiche dit « Attendu de la maison ». | Ce champ est vide, ou son nom est mal écrit, par exemple `parcele` au lieu de `parcelle`. | Vérifiez l'orthographe du nom de la ligne. Les noms ne changent jamais, seul ce qui est entre guillemets change. |
| La date s'affiche `2026-11-8` au lieu de « 8 novembre 2026 ». | La date n'est pas écrite avec deux chiffres partout. | Écrivez `"2026-11-08"`. Toujours quatre chiffres, deux chiffres, deux chiffres. |
| Le lot apparaît, mais sans son agave, et il manque dans la liste des crus. | Le mot de `cru` n'est pas l'un des trois attendus. | Écrivez exactement `"espadin"`, `"tobala"` ou `"coyote"`. Minuscules, sans accent. |
| Le visiteur tape son numéro et le registre ne trouve rien. | Le nombre de `bouteilles` du lot ne correspond pas au second nombre écrit à la main sur l'étiquette. | Corrigez `bouteilles`. C'est ce nombre là, et lui seul, qui fait entrer le visiteur. |
| Le lot s'affiche deux fois. | Il a été collé deux fois. | Effacez l'un des deux, du `{` au `}`, et la virgule qui va avec. |

---

## 11. Ce que le registre ne fera jamais

Ce ne sont pas des limites techniques, ce sont les règles de la maison, et elles sont dans le
code comme dans le dossier.

- **Aucun prix n'apparaît sur le registre.** Le registre documente, il ne vend pas.
- **Aucune remise, aucun prix barré, aucun compte à rebours.** Le prix monte avec le temps, jamais
  l'inverse.
- **Aucun lot ne disparaît.** Un lot épuisé reste, épuisé et daté.
- **Aucun cru absent n'est remplacé.** S'il n'y a pas de tobalá cette année, le registre le dit.
  La plante décide.
