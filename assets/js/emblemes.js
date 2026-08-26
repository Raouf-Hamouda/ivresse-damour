/* ============================================================================
   emblemes.js   Ivresse d'Amour, Toloache Legitimo.
   Refait le 16 aout au soir. Ce fichier ne dessine plus les emblemes lui meme :
   les emblemes retenus vivent dans trois fichiers, copies de 17_SITE/front et
   qu on ne modifie pas ici :
     assets/js/emblemes_parts.js    window.EMBLEMES_PARTS, les pieces vectorisees
     assets/js/embleme_mito.js      window.embleme_mito, le buisson d El Mito (base de mito3)
     assets/js/emblemes_anime.js    window.EMBLEMES_ANIME.mount(nom, svg, {color, paper})

   site.js ne depend plus de ce fichier : il charge les trois fichiers lui meme s'ils
   manquent et monte les emblemes animes. Ce fichier ne sert plus qu'aux pages qui
   appellent window.embleme_<cle> dans leur propre <script>. Il fait deux choses :
     1. il charge ces trois fichiers, dans l ordre, de maniere synchrone quand il est
        lu dans le <head> pendant l analyse de la page (document.write). Ainsi les
        pages qui appellent window.embleme_<cle> juste apres siteChrome.init() ont
        leurs emblemes. Si la page est deja analysee, site.js les charge lui meme.
     2. il garde l ancienne interface : window.embleme_<cle>({color}) renvoie la
        chaine SVG interne (viewBox -120 -120 240 240) de l embleme COMPLET, au repos.
        Cles : botella, historia, palenque, mito3, registro, ritual, eventos, espadin,
        tobala, coyote. La cle "mito" appartient a embleme_mito.js (le buisson brut, sans le
        nouvel eclair) parce que EMBLEMES_ANIME.mito3 s en sert : pour El Mito fini,
        demander "mito3" (site.js fait la traduction mito -> mito3).
   L ancien dessin provisoire d eventos (la table dressee) n a pas ete retenu par
   Raouf le 16 aout au soir : il est retire. Eventos a desormais le brindis
   (emblemes_anime.js), servi ici sous window.embleme_eventos.

   L encre est #2B2118, rendue en currentColor pour que le CSS commande la couleur ;
   les parties papier (lignes du registre, flamme du palenque) restent #FEF9F3.
   Pas de tiret cadratin dans ce fichier.
   ========================================================================= */
(function(){
  'use strict';
  var ENCRE = '#2B2118', PAPIER = '#FEF9F3';
  var FICHIERS = ['emblemes_parts.js', 'embleme_mito.js', 'emblemes_anime.js'];

  /* 1. le chargement synchrone, pendant l analyse du <head> seulement */
  (function(){
    if(window.EMBLEMES_ANIME) return;
    if(document.readyState !== 'loading') return;   /* trop tard pour ecrire : site.js prendra le relais */
    var base = 'assets/js/';
    var s = document.currentScript;
    if(s && s.src){ base = s.src.replace(/[^\/]*$/, ''); }
    for(var i=0;i<FICHIERS.length;i++){
      document.write('<script src="' + base + FICHIERS[i] + '"><\/script>');
    }
  })();

  /* 2. l embleme complet, au repos, en chaine : on le monte dans un svg cache mais
     rendu (les animations mesurent des boites avec getBBox, ce qui exige un element
     affiche), on lit le resultat, on retire le svg. */
  var NS = 'http://www.w3.org/2000/svg';
  function statique(nom, o, cle){
    o = o || {};
    if(!window.EMBLEMES_ANIME || !window.EMBLEMES_PARTS) return '';
    var hote = document.body || document.documentElement;
    if(!hote) return '';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-120 -120 240 240');
    svg.setAttribute('style', 'position:fixed;left:-9999px;top:0;width:240px;height:240px;opacity:0;pointer-events:none');
    hote.appendChild(svg);
    var out = '';
    try{
      var c = window.EMBLEMES_ANIME.mount(nom, svg, { color:ENCRE, paper:PAPIER });
      if(c && c.stop) c.stop();
      var g = svg.firstElementChild;
      if(g){
        g.setAttribute('class', 'embleme__encre');
        g.setAttribute('data-embleme-statique', cle);   /* site.js adopte l hote et l anime */
        var couleur = o.color || 'currentColor';
        var fills = g.querySelectorAll('[fill]');
        for(var i=0;i<fills.length;i++){
          if(/^#2b2118$/i.test(fills[i].getAttribute('fill'))) fills[i].setAttribute('fill', couleur);
        }
        out = g.outerHTML;
      }
    }catch(e){ out = ''; }
    hote.removeChild(svg);
    return out;
  }
  var CLES = ['botella','historia','palenque','mito3','registro','ritual','eventos','espadin','tobala','coyote'];
  var NOMS = { ritual:'ritual_couple', historia:'libro', eventos:'brindis' };   /* El Ritual : le couple ; La Historia : le livre ; Eventos : le brindis. Decisions du 16 aout au soir */
  CLES.forEach(function(cle){
    window['embleme_' + cle] = function(o){ return statique(NOMS[cle] || cle, o, cle); };
  });
  window.embleme_statique = function(nom, o){ return statique(nom, o, nom); };
})();
