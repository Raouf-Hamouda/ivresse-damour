/* ============================================================================
   registre.js   El Registro. Ivresse d'Amour, Toloache Legitimo.

   Une seule page utilise ce fichier : el-registro.html. Il fait trois choses
   et rien d autre :
     1. il lit assets/data/lots.json, le fichier que la famille edite
     2. il ecrit la fiche d un lot, les crus, et l archive
     3. il tient l entree par le numero de bouteille

   Vanilla, aucune dependance, aucune etape de fabrication, aucun CDN.
   Pas de tiret cadratin dans ce fichier.

   --------------------------------------------------------------------------
   COMMENT LES DONNEES ARRIVENT, ET POURQUOI C EST FAIT AINSI

   Un navigateur ouvert en double clic (protocole file://) REFUSE de lire un
   fichier voisin avec fetch : chaque fichier local est sa propre origine, la
   requete est bloquee. Verifie sur Chrome et sur Firefox, ce n est pas un
   reglage, c est la securite du navigateur.

   Donc deux chemins, dans cet ordre :

     a) le site est en ligne (http:// ou https://) : on lit
        assets/data/lots.json. C est la source, c est le fichier de la famille,
        c est celui qui gagne toujours.

     b) la page est ouverte en double clic (file://) : on lit la copie de
        secours posee dans la page elle meme, dans
        <script type="application/json" id="reg-secours"> ... </script>.
        La page affiche alors une ligne qui dit d ou vient ce qu on lit, pour
        que personne ne croie voir le fichier alors qu il voit la copie.

   On ne tente meme pas la requete en file:// : elle echouerait de toute facon
   et laisserait une erreur rouge dans la console du navigateur.

   La contrepartie est nommee, pas cachee : en double clic, une modification de
   lots.json ne se voit pas tant que la meme chose n est pas collee dans la
   copie de secours. PUBLIER_UN_LOT.md le dit en toutes lettres.
   ========================================================================= */
(function(){
'use strict';

var CHEMIN = 'assets/data/lots.json';
var ID_SECOURS = 'reg-secours';

/* ---------------------------------------------------------------------------
   0. LES MOTS DE LA PAGE. Trois langues, comme tout le site.
   Rien de ce qui est ecrit ici n est pose en dur dans le HTML : la page pose
   des attributs data-fr / data-es / data-en et site.js choisit.
   ------------------------------------------------------------------------ */
var M = {
  cle_cru:        { fr:'Agave',              es:'Agave',                en:'Agave' },
  cle_parcelle:   { fr:'Parcelle',           es:'Parcela',              en:'Plot' },
  cle_sol:        { fr:'Sol',                es:'Suelo',                en:'Soil' },
  cle_plantation: { fr:'Année de plantation',es:'Año de plantación',    en:'Year planted' },
  cle_maestro:    { fr:'Maestro',            es:'Maestro',              en:'Maestro' },
  cle_litres:     { fr:'Litres',             es:'Litros',               en:'Litres' },
  cle_numero:     { fr:'Numéro sur le total',es:'Número sobre el total',en:'Number out of total' },
  cle_degre:      { fr:'Degré',              es:'Graduación',           en:'Strength' },
  cle_contenant:  { fr:'Contenant',          es:'Contenido',            en:'Volume' },
  cle_categorie:  { fr:'Catégorie',          es:'Categoría',            en:'Category' },
  cle_village:    { fr:'Village',            es:'Pueblo',               en:'Village' },
  cle_distille:   { fr:'Date de distillation',es:'Fecha de destilación',en:'Date distilled' },
  cle_etat:       { fr:'État',               es:'Estado',               en:'State' },
  cle_note:       { fr:'Note',               es:'Nota',                 en:'Note' },
  cle_lot:        { fr:'Lot',                es:'Lote',                 en:'Lot' },

  attendu:   { fr:'Attendu de la maison', es:'Pendiente de la casa', en:'Awaited from the house' },
  ouvert:    { fr:'Ouvert',   es:'Abierto', en:'Open' },
  epuise:    { fr:'Épuisé',   es:'Agotado', en:'Sold out' },

  exemple:   { fr:'Lot d’exemple',   es:'Lote de ejemplo',  en:'Example lot' },
  exemple_l: { fr:'Lot d’exemple. Les valeurs sont des places tenues, écrites pour montrer la forme de la fiche. La maison publiera les siennes.',
               es:'Lote de ejemplo. Los valores son marcadores de sitio, escritos para mostrar la forma de la ficha. La casa publicará los suyos.',
               en:'Example lot. The values are placeholders, written to show the shape of the sheet. The house will publish its own.' },

  vide:      { fr:'Écrivez les deux nombres portés sur votre étiquette.',
               es:'Escriba los dos números que lleva su etiqueta.',
               en:'Write the two numbers your label carries.' },
  inconnu:   { fr:'Ce numéro n’est pas au registre. Vérifiez les deux nombres écrits à la main sur votre étiquette. Le registre ne porte pour l’instant que des lots d’exemple : la maison n’a pas encore publié les siens.',
               es:'Este número no está en el registro. Verifique los dos números escritos a mano en su etiqueta. Por ahora el registro solo lleva lotes de ejemplo: la casa todavía no ha publicado los suyos.',
               en:'This number is not in the register. Check the two numbers written by hand on your label. For now the register carries only example lots: the house has not published its own yet.' },
  hors:      { fr:'Ce lot compte moins de bouteilles que le numéro écrit. Le premier nombre est celui de votre bouteille, le second est le tirage du lot.',
               es:'Este lote tiene menos botellas que el número escrito. El primer número es el de su botella, el segundo es el tiraje del lote.',
               en:'This lot holds fewer bottles than the number written. The first number is your bottle, the second is the size of the lot.' },
  plusieurs: { fr:'Plusieurs lots ont ce tirage. Le vôtre est l’un de ceux ci.',
               es:'Varios lotes tienen este tiraje. El suyo es uno de estos.',
               en:'Several lots have this size. Yours is one of these.' },
  /* quand le visiteur n a donne que le premier nombre : c est le second,
     le tirage du lot, qui departage. On le lui dit au lieu de choisir. */
  plusieurs_num: { fr:'Plusieurs lots portent ce numéro. Le second nombre de votre étiquette, le tirage du lot, les départage.',
                   es:'Varios lotes llevan este número. El segundo número de su etiqueta, el tiraje del lote, los separa.',
                   en:'Several lots carry this number. The second number on your label, the size of the lot, tells them apart.' },
  trouve:    { fr:'Fiche ouverte plus bas.', es:'Ficha abierta más abajo.', en:'Sheet opened below.' },

  aucun_lot: { fr:'Aucun lot au registre.', es:'Ningún lote en el registro.', en:'No lot in the register.' },
  chaque:    { fr:'Chaque année.', es:'Cada año.', en:'Every year.' },
  decide:    { fr:'Quand la plante décide.', es:'Cuando la planta decide.', en:'When the plant decides.' },

  source_local: { fr:'Page ouverte par double clic. Le registre lit la copie de secours posée dans la page. En ligne, il lit assets/data/lots.json.',
                  es:'Página abierta con doble clic. El registro lee la copia de respaldo puesta en la página. En línea, lee assets/data/lots.json.',
                  en:'Page opened by double click. The register reads the backup copy held in the page. Online, it reads assets/data/lots.json.' },
  source_rien:  { fr:'Le registre n’a pas pu lire ses données. Le fichier assets/data/lots.json est absent ou mal écrit.',
                  es:'El registro no pudo leer sus datos. El archivo assets/data/lots.json falta o está mal escrito.',
                  en:'The register could not read its data. The file assets/data/lots.json is missing or badly written.' }
};

var MOIS = {
  fr:['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
  es:['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
  en:['January','February','March','April','May','June','July','August','September','October','November','December']
};

/* ---------------------------------------------------------------------------
   1. OUTILS DE LANGUE.
   trois(v) ramene n importe quelle valeur du fichier a un trio fr/es/en :
     "Parcelle A"                      -> le meme mot dans les trois langues
     { fr:'...', es:'...', en:'...' }  -> chacune la sienne
     absent ou vide                    -> null, la fiche dira "attendu"
   ------------------------------------------------------------------------ */
function trois(v){
  if(v === null || v === undefined) return null;
  if(typeof v === 'number') { var s = String(v); return { fr:s, es:s, en:s }; }
  if(typeof v === 'string'){
    v = v.trim();
    if(!v) return null;
    return { fr:v, es:v, en:v };
  }
  if(typeof v === 'object'){
    var base = v.fr || v.es || v.en;
    if(!base) return null;
    return { fr:v.fr || base, es:v.es || base, en:v.en || base };
  }
  return null;
}

function joindre(){
  /* colle plusieurs trios en un seul, langue par langue */
  var out = { fr:'', es:'', en:'' }, i, k, t;
  for(i=0;i<arguments.length;i++){
    t = arguments[i];
    if(!t) continue;
    for(k in out){
      if(Object.prototype.hasOwnProperty.call(out,k)){
        out[k] = out[k] ? (out[k] + ' ' + t[k]) : t[k];
      }
    }
  }
  return (out.fr || out.es || out.en) ? out : null;
}

/* deux legendes cote a cote se separent par le point median du site, jamais
   par un espace seul : "18 janvier 2026 · Lot d'exemple". */
function pointMedian(a, b){
  if(!a) return b;
  if(!b) return a;
  return { fr:a.fr + ' · ' + b.fr, es:a.es + ' · ' + b.es, en:a.en + ' · ' + b.en };
}

function avant(prefixe, t){
  if(!t) return null;
  return { fr:prefixe.fr + t.fr, es:prefixe.es + t.es, en:prefixe.en + t.en };
}

/* une date ISO 2025-11-14 devient une date lisible dans les trois langues.
   Tout ce qui n est pas une date ISO ressort tel quel, sans etre corrige. */
function dateTexte(v){
  var t = trois(v);
  if(!t) return null;
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t.fr);
  if(!m) return t;
  var a = m[1], mois = parseInt(m[2],10) - 1, j = parseInt(m[3],10);
  if(mois < 0 || mois > 11) return t;
  return {
    fr: j + ' ' + MOIS.fr[mois] + ' ' + a,
    es: j + ' de ' + MOIS.es[mois] + ' de ' + a,
    en: j + ' ' + MOIS.en[mois] + ' ' + a
  };
}

/* ---------------------------------------------------------------------------
   2. FABRIQUE D ELEMENTS.
   REGLE DURE DU SITE : un element qui porte data-fr ne contient jamais
   d element enfant. site.js ecrit dans textContent et effacerait les enfants.
   Toute la fabrique ci dessous respecte cette regle : soit un element porte du
   texte traduit, soit il porte des enfants, jamais les deux.
   ------------------------------------------------------------------------ */
function elem(balise, classe, texte){
  var e = document.createElement(balise);
  if(classe) e.className = classe;
  if(texte){
    if(typeof texte === 'string'){ e.textContent = texte; }
    else {
      e.setAttribute('data-fr', texte.fr);
      e.setAttribute('data-es', texte.es);
      e.setAttribute('data-en', texte.en);
      e.textContent = texte.fr;
    }
  }
  return e;
}

function vider(n){ while(n && n.firstChild) n.removeChild(n.firstChild); }

/* ---------------------------------------------------------------------------
   LE FONDU D UN BLOC REMPLI APRES COUP.

   site.js branche son observateur sur les .fondu au moment de init(). Nos deux
   blocs, les crus et l archive, sont encore VIDES a cet instant : ils mesurent
   zero pixel de haut, l observateur les juge hors de l ecran, et quand le
   contenu arrive plus tard il ne repasse pas toujours. Le bloc reste alors a
   opacite zero, c est a dire invisible.
   Verifie le 16 aout 2026, le site servi en http : #reg-crus restait a 0.
   On rattrape donc nous memes, une fois le bloc rempli et haut.
   ------------------------------------------------------------------------ */
function revoirFondu(el){
  if(!el || !el.classList.contains('fondu') || el.classList.contains('est-vu')) return;
  if(!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    el.classList.add('est-vu');
    return;
  }
  var r = el.getBoundingClientRect();
  if(r.top < window.innerHeight){ el.classList.add('est-vu'); return; }
  var o = new IntersectionObserver(function(entrees){
    entrees.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('est-vu'); o.unobserve(e.target); }
    });
  }, { rootMargin:'0px 0px -12% 0px', threshold:0.05 });
  o.observe(el);
}

function traduire(racine){
  if(window.siteChrome && siteChrome.appliquerLangue){
    siteChrome.appliquerLangue(siteChrome.langue(), racine);
  }
}

/* une ligne de la table de faits. valeur nulle = "attendu de la maison". */
function ligneFait(cle, valeur){
  var l = elem('div','faits__l');
  l.appendChild(elem('dt','faits__k',cle));
  var d = elem('dd','faits__v');
  if(valeur){
    d.setAttribute('data-fr', valeur.fr);
    d.setAttribute('data-es', valeur.es);
    d.setAttribute('data-en', valeur.en);
    d.textContent = valeur.fr;
  } else {
    d.appendChild(elem('span','mention',M.attendu));
  }
  l.appendChild(d);
  return l;
}

/* ---------------------------------------------------------------------------
   3. LES DONNEES.
   ------------------------------------------------------------------------ */
var D = null;          /* le contenu du fichier */
var SOURCE = '';       /* 'fichier' | 'secours' | 'rien' */

function lireSecours(){
  var b = document.getElementById(ID_SECOURS);
  if(!b) return null;
  try{ return JSON.parse(b.textContent); }catch(e){ return null; }
}

function charger(pret){
  if(location.protocol === 'file:'){
    D = lireSecours();
    SOURCE = D ? 'secours' : 'rien';
    pret();
    return;
  }
  if(!window.fetch){
    D = lireSecours();
    SOURCE = D ? 'secours' : 'rien';
    pret();
    return;
  }
  fetch(CHEMIN, { cache:'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function(j){ D = j; SOURCE = 'fichier'; pret(); })
    .catch(function(){
      D = lireSecours();
      SOURCE = D ? 'secours' : 'rien';
      pret();
    });
}

/* les valeurs communes completent chaque lot, le lot garde le dernier mot */
function champ(lot, nom){
  var v = lot[nom];
  if(v === undefined || v === null || v === '' ){
    var c = D && D.valeurs_communes;
    v = c ? c[nom] : null;
  }
  return trois(v);
}

function lots(){ return (D && D.lots) ? D.lots.slice() : []; }
function crus(){ return (D && D.crus) ? D.crus.slice() : []; }

function cruDe(id){
  var c = crus(), i;
  for(i=0;i<c.length;i++){ if(c[i].id === id) return c[i]; }
  return null;
}

function nomLot(lot){
  var c = cruDe(lot.cru);
  var n = (c ? c.nom : (lot.cru || '')) + (lot.annee ? ' ' + lot.annee : '');
  return { fr:n, es:n, en:n };
}

/* la pastille .etat ne porte qu un mot : au dela, des capitales espacees
   deviennent illisibles et le contrat interdit une phrase en capitales.
   La date suit a cote, en legende. */
function etatCourt(lot){
  return (lot.etat === 'epuise') ? M.epuise : M.ouvert;
}

function etatTexte(lot){
  if(lot.etat === 'epuise'){
    var d = dateTexte(lot.date_epuisement);
    if(d) return { fr:M.epuise.fr + ', ' + d.fr, es:M.epuise.es + ', ' + d.es, en:M.epuise.en + ', ' + d.en };
    return M.epuise;
  }
  return M.ouvert;
}

function classeEtat(lot){
  return 'etat ' + (lot.etat === 'epuise' ? 'etat--epuise' : 'etat--ouvert');
}

/* ---------------------------------------------------------------------------
   4. LA FICHE D UN LOT. Tout ce que porte l etiquette, dans l ordre de la
   structure envoyee au client le 3 aout : parcelle, sol, annee de plantation,
   maestro, litres, numero sur le total, degre, date de distillation.
   numero : le numero tape par le visiteur, ou null s il ouvre depuis l archive.
   ------------------------------------------------------------------------ */
function ecrireFiche(lot, numero){
  var hote = document.getElementById('reg-fiche-corps');
  var section = document.getElementById('reg-fiche');
  if(!hote || !section) return;
  vider(hote);

  var c = cruDe(lot.cru);

  hote.appendChild(elem('p','kicker', avant({ fr:'Lot ', es:'Lote ', en:'Lot ' }, trois(lot.reference))));
  hote.appendChild(elem('h2', null, nomLot(lot)));

  var pEtat = elem('p');
  pEtat.setAttribute('style','margin:16px 0 32px');
  pEtat.appendChild(elem('span', classeEtat(lot), etatCourt(lot)));
  var leg = null;
  if(lot.etat === 'epuise') leg = dateTexte(lot.date_epuisement);
  if(lot.exemple) leg = pointMedian(leg, M.exemple);
  if(leg){
    pEtat.appendChild(document.createTextNode('\u00A0\u00A0'));
    pEtat.appendChild(elem('span','mention', leg));
  }
  hote.appendChild(pEtat);

  var dl = elem('dl','faits faits--etiquette');

  var agave = c ? { fr:c.nom + ', ' + c.espece, es:c.nom + ', ' + c.espece, en:c.nom + ', ' + c.espece } : trois(lot.cru);
  dl.appendChild(ligneFait(M.cle_cru, agave));
  dl.appendChild(ligneFait(M.cle_parcelle, champ(lot,'parcelle')));
  dl.appendChild(ligneFait(M.cle_sol, champ(lot,'sol')));
  dl.appendChild(ligneFait(M.cle_plantation, champ(lot,'annee_plantation')));
  dl.appendChild(ligneFait(M.cle_maestro, champ(lot,'maestro')));

  var lit = trois(lot.litres);
  dl.appendChild(ligneFait(M.cle_litres, lit ? { fr:lit.fr + ' litres', es:lit.es + ' litros', en:lit.en + ' litres' } : null));

  var tot = lot.bouteilles;
  var num = null;
  if(tot && numero){
    num = { fr:numero + ' sur ' + tot, es:numero + ' de ' + tot, en:numero + ' of ' + tot };
  } else if(tot){
    num = { fr:tot + ' bouteilles', es:tot + ' botellas', en:tot + ' bottles' };
  }
  dl.appendChild(ligneFait(M.cle_numero, num));

  dl.appendChild(ligneFait(M.cle_degre, champ(lot,'degre')));
  dl.appendChild(ligneFait(M.cle_contenant, champ(lot,'contenant')));
  dl.appendChild(ligneFait(M.cle_categorie, champ(lot,'categorie')));
  dl.appendChild(ligneFait(M.cle_village, champ(lot,'village')));
  dl.appendChild(ligneFait(M.cle_distille, dateTexte(lot.date_distillation)));
  dl.appendChild(ligneFait(M.cle_etat, etatTexte(lot)));

  var note = trois(lot.note);
  if(note) dl.appendChild(ligneFait(M.cle_note, note));

  hote.appendChild(dl);

  /* une phrase entiere ne se met jamais en capitales : .mention est reservee
     aux quatre mots d une legende. Celle ci est une phrase, donc du texte. */
  if(lot.exemple){
    var pe = elem('p', null, M.exemple_l);
    pe.setAttribute('style','margin-top:24px');
    hote.appendChild(pe);
  }

  section.hidden = false;
  traduire(hote);
}

/* ---------------------------------------------------------------------------
   5. L ENTREE PAR LE NUMERO.
   Le visiteur porte deux nombres, ecrits a la main sur son etiquette :
   le numero de sa bouteille, et le tirage du lot. Le second departage deux
   lots qui porteraient le meme numero de bouteille.
   Il peut aussi taper la reference du lot, ESP-2025-01, si elle y figure.
   ------------------------------------------------------------------------ */
function entier(s){
  s = String(s || '').replace(/[^0-9]/g,'');
  return s ? parseInt(s,10) : 0;
}

function chercher(brutNumero, brutTotal){
  var l = lots(), i, out = [];
  var brut = String(brutNumero || '').trim();

  /* une reference tapee en toutes lettres */
  if(/[a-z]/i.test(brut)){
    var cle = brut.toUpperCase().replace(/\s+/g,'');
    for(i=0;i<l.length;i++){
      if(String(l[i].reference || '').toUpperCase().replace(/\s+/g,'') === cle) out.push(l[i]);
    }
    return { etat: out.length ? 'trouve' : 'inconnu', lots: out, numero: null };
  }

  var n = entier(brutNumero), t = entier(brutTotal);
  if(!n && !t) return { etat:'vide', lots:[], numero:null };

  var memeTirage = [];
  for(i=0;i<l.length;i++){
    if(t && l[i].bouteilles !== t) continue;
    memeTirage.push(l[i]);
  }
  if(t && !memeTirage.length) return { etat:'inconnu', lots:[], numero:n };

  for(i=0;i<memeTirage.length;i++){
    if(n && (n < 1 || n > memeTirage[i].bouteilles)) continue;
    out.push(memeTirage[i]);
  }

  if(!out.length) return { etat: (t ? 'hors' : 'inconnu'), lots:[], numero:n, avecTotal:!!t };
  if(out.length > 1) return { etat:'plusieurs', lots:out, numero:n, avecTotal:!!t };
  return { etat:'trouve', lots:out, numero:n, avecTotal:!!t };
}

function repondre(res, dur){
  var zone = document.getElementById('reg-reponse');
  var section = document.getElementById('reg-fiche');
  if(!zone) return;
  vider(zone);

  if(res.etat === 'trouve'){
    ecrireFiche(res.lots[0], res.numero);
    zone.appendChild(elem('p', null, M.trouve));
    traduire(zone);
    return;
  }

  if(section) section.hidden = true;

  if(res.etat === 'plusieurs'){
    zone.appendChild(elem('p', null, res.avecTotal ? M.plusieurs : M.plusieurs_num));
    /* un lot par ligne : une liste de candidats separee par des points medians
       casse mal en fin de ligne et laisse un point pendu au bord. */
    for(var i=0;i<res.lots.length;i++){
      var ligne = elem('div');
      ligne.setAttribute('style','margin-top:10px');
      ligne.appendChild(boutonLot(res.lots[i], res.numero, true));
      zone.appendChild(ligne);
    }
    traduire(zone);
    return;
  }

  /* rien de rouge, rien qui gronde : une phrase, la meme voix que le reste */
  if(!dur && res.etat !== 'vide'){ traduire(zone); return; }
  zone.appendChild(elem('p', null, M[res.etat] || M.inconnu));
  traduire(zone);
}

function boutonLot(lot, numero, avecReference){
  var t = avecReference ? joindre(nomLot(lot), trois('(' + lot.reference + ')')) : nomLot(lot);
  var b = elem('button','lien', t);
  b.type = 'button';
  b.addEventListener('click', function(){ ecrireFiche(lot, numero); allerALaFiche(); });
  return b;
}

function allerALaFiche(){
  var s = document.getElementById('reg-fiche');
  if(!s || s.hidden) return;
  var doux = !window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  try{ s.scrollIntoView({ behavior: doux ? 'smooth' : 'auto', block:'start' }); }
  catch(e){ s.scrollIntoView(); }
}

/* ---------------------------------------------------------------------------
   6. LES CRUS. L espadin chaque annee, le tobala et le coyote quand la plante
   decide. Une annee sans lot est DITE, jamais remplacee par une autre plante.
   ------------------------------------------------------------------------ */
function ecrireCrus(){
  var hote = document.getElementById('reg-crus');
  if(!hote) return;
  vider(hote);

  var dl = elem('dl','faits');
  var cs = crus(), l = lots(), abs = (D && D.annees_sans_lot) ? D.annees_sans_lot : [];

  for(var i=0;i<cs.length;i++){
    var c = cs[i], dernier = null, j;
    for(j=0;j<l.length;j++){
      if(l[j].cru !== c.id) continue;
      if(!dernier || (l[j].annee || 0) > (dernier.annee || 0)) dernier = l[j];
    }

    var phrase = (c.rythme === 'chaque_annee') ? M.chaque : M.decide;

    /* les annees sans lot, la plus recente d abord */
    var sans = [];
    for(j=0;j<abs.length;j++){ if(abs[j].cru === c.id) sans.push(abs[j]); }
    sans.sort(function(a,b){ return (b.annee||0) - (a.annee||0); });
    for(j=0;j<sans.length;j++){
      var r = trois(sans[j].raison);
      var an = sans[j].annee;
      var dit = { fr:'En ' + an + ', pas de lot.', es:'En ' + an + ', ningún lote.', en:'In ' + an + ', no lot.' };
      phrase = joindre(phrase, dit, r);
    }

    if(dernier){
      var e = etatTexte(dernier);
      var d = { fr:'Dernier lot ' + dernier.annee + ', ' + e.fr.toLowerCase() + '.',
                es:'Último lote ' + dernier.annee + ', ' + e.es.toLowerCase() + '.',
                en:'Last lot ' + dernier.annee + ', ' + e.en.toLowerCase() + '.' };
      phrase = joindre(phrase, d);
    } else {
      phrase = joindre(phrase, M.aucun_lot);
    }

    dl.appendChild(ligneFait({ fr:c.nom + ', ' + c.espece, es:c.nom + ', ' + c.espece, en:c.nom + ', ' + c.espece }, phrase));
  }

  hote.appendChild(dl);
  traduire(hote);
  revoirFondu(hote);
}

/* ---------------------------------------------------------------------------
   7. L ARCHIVE. Elle ne se vide jamais, elle s allonge. Un lot epuise reste
   affiche, epuise et date. Aucun prix, aucune remise, jamais.
   ------------------------------------------------------------------------ */
function ecrireArchive(){
  var hote = document.getElementById('reg-archive');
  if(!hote) return;
  vider(hote);

  var l = lots();
  l.sort(function(a,b){
    var d = (b.annee||0) - (a.annee||0);
    if(d) return d;
    return String(a.reference||'').localeCompare(String(b.reference||''));
  });

  if(!l.length){
    hote.appendChild(elem('p', null, M.aucun_lot));
    traduire(hote);
    revoirFondu(hote);
    return;
  }

  var dl = elem('dl','faits');
  for(var i=0;i<l.length;i++){
    var lot = l[i];
    var ligne = elem('div','faits__l');
    ligne.appendChild(elem('dt','faits__k', trois(lot.reference)));

    var d = elem('dd','faits__v');
    d.appendChild(boutonLot(lot, null, false));

    var sous = elem('div');
    sous.setAttribute('style','margin-top:8px');
    sous.appendChild(elem('span', classeEtat(lot), etatCourt(lot)));
    var leg = (lot.etat === 'epuise') ? dateTexte(lot.date_epuisement) : null;
    if(lot.exemple) leg = pointMedian(leg, M.exemple);
    if(leg){
      sous.appendChild(document.createTextNode('\u00A0\u00A0'));
      sous.appendChild(elem('span','mention', leg));
    }
    d.appendChild(sous);
    ligne.appendChild(d);
    dl.appendChild(ligne);
  }
  hote.appendChild(dl);
  traduire(hote);
  revoirFondu(hote);
}

/* ---------------------------------------------------------------------------
   8. D OU VIENNENT LES DONNEES. Dit a l ecran quand ce n est pas le fichier.
   ------------------------------------------------------------------------ */
function ecrireSource(){
  var hote = document.getElementById('reg-source');
  if(!hote) return;
  vider(hote);
  if(SOURCE === 'secours') hote.appendChild(elem('p', null, M.source_local));
  if(SOURCE === 'rien')    hote.appendChild(elem('p', null, M.source_rien));
  traduire(hote);
}

/* ---------------------------------------------------------------------------
   9. L EMBLEME DU REGISTRE, ET UN DEFAUT A SIGNALER.

   window.embleme_registro dessine le ticket de la maison avec un masque SVG
   dont l identifiant est fixe : id="rg_m". Or le meme emblème est pose deux
   fois dans le document, une fois dans le menu du telephone (cache au bureau)
   et une fois dans la page. Deux elements portent alors le meme identifiant :
   le navigateur ne garde que le premier, celui du menu cache, et le masque de
   la page ne decoupe plus rien. Le ticket devient un pave d encre plein.

   Verifie le 16 aout 2026 sur cette page : deux elements id="rg_m", le premier
   dans .menu. Les emblèmes botella et palenque n ont pas ce defaut, ils
   numerotent deja leurs identifiants.

   Le vrai correctif est dans assets/js/emblemes.js, qu un constructeur de page
   ne reecrit pas. On repare donc ici, et seulement dans notre page : les
   identifiants de notre exemplaire recoivent un suffixe. A signaler a Raouf,
   parce que la meme chose arrivera a mito et a ritual le jour ou ces emblèmes
   seront poses dans une page qui les montre aussi dans le menu.
   ------------------------------------------------------------------------ */
function reparerEmblemes(){
  var svgs = document.querySelectorAll('main .embleme[data-embleme] svg');
  for(var i=0;i<svgs.length;i++){
    var svg = svgs[i], h = svg.innerHTML, ids = [], m;
    var re = /\sid="([^"]+)"/g;
    while((m = re.exec(h)) !== null){ if(ids.indexOf(m[1]) === -1) ids.push(m[1]); }
    if(!ids.length) continue;
    for(var j=0;j<ids.length;j++){
      var vieux = ids[j], neuf = vieux + '-page' + i;
      h = h.split('id="' + vieux + '"').join('id="' + neuf + '"');
      h = h.split('#' + vieux + ')').join('#' + neuf + ')');
      h = h.split('href="#' + vieux + '"').join('href="#' + neuf + '"');
    }
    svg.innerHTML = h;
  }
}

/* ---------------------------------------------------------------------------
   10. LE BRANCHEMENT.
   ------------------------------------------------------------------------ */
function brancher(){
  var f = document.getElementById('reg-form');
  var n = document.getElementById('reg-numero');
  var t = document.getElementById('reg-total');
  if(!f || !n || !t) return;

  /* pendant la frappe : la fiche s ouvre des qu un lot est reconnu, et rien
     ne gronde tant que le visiteur n a pas fini. */
  function vivant(){
    var res = chercher(n.value, t.value);
    if(res.etat === 'trouve' || res.etat === 'plusieurs') repondre(res, false);
    else {
      var s = document.getElementById('reg-fiche');
      var z = document.getElementById('reg-reponse');
      if(s) s.hidden = true;
      if(z) vider(z);
    }
  }
  n.addEventListener('input', vivant);
  t.addEventListener('input', vivant);

  f.addEventListener('submit', function(e){
    e.preventDefault();
    var res = chercher(n.value, t.value);
    repondre(res, true);
    if(res.etat === 'trouve') allerALaFiche();
  });
}

function init(){
  reparerEmblemes();
  charger(function(){
    ecrireSource();
    if(!D) return;
    ecrireCrus();
    ecrireArchive();
    brancher();
  });
}

window.registre = { init: init, chercher: chercher, donnees: function(){ return D; }, source: function(){ return SOURCE; } };

})();
