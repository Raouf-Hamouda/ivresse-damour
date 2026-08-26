# Remplacer un logo ou un emblème, sans casser le site

Raouf va refaire certaines marques. Ce fichier dit **où chaque marque vit**, **qui l'appelle**,
et **quoi éditer** pour la remplacer. Une seule règle : aucune page HTML ne contient de dessin.
Toutes les marques sont dans `assets/js/`, donc **on remplace à un seul endroit et les 25 pages
suivent**. Ne collez jamais un SVG directement dans une page, il ne serait pas mis à jour ailleurs.

---

## Les marques du site, une par une

| marque | fichier à éditer | fonction appelée | où elle apparaît |
|---|---|---|---|
| **Le sceau de la famille** | `assets/js/logo.js` | `logoIvresse({x,y,scale,anime,color})` | la porte d'âge, le pied de page, l'accueil |
| **L'animation du sceau** | `assets/js/sceau_anime.js` | `sceauAnime(svg, opts)` | la porte d'âge, la première scène de l'accueil |
| **Le film du sceau** | `assets/media/logo_anime_1080p.mp4` | fichier direct | export, réseaux, hors site |
| **Emblème botella** | `assets/js/emblemes.js` | `embleme_botella({color})` | accueil, 3 bouteilles, 3 ventes, 3 campagnes, planche |
| **Emblème palenque** | `assets/js/emblemes.js` | `embleme_palenque({color})` | El Palenque, campagne espadín, menu |
| **Emblème mito** | `assets/js/emblemes.js` | `embleme_mito({color})` | El Mito, campagne tobalá, menu |
| **Emblème registro** | `assets/js/emblemes.js` | `embleme_registro({color})` | El Registro, campagnes, menu |
| **Emblème ritual** | `assets/js/emblemes.js` | `embleme_ritual({color})` | El Ritual, campagne coyote, menu |
| **Emblème eventos** *(provisoire)* | `assets/js/emblemes.js` | `embleme_eventos({color})` | Eventos, menu |
| **Les 4 icônes d'entête** | `assets/js/site.js`, objet `ICONES` | `ICONES.chercher/registre/compte/panier` | l'entête, toutes les pages |

**Manquants, jamais dessinés :** `historia`, `espadin`, `tobala`, `coyote`.
Le site ne met pas d'icône bouchon à leur place : l'entrée garde son mot. C'est voulu.

---

## Le contrat que doit respecter un nouvel emblème

Sinon il cassera l'alignement des autres.

```js
window.embleme_<nom> = function(o){
  o = o || {};
  var col = o.color || '#2b2118';
  return '<g fill="' + col + '">' + /* vos <path> */ + '</g>';
};
```

- Il renvoie **une chaîne SVG interne**, sans balise `<svg>`.
- Le repère est **`viewBox="-120 -120 240 240"`**, centre en 0,0.
- **Une seule encre.** Les blancs sont des découpes, `fill-rule="evenodd"`, jamais un aplat blanc
  posé par-dessus : sur l'écran noir des campagnes un aplat blanc devient une tache.
- Il accepte `color` et l'applique, sinon le survol du menu et l'écran d'encre ne fonctionneront pas.
- Lisible à **40 px** et beau à **400 px**.

Le site recadre ensuite chaque emblème sur son encre et le ramène à une hauteur optique commune,
donc ne vous souciez pas de la taille, seulement du dessin.

---

## Remplacer le sceau lui-même

`logo.js` expose `logoParts()` qui rend les neuf groupes : `arc`, `handTop`, `handBottom`, `ring`,
`flower`, `stars`, `sideStars`, `toloache`, `legitimo`. **L'animation retenue s'appuie sur ces neuf
noms.** Si vous remplacez le sceau, gardez les mêmes clés, sinon `sceau_anime.js` ne saura plus
quoi faire bouger, et les deux polices de la maison, qui sont tirées de ces lettres, seront
désynchronisées du dessin.

Repère natif du sceau : **842 x 595**, centre de la fleur en **443, 290**.

---

## Après un remplacement, vérifier

```
node ~/Desktop/MEZCAL_IVRESSE_DAMOUR/17_SITE/outils/render.js <page.html> <prefixe>
```

Regardez au minimum : l'accueil, une page bouteille, une campagne (l'écran d'encre), et le menu
survolé. Pour passer la porte d'âge en rendu automatique, posez `ida.age` à `oui` dans le
`localStorage` avant de naviguer.

---

## Les sauvegardes

Chaque état complet du site est copié dans `~/Desktop/IVRESSE_DAMOUR_SAUVEGARDES/<date>_<heure>/`.
Avant de remplacer une marque, prenez-en une : c'est un simple `cp -R` du dossier du site.
