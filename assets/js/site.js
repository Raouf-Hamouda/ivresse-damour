/* ============================================================================
   site.js   Ivresse d'Amour, Toloache Legitimo.
   Le comportement partage de toutes les pages. Vanilla, aucune dependance de
   paquet, aucune etape de fabrication, fonctionne depuis file:// en double clic.

   Il porte cinq choses, et rien d'autre :
     1. la porte d'age (plein ecran, le sceau joue une fois ; en demo, une fois par session)
     2. l'entete et le menu (le mot devient l'emblème au survol, au focus, au doigt)
     3. la bascule de langue FR / ES, pilotee par data-fr et data-es
     4. le pied de page, injecte partout, avec la ligne legale alcool
     5. deux mouvements autorises : le fondu a l'apparition, la parallaxe legere

   Dependances de fichier, dans cet ordre, dans le <head> :
     assets/js/logo.js
     assets/js/sceau_anime.js      (a besoin de logo.js)
     assets/js/emblemes_parts.js, assets/js/embleme_mito.js, assets/js/emblemes_anime.js
                                   (les emblèmes retenus ; si une page ne les a pas,
                                    init() les charge lui meme, dans cet ordre)
     assets/js/site.js             puis window.siteChrome.init()
   site.js ne depend plus de emblemes.js. Ce fichier ne sert qu'aux pages qui
   appellent window.embleme_<cle> dans leur propre script.

   Le contrat HTML exact qu'une page doit respecter est en tete de CONTRAT_VISUEL.md
   et rappele plus bas, section CONTRAT.
   Pas de tiret cadratin dans ce fichier.
   ========================================================================= */
(function(){
'use strict';

/* DEMO (regle de Raouf, 16 aout au soir). La porte d'age se montre UNE fois par
   session de navigation : on l'a passee, on circule ensuite de page en page sans
   la revoir. Elle revient quand on recharge une page (F5, bouton recharger) et
   quand le site s'ouvre dans un nouvel onglet ou une nouvelle fenetre (la
   session est vide). La reponse n'est jamais gardee d'une session a l'autre.
   Passer a false pour revenir au comportement normal (une seule fois, reponse
   gardee sous ida.age dans localStorage). La langue, elle, reste gardee. */
var PORTE_A_CHAQUE_VISITE = true; /* demo : la porte se represente a chaque session et a chaque rechargement */
var CLE_AGE_SESSION = 'ida.age.session';   /* sessionStorage, 'oui' quand la porte est passee dans cette session */
var memoireSession = {};
function lireSession(cle){
  try{ var v = window.sessionStorage.getItem(cle); return v === null ? memoireSession[cle] : v; }
  catch(e){ return memoireSession[cle]; }
}
function ecrireSession(cle, valeur){
  memoireSession[cle] = valeur;
  try{ window.sessionStorage.setItem(cle, valeur); }catch(e){}
}
/* la page arrive-t-elle par un rechargement ? */
function estRechargement(){
  try{
    var n = performance.getEntriesByType && performance.getEntriesByType('navigation');
    if(n && n.length) return n[0].type === 'reload';
  }catch(e){}
  try{ return !!(performance.navigation && performance.navigation.type === 1); }catch(e){}
  return false;
}
/* faut-il montrer la porte sur cette page ? */
function porteRequise(){
  if(PORTE_A_CHAQUE_VISITE){
    return estRechargement() || lireSession(CLE_AGE_SESSION) !== 'oui';
  }
  return lire(CLE_AGE) !== 'oui';
}

/* ---------------------------------------------------------------------------
   0. MEMOIRE. localStorage quand il existe, sinon en memoire pour la session.
   Certains navigateurs refusent localStorage en file:// : on ne casse jamais.
   ------------------------------------------------------------------------ */
var memoire = {};
function lire(cle){
  try{ var v = window.localStorage.getItem(cle); return v === null ? memoire[cle] : v; }
  catch(e){ return memoire[cle]; }
}
function ecrire(cle, valeur){
  memoire[cle] = valeur;
  try{ window.localStorage.setItem(cle, valeur); }catch(e){}
}

var CLE_AGE = 'ida.age';    /* 'oui' ou 'non' */
var CLE_LANG = 'ida.lang';  /* 'fr' ou 'es' */

/* ---------------------------------------------------------------------------
   1. LES DONNEES DE LA MAISON. Une seule source pour les sept pages.
   embleme : la cle d'un emblème (voir la table EMBLEMES plus bas, qui traduit
   la cle vers le nom anime de EMBLEMES_ANIME). null = l'emblème n'est pas
   dessine, l'entree garde son mot, on ne pose jamais d'icone de remplacement.
   Depuis le 16 aout au soir, La Historia a son emblème (le livre), et les
   trois bouteilles ont le leur (leur agave : espadin, tobala, coyote).
   Eventos a le sien depuis le meme soir : le brindis (deux copitas qui
   trinquent). L'ancienne table dressee provisoire est retiree.
   ------------------------------------------------------------------------ */
var MENU = [
  { id:'botella',  href:'index.html',         embleme:'botella',  fr:'La Botella',  es:'La Botella',  en:'La Botella'  },
  { id:'mezcales', href:'les-mezcales.html',  embleme:'fleur',    fr:'Les Mezcals', es:'Los Mezcales',en:'The Mezcals' },
  { id:'boutique', href:'boutique.html',      embleme:'ofrenda',  fr:'La Boutique', es:'La Tienda',   en:'The Shop'    },
  { id:'historia', href:'la-historia.html',   embleme:'historia', fr:'La Historia', es:'La Historia', en:'La Historia' },
  { id:'palenque', href:'el-palenque.html',   embleme:'palenque', fr:'El Palenque', es:'El Palenque', en:'El Palenque' },
  { id:'mito',     href:'el-mito.html',       embleme:'mito',     fr:'El Mito',     es:'El Mito',     en:'El Mito'     },
  { id:'registro', href:'el-registro.html',   embleme:'registro', fr:'El Registro', es:'El Registro', en:'El Registro' },
  { id:'ritual',   href:'el-ritual.html',     embleme:'ritual',   fr:'El Ritual',   es:'El Ritual',   en:'El Ritual'   },
  { id:'eventos',  href:'eventos.html',       embleme:'eventos',  fr:'Eventos',     es:'Eventos',     en:'Eventos'     }
];

/* Les trois bouteilles. Chacune a sa page, son jeu et sa page de vente.
   accent : la couleur de la maison qui signe cette bouteille et elle seule.
   L espadin garde l olive de l etiquette, le tobala prend le turquesa,
   le coyote prend le rosa mexicano : les deux couleurs mexicaines demandees
   par Raouf le 16 aout, employees comme cle de champ, jamais comme fond. */
var BOUTEILLES = [
  { id:'espadin', href:'espadin.html', jeu:'jeu-espadin.html', vente:'acheter-espadin.html',
    accent:'var(--olive-etiquette)', embleme:'espadin',
    fr:'Espadín', es:'Espadín', en:'Espadín',
    latin:'A. angustifolia' },
  { id:'tobala',  href:'tobala.html',  jeu:'jeu-tobala.html',  vente:'acheter-tobala.html',
    accent:'var(--turquesa)', embleme:'tobala',
    fr:'Tobalá', es:'Tobalá', en:'Tobalá',
    latin:'A. potatorum' },
  { id:'coyote',  href:'coyote.html',  jeu:'jeu-coyote.html',  vente:'acheter-coyote.html',
    accent:'var(--rosa)', embleme:'coyote',
    fr:'Coyote', es:'Coyote', en:'Coyote',
    latin:'A. americana' }
];

/* Les cinq entrees de gauche. Gentle monster en a cinq, jamais huit : au dela
   la barre devient une liste et la page perd son calme. Nos huit pages tiennent
   dans cinq entrees, dont deux ouvrent un panneau. */
var GROUPES = [
  { id:'mezcales', href:'les-mezcales.html', embleme:'fleur', fr:'Les Mezcals', es:'Los Mezcales', en:'The Mezcals',
    sous:[
      { href:'espadin.html', embleme:'espadin', fr:'Espadín', es:'Espadín', en:'Espadín' },
      { href:'tobala.html',  embleme:'tobala',  fr:'Tobalá',  es:'Tobalá',  en:'Tobalá'  },
      { href:'coyote.html',  embleme:'coyote',  fr:'Coyote',  es:'Coyote',  en:'Coyote'  },
      { href:'les-mezcales.html', embleme:'botella', fr:'Les trois', es:'Los tres', en:'All three' }
    ] },
  { id:'boutique', href:'boutique.html', embleme:'ofrenda', fr:'Boutique', es:'Tienda', en:'Shop' },
  { id:'maison', href:'la-historia.html', embleme:'maison', fr:'La Maison', es:'La Casa', en:'The House',
    sous:[
      { href:'el-mito.html',     embleme:'mito',     fr:'El Mito',     es:'El Mito',     en:'El Mito'     },
      { href:'la-historia.html', embleme:'historia', fr:'La Historia', es:'La Historia', en:'La Historia' },
      { href:'el-palenque.html', embleme:'palenque', fr:'El Palenque', es:'El Palenque', en:'El Palenque' }
    ] },
  { id:'registro', href:'el-registro.html', embleme:'registro', fr:'El Registro', es:'El Registro', en:'El Registro' },
  { id:'ritual',   href:'el-ritual.html',   embleme:'ritual',   fr:'El Ritual',   es:'El Ritual',   en:'El Ritual'   },
  { id:'eventos',  href:'eventos.html',     embleme:'eventos',  fr:'Eventos',     es:'Eventos',     en:'Eventos'     }
];

var PIED = [
  { href:'mentions-legales.html', fr:'Mentions légales', es:'Avisos legales', en:'Legal notice'  },
  { href:'contact.html',          fr:'Contact',          es:'Contacto',       en:'Contact'       },
  { href:'distribution.html',     fr:'Distribution',     es:'Distribución',   en:'Distribution'  },
  { href:'presse.html',           fr:'Presse',           es:'Prensa',         en:'Press'         }
];

var TEXTES = {
  marque:   { fr:'Ivresse d’Amour',   es:'Ivresse d’Amour',   en:'Ivresse d’Amour'   },
  marque2:  { fr:'Toloache Legitimo', es:'Toloache Legitimo', en:'Toloache Legitimo' },
  menu:     { fr:'Menu',              es:'Menú',              en:'Menu'              },
  /* la ligne legale alcool, obligatoire sur chaque page (appel client, lignes 80 a 83) */
  legal:    { fr:'L’abus d’alcool est dangereux pour la santé. À consommer avec modération.',
              es:'El abuso en el consumo de este producto es nocivo para la salud. Consúmase con moderación.',
              en:'Excessive drinking is harmful to health. Please drink responsibly.' },
  lieu:     { fr:'Villa Sola de Vega, Oaxaca, Mexique',
              es:'Villa Sola de Vega, Oaxaca, México',
              en:'Villa Sola de Vega, Oaxaca, Mexico' },
  /* la porte d'age */
  porteQ:   { fr:'Avez-vous l’âge légal pour consommer de l’alcool dans votre pays ?',
              es:'¿Tiene la edad legal para consumir alcohol en su país?',
              en:'Are you of legal drinking age in your country?' },
  porteOui: { fr:'Oui',  es:'Sí',  en:'Yes' },
  porteNon: { fr:'Non',  es:'No',  en:'No'  },
  porteRef: { fr:'Cette maison ne s’adresse qu’aux personnes en âge de boire. Revenez quand la loi de votre pays vous y autorisera.',
              es:'Esta casa se dirige solo a personas en edad de beber. Vuelva cuando la ley de su país se lo permita.',
              en:'This house speaks only to those of drinking age. Come back when the law of your country allows it.' }
};

/* ---------------------------------------------------------------------------
   2. LANGUE. Le contrat d'ecriture pour les constructeurs.

   (a) TEXTE SIMPLE, le cas de 95 % des copies :
         <p data-fr="Le texte francais." data-es="El texto espanol."></p>
       L'element est vide dans le fichier, site.js ecrit son contenu.
       Marche sur n'importe quelle balise : h1, h2, p, span, a, li, td, figcaption.

   (b) CONTENU RICHE (un paragraphe avec un lien, une liste, un bloc entier) :
         <div data-lang="fr"> ... </div>
         <div data-lang="es"> ... </div>
       Les deux existent dans le fichier, site.js affiche celui de la langue.

   (c) TITRE DU DOCUMENT :
         <body data-titre-fr="El Mito. Ivresse d'Amour" data-titre-es="El Mito. Ivresse d'Amour">

   (d) ATTRIBUT (alt d'une image, aria-label) :
         <img data-fr-alt="..." data-es-alt="..." alt="">
       Le motif est data-<langue>-<attribut>.

   Interdit : ecrire du francais en dur dans le HTML sans son espagnol.
   Une page qui n'a pas ses deux langues est refusee.
   ------------------------------------------------------------------------ */
/* Les trois langues de la maison, dans cet ordre et pas un autre : FR, ES, EN.
   Le francais est la langue de travail, l espagnol celle de la famille, l anglais l export. */
var LANGUES = ['fr','es','en'];
var langue = 'fr';

function langueDepart(){
  var m = lire(CLE_LANG);
  if(LANGUES.indexOf(m) !== -1) return m;
  /* La maison ouvre en francais. La langue du navigateur ne decide pas a sa place :
     seul un choix explicite du visiteur, garde d une visite a l autre, change cela. */
  return 'fr';
}

function appliquerLangue(l, racine){
  racine = racine || document;
  var i, els;

  /* (a) texte simple */
  els = racine.querySelectorAll('[data-fr],[data-es],[data-en]');
  for(i=0;i<els.length;i++){
    var v = els[i].getAttribute('data-' + l);
    if(v === null) continue;
    /* GARDE. textContent efface TOUS les enfants. Un bouton qui porte a la fois
       data-fr et une icone perdait son icone au premier changement de langue :
       c est ce qui a fait disparaitre la marque Google le 16 aout. Un element
       qui contient des elements ne se remplace jamais en bloc, on ecrit
       seulement dans son premier noeud de texte. Sinon on ignore, et le texte
       doit vivre dans un <span> a l interieur. */
    if(els[i].firstElementChild){
      var n = els[i].firstChild;
      while(n && n.nodeType !== 3){ n = n.nextSibling; }
      if(n) n.nodeValue = v;
      continue;
    }
    els[i].textContent = v;
  }

  /* (b) blocs riches */
  els = racine.querySelectorAll('[data-lang]');
  for(i=0;i<els.length;i++){
    var estLui = els[i].getAttribute('data-lang') === l;
    els[i].classList.toggle('est-actif', estLui);
  }

  /* (d) attributs */
  els = racine.querySelectorAll('*');
  for(i=0;i<els.length;i++){
    var d = els[i].dataset, k;
    for(k in d){
      if(k.indexOf(l) === 0 && k.length > l.length){
        var attr = k.slice(l.length);
        attr = attr.charAt(0).toLowerCase() + attr.slice(1);
        /* le dataset rend data-fr-aria-label sous la forme frAriaLabel : il faut
           remettre les tirets, sinon on pose un attribut "arialabel" que personne
           ne lit et les icones restent sans nom accessible. Trouve le 16 aout. */
        attr = attr.replace(/[A-Z]/g, function(c){ return '-' + c.toLowerCase(); });
        if(attr) els[i].setAttribute(attr, d[k]);
      }
    }
  }

  if(racine === document){
    langue = l;
    document.documentElement.setAttribute('lang', l);
    var t = document.body.getAttribute('data-titre-' + l) || document.body.getAttribute('data-titre-fr');
    if(t) document.title = t;
    var b = document.querySelectorAll('.langue__b,.porte__l');
    for(i=0;i<b.length;i++) b[i].setAttribute('aria-pressed', String(b[i].getAttribute('data-l') === l));
  }
}

function changerLangue(l){
  if(LANGUES.indexOf(l) === -1) return;
  ecrire(CLE_LANG, l);
  appliquerLangue(l);
}

/* ---------------------------------------------------------------------------
   3. LES EMBLEMES. Depuis le 16 aout au soir, les emblèmes retenus sont animes :
   EMBLEMES_ANIME.mount(nom, svg, {color, paper}) construit l'emblème dans un
   <svg viewBox="-120 -120 240 240"> et rend un lecteur {play, stop, render,
   duration}. Au repos l'emblème est complet ; play() le fait naitre une fois.
   Regle du contrat, chapitre 5 : jamais en boucle, jamais au chargement,
   seulement au survol ou a l'entree dans l'ecran.

   La couleur : on monte avec l'encre exacte #2B2118 puis on remplace cette
   encre par currentColor pour que le CSS commande (brique au survol du menu).
   Les parties papier (lignes du registre, flamme du palenque) restent #FEF9F3.
   L'eclair d'El Mito garde sa teinte eclaircie, calculee par emblemes_anime.

   Un emblème absent ne laisse jamais de trou : le mot reste.
   ------------------------------------------------------------------------ */
var ENCRE = '#2B2118', PAPIER = '#FEF9F3';

/* la cle d'un emblème (celle des pages, des menus, de data-embleme) vers le nom
   anime de EMBLEMES_ANIME. C'est la seule source : une cle absente ici n'a pas
   d'emblème, quoi que le HTML demande, et la case reste vide, cachee. Aucun
   ancien dessin de l'ex emblemes.js n'est utilise. */
var EMBLEMES = {
  botella:  'botella',
  historia: 'libro',           /* La Historia : le livre ouvert, la fleur du sceau pressee sur la page (Raouf, 16 aout au soir). Le couple 'historia' reste dans le moteur, inutilise */
  palenque: 'palenque',
  mito:     'mito3',           /* El Mito : le buisson du sceau, l'eclair v2, deux etoiles */
  registro: 'registro',
  ritual:   'ritual_couple',   /* El Ritual : le couple, les copitas se touchent */
  espadin:  'espadin',
  tobala:   'tobala',
  coyote:   'coyote',
  mito3:    'mito3',           /* alias : la cle que sert emblemes.js pour El Mito fini */
  eventos:  'brindis',         /* Eventos : deux copitas qui trinquent, le liquide bouge, trois etoiles (Raouf, 16 aout au soir) */
  fleur:    'fleur',           /* la fleur du sceau (logo.js), montee par site.js : Les Mezcals, Les trois */
  maison:   'historia_mains',  /* La Maison : les deux mains qui portent la fleur du sceau (17 aout 00h05 : plus le meme visuel que Les Mezcals) */
  ofrenda:  'caja'             /* la Boutique : la caisse de bois et ses trois bouteilles, dessinee pour la vente (Raouf, 17 aout 00h05) */
};
function emblemeExiste(cle){ return !!(cle && EMBLEMES[cle]); }

/* les trois fichiers des emblèmes, charges par emblemes.js dans le <head> ; si
   une page ne les a pas, init() les charge ici, dans cet ordre, et tout ce qui
   attend un emblème passe par quandEmblemesPrets(). */
/* 2 sept : ces fichiers se chargent tard, depuis ce script, et n'avaient pas de
   cachet de cache : le telephone de Raouf rejouait l'ancienne animation de la
   bouteille apres chaque correction. Le cachet est celui de site.js. */
var VERSION_ASSETS = '20260902q';
var FICHIERS_EMBLEMES = ['assets/js/emblemes_parts.js', 'assets/js/embleme_mito.js', 'assets/js/emblemes_anime.js'].map(function(f){ return f + '?v=' + VERSION_ASSETS; });
var emblemesPrets = false, emblemesEnAttente = [], emblemesChargement = false;

function emblemesDisponibles(){
  return !!(window.EMBLEMES_ANIME && window.EMBLEMES_PARTS && typeof window.embleme_mito === 'function');
}
function quandEmblemesPrets(fn){
  if(emblemesPrets){ fn(); return; }
  emblemesEnAttente.push(fn);
  chargerEmblemes();
}
function chargerEmblemes(){
  if(emblemesPrets || emblemesChargement) return;
  if(emblemesDisponibles()){ emblemesPrets = true; viderAttente(); return; }
  emblemesChargement = true;
  var base = baseScripts();
  (function suivant(i){
    if(i >= FICHIERS_EMBLEMES.length){
      emblemesChargement = false;
      emblemesPrets = true;          /* pret, meme si un fichier a manque : chaque montage se protege */
      viderAttente();
      return;
    }
    var deja = document.querySelector('script[src$="' + FICHIERS_EMBLEMES[i].replace('assets/js/','') + '"]');
    if(deja){ suivant(i+1); return; }
    var sc = document.createElement('script');
    sc.src = base + FICHIERS_EMBLEMES[i];
    sc.onload = function(){ suivant(i+1); };
    sc.onerror = function(){ suivant(i+1); };
    document.head.appendChild(sc);
  })(0);
}
function viderAttente(){
  var l = emblemesEnAttente; emblemesEnAttente = [];
  for(var i=0;i<l.length;i++){ try{ l[i](); }catch(e){} }
}
/* le dossier du site, lu sur la balise de site.js : les pages vivent a la
   racine, mais on ne parie pas dessus. */
function baseScripts(){
  var s = document.querySelector('script[src$="site.js"]');
  if(s && s.getAttribute('src')){
    return s.getAttribute('src').replace(/assets\/js\/site\.js$/, '');
  }
  return '';
}

var reduitMouvement = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

function creerSvgEmbleme(){
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-120 -120 240 240');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.style.overflow = 'visible';   /* l'animation peut sortir un instant du cadre recadre */
  return svg;
}

/* l'encre devient currentColor, le papier reste papier */
function encreCourante(racine){
  var fills = racine.querySelectorAll('[fill]');
  for(var i=0;i<fills.length;i++){
    if(/^#2b2118$/i.test(fills[i].getAttribute('fill'))) fills[i].setAttribute('fill', 'currentColor');
  }
}

/* monte l'emblème anime dans hote (un element vide ou a vider). Rend le lecteur,
   false si l'emblème n'existe pas ou n'a pas pu etre monte, null si les fichiers
   ne sont pas encore la (le montage est alors remis a quandEmblemesPrets).
   IMPORTANT : l'hote doit etre affiche (pas display:none) au moment du montage,
   les animations mesurent des boites avec getBBox. */
function monterEmbleme(hote, cle){
  if(hote.__embleme !== undefined) return hote.__embleme;
  var nom = EMBLEMES[cle];
  if(!nom){ hote.__embleme = false; return false; }   /* pas d'emblème : rien, jamais de remplacement */
  if(!emblemesPrets){ return null; }
  if(nom !== 'fleur' && !window.EMBLEMES_ANIME){ hote.__embleme = false; return false; }
  while(hote.firstChild) hote.removeChild(hote.firstChild);
  var svg = creerSvgEmbleme();
  hote.appendChild(svg);
  var c = null;
  try{
    if(nom === 'fleur'){ c = monterFleur(svg); }
    else {
      /* la bouteille peut porter le nom du mezcal dans l'espace du ticket :
         <span class="embleme" data-embleme="botella" data-label="Espadín"> */
      var o = { color:ENCRE, paper:PAPIER };
      var label = hote.getAttribute('data-label');
      if(label && nom === 'botella') o.label = label;
      c = window.EMBLEMES_ANIME.mount(nom, svg, o);
    }
  }catch(e){ c = null; }
  if(!c){ hote.removeChild(svg); hote.__embleme = false; return false; }
  var g = svg.firstElementChild;
  if(g) g.setAttribute('class', 'embleme__encre');
  encreCourante(svg);
  hote.__embleme = c;
  hote.__nomEmbleme = nom;
  caresserEmbleme(hote, svg, nom);
  return c;
}

/* La caresse (Raouf, 17 aout au soir) : quand la souris passe sur certains emblèmes
   (la bouteille, les trois agaves, le palenque, et les deux copitas du couple du
   Ritual), les pieces proches du pointeur glissent de quelques unites vers lui et le
   dessin s'incline d'un degre ; tout revient a sa place quand la souris sort. Rien ne
   rejoue. Les autres emblèmes gardent leur comportement d'avant. Se pose par les
   proprietes translate / rotate CSS, qui s'ajoutent au transform de l'animation sans
   l'ecraser. Coupe si le mouvement est reduit. Au doigt aussi : la piece suit le doigt tant qu'il touche l'emblème. */
var CARESSABLES = { botella:1, espadin:1, tobala:1, coyote:1, palenque:1, ritual_couple:1 };
function estCaressable(nom){ return !!CARESSABLES[nom]; }
function caresserEmbleme(hote, svg, nom){
  if(reduitMouvement || hote.__caresse || !estCaressable(nom)) return;
  hote.__caresse = true;
  /* Tout est calcule par le script, image par image, sans transition CSS ni calque par
     piece : chaque piece glisse vers sa cible par interpolation (un cinquieme du chemin
     par image), la cible suit le pointeur, l amplitude monte en douceur a l entree et
     redescend a la sortie. Le premier geste et le centieme sont donc les memes. */
  /* 1er sept, Raouf : le mouvement, deux fois plus fort (3,4 -> 6,8 unites de
     glissement par piece, et l'inclinaison du dessin de 0,7 -> 1,4 degre). */
  var PORTEE = 190, AMPLI = 6.8, LISSAGE = 0.16;
  /* Deux gains, pas un. Un emblème repond de deux façons : ses PIECES s'ecartent
     vers le pointeur, et le DESSIN ENTIER se penche. En separant les deux, chaque
     main a son propre caractere (1er sept, Raouf : "au gyroscope ca bouge trop
     maintenant, la main c'est bien ; et un peu different, ce n'est pas le meme
     effet") :
       la souris  : 1 / 1     — le curseur est precis, la mesure d'origine ;
       le doigt   : 2 / 2     — un geste large, une reponse large ;
       le capteur : 1,1 / 2,6 — les feuilles bougent peu, mais la plante PENCHE :
                    le telephone qu'on incline fait ployer le dessin comme sous le
                    vent, au lieu d'ecarter les feuilles comme un doigt qui passe. */
  var gainP = 1, gainT = 1;
  var pieces = null, centres = null, poids = null, cour = null, cible = null, rayons = null;
  /* LE VENT (1er sept, Raouf : "au gyroscope, ne bouge pas trop le centre de la
     plante, plutot les extremites, et avec plus de synergie"). La souris est un
     effet LOCAL : les pieces pres du curseur bougent, il se deplace, l'effet
     voyage. Reproduire ca avec un pointeur virtuel pres du centre donnait ce
     qu'il a vu : le coeur qui remue, les pointes mortes. Le telephone qu'on
     incline n'est pas un curseur, c'est un souffle sur toute la plante : chaque
     piece part DANS LA MEME DIRECTION, d'autant plus loin qu'elle est loin du
     coeur (bras de levier, rayon^1.6). Le coeur tient, les feuilles ploient,
     ensemble. Le dessin entier s'incline un peu avec elles. */
  var vent = null;   /* {x,y} entre -1 et 1 quand le vent souffle, null sinon */
  var AMPLI_VENT = 7;   /* la piece la plus lointaine part de 7 unites a pleine inclinaison ; le coeur ne bouge pas */
  var actif = false, boucle = 0, t0 = 0, dernier = null, sr = 0, stx = 0, sty = 0, crx = 0, ctx = 0, cty = 0;
  /* fige : la pose atteinte se TIENT (le defilement a place l'emblème, il reste
     penche la ou il est) et la boucle s'arrete des qu'elle est posee : au repos,
     un emblème fige ne coute pas une image. */
  var fige = false;
  function preparer(){
    var racine = svg.firstElementChild; if(!racine) return false;
    var tous = Array.prototype.slice.call(racine.children).filter(function(n){ return n.tagName === 'g' || n.tagName === 'path'; });
    var marques = tous.filter(function(n){ return n.hasAttribute('data-caresse'); });
    pieces = marques.length ? marques : tous;
    if(!pieces.length){ pieces = [racine]; }
    poids = pieces.map(function(n){ var v = parseFloat(n.getAttribute('data-caresse')); return isNaN(v) ? 1 : v; });
    centres = pieces.map(function(n){ try{ var bx = n.getBBox(); var x = bx.x + bx.width/2, y = bx.y + bx.height/2;
      var tl = n.transform && n.transform.baseVal, m = tl && tl.numberOfItems ? tl.consolidate() : null;
      if(m){ var mm = m.matrix; return [mm.a*x + mm.c*y + mm.e, mm.b*x + mm.d*y + mm.f]; }
      return [x, y]; }catch(e){ return null; } });
    cour = pieces.map(function(){ return [0, 0]; }); cible = pieces.map(function(){ return [0, 0]; });
    /* le rayon de chaque piece : 0 au coeur du dessin, 1 a la piece la plus
       eloignee. C'est le bras de levier du vent (voir __caresseVent). Mesure a
       l'ECRAN (getBoundingClientRect), pas dans le repere local des pieces : les
       emblèmes sont dessines dans un groupe transforme, et le repere local
       rangeait toutes les feuilles pres du centre (mesure : 0,02 a 0,17 au lieu
       de 0,06 a 0,64). Normalise par piece la plus lointaine, chaque emblème
       ploie de la meme façon quelle que soit sa forme. */
    try{
      var rs = svg.getBoundingClientRect(), scx = rs.left + rs.width/2, scy = rs.top + rs.height/2;
      rayons = pieces.map(function(n){ var r = n.getBoundingClientRect(); return Math.hypot(r.left + r.width/2 - scx, r.top + r.height/2 - scy); });
      var rmax = Math.max.apply(null, rayons) || 1;
      rayons = rayons.map(function(r){ return r / rmax; });
    }catch(e){ rayons = pieces.map(function(){ return 0.5; }); }
    svg.style.transformOrigin = '50% 60%';
    return true;
  }
  function pointeur(ev){
    var m = svg.getScreenCTM(); if(!m) return null;
    var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    return pt.matrixTransform(m.inverse());
  }
  /* la cible de chaque piece, depuis le dernier pointeur et la montee d entree */
  function viser(){
    if(vent){
      var ev2 = actif ? Math.min(1, (performance.now() - t0) / 700) : 0; ev2 = 1 - Math.pow(1 - ev2, 3);
      crx = vent.x * 1.2 * ev2; ctx = vent.x * 0.5 * ev2; cty = vent.y * 0.5 * ev2;
      for(var j = 0; j < pieces.length; j++){
        var bras = Math.pow(rayons[j] || 0, 1.6) * AMPLI_VENT * ev2 * poids[j];
        cible[j][0] = vent.x * bras; cible[j][1] = vent.y * bras;
      }
      return;
    }
    var p = dernier ? pointeur(dernier) : null;
    var e = actif && p ? Math.min(1, (performance.now() - t0) / 700) : 0; e = 1 - Math.pow(1 - e, 3);
    var vb = svg.viewBox && svg.viewBox.baseVal;
    var cx = vb ? vb.x + vb.width/2 : 0, cy = vb ? vb.y + vb.height/2 : 0, demi = vb ? Math.max(vb.width, vb.height)/2 : 120;
    if(p){
      var nx = Math.max(-1, Math.min(1, (p.x - cx)/demi)), ny = Math.max(-1, Math.min(1, (p.y - cy)/demi));
      crx = nx * 1.4 * e * gainT; ctx = nx * 1.6 * e * gainT; cty = ny * 1.6 * e * gainT;
    } else { crx = ctx = cty = 0; }
    for(var i = 0; i < pieces.length; i++){
      var c = centres[i]; if(!c || !p){ cible[i][0] = cible[i][1] = 0; continue; }
      var dx = p.x - c[0], dy = p.y - c[1], d = Math.sqrt(dx*dx + dy*dy);
      var w = Math.max(0, 1 - d/PORTEE); w = w*w;
      var k = d > 0.5 ? (AMPLI * gainP * e * poids[i] * w / d) : 0;
      cible[i][0] = dx*k; cible[i][1] = dy*k;
    }
  }
  function tourner(){
    boucle = 0;
    viser();
    var reste = 0;
    sr += (crx - sr) * LISSAGE; stx += (ctx - stx) * LISSAGE; sty += (cty - sty) * LISSAGE;
    svg.style.rotate = sr.toFixed(3) + 'deg'; svg.style.translate = stx.toFixed(2) + 'px ' + sty.toFixed(2) + 'px';
    reste += Math.abs(crx - sr) + Math.abs(ctx - stx) + Math.abs(cty - sty);
    for(var i = 0; i < pieces.length; i++){
      var q = cour[i], t = cible[i];
      q[0] += (t[0] - q[0]) * LISSAGE; q[1] += (t[1] - q[1]) * LISSAGE;
      reste += Math.abs(t[0] - q[0]) + Math.abs(t[1] - q[1]);
      if(Math.abs(q[0]) < 0.005 && Math.abs(q[1]) < 0.005 && !t[0] && !t[1]){ if(pieces[i].__t){ pieces[i].style.translate = ''; pieces[i].__t = false; } continue; }
      pieces[i].style.translate = q[0].toFixed(2) + 'px ' + q[1].toFixed(2) + 'px'; pieces[i].__t = true;
    }
    if(fige){ if(reste > 0.02) boucle = requestAnimationFrame(tourner); return; }
    if(actif || reste > 0.02) boucle = requestAnimationFrame(tourner);
    else { svg.style.rotate = ''; svg.style.translate = ''; }
  }
  function bouger(ev){
    if(!pieces && !preparer()) return;
    if(!actif){ actif = true; t0 = performance.now(); }
    /* un vrai geste (souris ou doigt) porte un type ; le pointeur virtuel du
       gyroscope, non. La main a toujours le dernier mot sur le capteur. */
    if(ev && ev.type) DERNIER_GESTE = performance.now();
    fige = false; vent = null;
    dernier = ev;
    if(!boucle) boucle = requestAnimationFrame(tourner);
  }
  function lacher(){ fige = false; vent = null; if(!actif) return; actif = false; dernier = null; if(!boucle) boucle = requestAnimationFrame(tourner); }
  if(window.requestAnimationFrame) requestAnimationFrame(function(){ requestAnimationFrame(function(){ if(!pieces) preparer(); }); });
  function aLaSouris(ev){ if(ev.pointerType === 'touch') return; gainP = gainT = 1; bouger(ev); }
  hote.addEventListener('pointermove', aLaSouris, { passive:true });
  hote.addEventListener('pointerdown', aLaSouris, { passive:true });
  hote.addEventListener('pointerleave', lacher);
  hote.addEventListener('pointerup', lacher);
  /* 1er sept, Raouf : AU DOIGT, C'EST LE MEME GESTE QU'A LA SOURIS. Le doigt
     qui glisse sur l'emblème fait exactement ce que fait le pointeur. Les
     evenements pointeur sont annules par le navigateur des que le geste
     devient un defilement (pointercancel) : les evenements tactiles prennent
     alors le relais et la caresse continue tant que le doigt touche. */
  /* 1er sept, Raouf : "s'il presse loin de la plante, dans le blanc, sans toucher
     aucune ligne noire, ca veut dire qu'il veut defiler : alors on defile, tout de
     suite". La boite d'un emblème est un carre ; le dessin, lui, est de l'encre au
     milieu de beaucoup de blanc. C'est donc l'ENCRE qui prend le geste, pas la
     boite : au poser du doigt on regarde ce qu'il y a REELLEMENT sous lui (le
     navigateur ne compte que les surfaces peintes d'un svg). Sur l'encre — a huit
     pixels pres, pour que le jeu reste facile entre deux feuilles — le doigt joue
     et la page ne bouge pas. Dans le blanc, on ne retient rien : la page defile
     comme partout ailleurs, des le premier pixel. */
  var doigt = false, tranche = false, dx0 = 0, dy0 = 0, aJoue = false;
  /* Deux questions, pas une (1er sept, Raouf : "distingue mieux le doigt qui
     defile du doigt qui joue avec la plante").
     1. OU s'est-il pose ? La boite d'un emblème est un carre, le dessin est de
        l'encre au milieu de beaucoup de blanc. Seule l'ENCRE retient le doigt,
        a cinq pixels pres (le navigateur ne compte que les surfaces peintes).
        Dans le blanc, rien n'est retenu : la page defile au premier pixel.
     2. QUE fait-il ? Meme pose sur une feuille, un doigt qui part droit vers le
        haut ou vers le bas, franchement, VEUT DEFILER : on lui rend la page.
        Un doigt qui part de biais, ou qui traine, joue. La reponse se decide au
        tout premier deplacement — apres, le navigateur a deja choisi. */
  function surEncre(x, y){
    var pas = [[0,0],[5,0],[-5,0],[0,5],[0,-5]];
    for(var i = 0; i < pas.length; i++){
      var e = document.elementFromPoint(x + pas[i][0], y + pas[i][1]);
      if(e && e !== svg && svg.contains(e)) return true;
    }
    return false;
  }
  function auDoigt(ev){
    var t = ev.touches && ev.touches[0]; if(!t) return;
    if(!doigt){
      if(ev.type !== 'touchstart') return;                 /* geste deja rendu a la page */
      if(!surEncre(t.clientX, t.clientY)) return;          /* du blanc : la page defile */
      doigt = true; tranche = false; dx0 = t.clientX; dy0 = t.clientY; aJoue = false;
      gainP = gainT = 2;                                   /* au doigt : deux fois plus */
      return;                                              /* on ne retient rien avant de savoir */
    }
    if(!tranche){
      var ax = Math.abs(t.clientX - dx0), ay = Math.abs(t.clientY - dy0);
      if(ax + ay < 3) return;                              /* trop tot pour lire l'intention */
      tranche = true;
      /* 2 sept, Raouf : "quand je joue avec mes mains, le defilement s'arrete ;
         je veux la meme chose sur la bouteille". La regle du 1er sept qui
         rendait la page a un doigt partant droit vers le haut ou le bas
         tuait le jeu sur la bouteille, haute et etroite : on y joue de haut
         en bas. Elle tombe. Sur l'encre on joue, dans le blanc on defile. */
    }
    if(!aJoue && Math.abs(t.clientX - dx0) + Math.abs(t.clientY - dy0) > 14){
      /* le doigt ne fait plus que toucher : IL JOUE. C'est l'instant, et le seul,
         ou l'on propose le capteur (1er sept, Raouf : "que la demande arrive
         quand on commence a jouer, pas en entrant sur le site"). */
      aJoue = true; PROPOSER_CAPTEUR();
    }
    if(ev.cancelable) ev.preventDefault();                 /* il joue : la page ne bouge pas sous lui */
    DERNIER_GESTE = performance.now();                     /* 2 sept : le doigt date son geste, sinon le capteur le recouvrait toutes les 32 ms (Raouf : "capteur allume, je ne peux plus jouer") */
    bouger({ clientX:t.clientX, clientY:t.clientY });
  }
  function doigtParti(){ doigt = false; tranche = false; lacher(); }
  hote.addEventListener('pointercancel', function(){ if(!doigt) lacher(); });
  hote.addEventListener('touchstart', auDoigt, { passive:false });
  hote.addEventListener('touchmove', auDoigt, { passive:false });
  hote.addEventListener('touchend', doigtParti, { passive:true });
  hote.addEventListener('touchcancel', doigtParti, { passive:true });
  /* 1er sept, Raouf : "quand on presse l'image de la plante, rien n'arrive, on ne
     va pas sur une autre page ; on n'y va que par les mots en dessous — on ne peut
     pas jouer avec quelque chose qui est un lien."
     Le dessin devient donc un objet qu'on manipule, pas une porte : tout clic ne
     dans l'emblème s'arrete la. Le mot sous le dessin (« Voir la bouteille ») garde
     le lien, seul. Le defilement du doigt sur la carte reste normal. */
  var lien = hote.closest && hote.closest('a[href]');
  if(lien){
    hote.style.cursor = 'default';
    hote.style.webkitTapHighlightColor = 'transparent';
    hote.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); }, true);
  }
  /* AU GYROSCOPE, C'EST LE MEME GESTE AUSSI. On ne deplace pas la plante :
     on pose un pointeur virtuel dans l'emblème, a l'endroit ou l'inclinaison
     du telephone le met (-1 = bord gauche/haut, +1 = bord droit/bas de la
     boite du dessin), et la caresse fait le reste : les pieces proches se
     penchent vers lui, le dessin s'incline d'un degre. Exactement la souris. */
  hote.__caresseVers = function(nx, ny, gp, gt){
    var r = svg.getBoundingClientRect();
    if(!(r.width > 0)) return;
    gainP = (gp == null) ? 1 : gp; gainT = (gt == null) ? gainP : gt;   /* 0 est un gain valable : le capteur au repos */
    bouger({ clientX:r.left + r.width * (0.5 + nx * 0.5),
             clientY:r.top  + r.height * (0.5 + ny * 0.5) });
  };
  /* le vent : x, y entre -1 et 1, l'inclinaison du telephone */
  hote.__caresseVent = function(x, y){
    if(!pieces && !preparer()) return;
    if(!actif){ actif = true; t0 = performance.now(); }
    fige = false; dernier = null;
    vent = { x:Math.max(-1, Math.min(1, x)), y:Math.max(-1, Math.min(1, y)) };
    if(!boucle) boucle = requestAnimationFrame(tourner);
  };
  hote.__caresseLache = lacher;
  /* poser la caresse et la tenir la (fin d'un defilement) */
  hote.__caresseFiger = function(){ if(!actif) return; fige = true; if(!boucle) boucle = requestAnimationFrame(tourner); };
  CARESSES.push(hote);
}

/* ---------------------------------------------------------------------------
   LE GYROSCOPE (1er sept, Raouf : "je ne veux pas que la plante se deplace
   en entier, je veux la MEME animation que la souris quand je bouge le
   telephone"). Un seul pilote pour toute la page : il lit l'inclinaison, la
   ramene entre -1 et +1, et la donne comme position de pointeur a chaque
   emblème caressable visible a l'ecran. Aucune couche ne se translate : c'est
   la caresse, la vraie, celle du curseur.
   iOS 13+ ne livre les capteurs qu'en HTTPS et apres un geste : le premier
   toucher de la page les reveille, sans bouton. Coupe si mouvement reduit.
   ------------------------------------------------------------------------ */
var CARESSES = [], DERNIER_GESTE = 0;
/* propose le capteur de mouvement, au moment du jeu et jamais avant. Rend true
   si quelque chose a ete ouvert (l'appel qui suit ne doit alors pas naviguer). */
var PROPOSER_CAPTEUR = function(){ return false; };
(function vivre(){
  if(reduitMouvement) return;
  /* -------------------------------------------------------------------------
     LA VIE DES EMBLEMES, ET LA DEMANDE DU CAPTEUR AU BON MOMENT.
     1er sept, Raouf : "que les gens puissent commencer a jouer, et que la
     demande arrive quand on arrive a la plante et qu'on commence a jouer avec ;
     et que la demande soit dans le site, pas une notification iOS".
     Ce qui est possible, et ce qui ne l'est pas : la boite d'iOS ne peut pas
     etre remplacee — requestPermission ouvre une boite du systeme, point. Mais
     on peut la PRECEDER et la CHOISIR : la maison pose d'abord son propre mot,
     dans sa lettre et ses couleurs, et il n'apparait qu'a l'instant ou un doigt
     se met a jouer avec un emblème. Rien a l'arrivee sur le site, rien avant.
     Qui refuse n'est plus jamais derange. Qui accepte une fois n'a plus que la
     boite d'iOS aux sessions suivantes (elle, iOS la redemande a chaque fois).
     Et sans capteur du tout, le DOIGT et le DEFILEMENT mènent la meme caresse.
     ---------------------------------------------------------------------- */
  /* LE CAPTEUR EST UNE SOURIS QUI TOURNE AUTOUR DE LA PLANTE (1er sept au soir,
     Raouf : "imite le mouvement que je fais a la souris quand je tourne autour
     de la plante en cercle, pas toucher le centre ; dans la direction ou le
     telephone penche ; et deux fois plus sensible, c'est trop faible"). Le vent
     est retire. L'inclinaison du telephone est un VECTEUR : sa direction dit de
     quel cote de la plante le curseur se tient, sa longueur dit avec quelle
     force il appuie. Le curseur virtuel n'entre jamais dans le coeur : il tient
     sur le bord du dessin (ORBITE), la ou passe le vrai curseur quand on tourne
     autour, et la caresse fait le reste, exactement comme a la souris : les
     feuilles proches s'ecartent, le dessin entier se penche vers lui. Tourner le
     telephone, c'est tourner autour de la plante. */
  /* 2 sept, 01h37, Raouf : "quand je bouge le telephone, c'est comme ma main
     qui pousse la plante, pas au centre mais au milieu de la plante, j'aime cet
     effet ; pas la plante qui tourne ou se deplace". Le curseur se tient donc
     a MI-RAYON (0,58), la ou la souris fait cet effet-la, et le dessin entier
     ne s'incline plus ni ne se deplace (gain d'inclinaison a zero) : seules
     les pieces autour de la main s'ecartent. */
  var ORBITE = 0.58;           /* le curseur tient a 58 % du demi-cote de la boite : au milieu de la plante */
  var GAIN = 2;                /* a pleine inclinaison : la reponse du doigt (2), deux fois la souris ; sur les pieces seulement */
  var ZONE_MORTE = 0.06;       /* sous six centiemes d'inclinaison, la plante est au repos */
  var ANCRE = 0.45;            /* hauteur de l'ancre du defilement a l'ecran : un peu au dessus du milieu */
  var nx = 0, ny = 0, vise = { x:0, y:0 }, boucle = 0, dernierT = 0;
  var capteur = 0, defile = 0;  /* instants du dernier signal de chaque source */

  function nourrir(){
    var mag = Math.min(1, Math.hypot(nx, ny));
    var force = mag <= ZONE_MORTE ? 0 : (mag - ZONE_MORTE) / (1 - ZONE_MORTE);
    force = force * force * (3 - 2 * force);                              /* montee douce depuis le repos */
    var ux = mag > 0 ? nx / mag : 0, uy = mag > 0 ? ny / mag : 0;         /* la direction, seule */
    for(var i = 0; i < CARESSES.length; i++){
      var h = CARESSES[i];
      if(!h.__caresseVers || !h.isConnected) continue;
      var r = h.getBoundingClientRect();
      if(r.bottom < 0 || r.top > innerHeight || !r.width) continue;   /* hors de l'ecran : rien */
      if(capteur){
        if(h.__nomEmbleme === 'botella') continue;                           /* 2 sept, Raouf : le capteur ne touche pas la bouteille ; le doigt et la souris, si */
        if(!force){ if(h.__caresseLache) h.__caresseLache(); continue; }    /* telephone au repos : la plante aussi */
        h.__caresseVers(ux * ORBITE, uy * ORBITE, GAIN * force, 0);   /* la main a mi-rayon, du cote ou ca penche ; le dessin ne bouge pas en entier */
        continue;
      }
      /* le defilement souffle aussi (meme remarque de Raouf : le coeur ne doit pas
         remuer, les pointes oui, ensemble). La force vient de la distance entre
         le centre de l'emblème et l'ancre de l'ecran ; la direction est un vent
         de biais, plus couche que droit : une plante ploie de cote, elle ne
         s'ecrase pas. */
      var c = r.top + r.height / 2, d = Math.max(-1, Math.min(1, (innerHeight * ANCRE - c) / (r.height * 0.75)));
      if(h.__caresseVent) h.__caresseVent(d * 0.6, d * 0.4);
    }
  }
  function poserTout(){
    /* le defilement s'arrete : chaque emblème GARDE la pose qu'il vient de
       prendre (il est penche selon l'endroit ou il s'est arrete a l'ecran) et
       sa boucle s'eteint. Rien ne clignote, rien ne tourne pour rien. */
    for(var i = 0; i < CARESSES.length; i++){ if(CARESSES[i].__caresseFiger) CARESSES[i].__caresseFiger(); }
  }
  function tourner(t){
    boucle = 0;
    var now = performance.now();
    if(now - capteur > 2000 && now - defile > 500){ poserTout(); return; }
    /* et il glisse : un huitieme du chemin par image, le curseur suit le
       poignet avec un petit retard, comme une main qui accompagne. */
    if(capteur) { nx += (vise.x - nx) * 0.12; ny += (vise.y - ny) * 0.12; }
    if(t - dernierT > 32 && now - DERNIER_GESTE > 1200){ dernierT = t; nourrir(); }
    boucle = requestAnimationFrame(tourner);
  }
  function reveiller(){ if(!boucle) boucle = requestAnimationFrame(tourner); }

  /* le defilement : gratuit, partout, sans un mot */
  addEventListener('scroll', function(){ defile = performance.now(); reveiller(); }, { passive:true });

  /* 15 degres d'inclinaison pour porter le curseur jusqu'au bord (30 avant :
     deux fois plus sensible). Le REPOS n'est plus un angle fixe (40 degres) :
     c'est la pose du telephone dans la main, lue au premier signal, puis qui
     suit lentement la main (quatre secondes) : une inclinaison tenue devient
     la nouvelle pose de repos, et c'est le MOUVEMENT du telephone, quelle que
     soit la facon de le tenir, qui promene le curseur autour de la plante. */
  var PORTEE_DEG = 15, REPOS_S = 4;
  function ecouter(){
    var b0 = null, g0 = null, tPrec = 0;
    window.addEventListener('deviceorientation', function(e){
      if(e.gamma == null && e.beta == null) return;      /* pas de capteur reel : on ignore */
      var b = e.beta || 0, g = e.gamma || 0, now = performance.now();
      if(b0 == null){ b0 = b; g0 = g; tPrec = now; }
      var k = 1 - Math.exp(-Math.min(0.1, (now - tPrec) / 1000) / REPOS_S); tPrec = now;
      b0 += (b - b0) * k; g0 += (g - g0) * k;
      vise.x = Math.max(-1, Math.min(1, (g - g0) / PORTEE_DEG));
      vise.y = Math.max(-1, Math.min(1, (b - b0) / PORTEE_DEG));
      capteur = now;
      reveiller();
    }, true);
  }

  var iOS = typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function';
  if(!iOS){ if('DeviceOrientationEvent' in window) ecouter(); return; }

  /* ---- iOS : le mot de la maison, puis la boite du systeme ---- */
  function memoire(cle){ try{ return localStorage.getItem(cle); }catch(e){ return null; } }
  function noter(cle, v){ try{ localStorage.setItem(cle, v); }catch(e){} }
  var demande = false, panneau = null;
  function demanderAuSysteme(){
    DeviceOrientationEvent.requestPermission()
      .then(function(rep){ if(rep === 'granted'){ noter('ida.capteur', 'oui'); ecouter(); }
                           else noter('ida.capteur', 'non'); })
      .catch(function(){});
  }
  function fermer(){ if(panneau){ panneau.classList.remove('est-la'); var q = panneau;
    setTimeout(function(){ if(q.parentNode) q.parentNode.removeChild(q); }, 400); panneau = null; } }
  function mot(){
    var l = (window.siteChrome && siteChrome.langueCourante) ? siteChrome.langueCourante() : 'fr';
    var T = {
      fr:{ p:"Incliner le téléphone fait vivre les plantes.", oui:"Activer", non:"Non merci" },
      es:{ p:"Inclinar el teléfono hace vivir las plantas.",  oui:"Activar", non:"No, gracias" },
      en:{ p:"Tilting the phone brings the plants to life.",  oui:"Turn on", non:"No thanks" }
    };
    return T[l] || T.fr;
  }
  function proposer(){
    if(demande) return false;
    demande = true;
    if(memoire('ida.capteur') === 'non') return false;        /* refuse une fois : plus jamais */
    if(memoire('ida.capteur') === 'oui'){ demanderAuSysteme(); return true; }
    var t = mot();
    panneau = document.createElement('div');
    panneau.className = 'capteur';
    panneau.setAttribute('role', 'group');
    panneau.innerHTML = '<p class="capteur__mot"></p>' +
      '<div class="capteur__b"><button type="button" class="capteur__oui"></button>' +
      '<button type="button" class="capteur__non"></button></div>';
    panneau.querySelector('.capteur__mot').textContent = t.p;
    panneau.querySelector('.capteur__oui').textContent = t.oui;
    panneau.querySelector('.capteur__non').textContent = t.non;
    document.body.appendChild(panneau);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ if(panneau) panneau.classList.add('est-la'); }); });
    panneau.querySelector('.capteur__oui').addEventListener('click', function(){ fermer(); demanderAuSysteme(); });
    panneau.querySelector('.capteur__non').addEventListener('click', function(){ noter('ida.capteur', 'non'); fermer(); });
    /* seul, il s'efface : on ne barre pas une page pour un ornement */
    setTimeout(function(){ if(panneau) fermer(); }, 9000);
    return true;
  }
  PROPOSER_CAPTEUR = proposer;
})();
/* la naissance, une fois ; ensuite, pour la bouteille, chaque survol ne rejoue
   que le bouchon (la couronne de feuilles se referme et se rouvre, playCrown),
   jamais la construction entiere. Les autres emblèmes rejouent leur naissance. */
function jouerEmbleme(hote){
  var c = hote.__embleme;
  if(!c || reduitMouvement) return;
  /* 31 aout, Raouf : un emblème de FOND (le filigrane de la campagne) ne joue
     jamais sa construction : le bas arrivait d'un bloc, puis le reste. Un
     fond est la, complet, des le premier regard ; seul le fondu de la feuille
     l'amene. Regle generale : tout hote dans un fond. */
  if(hote.closest && hote.closest('.campagne__fond,.scene__fond')){ hote.__joue = true; return; }
  /* 1er sept, 00h35 : la naissance de la bouteille REJOUE (Raouf y tient) ;
     le defaut du bas-en-un-bloc se corrige dans le moteur, pas en la coupant. */
  if(hote.__joue && typeof c.playCrown === 'function'){ c.playCrown(); return; }
  hote.__joue = true;
  if(typeof c.play === 'function') c.play();
}

/* La fleur du sceau : les dix petales du logo de la famille (logo.js,
   window.logoParts().flower), posee comme emblème de "Les Mezcals" et de
   "Les trois", a la demande de Raouf le 16 aout au soir. Au repos elle est
   complete ; a l'appel, les petales eclosent du centre vers l'exterieur, comme
   dans l'animation du sceau. Meme interface que EMBLEMES_ANIME.mount. */
function monterFleur(svg){
  if(typeof window.logoParts !== 'function') return null;
  var P = window.logoParts();
  if(!P || !P.flower) return null;
  var NS = 'http://www.w3.org/2000/svg';
  var CX = 443, CY = 290;                 /* le centre du sceau, d'ou partent les petales */
  var FX = 443.435, FY = 278.82;          /* le centre de la boite de la fleur, mis en (0,0) */
  /* le groupe racine ne porte pas de transformation : ajusterEmbleme mesure
     sa boite avec getBBox, qui ignore la transformation de l'element lui meme.
     Le decalage vers le centre vit dans un groupe interieur. */
  var racine = document.createElementNS(NS, 'g');
  racine.setAttribute('fill', ENCRE);
  racine.setAttribute('fill-rule', 'evenodd');
  svg.appendChild(racine);
  var root = document.createElementNS(NS, 'g');
  root.setAttribute('transform', 'translate(' + (-FX) + ' ' + (-FY) + ')');
  racine.appendChild(root);
  function bbox(d){
    var nums = d.match(/-?\d+(\.\d+)?/g).map(Number), x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(var i=0;i<nums.length;i+=2){ var x=nums[i], y=nums[i+1]; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
    return [x0,y0,x1,y1];
  }
  function clamp(v,a,b){ return v<a?a:v>b?b:v; }
  function co(x){ var y=1-x; return 1-y*y*y; }
  var petales = P.flower.map(function(it){
    var b = bbox(it.d), bx = clamp(CX,b[0],b[2]), by = clamp(CY,b[1],b[3]);
    var g = document.createElementNS(NS,'g'); root.appendChild(g);
    var pth = document.createElementNS(NS,'path'); pth.setAttribute('d', it.d); g.appendChild(pth);
    return { g:g, bx:bx, by:by, dist:Math.hypot(it.cx-CX, it.cy-CY) };
  });
  var ds = petales.map(function(p){ return p.dist; }), dmin = Math.min.apply(null,ds), dmax = Math.max.apply(null,ds);
  petales.forEach(function(p){ p.k = (p.dist-dmin)/(dmax-dmin||1); });
  var DUR = 900, PETALE = 320, ETAL = DUR - PETALE;
  var c = {
    duration: DUR,
    render: function(ms){
      petales.forEach(function(p){
        var e = co(clamp((ms - ETAL*p.k)/PETALE, 0, 1));
        p.g.setAttribute('opacity', e > 0.1 ? 1 : 0);
        p.g.setAttribute('transform', e >= 1 ? '' :
          'translate(' + p.bx + ' ' + p.by + ') scale(' + e.toFixed(3) + ') translate(' + (-p.bx) + ' ' + (-p.by) + ')');
      });
    }
  };
  var raf = null, t0 = 0;
  c.play = function(){
    if(raf) cancelAnimationFrame(raf);
    t0 = performance.now();
    (function f(){ var ms = performance.now()-t0; c.render(ms); if(ms < DUR + 100) raf = requestAnimationFrame(f); else raf = null; })();
  };
  c.stop = function(){ if(raf) cancelAnimationFrame(raf); raf = null; };
  c.render(DUR);   /* au repos, complete */
  return c;
}

/* la chaine <svg> statique de l'emblème complet, pour tout usage ancien
   (siteChrome.embleme). null si l'emblème n'existe pas ou n'est pas charge.
   On le monte dans un svg cache mais rendu (les animations mesurent des boites
   avec getBBox, ce qui exige un element affiche), on lit, on retire. */
function embleme(cle){
  if(!cle || !EMBLEMES[cle]) return null;
  if(!emblemesPrets || (!window.EMBLEMES_ANIME && EMBLEMES[cle] !== 'fleur')) return null;
  var hote = document.body || document.documentElement;
  if(!hote) return null;
  var svg = creerSvgEmbleme();
  svg.setAttribute('style', 'position:fixed;left:-9999px;top:0;width:240px;height:240px;opacity:0;pointer-events:none');
  hote.appendChild(svg);
  var out = null;
  try{
    var c = EMBLEMES[cle] === 'fleur' ? monterFleur(svg) : window.EMBLEMES_ANIME.mount(EMBLEMES[cle], svg, { color:ENCRE, paper:PAPIER });
    if(c && c.stop) c.stop();
    var g = svg.firstElementChild;
    if(g){
      g.setAttribute('class', 'embleme__encre');
      encreCourante(svg);
      out = '<svg viewBox="-120 -120 240 240" aria-hidden="true" focusable="false">' + g.outerHTML + '</svg>';
    }
  }catch(e){ out = null; }
  hote.removeChild(svg);
  return out;
}

/* Les emblèmes n'ont pas la meme etendue d'encre dans le disque de 240 :
   la bouteille est haute et etroite (90 x 196), le ticket du registre est large
   et plat (180 x 104). Poses tels quels, l'un ecrase l'autre. On recadre donc
   chaque emblème sur son encre, puis on lui donne la meme HAUTEUR optique.
   C'est ce que veut dire "a la hauteur du mot". */
function ajusterEmbleme(svg, hauteur, largeurMax){
  /* 31 aout, refonte apres la casse vue par Raouf (fleur et tobala en carre
     d'encre) : la mesure ne se prend qu'UNE fois, au repos, puis se fige.
     Avant, chaque survol et chaque minuterie remesuraient ; si une naissance
     jouait a cet instant, la boite se refermait sur une image transitoire et
     l'emblème explosait dans sa case. Une fois fige, plus rien ne le touche. */
  if(svg.hasAttribute('data-fige')) return;
  var g = svg.querySelector('.embleme__encre');
  if(!g) return;
  /* jamais de mesure pendant qu'une naissance joue : l'hote marque __joue
     au premier jeu ; s'il joue et que la boite est deja posee, on fige. */
  var hote = svg.parentNode;
  var b;
  try{ b = g.getBBox(); }catch(e){ b = null; }
  if(!b || !b.width || !b.height){
    /* pas encore mesurable (monte avant la mise en page) : on borne quand meme
       le svg a sa case et on le marque, ajusterMenu repassera dessus */
    if(hauteur){
      svg.style.width = Math.min(hauteur, largeurMax) + 'px';
      svg.style.height = hauteur + 'px';
      svg.setAttribute('data-a-ajuster', '1');
    }
    return;
  }
  svg.removeAttribute('data-a-ajuster');
  var m = Math.max(b.width, b.height) * 0.04;   /* 4 % d'air autour de l'encre */
  svg.setAttribute('viewBox',
    (b.x - m).toFixed(1) + ' ' + (b.y - m).toFixed(1) + ' ' +
    (b.width + 2*m).toFixed(1) + ' ' + (b.height + 2*m).toFixed(1));
  if(!hauteur) return;
  var w = b.width + 2*m, h = b.height + 2*m;
  var k = Math.min(hauteur / h, largeurMax / w);
  /* egalite optique : la case borne la hauteur et la largeur, mais un emblème
     large (la fleur, le billet) y gagne pres du double d'encre qu'un emblème
     etroit (la bouteille). On plafonne donc l'AIRE apparente : jamais plus
     que celle d'un carre de la hauteur demandee. Regle generale, aucun
     emblème n'est nomme. */
  var aire = (w * k) * (h * k), plafond = hauteur * hauteur;
  if(aire > plafond) k *= Math.sqrt(plafond / aire);
  svg.style.width  = Math.round(w * k) + 'px';
  svg.style.height = Math.round(h * k) + 'px';
  /* la boite est posee au repos : elle se fige, aucun survol, aucune
     minuterie, aucun defilement ne la remesurera */
  svg.setAttribute('data-fige', '1');
}

/* pose les emblèmes demandes dans le corps de la page :
   <span class="embleme" data-embleme="mito" style="width:120px;height:120px"></span>
   Tout element [data-embleme] hors entete est pris : l'emblème se monte quand
   il entre dans l'ecran (complet, au repos), joue une fois quand 40 % de sa
   boite est visible, et c'est tout. Si une page l'a deja rempli avec
   l'ancienne chaine statique, le montage la remplace par la version animee. */
/* Idempotent : on peut le rappeler (init, juste apres les scripts de la page,
   au chargement) ; un hote deja pris n'est pas repris. */
var observateurEmblemes = null, hotesEmblemes = [];
function poserEmblemes(){
  /* un emblème que la page a insere elle meme via window.embleme_<cle> (grille
     de l'accueil, boutique...) porte la marque du fichier emblemes.js : on
     adopte son hote comme un [data-embleme], il devient anime lui aussi. */
  var marques = document.querySelectorAll('svg > g[data-embleme-statique]');
  for(var k=0;k<marques.length;k++){
    var svgS = marques[k].parentNode, hoteS = svgS && svgS.parentNode;
    if(hoteS && hoteS.nodeType === 1 && !hoteS.hasAttribute('data-embleme')){
      hoteS.setAttribute('data-embleme', marques[k].getAttribute('data-embleme-statique'));
    }
  }
  var els = document.querySelectorAll('[data-embleme]');
  var liste = [];
  for(var i=0;i<els.length;i++){
    if(els[i].__pose) continue;
    if(els[i].closest && els[i].closest('.tete')) continue;
    var cle = els[i].getAttribute('data-embleme');
    if(!EMBLEMES[cle]){
      /* pas d'emblème (cle inconnue) : la case se vide et se cache, le mot
         de la page reste seul. Jamais de remplacement. */
      while(els[i].firstChild) els[i].removeChild(els[i].firstChild);
      els[i].setAttribute('data-vide','1');
      els[i].setAttribute('hidden','');
      els[i].__pose = true;
      continue;
    }
    els[i].__pose = true;
    liste.push(els[i]);
    hotesEmblemes.push(els[i]);
    /* l'emblème d'une scene (index, pages bouteille) ne se pose plus SUR le
       texte : la scene l'empile au dessus du texte, dans le flux, 23 px entre
       les deux (Raouf, 16 aout au soir). La feuille fait le reste. */
    if(els[i].classList.contains('scene__marque') && els[i].closest){
      var sc = els[i].closest('.scene');
      if(sc) sc.classList.add('scene--empilee');
    }
  }
  if(!liste.length) return;

  /* en page, l'emblème nait UNE fois, a 40 % visible, et plus jamais : pas de
     rejeu au survol ni au doigt (Raouf, 16 aout au soir). Le survol anime
     seulement la barre, les panneaux et le tiroir. */

  if(!('IntersectionObserver' in window)){
    liste.forEach(function(el){ quandEmblemesPrets(function(){ monterEmblemeEnPage(el); }); });
    return;
  }
  /* tant que la porte d'age est la, rien ne joue derriere elle : l'observation
     commence quand elle s'efface, sinon la naissance se perd sans temoin */
  quandPorteFermee(function(){
    var o = observateurEmblemesEnPage();
    liste.forEach(function(el){ o.observe(el); });
  });
}

/* monte l'emblème d'un hote de page ; false si les fichiers manquent encore */
function monterEmblemeEnPage(el){
  var c = monterEmbleme(el, el.getAttribute('data-embleme'));
  if(c === null){
    quandEmblemesPrets(function(){ monterEmblemeEnPage(el); });
    return false;
  }
  /* seul le <span class="embleme"> du contrat est recadre sur son encre ; un
     autre hote (scene, grille, fond de campagne) garde le disque entier de
     240, parce que sa feuille le dimensionne en largeur avec height:auto */
  if(el.classList.contains('embleme')){
    var svg = el.querySelector('svg');
    if(svg) ajusterEmbleme(svg, 0, 0);
  }
  return true;
}

/* l'observateur unique des emblèmes de page : montage a la premiere
   apparition, naissance a 40 % visible, une fois */
function observateurEmblemesEnPage(){
  if(observateurEmblemes) return observateurEmblemes;
  var o = new IntersectionObserver(function(entrees){
    entrees.forEach(function(e){
      var el = e.target;
      if(!e.isIntersecting) return;
      if(el.__embleme === undefined){
        /* premiere apparition : on monte, complet, au repos */
        var ok = monterEmblemeEnPage(el);
        if(!ok){ el.__aJouer = e.intersectionRatio >= 0.4; return; }
      }
      if(e.intersectionRatio >= 0.4 && !el.__joue){
        jouerEmbleme(el);          /* la naissance, une fois ; pose el.__joue */
        o.unobserve(el);
      }
    });
  }, { threshold:[0, 0.4] });
  /* si les fichiers arrivent apres que l'emblème est deja bien visible */
  quandEmblemesPrets(function(){
    hotesEmblemes.forEach(function(el){
      if(el.__aJouer && !el.__joue && el.__embleme){ jouerEmbleme(el); o.unobserve(el); }
    });
  });
  observateurEmblemes = o;
  return o;
}

/* la porte d'age : ce qui doit attendre qu'elle s'efface */
var porteEnCours = false, attentePorte = [];
function quandPorteFermee(fn){
  if(!porteEnCours){ fn(); return; }
  attentePorte.push(fn);
}
function porteFermee(){
  porteEnCours = false;
  var l = attentePorte; attentePorte = [];
  for(var i=0;i<l.length;i++){ try{ l[i](); }catch(e){} }
}

/* la hauteur optique des emblèmes du menu, une fois l'entete posee */
function ajusterMenu(tete){
  /* dans le tiroir du telephone (jusqu'a 1000 px) l'emblème vit dans une case
     de 44 px : 36 px de haut, 44 de large au plus. Au bureau, 52 sur 112. */
  var petit = window.matchMedia('(max-width:1000px)').matches;
  var H = petit ? 36 : 52, W = petit ? 44 : 112;
  var svgs = tete.querySelectorAll('.menu__embleme svg');
  for(var i=0;i<svgs.length;i++) ajusterEmbleme(svgs[i], H, W);
}

/* monte (une fois) puis joue l'emblème d'une case du menu ou d'un panneau.
   La case doit etre affichee. */
function reveillerEmbleme(hote, tete){
  if(!hote) return;
  var c = monterEmbleme(hote, hote.getAttribute('data-cle'));
  if(c === null){
    quandEmblemesPrets(function(){ reveillerEmbleme(hote, tete); });
    return;
  }
  if(c && hote.classList.contains('menu__embleme') && tete) ajusterMenu(tete);
  if(c && hote.classList.contains('nav__em')){
    var sv = hote.querySelector('svg');
    if(sv) ajusterEmbleme(sv, 36, 44);   /* la case de la barre : 44 px, l'encre a 36 de haut */
  }
  jouerEmbleme(hote);
}

/* ---------------------------------------------------------------------------
   4. L'ENTETE ET LE MENU.
   Deux bandes : la marque et la langue, puis le menu.
   Au survol, au focus, au doigt : le mot sort, l'emblème entre, meme centre,
   280 ms, une seule courbe. Une entree sans emblème garde son mot.
   ------------------------------------------------------------------------ */
/* ---------------------------------------------------------------------------
   LES ICONES DE L ENTETE. Trait de 1 px, 22 px de cote, meme facture que les
   leurs : un dessin au trait, jamais un aplat. Le registre est un ticket
   perfore, parce que l etiquette de cette maison EST un ticket. Le panier est
   un sac qui porte son compte, comme chez eux.
   ------------------------------------------------------------------------ */
var ICONES = {
  /* Toutes sur une grille de 24, trait de 1,1, jointures rondes, meme masse
     optique : une icone plus grasse que sa voisine se voit tout de suite dans
     une entete. Aucune n est un aplat. */

  /* chercher : le geste le plus attendu d un site qui a un catalogue ET un
     registre ou l on entre un numero de bouteille. */
  chercher:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<circle cx="10.8" cy="10.8" r="6.4"/><path d="M15.5 15.5L20 20"/>' +
    '</svg>',

  /* le registre : le ticket de la maison. L etiquette officielle EST un ticket
     a encoches perforees, donc l icone est ce ticket, pas une loupe ni un
     livre. Deux encoches sur les flancs, trois lignes reglees dedans. */
  registre:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M3.6 7.2h16.8v3.05a1.9 1.9 0 0 0 0 3.5v3.05H3.6v-3.05a1.9 1.9 0 0 0 0-3.5z"/>' +
      '<path d="M8.4 10.6h7.2M8.4 13.4h4.6"/>' +
    '</svg>',

  /* le compte : la maison garde les donnees de ses clients, il faut donc une
     porte vers eux. Tete et epaules, la forme universelle. */
  compte:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="8.4" r="3.6"/>' +
      '<path d="M4.9 20.1a7.6 7.6 0 0 1 14.2 0"/>' +
    '</svg>',

  /* le lieu : une epingle de carte, pour les points de vente (pied du tiroir). */
  lieu:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M12 21.2s-6.4-6.1-6.4-11.1a6.4 6.4 0 0 1 12.8 0c0 5-6.4 11.1-6.4 11.1z"/>' +
      '<circle cx="12" cy="10.1" r="2.3"/>' +
    '</svg>',

  /* la bulle : nous contacter (pied du tiroir). */
  bulle:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M4.2 5.6h15.6v10.2H10.4l-4.2 3.4v-3.4h-2z"/>' +
    '</svg>',

  /* l'enveloppe : ecrire a la maison (pied de page). */
  courriel:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M3.6 6.4h16.8v11.2H3.6z"/><path d="M3.6 6.9l8.4 6.3 8.4-6.3"/>' +
    '</svg>',

  /* le glyphe Instagram au trait : carre arrondi, cercle, point, un seul trait. */
  instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<rect x="4" y="4" width="16" height="16" rx="4.4"/><circle cx="12" cy="12" r="3.6"/>' +
      '<path d="M16.6 7.4h.01"/>' +
    '</svg>',

  /* le sac, avec son compte inscrit dedans. */
  panier:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M4.7 7.9h14.6v11.9H4.7z"/>' +
      '<path d="M9.2 7.9V6.4a2.8 2.8 0 0 1 5.6 0v1.5"/>' +
    '</svg>'
};


/* ---------------------------------------------------------------------------
   LE PANIER. La famille veut vendre depuis le site, decision de l appel du
   27 juillet, lignes 74 a 78. Le panier vit dans le navigateur tant que la
   route technique n est pas tranchee, statique plus Stripe ou plateforme.
   ------------------------------------------------------------------------ */
var CLE_PANIER = 'ida.panier';

function panierLire(){
  try{ return JSON.parse(lire(CLE_PANIER) || '{}') || {}; }catch(e){ return {}; }
}
function panierEcrire(p){ ecrire(CLE_PANIER, JSON.stringify(p)); majPanier(); }
function panierNombre(){
  var p = panierLire(), n = 0, k;
  for(k in p){ if(Object.prototype.hasOwnProperty.call(p,k)) n += (p[k] | 0); }
  return n;
}
function panierAjouter(id, q){
  var p = panierLire();
  p[id] = (p[id] | 0) + (q == null ? 1 : q);
  if(p[id] < 1) delete p[id];
  panierEcrire(p);
  return panierNombre();
}
function majPanier(){
  var els = document.querySelectorAll('.nav__compte');
  var n = panierNombre();
  for(var i=0;i<els.length;i++){ els[i].textContent = String(n); }
  var b = document.querySelectorAll('.nav__sac');
  for(var j=0;j<b.length;j++){ b[j].classList.toggle('est-plein', n > 0); }
}

/* Le panneau d une entree groupee : il s ouvre au survol et au clavier, il se
   ferme quand le curseur quitte l entete, jamais avant. */
function brancherPanneaux(t){
  var fermer = function(){
    var ps = t.querySelectorAll('.pan');
    for(var i=0;i<ps.length;i++) ps[i].hidden = true;
    var ls = t.querySelectorAll('.nav__lien[aria-haspopup]');
    for(var j=0;j<ls.length;j++) ls[j].setAttribute('aria-expanded','false');
    t.classList.remove('a-panneau');
  };
  var ouvrir = function(id){
    fermer();
    var p = t.querySelector('.pan[data-pan="' + id + '"]');
    if(!p) return;
    p.hidden = false;
    var l = t.querySelector('.nav__i[data-groupe="' + id + '"] .nav__lien');
    if(l) l.setAttribute('aria-expanded','true');
    t.classList.add('a-panneau');
    /* le panneau s'ouvre au survol de l'entree : ses emblèmes naissent a ce
       moment, une fois par ouverture. C'est le survol du menu, pas un chargement. */
    var ems = p.querySelectorAll('.pan__em[data-cle]');
    for(var e=0;e<ems.length;e++) reveillerEmbleme(ems[e], t);
  };
  /* survoler une carte du panneau rejoue son emblème */
  var cartes = t.querySelectorAll('.pan__c');
  for(var c=0;c<cartes.length;c++){
    (function(carte){
      var em = carte.querySelector('.pan__em[data-cle]');
      if(!em) return;
      var rejouer = function(){ if(em.__embleme && estCaressable(em.__nomEmbleme)) return; reveillerEmbleme(em, t); };   /* la bouteille, les agaves, le palenque restent : c'est la caresse qui repond au survol */
      carte.addEventListener('mouseenter', rejouer);
      carte.addEventListener('focus', rejouer);
    })(cartes[c]);
  }
  var items = t.querySelectorAll('.nav__i[data-groupe]');
  for(var i=0;i<items.length;i++){
    (function(it){
      var id = it.getAttribute('data-groupe');
      it.addEventListener('mouseenter', function(){ ouvrir(id); });
      it.addEventListener('focusin', function(){ ouvrir(id); });
    })(items[i]);
  }
  var simples = t.querySelectorAll('.nav__i:not([data-groupe])');
  for(var k=0;k<simples.length;k++) simples[k].addEventListener('mouseenter', fermer);
  /* le survol mot vers emblème sur chaque entree de la barre */
  var tous = t.querySelectorAll('.nav__i .nav__lien[data-a-embleme]');
  for(var u=0;u<tous.length;u++){
    (function(a){
      var em = a.querySelector('.nav__em[data-cle]');
      function entre(){ a.classList.add('est-survole'); reveillerEmbleme(em, t); }
      function sort(){ a.classList.remove('est-survole'); }
      a.addEventListener('mouseenter', entre);
      a.addEventListener('mouseleave', sort);
      a.addEventListener('focus', entre);
      a.addEventListener('blur', sort);
    })(tous[u]);
  }
  t.addEventListener('mouseleave', fermer);
  t.addEventListener('keydown', function(e){ if(e.key === 'Escape') fermer(); });
  var b = t.querySelector('.nav__burger');
  if(b) brancherTiroir(t, b);
}

/* Le tiroir du telephone : il glisse (transform et opacite, 260 ms, la courbe
   du site), la page ne defile plus derriere, le clavier reste dedans (Tab
   tourne dans le panneau), Echap ferme, le voile ferme, la croix ferme. A
   l'ouverture les emblèmes se montent, complets, sans jouer : ils jouent au
   doigt, sur l'entree qu'on touche. */
function brancherTiroir(t, b){
  var m = t.querySelector('.menu');
  if(!m) return;
  var panneau = m.querySelector('.menu__panneau');
  var voile = m.querySelector('.menu__voile');
  var croix = m.querySelector('.menu__fermer');
  var minuterie = null;

  function focusables(){
    return panneau.querySelectorAll('a[href],button:not([disabled])');
  }
  function monterTout(){
    var ems = m.querySelectorAll('.menu__embleme[data-cle]');
    for(var e=0;e<ems.length;e++){
      (function(em){
        var c = monterEmbleme(em, em.getAttribute('data-cle'));
        if(c === null){ quandEmblemesPrets(function(){ monterEmbleme(em, em.getAttribute('data-cle')); ajusterMenu(t); }); }
      })(ems[e]);
    }
    ajusterMenu(t);
  }
  function ouvrir(){
    if(minuterie){ clearTimeout(minuterie); minuterie = null; }
    m.hidden = false;
    b.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('menu-ouvert');
    void m.offsetWidth;                 /* le navigateur voit l'etat ferme, puis la transition */
    m.classList.add('est-ouvert');
    monterTout();
    /* deuxieme passe apres la mise en page : un emblème monte trop tot garde
       sinon une taille provisoire (Raouf a vu un tobala demesure) */
    requestAnimationFrame(function(){ ajusterMenu(t); });
    /* 31 aout : un agave mesure en plein montage recoit une viewBox partielle
       et deborde, geant, sur les mots (revu ce soir). On repasse la mesure
       apres que tout s'est pose : deux rappels suffisent aux montages lents. */
    setTimeout(function(){ ajusterMenu(t); }, 150);
    setTimeout(function(){ ajusterMenu(t); }, 450);
    /* 1er sept : au doigt, la choregraphie remplace le survol : une fois les
       rangs poses, chaque emblème joue sa naissance, l'un apres l'autre */
    if(window.matchMedia('(max-width:1000px)').matches){
      setTimeout(function(){
        var ems = m.querySelectorAll('.menu__embleme[data-cle]');
        for(var e2=0; e2<ems.length; e2++){
          (function(em, i2){ setTimeout(function(){ jouerEmbleme(em); }, i2*70); })(ems[e2], e2);
        }
      }, 260);
    }
    /* le focus va au panneau, pas au premier lien : sinon l'anneau de focus
       encadre la marque a chaque ouverture (vu au rendu du 31 aout) */
    panneau.focus();
    document.addEventListener('keydown', clavier);
  }
  function fermer(){
    if(m.hidden) return;
    m.classList.remove('est-ouvert');
    b.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-ouvert');
    document.removeEventListener('keydown', clavier);
    minuterie = setTimeout(function(){ m.hidden = true; minuterie = null; }, 280);
    b.focus();
  }
  function clavier(e){
    if(e.key === 'Escape'){ fermer(); return; }
    if(e.key !== 'Tab') return;
    var f = focusables();
    if(!f.length) return;
    var premier = f[0], dernier = f[f.length-1];
    if(e.shiftKey && document.activeElement === premier){ e.preventDefault(); dernier.focus(); }
    else if(!e.shiftKey && document.activeElement === dernier){ e.preventDefault(); premier.focus(); }
    else if(!panneau.contains(document.activeElement)){ e.preventDefault(); premier.focus(); }
  }
  b.addEventListener('click', function(){ if(m.hidden) ouvrir(); else fermer(); });
  if(croix) croix.addEventListener('click', fermer);
  if(voile) voile.addEventListener('click', fermer);
  /* le tiroir se ferme si l'ecran repasse au bureau */
  window.addEventListener('resize', function(){
    if(!m.hidden && !window.matchMedia('(max-width:1000px)').matches) fermer();
  });
}

/* Le bouton unique de langue : il montre la langue courante, il ouvre les trois. */
function brancherLangue1(t){
  var b = t.querySelector('.lang1__b');
  var l = t.querySelector('.lang1__l');
  if(!b || !l) return;
  function fermer(){ l.hidden = true; b.setAttribute('aria-expanded','false'); }
  b.addEventListener('click', function(e){
    e.stopPropagation();
    var ouvert = !l.hidden;
    l.hidden = ouvert;
    b.setAttribute('aria-expanded', String(!ouvert));
  });
  l.addEventListener('click', function(e){
    var c = e.target.closest ? e.target.closest('.langue__b') : null;
    if(!c) return;
    var code = c.getAttribute('data-l');
    changerLangue(code);
    var span = t.querySelector('.lang1__c');
    if(span) span.textContent = code.toUpperCase();
    fermer();
  });
  document.addEventListener('click', fermer);
  t.addEventListener('keydown', function(e){ if(e.key === 'Escape') fermer(); });
}

/* Les trois boutons de langue, memes partout : entete du bureau (a droite des
   icones), bas du tiroir, pied de page. Texte nu, capitales du sceau 11 px
   espacees, la courante en brique sous son filet, serres a 10 px (Raouf, 16
   aout au soir, apres essai d'une boite qui ne convenait pas). */
function boutonsLangue(){
  return LANGUES.map(function(l){
    return '<button class="langue__b" type="button" data-l="' + l + '" aria-pressed="' +
           (l === langue ? 'true' : 'false') + '">' + l.toUpperCase() + '</button>';
  }).join('');
}
function brancherBoutonsLangue(racine){
  var lbs = racine.querySelectorAll('.langue__b');
  for(var q=0;q<lbs.length;q++){
    if(lbs[q].__branche) continue; lbs[q].__branche = true;
    lbs[q].addEventListener('click', function(){ changerLangue(this.getAttribute('data-l')); });
  }
}

function construireEntete(pageCourante){
  var t = document.createElement('header');
  t.className = 'tete';

  /* pas de sceau dans l'entete : a 30 px l'arc de lettres devient une bouillie.
     Le sceau vit en grand a la porte d'age et en 96 px au pied de page. */
  /* la case de l'emblème est vide a la construction : l'emblème anime s'y monte
     la premiere fois qu'on la reveille (survol, focus, doigt, ouverture du menu),
     parce que le montage mesure des boites et exige une case affichee. */
  var entrees = MENU.map(function(m){
    var a = emblemeExiste(m.embleme);
    return '<li>' +
      '<a class="menu__lien" href="' + m.href + '" data-id="' + m.id + '"' +
        (a ? ' data-a-embleme="1"' : '') +
        (m.id === pageCourante ? ' aria-current="page"' : '') + '>' +
        '<span class="menu__mot" data-fr="' + m.fr + '" data-es="' + m.es + '" data-en="' + m.en + '">' + m.fr + '</span>' +
        (a ? '<span class="menu__embleme" data-cle="' + m.embleme + '"></span>' : '') +
      '</a></li>';
  }).join('');

  /* les trois bouteilles, sous les huit entrees du tiroir */
  var sousEntrees = BOUTEILLES.map(function(b){
    var a = emblemeExiste(b.embleme);
    return '<li>' +
      '<a class="menu__lien" href="' + b.href + '" data-id="' + b.id + '"' +
        (a ? ' data-a-embleme="1"' : '') +
        (b.id === pageCourante ? ' aria-current="page"' : '') + '>' +
        '<span class="menu__mot" data-fr="' + b.fr + '" data-es="' + b.es + '" data-en="' + b.en + '">' + b.fr + '</span>' +
        (a ? '<span class="menu__embleme" data-cle="' + b.embleme + '"></span>' : '') +
      '</a></li>';
  }).join('');

  /* Structure relevee sur gentlemonster.com le 16 aout 2026 : UNE seule barre
     de 90 px, transparente, posee sur la premiere image. A gauche cinq entrees
     et pas plus. Au centre le nom de la maison. A droite les utilitaires.
     Survoler une entree groupee ouvre un panneau pleine largeur, comme chez eux. */
  /* chaque entree porte son mot et, par dessus, la case de son emblème : au
     survol le mot s'efface, l'emblème parait a sa place et joue (le survol mot
     vers emblème du cahier). La largeur du mot reste, rien ne bouge. */
  var gauche = GROUPES.map(function(g){
    var em = emblemeExiste(g.embleme);
    var a = '<a class="nav__lien" href="' + g.href + '" data-id="' + g.id + '"' +
            (em ? ' data-a-embleme="1"' : '') +
            (g.id === pageCourante ? ' aria-current="page"' : '') +
            (g.sous ? ' aria-haspopup="true" aria-expanded="false"' : '') + '>' +
            '<span class="nav__mot" data-fr="' + g.fr + '" data-es="' + g.es + '" data-en="' + g.en + '"></span>' +
            (em ? '<span class="nav__em" data-cle="' + g.embleme + '"></span>' : '') + '</a>';
    return '<li class="nav__i"' + (g.sous ? ' data-groupe="' + g.id + '"' : '') + '>' + a + '</li>';
  }).join('');

  var panneaux = GROUPES.filter(function(g){ return g.sous; }).map(function(g){
    var cartes = g.sous.map(function(m){
      var a = emblemeExiste(m.embleme);
      return '<a class="pan__c" href="' + m.href + '">' +
               '<span class="pan__em"' + (a ? ' data-cle="' + m.embleme + '"' : '') + '></span>' +
               '<span class="pan__n" data-fr="' + m.fr + '" data-es="' + m.es + '" data-en="' + m.en + '"></span>' +
             '</a>';
    }).join('');
    return '<div class="pan" data-pan="' + g.id + '" hidden><div class="pan__in">' + cartes + '</div></div>';
  }).join('');

  t.innerHTML =
    '<div class="nav">' +
      '<ul class="nav__g">' + gauche + '</ul>' +
      '<a class="nav__marque" href="index.html">' +
        '<span data-fr="' + TEXTES.marque.fr + '" data-es="' + TEXTES.marque.es + '" data-en="' + TEXTES.marque.en + '"></span>' +
      '</a>' +
      '<div class="nav__d">' +
        /* La langue a quitte l entete : elle se choisit a la porte d age, une
           fois, avec la question de la majorite. Decision de Raouf le 16 aout.
           Restent les quatre fonctions dont le site a vraiment besoin. */
        /* 1er sept, Raouf : "pas besoin d'un bouton de recherche". Le catalogue
           tient en trois bouteilles : on ne cherche pas, on regarde. */

        '<a class="nav__ic" href="el-registro.html" ' +
           'data-fr-aria-label="Le registre" data-es-aria-label="El registro" data-en-aria-label="The register">' +
           ICONES.registre + '</a>' +
        '<a class="nav__ic" href="commande.html" ' +
           'data-fr-aria-label="Mon compte" data-es-aria-label="Mi cuenta" data-en-aria-label="My account">' +
           ICONES.compte + '</a>' +
        '<a class="nav__ic nav__sac" href="panier.html" ' +
           'data-fr-aria-label="Panier" data-es-aria-label="Carrito" data-en-aria-label="Bag">' +
           ICONES.panier + '<span class="nav__compte">0</span></a>' +
        /* les trois langues, de nouveau visibles dans l'entete (Raouf, 16 aout
           au soir) : au bout de la rangee d'icones, la courante en brique.
           Sur telephone le groupe vit au bas du tiroir. */
        '<div class="nav__langues" role="group" aria-label="Langue">' + boutonsLangue() + '</div>' +
        '<button class="nav__burger" aria-expanded="false" aria-controls="menu-maison" aria-label="Menu">' +
          '<span></span><span></span>' +
        '</button>' +
      '</div>' +
    '</div>' + panneaux +
    /* Le menu du telephone est un tiroir : un voile, un panneau papier qui
       glisse depuis la droite, sa propre ligne d'entete (la marque, fermer)
       alignee sur celle de la page, les huit entrees en rangs pleine largeur
       (l'emblème dans une case fixe de 44 px, le mot sur la meme ligne), puis
       les trois bouteilles sous un petit kicker. Refait le 16 aout au soir
       sur les captures de Raouf. */
    '<nav class="menu" id="menu-maison" aria-label="Menu" hidden>' +
      '<div class="menu__voile"></div>' +
      '<div class="menu__panneau" role="dialog" aria-modal="true" aria-label="Menu" tabindex="-1">' +
        '<div class="menu__tete">' +
          '<a class="menu__marque" href="index.html">' +
            '<span data-fr="' + TEXTES.marque.fr + '" data-es="' + TEXTES.marque.es + '" data-en="' + TEXTES.marque.en + '"></span>' +
          '</a>' +
          '<button class="menu__fermer" type="button" ' +
            'data-fr-aria-label="Fermer le menu" data-es-aria-label="Cerrar el menú" data-en-aria-label="Close the menu">' +
            '<span></span><span></span></button>' +
        '</div>' +
        '<ul class="menu__liste">' + entrees + '</ul>' +
        '<p class="menu__kicker" data-fr="Les trois bouteilles" data-es="Las tres botellas" data-en="The three bottles"></p>' +
        '<ul class="menu__liste menu__liste--sous">' + sousEntrees + '</ul>' +
        /* le pied du tiroir : trois rangs utiles au trait fin (points de vente,
           compte, contact) et le sceau de la famille a droite, lien vers
           l'accueil ; puis les trois langues, derniere ligne. */
        '<div class="menu__pied">' +
          '<ul class="menu__utils">' +
            '<li><a class="menu__util" href="points-de-vente.html">' + ICONES.lieu +
              '<span data-fr="Points de vente" data-es="Puntos de venta" data-en="Stockists"></span></a></li>' +
            '<li><a class="menu__util" href="commande.html">' + ICONES.compte +
              '<span data-fr="Compte" data-es="Cuenta" data-en="Account"></span></a></li>' +
            '<li><a class="menu__util" href="contact.html">' + ICONES.bulle +
              '<span data-fr="Nous contacter" data-es="Contáctenos" data-en="Contact us"></span></a></li>' +
          '</ul>' +
          '<div class="menu__cote">' +
          (typeof window.logoIvresse === 'function' ?
            '<a class="menu__sceau" href="index.html" data-fr-aria-label="Accueil" data-es-aria-label="Inicio" data-en-aria-label="Home">' +
              '<svg viewBox="0 0 842 595" aria-hidden="true">' +
                window.logoIvresse({ x:443, y:290, scale:1, anime:false, color:'currentColor' }) +
              '</svg></a>' : '') +
          reseaux('menu__reseaux', 'menu__ic') +
          '</div>' +
        '</div>' +
        '<div class="menu__langues" role="group" aria-label="Langue">' + boutonsLangue() + '</div>' +
      '</div>' +
    '</nav>';

  brancherPanneaux(t);
  majPanier();
  /* les boutons de langue de l'entete et du tiroir : ils basculent tout de
     suite, et appliquerLangue tient leur etat a jour partout (porte comprise) */
  brancherBoutonsLangue(t);


  document.body.insertBefore(t, document.body.firstChild);
  brancherMenu(t);
  ajusterMenu(t);
  window.addEventListener('resize', function(){ ajusterMenu(t); });
  return t;
}

function brancherMenu(tete){
  var liens = tete.querySelectorAll('.menu__lien');
  var tactile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  for(var i=0;i<liens.length;i++){
    (function(a){
      if(!a.hasAttribute('data-a-embleme')) return;   /* pas d'emblème : rien a echanger */
      var em = a.querySelector('.menu__embleme[data-cle]');
      /* le mot sort, l'emblème entre ET joue sa naissance (monte une fois, a la premiere entree) */
      function entre(){ a.classList.add('est-survole'); reveillerEmbleme(em, tete); }
      function sort(){ a.classList.remove('est-survole'); }
      a.addEventListener('mouseenter', entre);
      a.addEventListener('mouseleave', sort);
      a.addEventListener('focus', entre);
      a.addEventListener('blur', sort);
      if(tactile){
        /* au doigt : l'echange se fait pendant l'appui, le lien navigue normalement */
        a.addEventListener('touchstart', entre, { passive:true });
        a.addEventListener('touchend', function(){ setTimeout(sort, 320); }, { passive:true });
        a.addEventListener('touchcancel', sort, { passive:true });
      }
    })(liens[i]);
  }

  /* la bascule du menu sur telephone. Depuis la refonte du 16 aout, l entete
     porte .nav__burger : l ancien bouton .menu__bascule n existe plus, et sur
     grand ecran il n y a plus de bande de mots a ouvrir. */
  var bascule = tete.querySelector('.menu__bascule');
  var nav = tete.querySelector('.menu');
  if(!bascule || !nav) return;
  function fermerSiPetit(){
    if(window.matchMedia('(max-width:860px)').matches){
      nav.hidden = true; bascule.setAttribute('aria-expanded','false');
    } else {
      nav.hidden = false; bascule.setAttribute('aria-expanded','false');
    }
  }
  bascule.addEventListener('click', function(){
    var ouvert = bascule.getAttribute('aria-expanded') === 'true';
    bascule.setAttribute('aria-expanded', String(!ouvert));
    nav.hidden = ouvert;
  });
  fermerSiPetit();
  window.addEventListener('resize', fermerSiPetit);

  /* la langue */
  var b = tete.querySelectorAll('.langue__b');
  for(var j=0;j<b.length;j++){
    b[j].addEventListener('click', function(){ changerLangue(this.getAttribute('data-l')); });
  }
}

/* ---------------------------------------------------------------------------
   5. LE PIED DE PAGE. Le meme partout : mentions legales, contact,
   distribution, presse, et la ligne legale alcool.
   ------------------------------------------------------------------------ */
/* Ecrire a la maison, et le compte Instagram : deux icones au trait, en brun,
   cibles de 44 px, sous le lieu au pied de page et pres du sceau dans le
   tiroir (Raouf, 17 aout). */
function reseaux(classeBoite, classeIcone){
  return '<div class="' + classeBoite + '">' +
    '<a class="' + classeIcone + '" href="contact.html" ' +
      'data-fr-aria-label="Écrire à la maison" data-es-aria-label="Escribir a la casa" data-en-aria-label="Write to the house">' +
      ICONES.courriel + '</a>' +
    /* compte de la maison a confirmer : c'est celui du restaurant de la famille */
    '<!-- compte de la maison à confirmer -->' +
    '<a class="' + classeIcone + '" href="https://www.instagram.com/toloacheparis/" target="_blank" rel="noopener" ' +
      'data-fr-aria-label="Instagram de la maison" data-es-aria-label="Instagram de la casa" data-en-aria-label="The house on Instagram">' +
      ICONES.instagram + '</a>' +
  '</div>';
}

function construirePied(){
  var p = document.createElement('footer');
  p.className = 'pied';

  var sceau = '';
  if(typeof window.logoIvresse === 'function'){
    sceau = '<svg class="pied__sceau" viewBox="0 0 842 595" aria-hidden="true">' +
            window.logoIvresse({ x:443, y:290, scale:1, anime:false, color:'currentColor' }) + '</svg>';
  }

  var choixLangue =
    '<div class="pied__langue" role="group" aria-label="Langue">' +
      LANGUES.map(function(l){
        return '<button class="langue__b" data-l="' + l + '" aria-pressed="' +
               (l === langue ? 'true' : 'false') + '">' + l.toUpperCase() + '</button>';
      }).join('') +
    '</div>';

  /* le pied refait (Raouf, 17 aout 00h50 : "every footer, I don't feel it right") :
     le sceau et le lieu a gauche, trois colonnes de liens au milieu, le courrier et
     Instagram a droite ; dessous, le filet, la ligne legale et les pages de droit. */
  /* le pied de page : la premiere version, celle que Raouf veut garder (17 aout 01h05) :
     le sceau et le lieu a gauche ; a droite les quatre liens sur une ligne, puis le
     courrier et Instagram dessous ; le filet ; la ligne legale et les pages de droit. */
  var DROIT = [
    { href:'mentions-legales.html',           fr:'Mentions légales', es:'Avisos legales', en:'Legal notice' },
    { href:'cgv.html',                        fr:'CGV',              es:'Condiciones',    en:'Terms' },
    { href:'confidentialite-et-cookies.html', fr:'Confidentialité',  es:'Privacidad',     en:'Privacy' }
  ];
  function lienPied(l){ return '<a href="' + l.href + '" data-fr="' + l.fr + '" data-es="' + l.es + '" data-en="' + l.en + '">' + l.fr + '</a>'; }
  var liens = PIED.map(lienPied).join('');

  p.innerHTML =
    '<div class="pied__boite">' +
      '<div>' + (sceau ? '<a class="pied__accueil" href="index.html" aria-label="Ivresse d’Amour, accueil">' + sceau + '</a>' : '') +
        '<div class="pied__marque" data-fr="' + TEXTES.lieu.fr + '" data-es="' + TEXTES.lieu.es + '" data-en="' + TEXTES.lieu.en + '">' + TEXTES.lieu.fr + '</div>' +
      '</div>' +
      '<div class="pied__droite">' +
        '<nav class="pied__nav" aria-label="Pied de page">' + liens + '</nav>' +
        reseaux('pied__reseaux', 'pied__ic') +
      '</div>' +
      '<div class="pied__legal">' +
        '<span data-fr="' + TEXTES.legal.fr + '" data-es="' + TEXTES.legal.es + '" data-en="' + TEXTES.legal.en + '">' + TEXTES.legal.fr + '</span>' +
        '<span class="pied__droit"><span>Ivresse d’Amour · Toloache Legitimo</span>' + DROIT.map(lienPied).join('') + '</span>' +
      '</div>' +
    '</div>';

  document.body.appendChild(p);

  /* la langue au pied : elle se choisit a la porte, mais on doit pouvoir y
     revenir. Discrete, en bas, jamais dans l entete. */
  var lb = p.querySelectorAll('.langue__b');
  for(var z=0; z<lb.length; z++){
    lb[z].addEventListener('click', function(){ changerLangue(this.getAttribute('data-l')); });
  }
  return p;
}

/* ---------------------------------------------------------------------------
   6. LA PORTE D'AGE. Plein ecran, avant toute autre chose. Premiere visite
   seulement quand PORTE_A_CHAQUE_VISITE est false ; en demo, une fois par
   session, et de nouveau a chaque rechargement (voir porteRequise).
   Le sceau joue une fois (sceauAnime), puis rien ne bouge. Une question,
   deux reponses sobres. La reponse est retenue. Un non montre un refus sobre.
   index.html est sa page dediee, mais la porte vit ici : toutes les pages
   la font respecter, quelle que soit celle par laquelle on entre.
   ------------------------------------------------------------------------ */
function construirePorte(){
  /* en demo (PORTE_A_CHAQUE_VISITE) : une fois par session, et a chaque rechargement */
  if(!porteRequise()){ return null; }

  document.documentElement.classList.add('porte-ouverte');
  porteEnCours = true;

  var d = document.createElement('div');
  d.className = 'porte';
  d.setAttribute('role','dialog');
  d.setAttribute('aria-modal','true');
  d.innerHTML =
    /* La langue se choisit ici, avec la majorite, une seule fois, et le site
       entier bascule sous les yeux du visiteur avant meme qu il reponde. */
    '<div class="porte__langues" role="group" aria-label="Langue">' +
      LANGUES.map(function(l){
        return '<button class="porte__l" data-l="' + l + '" aria-pressed="' +
               (l === langue ? 'true' : 'false') + '">' + l.toUpperCase() + '</button>';
      }).join('') +
    '</div>' +
    '<div class="porte__sceau"><svg viewBox="0 0 842 595" aria-hidden="true"></svg></div>' +
    '<p class="porte__q" data-fr="' + TEXTES.porteQ.fr + '" data-es="' + TEXTES.porteQ.es + '" data-en="' + TEXTES.porteQ.en + '">' + TEXTES.porteQ.fr + '</p>' +
    '<div class="porte__reponses">' +
      '<button class="porte__b" data-r="oui" data-fr="' + TEXTES.porteOui.fr + '" data-es="' + TEXTES.porteOui.es + '" data-en="' + TEXTES.porteOui.en + '">' + TEXTES.porteOui.fr + '</button>' +
      '<button class="porte__b" data-r="non" data-fr="' + TEXTES.porteNon.fr + '" data-es="' + TEXTES.porteNon.es + '" data-en="' + TEXTES.porteNon.en + '">' + TEXTES.porteNon.fr + '</button>' +
    '</div>' +
    '<p class="porte__refus" data-fr="' + TEXTES.porteRef.fr + '" data-es="' + TEXTES.porteRef.es + '" data-en="' + TEXTES.porteRef.en + '">' + TEXTES.porteRef.fr + '</p>' +
    '<p class="porte__legal" data-fr="' + TEXTES.legal.fr + '" data-es="' + TEXTES.legal.es + '" data-en="' + TEXTES.legal.en + '">' + TEXTES.legal.fr + '</p>';

  document.body.insertBefore(d, document.body.firstChild);

  /* le sceau joue une fois, 3,1 s, maintien a 2,9 s. Rien d'autre ne bouge. */
  var svg = d.querySelector('.porte__sceau svg');
  var reduit = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(typeof window.sceauAnime === 'function' && !reduit){
    window.sceauAnime(svg, { autoplay:true, color:'#2B2118' });
  } else if(typeof window.logoIvresse === 'function'){
    svg.innerHTML = window.logoIvresse({ x:443, y:290, scale:1, anime:false });
  }

  /* le choix de langue, a la porte : il bascule tout de suite, porte comprise */
  var ls = d.querySelectorAll('.porte__l');
  for(var k=0;k<ls.length;k++){
    ls[k].addEventListener('click', function(){
      var code = this.getAttribute('data-l');
      changerLangue(code);
      for(var m=0;m<ls.length;m++){
        ls[m].setAttribute('aria-pressed', String(ls[m].getAttribute('data-l') === code));
      }
    });
  }

  var b = d.querySelectorAll('.porte__b');
  for(var i=0;i<b.length;i++){
    b[i].addEventListener('click', function(){
      if(this.getAttribute('data-r') === 'oui'){
        if(PORTE_A_CHAQUE_VISITE) ecrireSession(CLE_AGE_SESSION,'oui');   /* la session seulement */
        else ecrire(CLE_AGE,'oui');
        document.documentElement.classList.remove('porte-ouverte');
        d.parentNode.removeChild(d);
        porteFermee();
      } else {
        if(!PORTE_A_CHAQUE_VISITE) ecrire(CLE_AGE,'non');
        d.classList.add('est-refus');
      }
    });
  }
  return d;
}

/* ---------------------------------------------------------------------------
   7. LE MOUVEMENT. Deux choses, pas une de plus.
   Le fondu : .fondu devient .est-vu quand le bloc entre dans l'ecran.
   La parallaxe : [data-parallaxe="40"] deplace de 40 px au maximum, plafond 60.
   Tout est coupe si le systeme demande moins de mouvement.
   ------------------------------------------------------------------------ */
function brancherFondu(){
  var els = document.querySelectorAll('.fondu');
  if(!els.length) return;
  if(!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    for(var i=0;i<els.length;i++) els[i].classList.add('est-vu');
    return;
  }
  var o = new IntersectionObserver(function(entrees){
    entrees.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('est-vu'); o.unobserve(e.target); }
    });
  }, { rootMargin:'0px 0px -12% 0px', threshold:0.05 });
  for(var j=0;j<els.length;j++) o.observe(els[j]);
}

/* ---------------------------------------------------------------------------
   LA BARRE D'ACHAT DU TELEPHONE (1er sept au soir). Sur une page d'achat, quand
   le bouton de la fiche quitte l'ecran (sous l'entete ou sous le pli), la
   barre du bas se leve : le nom, le prix, AJOUTER sous le pouce. Elle se
   couche des que le bouton revient. Le bouton de la barre porte le meme
   data-ajouter que la fiche : la page le branche comme l'autre. Bureau : la
   barre n'est pas affichee (site.css), rien ne s'observe pour rien.
   ------------------------------------------------------------------------ */
function brancherBarreAchat(){
  var barre = document.querySelector('.barre-achat'); if(!barre) return;
  var cible = document.querySelector('.fiche__commande');
  if(!cible || !('IntersectionObserver' in window)) return;
  var tete = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tete-h')) || 90;
  function poser(visible){
    barre.classList.toggle('est-la', !visible);
    document.body.classList.toggle('a-barre', !visible);
  }
  /* la barre se leve des que le bouton est COUPE, meme a moitie (Raouf, 23h27 :
     "we fully see this button") : visible veut dire entier a l'ecran. */
  new IntersectionObserver(function(es){ poser(es[0].isIntersecting && es[0].intersectionRatio >= 0.98); },
    { rootMargin:(-tete) + 'px 0px 0px 0px', threshold:[0, 0.98, 1] }).observe(cible);
}

/* ---------------------------------------------------------------------------
   LE FAVICON JOUE LE SCEAU (2 sept, Raouf : "le favicon = le logo, et peut-
   etre le logo en animation"). L'icone de l'onglet est le sceau entier (les
   fichiers favicon.*). Au chargement, elle rejoue les trois secondes de sa
   naissance : un petit svg hors ecran est anime par sceauAnime, serialise
   dix fois par seconde dans le href de l'icone, puis l'icone fixe reprend.
   Chrome et Arc suivent ; Safari ignore les icones svg et garde le png.
   Coupe si mouvement reduit. Le cadre : le sceau mesure 457 x 490 autour de
   (441, 301) dans l'espace de logo.js ; 10 % d'air, un cercle de papier.
   ------------------------------------------------------------------------ */
function animerFavicon(){
  if(reduitMouvement) return;
  if(typeof window.sceauAnime !== 'function' || typeof window.logoParts !== 'function') return;
  var lien = document.querySelector('link[rel="icon"][type="image/svg+xml"]'); if(!lien) return;
  var fixe = lien.getAttribute('href');
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('viewBox', '172 31.5 539 539');
  svg.setAttribute('width', '100'); svg.setAttribute('height', '100');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:fixed;left:-9999px;top:0;width:100px;height:100px;pointer-events:none';
  document.body.appendChild(svg);
  var fond = document.createElementNS(NS, 'circle');
  fond.setAttribute('cx', '441.5'); fond.setAttribute('cy', '301'); fond.setAttribute('r', '269.5'); fond.setAttribute('fill', '#FEF9F3');
  svg.appendChild(fond);
  try{ window.sceauAnime(svg, { color:'#2B2118' }); }catch(e){ svg.remove(); return; }
  var t0 = performance.now(), ser = new XMLSerializer();
  var minuteur = setInterval(function(){
    var t = performance.now() - t0;
    if(t > 3300 || document.visibilityState === 'hidden' && t > 100){
      clearInterval(minuteur); lien.setAttribute('href', fixe); svg.remove(); return;
    }
    try{ lien.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ser.serializeToString(svg))); }catch(e){}
  }, 100);
}

function brancherParallaxe(){
  var els = document.querySelectorAll('[data-parallaxe]');
  if(!els.length || window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var enAttente = false;
  function poser(){
    var h = window.innerHeight;
    for(var i=0;i<els.length;i++){
      var a = Math.min(60, Math.abs(parseFloat(els[i].getAttribute('data-parallaxe')) || 40));
      var r = els[i].getBoundingClientRect();
      var p = (r.top + r.height/2 - h/2) / h;          /* -1 en haut, +1 en bas */
      p = Math.max(-1, Math.min(1, p));
      els[i].style.transform = 'translate3d(0,' + (-p * a).toFixed(1) + 'px,0)';
    }
    enAttente = false;
  }
  window.addEventListener('scroll', function(){
    if(!enAttente){ enAttente = true; requestAnimationFrame(poser); }
  }, { passive:true });
  window.addEventListener('resize', poser);
  poser();
}

/* ---------------------------------------------------------------------------
   8. CONTRAT. Ce qu'une page doit contenir, et rien de plus.

     <!doctype html><html lang="fr"><head>
       <meta charset="utf-8">
       <meta name="viewport" content="width=device-width, initial-scale=1">
       <title>El Mito. Ivresse d'Amour, Toloache Legitimo</title>
       <link rel="stylesheet" href="assets/css/site.css">
       <script src="assets/js/logo.js"></script>
       <script src="assets/js/sceau_anime.js"></script>
       <script src="assets/js/emblemes_parts.js"></script>
       <script src="assets/js/embleme_mito.js"></script>
       <script src="assets/js/emblemes_anime.js"></script>
       <script src="assets/js/site.js"></script>
     </head>
     <body data-page="mito" data-titre-fr="..." data-titre-es="...">
       <main class="page">  ... les sections de la page ...  </main>
       <script>siteChrome.init();</script>
     </body></html>

   data-page vaut : botella, historia, palenque, mito, registro, ritual, eventos.
   L'entete et le pied ne s'ecrivent pas dans la page : init() les pose.
   ------------------------------------------------------------------------ */
function init(opt){
  opt = opt || {};
  var page = opt.page || document.body.getAttribute('data-page') || '';

  poserFavicon();
  chargerEmblemes();       /* deja la si emblemes.js a fait son travail dans le <head> */
  construirePorte();
  construireEntete(page);
  poserEmblemes();
  /* les pages remplissent parfois leurs cases juste apres init() (grille de
     l'accueil) : on repasse au tour suivant et au chargement complet */
  setTimeout(poserEmblemes, 0);
  window.addEventListener('load', poserEmblemes);
  /* et chaque fois qu'une page insere de nouveaux hotes plus tard (grille
     rebatie a la bascule de langue, fiche du registre...) */
  if('MutationObserver' in window){
    var attente = null;
    new MutationObserver(function(muts){
      var utile = false;
      for(var i=0;i<muts.length && !utile;i++){
        var aj = muts[i].addedNodes;
        for(var j=0;j<aj.length;j++){
          var n = aj[j];
          if(n.nodeType !== 1) continue;
          if((n.matches && (n.matches('[data-embleme]') || n.matches('g[data-embleme-statique]'))) ||
             (n.querySelector && n.querySelector('[data-embleme],g[data-embleme-statique]'))){ utile = true; break; }
        }
      }
      if(!utile) return;
      if(attente) clearTimeout(attente);
      attente = setTimeout(function(){ attente = null; poserEmblemes(); }, 30);
    }).observe(document.body, { childList:true, subtree:true });
  }
  construirePied();
  /* les sceaux animes des pages (heros de vente, 31 aout) : tout svg marque
     js-sceau-anime joue une fois, comme le sceau de l'accueil ; en mouvement
     reduit il se pose complet, immobile */
  (function(){
    var sceaux = document.querySelectorAll('svg.js-sceau-anime');
    if(!sceaux.length) return;
    var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    for(var i=0;i<sceaux.length;i++){
      /* un sceau de moins de 100 px est un cachet : son dessin de 3 s est
         illisible a cette taille, il se pose complet. L'animation retenue
         vit la ou on peut la regarder (accueil bureau, porte d'age). */
      var large = sceaux[i].getBoundingClientRect().width >= 100;
      if(typeof window.sceauAnime === 'function' && !reduit && large){
        /* 1er sept, Raouf : l'animation part une seconde plus tard */
        (function(sv){ setTimeout(function(){ window.sceauAnime(sv); }, 1000); })(sceaux[i]);
      } else if(typeof window.logoIvresse === 'function'){
        sceaux[i].innerHTML = window.logoIvresse({ x:443, y:290, scale:1, anime:false, color:'currentColor' });
      }
    }
  })();
  appliquerLangue(langueDepart());
  brancherFondu();
  brancherParallaxe();
  brancherBarreAchat();
  animerFavicon();
  entetePosee();
}

/* le favicon de la maison (la fleur du sceau dans un disque papier), pose par
   site.js pour que toutes les pages l'aient sans l'ecrire. Une page qui porte
   deja un <link rel="icon"> garde le sien. */
function poserFavicon(){
  if(document.querySelector('link[rel="icon"]')) return;
  var base = baseScripts();
  var liens = [
    { rel:'icon', href:'assets/img/favicon.svg?v=20260902q', type:'image/svg+xml' },
    { rel:'icon', href:'assets/img/favicon-32.png?v=20260902q', sizes:'32x32' },
    { rel:'apple-touch-icon', href:'assets/img/favicon-180.png?v=20260902q' }
  ];
  for(var i=0;i<liens.length;i++){
    var l = document.createElement('link'), k;
    for(k in liens[i]){ l.setAttribute(k, k === 'href' ? base + liens[i][k] : liens[i][k]); }
    document.head.appendChild(l);
  }
}

/* si la page est encore en cours d'analyse, on cache le corps le temps de la
   porte, pour que rien ne clignote avant la question. */
(function(){
  if(document.readyState === 'loading' && porteRequise()){
    document.documentElement.classList.add('ida-attente');
    document.addEventListener('DOMContentLoaded', function(){
      document.documentElement.classList.remove('ida-attente');
    });
  }
})();

/* L entete est transparente sur la premiere scene et devient papier des que
   la page defile, releve sur gentlemonster.com le 16 aout. */
function entetePosee(){
  var t = document.querySelector('.tete');
  if(!t) return;
  function maj(){ t.classList.toggle('est-posee', window.scrollY > 12); }
  maj();
  window.addEventListener('scroll', maj, {passive:true});
}

window.siteChrome = {
  init: init,
  entetePosee: entetePosee,
  langue: function(){ return langue; },
  changerLangue: changerLangue,
  appliquerLangue: appliquerLangue,   /* a rappeler apres avoir injecte du HTML */
  embleme: embleme,                   /* renvoie la chaine <svg> statique (emblème complet) ou null */
  emblemes: EMBLEMES,                 /* la table cle -> nom anime */
  monterEmbleme: monterEmbleme,       /* monter l'emblème anime dans un element affiche */
  jouerEmbleme: jouerEmbleme,         /* le faire naitre une fois */
  quandEmblemesPrets: quandEmblemesPrets,
  langueCourante: function(){ return langue; },
  langues: LANGUES,
  menu: MENU,
  bouteilles: BOUTEILLES,              /* espadin, tobala, coyote : page, jeu, vente, accent */
  panier: {                            /* le panier, garde par le navigateur */
    lire: panierLire,
    ajouter: panierAjouter,
    nombre: panierNombre,
    vider: function(){ panierEcrire({}); }
  }
};

})();

/* le compteur de quantite (.qte) : moins / plus, entre 1 et 6, partout dans le site.
   Le champ garde data-qte : les scripts de page lisent .value comme avant. */
document.addEventListener('click', function(ev){
  var b = ev.target.closest && ev.target.closest('.qte__b'); if(!b) return;
  var q = b.closest('.qte'); var v = q && q.querySelector('.qte__v'); if(!v) return;
  var n = parseInt(v.value, 10) || 1; n += b.hasAttribute('data-plus') ? 1 : -1; if(n < 1) n = 1; if(n > 6) n = 6;
  v.value = n; var moins = q.querySelector('[data-moins]'), plus = q.querySelector('[data-plus]');
  if(moins) moins.disabled = (n <= 1); if(plus) plus.disabled = (n >= 6);
  v.dispatchEvent(new Event('change', { bubbles:true }));
});

/* ---------------------------------------------------------------------------
   LA GALERIE DES PAGES D'ACHAT (31 aout). Les vignettes etaient des boutons
   morts : elles changent maintenant la grande vue. La grande image reprend
   la source de la vignette en haute definition, la legende suit la vignette.
   ------------------------------------------------------------------------ */
(function(){
  function brancherGaleries(){
    var galeries = document.querySelectorAll('.galerie');
    for(var g=0; g<galeries.length; g++){
      (function(gal){
        var grande = gal.querySelector('.galerie__grande');
        var legende = gal.querySelector('.galerie__legende');
        var parent = gal.parentNode;
        var vignettes = (parent ? parent.querySelectorAll('.galerie__vignettes .galerie__v') : []);
        if(!grande || !vignettes.length) return;
        for(var i=0;i<vignettes.length;i++){
          (function(v){
            if(v.__branchee) return; v.__branchee = true;
            v.addEventListener('click', function(){
              /* la vignette porte deja sa haute definition en data-src et
                 data-srcset (poses le 17 aout, jamais branches jusqu'ici) */
              var im = v.querySelector('img');
              var src = v.getAttribute('data-src') || (im && im.getAttribute('src'));
              if(!src) return;
              grande.setAttribute('src', src);
              var jeu = v.getAttribute('data-srcset');
              if(jeu) grande.setAttribute('srcset', jeu); else grande.removeAttribute('srcset');
              for(var l=0;l<vignettes.length;l++){
                vignettes[l].classList.toggle('est-active', vignettes[l]===v);
                vignettes[l].setAttribute('aria-selected', vignettes[l]===v ? 'true':'false');
              }
              if(legende){
                var langues = ['fr','es','en'];
                for(var k=0;k<langues.length;k++){
                  var t = v.getAttribute('data-'+langues[k]);
                  if(t !== null) legende.setAttribute('data-'+langues[k], t);
                }
                var courante = (window.siteChrome && siteChrome.langue) ? siteChrome.langue() :
                               (document.documentElement.getAttribute('lang')||'fr');
                legende.textContent = v.getAttribute('data-'+courante) || v.getAttribute('data-fr') || '';
              }
            });
          })(vignettes[i]);
        }
      })(galeries[g]);
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancherGaleries);
  else brancherGaleries();
})();

/* ---------------------------------------------------------------------------
   LE PASSAGE D'UNE BOUTEILLE A L'AUTRE (31 aout, demande de Raouf : "quand on
   presse, la bouteille prend la place de l'autre, en douceur"). Transitions
   de vue entre documents : la carte pressee recoit le nom de vue de la grande
   image, le navigateur fait glisser l'une vers l'autre. Sans support, la
   navigation reste la navigation : rien ne casse.
   ------------------------------------------------------------------------ */
(function(){
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a.autre') : null;
    if(!a) return;
    var im = a.querySelector('img');
    var grande = document.querySelector('.galerie__grande');
    if(im){ if(grande) grande.style.viewTransitionName = 'none';
            im.style.viewTransitionName = 'bouteille-vedette'; }
  }, true);
})();
