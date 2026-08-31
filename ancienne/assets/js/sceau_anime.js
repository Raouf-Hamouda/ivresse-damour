/* sceau_anime.js : l'animation du sceau retenue par Raouf le 16 aout 2026 (variante "mains").
   Les deux mains font le tour et se referment, chacune apporte son crochet qui se deroule pendant
   le trajet, la fleur eclot du centre vers l'exterieur, les etoiles et les deux points jaillissent,
   l'arc de lettres monte de gauche a droite (le R final de D'AMOUR arrive en dernier, correction du
   16 aout au soir), une etoile cligne, les deux mots ferment leur chasse. 3,1 s, maintien a 2,9 s.

   Copie fonctionnelle exacte du <script> de 17_SITE/front/logo_anime.html, re-portee le 16 aout au
   soir : meme construction, meme ligne de temps T, meme mouvement des mains, meme tri de l'arc.
   Seules differences : le svg et la couleur sont passes en parametre, les identifiants de clip sont
   numerotes pour que plusieurs sceaux vivent dans la meme page, et il n'y a pas de curseur.

   sceauAnime(svg, {autoplay, duree, color}) : svg doit etre un <svg viewBox="0 0 842 595"> vide.
   Retourne {play, stop, set(t)}, t de 0 a 1. Depend de logo.js (window.logoParts). */
(function(){
  'use strict';
  var NS='http://www.w3.org/2000/svg';
  var UID=0;
  window.sceauAnime=function(svg, opt){
  opt=opt||{};
  var uid='s'+(++UID);
  var defs=document.createElementNS(NS,'defs'); svg.appendChild(defs);
  var root=document.createElementNS(NS,'g');
  root.setAttribute('fill', opt.color||'#2b2118');
  root.setAttribute('fill-rule','evenodd');
  svg.appendChild(root);

  var P=window.logoParts();
  var CX=443, CY=290;
  var DUR=opt.duree||3100;    /* ms ; maintien a partir de 2900 */

  function el(n,attrs,parent){var e=document.createElementNS(NS,n);if(attrs)for(var k in attrs)e.setAttribute(k,attrs[k]);(parent||root).appendChild(e);return e;}
  function path(d,parent){return el('path',{d:d},parent);}
  function bbox(d){var nums=d.match(/-?\d+(\.\d+)?/g).map(Number),x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(var i=0;i<nums.length;i+=2){var x=nums[i],y=nums[i+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}return [x0,y0,x1,y1];}
  function clamp(v,a,b){return v<a?a:v>b?b:v;}
  function seg(ms,a,d){return clamp((ms-a)/d,0,1);}
  function eo(x){return 1-Math.pow(1-x,4);}   /* quart-out : depart vif, atterrissage lisse sur toute la duree */
  function co(x){var y=1-x;return 1-y*y*y;}
  function f(v){return Math.round(v*1000)/1000;}

  /* ---------- construction, une fois ---------- */
  /* le petit point sous chaque main appartient aux etoiles, pas a la main */
  var handTopMain=P.handTop.filter(function(it){return it.d.length>800;}), handBotMain=P.handBottom.filter(function(it){return it.d.length>800;});
  var dots=P.handTop.filter(function(it){return it.d.length<=800;}).concat(P.handBottom.filter(function(it){return it.d.length<=800;}));
  var gHandTop=el('g',{opacity:0}); handTopMain.forEach(function(it){path(it.d,gHandTop);});
  var gHandBot=el('g',{opacity:0}); handBotMain.forEach(function(it){path(it.d,gHandBot);});

  /* les deux crochets de l anneau : chacun sous un demi-plan de decoupe qui tourne autour du centre,
     pour que le bord de l apparition soit toujours radial. Plage d angle du crochet autour du centre :
     [a0,a1] en degres (atan2 ecran). Apparition depuis a1 (pres d une main) vers a0. */
  var ring=P.ring.map(function(it,i){
    var nums=it.d.match(/-?\d+(\.\d+)?/g).map(Number), angs=[];
    for(var k=0;k<nums.length;k+=2){var an=Math.atan2(nums[k+1]-CY,nums[k]-CX)*180/Math.PI; if(i===0&&an<0)an+=360; angs.push(an);}
    var a0=Math.min.apply(null,angs)-4, a1=Math.max.apply(null,angs)+4;   /* gauche : ~141..218, droite : ~-38..38 */
    var id='clipRing'+uid+'_'+i, cp=el('clipPath',{id:id},defs);
    /* demi-plan droit ancre au centre : couvre les angles (-90..90) avant rotation */
    var rc=el('rect',{x:CX,y:CY-900,width:900,height:1800},cp);
    var go=el('g',{opacity:0}); var g=el('g',{'clip-path':'url(#'+id+')'},go); path(it.d,g);
    return {g:g,go:go,rc:rc,a0:a0,a1:a1,url:'url(#'+id+')'};
  });
  /* le crochet droit apparait depuis son bout bas (a1) vers le haut ; le gauche depuis son bout haut (a1, ~218 deg) vers le bas : meme formule */
  function ringAt(R,r){
    var lead=R.a1-(R.a1-R.a0)*r; R.rc.setAttribute('transform','rotate('+f(lead+90)+' '+CX+' '+CY+')');
    R.g.setAttribute('clip-path', r>=1? 'none' : R.url);   /* plus aucune decoupe une fois complet : le logo exact */
  }

  /* les petales : point de base = point de la boite le plus proche du centre ; ordre par distance */
  var petals=P.flower.map(function(it,i){
    var b=bbox(it.d), bx=clamp(CX,b[0],b[2]), by=clamp(CY,b[1],b[3]);
    var g=el('g',{transform:'translate('+bx+' '+by+') scale(0) translate('+(-bx)+' '+(-by)+')'}); path(it.d,g);
    return {g:g,bx:bx,by:by,dist:Math.hypot(it.cx-CX,it.cy-CY)};
  });
  var pd=petals.map(function(p){return p.dist;}), pmin=Math.min.apply(null,pd), pmax=Math.max.apply(null,pd);
  petals.forEach(function(p){p.k=(p.dist-pmin)/(pmax-pmin);});

  var stars=P.stars.concat(dots).map(function(it){var g=el('g',{opacity:0}); path(it.d,g); return {g:g,cx:it.cx,cy:it.cy};});
  /* l etoile qui cligne a la fin : la petite en haut a droite */
  var blinkStar=stars.slice().sort(function(a,b){return (b.cx-b.cy)-(a.cx-a.cy);})[0];

  /* lettres de l arc dans l ordre de lecture (angle autour du centre, de gauche a droite ; le R final de D'AMOUR arrive en dernier, correction 16 aout) */
  var arc=P.arc.slice().sort(function(a,b){function A(it){var a=Math.atan2(-(it.cy-290),it.cx-443)*180/Math.PI; if(a<0)a+=360; if(a>270)a-=360; return a;} return A(b)-A(a);}).map(function(it){var g=el('g',{opacity:0}); path(it.d,g); return {g:g};});
  var side=P.sideStars.map(function(it){var g=el('g',{opacity:0}); path(it.d,g); return {g:g,cx:it.cx,cy:it.cy};});

  function word(items){
    var xs=items.map(function(it){return it.cx;}), c=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2;
    return items.map(function(it){var g=el('g',{opacity:0}); path(it.d,g); return {g:g,dir:it.cx<c?-1:1};});
  }
  var tolo=word(P.toloache), legi=word(P.legitimo);

  /* ---------- ligne de temps (ms) ---------- */
  var T={
    hands:0, handsDur:700, fadeDur:120, handAng:55,
    ring:380, ringDur:320,
    flower:340, flowerDur:380, petalDur:200,
    stars:520, starDur:200, starStag:35, blink:1500, blinkDur:380,
    arc:900, arcStag:60, arcDur:420, arcRise:5,
    tolo:1850, wordDur:520, legi:2300,
    hold:2900
  };

  function render(t){
    t=clamp(t,0,1); var ms=t*DUR;

    /* 1. les mains se referment autour du centre */
    var h=eo(seg(ms,T.hands,T.handsDur)), ho=co(seg(ms,T.hands,T.fadeDur));
    var a=T.handAng*(1-h);
    gHandTop.setAttribute('transform', a? 'rotate('+f(a)+' '+CX+' '+CY+')' : '');
    gHandBot.setAttribute('transform', a? 'rotate('+f(a)+' '+CX+' '+CY+')' : '');
    gHandTop.setAttribute('opacity',f(ho)); gHandBot.setAttribute('opacity',f(ho));

    /* 2. chaque crochet voyage AVEC sa main (le gauche avec la main du haut, le droit avec la main du bas)
          et se deroule hors de la main pendant le trajet : fini quand la main arrive */
    var r=eo(seg(ms,T.hands+120,T.handsDur-120));
    ringAt(ring[0],r); ringAt(ring[1],r);
    ring.forEach(function(R){ R.go.setAttribute('transform', a? 'rotate('+f(a)+' '+CX+' '+CY+')' : ''); R.go.setAttribute('opacity',f(ho)); });

    /* 3. la fleur eclot, petales du centre d abord */
    var span=T.flowerDur-T.petalDur;
    petals.forEach(function(p){
      var e=co(seg(ms,T.flower+span*p.k,T.petalDur));
      p.g.setAttribute('opacity',e>0.12?1:0);
      p.g.setAttribute('transform', e>=1? '' : 'translate('+p.bx+' '+p.by+') scale('+f(e)+') translate('+(-p.bx)+' '+(-p.by)+')');
    });
    stars.forEach(function(s,i){
      var e=co(seg(ms,T.stars+T.starStag*i,T.starDur));
      s.g.setAttribute('opacity',e>0?1:0);
      var tr = e>=1? '' : 'translate('+s.cx+' '+s.cy+') rotate('+f(45*(1-e))+') scale('+f(e)+') translate('+(-s.cx)+' '+(-s.cy)+')';
      if(s===blinkStar && e>=1){ var b=seg(ms,T.blink,T.blinkDur); var k=Math.sin(Math.PI*b); tr = b<=0||b>=1? '' : 'translate('+s.cx+' '+s.cy+') scale('+f(1+0.2*k)+') translate('+(-s.cx)+' '+(-s.cy)+')'; }
      s.g.setAttribute('transform', tr);
    });

    /* 4. les lettres de l arc, de gauche a droite, montent en place */
    arc.forEach(function(l,i){
      var x=seg(ms,T.arc+T.arcStag*i,T.arcDur), e=co(x);
      l.g.setAttribute('opacity',f(co(clamp(x/0.15,0,1))));
      l.g.setAttribute('transform', e>=1? '' : 'translate(0 '+f(T.arcRise*(1-e))+')');
    });
    side.forEach(function(s,i){
      var x=seg(ms,T.arc+T.arcStag*(12+i),T.arcDur), e=co(x);
      s.g.setAttribute('opacity',f(co(clamp(x/0.15,0,1))));
      s.g.setAttribute('transform', e>=1? '' : 'translate(0 '+f(T.arcRise*(1-e))+')');
    });

    /* 5. les mots : les lettres apparaissent de gauche a droite, la chasse se referme */
    function wordAt(w,t0){
      /* la chasse se referme pour tout le mot a la fois ; les lettres apparaissent de gauche a droite, 110 ms chacune */
      var n=w.length, per=110, stag=(T.wordDur-per)/(n-1), k=co(seg(ms,t0,T.wordDur));
      w.forEach(function(l,i){
        var e=co(seg(ms,t0+stag*i,per));
        l.g.setAttribute('opacity',f(e));
        l.g.setAttribute('transform', k>=1? '' : 'translate('+f(l.dir*5*(1-k))+' 0)');
      });
    }
    wordAt(tolo,T.tolo); wordAt(legi,T.legi);
  }

  /* ---------- lecteur ---------- */
  var raf=null, t0=0;
  function frame(now){ var t=Math.min(1,(now-t0)/DUR); render(t); if(t<1) raf=requestAnimationFrame(frame); else raf=null; }
  function stop(){ if(raf) cancelAnimationFrame(raf); raf=null; }
  function play(){ stop(); t0=performance.now(); raf=requestAnimationFrame(frame); }
  render(0);
  if(opt.autoplay!==false) play();
  return {play:play, stop:stop, set:function(t){ stop(); render(clamp(+t||0,0,1)); }};
  };
})();
