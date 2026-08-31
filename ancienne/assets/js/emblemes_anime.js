/* emblemes_anime.js : animation des emblemes retenus (16 aout 2026), meme esprit que logo_anime.html.
   Depend de emblemes_parts.js (pieces vectorisees) et, pour El Mito, de embleme_mito.js.
   Usage : var c = EMBLEMES_ANIME.mount(nom, svgElement, {color, paper}); c.play(); c.render(ms); c.duration
   Noms : coyote, espadin, tobala, historia, historia_mains, registro, palenque, ritual_mains, ritual_couple, mito, botella. */
(function(){
  var NS='http://www.w3.org/2000/svg';
  var co=function(x){ return 1-Math.pow(1-x,3); };                       // ease out cubic
  var back=function(x){ var s=1.4; return 1+(--x)*x*((s+1)*x+s); };     // ease out back (petit depassement)
  var io=function(x){ return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2; };    // ease in-out
  var clamp=function(v,a,b){ return v<a?a:v>b?b:v; };
  var seg=function(ms,a,b){ return clamp((ms-a)/(b-a),0,1); };
  var pop=function(k){ return k<1?back(k):1; };                          // 0..1 avec depassement
  function el(tag,attrs,parent){ var e=document.createElementNS(NS,tag); for(var k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }
  function group(parent,items,color){ return items.map(function(it){ var g=el('g',{},parent); var a={d:it.d,'fill-rule':'evenodd',fill:color}; if(it.tf) a.transform=it.tf; el('path',a,g); g.__it=it; return g; }); }
  function T(g,s){ g.setAttribute('transform',s); } function O(g,v){ g.setAttribute('opacity',v.toFixed(3)); }
  function about(cx,cy,inner){ return 'translate('+cx+' '+cy+') '+inner+' translate('+(-cx)+' '+(-cy)+')'; }
  function blink(ms,at,g){ if(ms>at&&ms<at+360){ var k=(ms-at)/360; O(g,0.25+0.75*Math.abs(Math.cos(k*Math.PI))); } }
  var D=window.EMBLEMES_PARTS||{};
  var A={};

  /* --- plantes en eventail : coyote, espadin. Chaque feuille tourne depuis la verticale autour du pied, du centre vers l exterieur --- */
  function fan(name){ return function(root,o){
    var e=D[name], px=e.pivot[0], py=e.pivot[1];
    var leaves=group(root,e.parts.leaf,o.color).map(function(g){ var it=g.__it; g.__a=Math.atan2(it.cx-px,-(it.cy-py))*180/Math.PI; return g; });
    var n=leaves.length; var order=leaves.slice().sort(function(a,b){ return Math.abs(a.__a)-Math.abs(b.__a); }); order.forEach(function(g,i){ g.__i=i; });
    return { duration:2200, render:function(ms){
      leaves.forEach(function(g){ var st=g.__i/n*700; var k=seg(ms,st,st+1100); var e=back(k); var rot=g.__a*(1-e); var sc=0.55+0.45*co(k);
        T(g,about(px,py,'rotate('+rot.toFixed(2)+') scale('+sc.toFixed(3)+')')); O(g,co(seg(ms,st,st+300))); }); } };
  }; }
  A.coyote=fan('coyote'); A.espadin=fan('espadin');
  /* --- tobala, rosette : les feuilles se deplient depuis le coeur, en tournant un peu, interieur d abord --- */
  A.tobala=function(root,o){
    var e=D.tobala, px=e.pivot[0], py=e.pivot[1];
    var leaves=group(root,e.parts.leaf,o.color); var ds=leaves.map(function(g){ return Math.hypot(g.__it.cx-px,g.__it.cy-py); }); var dmax=Math.max.apply(null,ds);
    return { duration:2200, render:function(ms){
      leaves.forEach(function(g,i){ var st=ds[i]/dmax*900; var k=seg(ms,st,st+1000); var e=back(k);
        T(g,about(px,py,'rotate('+(-28*(1-e)).toFixed(2)+') scale('+(0.25+0.75*e).toFixed(3)+')')); O(g,co(seg(ms,st,st+250))); }); } };
  };
  /* --- historia : elle arrive de gauche, lui de droite, la plante pousse entre eux, deux etoiles --- */
  A.historia=function(root,o){
    var e=D.historia, P=e.parts, px=e.pivot[0], py=e.pivot[1];
    var woman=group(root,P.woman,o.color), man=group(root,P.man,o.color), plant=group(root,P.plant,o.color), stars=group(root,P.star,o.color);
    plant.sort(function(a,b){ return b.__it.cy-a.__it.cy; });
    return { duration:2200, render:function(ms){
      var k=co(seg(ms,0,900)); woman.forEach(function(g){ T(g,'translate('+(-42*(1-k)).toFixed(2)+' 0)'); O(g,k); }); man.forEach(function(g){ T(g,'translate('+(42*(1-k)).toFixed(2)+' 0)'); O(g,k); });
      plant.forEach(function(g,i){ var st=350+i*60; var kk=seg(ms,st,st+450); var ee=back(kk); T(g,about(px,py,'scale('+(0.15+0.85*ee).toFixed(3)+')')); O(g,co(seg(ms,st,st+250))); });
      stars.forEach(function(g,i){ var st=1000+i*140; var kk=pop(seg(ms,st,st+400)); T(g,about(g.__it.cx,g.__it.cy,'scale('+kk.toFixed(3)+') rotate('+(20*(1-kk)).toFixed(1)+')')); O(g,seg(ms,st,st+120)); blink(ms,1800,g); }); } };
  };
  /* --- historia, les mains : les mains montent, la fleur eclot, les etoiles et le point --- */
  A.historia_mains=function(root,o){
    var e=D.historia_mains, P=e.parts, px=e.pivot[0], py=e.pivot[1];
    var hands=group(root,P.handL.concat(P.handR),o.color), petals=group(root,P.petal,o.color), stars=group(root,P.star,o.color), dot=group(root,P.dot,o.color);
    var ds=petals.map(function(g){ return Math.hypot(g.__it.cx-px,g.__it.cy-py); }); var dmax=Math.max.apply(null,ds);
    return { duration:2700, render:function(ms){
      var k=co(seg(ms,0,850)); hands.forEach(function(g){ T(g,'translate(0 '+(38*(1-k)).toFixed(2)+')'); O(g,k); });
      petals.forEach(function(g,i){ var st=500+ds[i]/dmax*600; var kk=seg(ms,st,st+800); var ee=back(kk); T(g,about(px,py,'scale('+(0.1+0.9*ee).toFixed(3)+')')); O(g,co(seg(ms,st,st+250))); });
      stars.forEach(function(g,i){ var st=1400+i*130; var kk=pop(seg(ms,st,st+450)); T(g,about(g.__it.cx,g.__it.cy,'scale('+kk.toFixed(3)+')')); O(g,seg(ms,st,st+100)); if(i===1) blink(ms,2250,g); });
      dot.forEach(function(g){ var kk=pop(seg(ms,1950,2350)); T(g,about(g.__it.cx,g.__it.cy,'scale('+kk.toFixed(3)+')')); O(g,seg(ms,1950,2050)); }); } };
  };
  /* --- registro : le ticket entier glisse et se pose (lignes et texte deja ecrits), puis le sceau en haut a droite fait un tour complet --- */
  A.registro=function(root,o){
    var e=D.registro, P=e.parts, Q=e.paper; var wrap=el('g',{},root);
    group(wrap,P.frame.concat([P.body[0]]),o.color); group(wrap,Q.line,o.paper); group(wrap,Q.text,o.paper); var seal=group(wrap,Q.seal,o.paper); group(wrap,P.body.slice(1),o.color);
    var sc=seal.reduce(function(s,g){ s.x+=g.__it.cx/seal.length; s.y+=g.__it.cy/seal.length; return s; },{x:0,y:0});
    return { duration:2600, render:function(ms){
      var k=co(seg(ms,0,750)); T(wrap,'translate('+(55*(1-k)).toFixed(2)+' '+(-10*(1-k)).toFixed(2)+') rotate('+(-7*(1-k)).toFixed(2)+')'); O(wrap,k);
      var r=-360*io(seg(ms,900,2300)); seal.forEach(function(g){ T(g,about(sc.x,sc.y,'rotate('+r.toFixed(2)+')')); }); } };
  };
  /* --- palenque : le notre, immobile. Seule la flamme (decoupe blanche + son coeur noir) vacille, et la goutte tombe du robinet, en boucle --- */
  A.palenque=function(root,o){
    var e=D.palenque, P=e.parts, Q=e.paper, c=o.color;
    group(root,P.ground.concat(P.brick,P.oven,P.pot,P.spout,P.dome,P.pipe,P.tank),c); var flame=group(root,Q.flame,o.paper).concat(group(root,P.flamecore||[],c)), drop=group(root,P.drop,c);
    var fb=flame.length?flame[0].firstChild.getBBox():null;
    return { duration:3000, render:function(ms){
      if(fb){ var t=ms/1000; var sy=1+0.08*Math.sin(t*9.7)+0.04*Math.sin(t*15.3); var sk=3*Math.sin(t*7.1)+1.5*Math.sin(t*11.9); var by=fb.y+fb.height, bx=fb.x+fb.width/2;
        flame.forEach(function(g){ T(g,'translate('+bx+' '+by+') scale('+(1-0.03*Math.sin(t*13)).toFixed(3)+' '+sy.toFixed(3)+') skewX('+sk.toFixed(2)+') translate('+(-bx)+' '+(-by)+')'); }); }
      drop.forEach(function(g){ var t=(ms%1400)/1400; var y=co(Math.min(t/0.6,1))*7; var op=t<0.6?Math.min(1,t*6):Math.max(0,1-(t-0.6)/0.15); T(g,'translate(0 '+y.toFixed(2)+')'); O(g,op); }); } };
  };
  /* --- ritual, les mains : comme le sceau, la main du haut descend, celle du bas monte, la copita apparait, les etoiles --- */
  A.ritual_mains=function(root,o){
    var e=D.ritual_mains, P=e.parts, c=o.color;
    var top=group(root,P.handT,c), bot=group(root,P.handB,c), glass=group(root,P.glass,c), stars=group(root,P.star,c), dots=group(root,P.dot,c);
    return { duration:2500, render:function(ms){
      var k=co(seg(ms,0,850)); top.forEach(function(g){ T(g,'translate(0 '+(-45*(1-k)).toFixed(2)+')'); O(g,k); }); bot.forEach(function(g){ T(g,'translate(0 '+(45*(1-k)).toFixed(2)+')'); O(g,k); });
      glass.forEach(function(g){ var kk=back(seg(ms,600,1250)); T(g,about(g.__it.cx,g.__it.cy,'scale('+(0.5+0.5*kk).toFixed(3)+')')); O(g,co(seg(ms,600,850))); });
      stars.forEach(function(g,i){ var st=1150+i*120; var kk=pop(seg(ms,st,st+420)); T(g,about(g.__it.cx,g.__it.cy,'scale('+kk.toFixed(3)+')')); O(g,seg(ms,st,st+100)); if(i===2) blink(ms,2100,g); });
      dots.forEach(function(g,i){ var st=1550+i*120; var kk=pop(seg(ms,st,st+380)); T(g,about(g.__it.cx,g.__it.cy,'scale('+kk.toFixed(3)+')')); O(g,seg(ms,st,st+100)); }); } };
  };
  /* --- ritual, le couple : ils entrent chacun de son cote, les copitas se touchent, les etoiles jaillissent au choc --- */
  A.ritual_couple=function(root,o){
    var e=D.ritual_couple, P=e.parts, c=o.color;
    var man=group(root,P.man,c), woman=group(root,P.woman,c), gl=group(root,P.glassL,c), gr=group(root,P.glassR,c), stars=group(root,P.star,c);
    gl.concat(gr).forEach(function(g){ g.setAttribute('data-caresse','1'); });   /* seules les copitas repondent a la caresse (Raouf, 17 aout) */
    var bl=gl.map(function(g){ return g.firstChild.getBBox(); }), br=gr.map(function(g){ return g.firstChild.getBBox(); });
    var lc={x:-9,y:8}, rc={x:8,y:8};
    return { duration:2700, render:function(ms){
      var k=co(seg(ms,0,900)); var dx=48*(1-k);
      man.forEach(function(g){ T(g,'translate('+(-dx).toFixed(2)+' 0)'); O(g,k); }); woman.forEach(function(g){ T(g,'translate('+dx.toFixed(2)+' 0)'); O(g,k); });
      var t1=seg(ms,950,1250), t2=seg(ms,1250,1750); var ang=t2>0?8*(1-io(t2)):8*io(t1);   // penche vers l autre puis revient
      gl.forEach(function(g){ T(g,'translate('+(-dx).toFixed(2)+' 0) '+about(lc.x,lc.y,'rotate('+ang.toFixed(2)+')')); O(g,k); });
      gr.forEach(function(g){ T(g,'translate('+dx.toFixed(2)+' 0) '+about(rc.x,rc.y,'rotate('+(-ang).toFixed(2)+')')); O(g,k); });
      stars.forEach(function(g,i){ var st=1230+i*90; var kk=pop(seg(ms,st,st+450)); T(g,about(g.__it.cx,g.__it.cy,'scale('+kk.toFixed(3)+') rotate('+(25*(1-kk)).toFixed(1)+')')); O(g,seg(ms,st,st+100)); if(i===1) blink(ms,2250,g); }); } };
  };
  /* --- mito : reprise de mito_anime.html (l eclair descend derriere l agave, frappe, l agave tremble, les etoiles jaillissent) --- */
  A.mito=function(root,o){
    root.innerHTML=window.embleme_mito({color:o.color});
    var bg=root.querySelector('#mt_bolt_g'); root.querySelector('g').parentNode.insertBefore(bg,root.querySelector('g'));
    (function(){ var m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(o.color); if(m){ var l=[1,2,3].map(function(i){ var v=parseInt(m[i],16); return Math.round(v+(255-v)*0.2); }); bg.setAttribute('fill','rgb('+l.join(',')+')'); [].slice.call(bg.querySelectorAll('[fill]')).forEach(function(n){ if(n.getAttribute('fill').toLowerCase()===o.color.toLowerCase()) n.setAttribute('fill','rgb('+l.join(',')+')'); }); } })();   /* l eclair : la couleur du buisson, 20 % plus claire (Raouf) */   /* l eclair derriere toute la plante (Raouf) */
    var uid='mtc'+Math.floor(Math.random()*1e6); var defs=el('defs',{},root); var cp=el('clipPath',{id:uid},defs); var rect=el('rect',{x:-120,y:-120,width:240,height:0},cp);
    var bolt=root.querySelector('#mt_bolt_g'), stars=[].slice.call(root.querySelectorAll('.mt_star')), plants=[].slice.call(root.querySelectorAll('.mt_plant'));
    bolt.setAttribute('clip-path','url(#'+uid+')'); var base=plants.map(function(p){ return p.getAttribute('transform')||''; });
    var so=stars.map(function(st){ var m=/translate\(([-\d.]+) ([-\d.]+)\)/.exec(st.firstElementChild.getAttribute('transform')||''); return m?[+m[1],+m[2]]:[0,0]; });
    var HIT=520, TOP=-116, BOT=40;
    return { duration:2600, render:function(ms){
      var d=clamp(ms/HIT,0,1); rect.setAttribute('height',((BOT-TOP)*d).toFixed(2)); bolt.setAttribute('opacity',1);
      var hit=ms>=HIT;
      stars.forEach(function(st,i){ var k=co(clamp((ms-HIT-40-i*50)/260,0,1)); var dx=(i===0?-1:1)*8*(1-k); st.setAttribute('transform','translate('+(dx+so[i][0]*(1-k)).toFixed(2)+' '+(-6*(1-k)+so[i][1]*(1-k)).toFixed(2)+') scale('+k.toFixed(3)+')'); st.setAttribute('opacity',k>0?1:0); });
      var t=(ms-HIT)/1000; var rot=hit?Math.sin(t*28)*4.5*Math.exp(-t*4.5):0; var sc=hit?1+0.04*Math.exp(-t*6)*Math.cos(t*22):1;
      plants.forEach(function(p,i){ p.setAttribute('transform','rotate('+rot.toFixed(2)+' 0 66) translate(0 '+(-1.5*(sc-1)*40).toFixed(2)+') scale('+sc.toFixed(3)+') '+base[i]); }); } };
  };
  /* --- mito (v2 Nano Banana + nos etoiles) : l eclair descend derriere l agave ; avant le choc le haut de la plante est entier ; au choc la coupure apparait, la plante tremble, les rayons et les deux etoiles jaillissent --- */
  A.mito2=function(root,o){
    var e=D.mito2, P=e.parts, c=o.color, tip=e.tip;
    var uid='m2c'+Math.floor(Math.random()*1e6); var defs=el('defs',{},root); var cp=el('clipPath',{id:uid},defs); var rect=el('rect',{x:-120,y:-120,width:240,height:240},cp);
    var boltG=el('g',{'clip-path':'url(#'+uid+')'},root); var bolt=group(boltG,P.bolt,c);
    var plantG=el('g',{},root); group(plantG,P.plant,c); var patch=group(plantG,P.patch,c); group(root,P.ground,c); var rays=group(root,P.ray,c), stars=group(root,P.star,c);
    var top=Math.min.apply(null,bolt.map(function(g){ return g.firstChild.getBBox().y; })); var HIT=480, END=tip[1]+2;
    return { duration:2200, render:function(ms){
      var d=co(seg(ms,0,HIT)); rect.setAttribute('y',top-1); rect.setAttribute('height',Math.max(0,(END-top+1)*d));
      var hit=ms>=HIT; patch.forEach(function(g){ O(g,hit?0:1); });
      var t=(ms-HIT)/1000; var rot=hit?Math.sin(t*26)*4*Math.exp(-t*4.5):0; T(plantG,'rotate('+rot.toFixed(2)+' 0 90)');
      rays.forEach(function(g,i){ var k=co(seg(ms,HIT,HIT+260)); var sx=g.__it.cx<0?1:-1; var ox=g.__it.cx+sx*9, oy=g.__it.cy+9; T(g,about(ox,oy,'scale('+Math.max(k,0.001).toFixed(3)+')')); O(g,k>0?1:0); });
      stars.forEach(function(g,i){ var st=HIT+120+i*60; var k=pop(seg(ms,st,st+380)); var dir=g.__it.cx<0?-1:1; T(g,'translate('+(dir*-6*(1-Math.min(k,1))).toFixed(2)+' '+(6*(1-Math.min(k,1))).toFixed(2)+') '+about(g.__it.cx,g.__it.cy,'scale('+k.toFixed(3)+') rotate('+(30*(1-Math.min(k,1))).toFixed(1)+')')); O(g,seg(ms,st,st+80)); if(i===1) blink(ms,1750,g); }); } };
  };
  /* --- mito 3 : l eclair, les rayons et les etoiles de la v2 Nano Banana, posees sur le buisson de l ancien El Mito (la fleur du sceau). L eclair descend derriere le buisson, frappe, le buisson tremble, rayons et etoiles jaillissent --- */
  A.mito3=function(root,o){
    root.innerHTML=window.embleme_mito({color:o.color});
    var ob=root.querySelector('#mt_bolt_g'); ob.parentNode.removeChild(ob); [].slice.call(root.querySelectorAll('.mt_star')).forEach(function(n){ n.parentNode.removeChild(n); });   /* les deux anciennes etoiles : supprimees */
    var e=D.mito2, P=e.parts, c=o.color, DY=38-e.tip[1];   /* la pointe de l eclair enterree a y=38 comme avant ; eclair reduit de 20 % autour de sa pointe */
    var uid='m3c'+Math.floor(Math.random()*1e6); var defs=el('defs',{},root); var cp=el('clipPath',{id:uid},defs); var rect=el('rect',{x:-120,y:-120,width:240,height:240},cp);
    var host=root.querySelector('g'); var boltG=el('g',{'clip-path':'url(#'+uid+')',transform:'translate(0 '+DY.toFixed(2)+') '+about(e.tip[0],e.tip[1],'scale(0.8)')}); host.parentNode.insertBefore(boltG,host); var bolt=group(boltG,P.bolt,c);
    var rays=[];   /* les rayons : supprimes (Raouf 16 aout 22h12) */
    /* les etoiles : les deux etoiles nettes a quatre branches du Ritual (couple), aux places des anciennes, eclair 40 % plus clair */
    var so=[[-50,-8],[62,-12]]; var src=D.ritual_couple.parts.star.slice().sort(function(a,b){ return b.area-a.area; }).slice(0,2);
    var stars=so.map(function(pos,i){ var it=src[i]; var sc=(i===0?16:13)/Math.sqrt(it.area); var w=el('g',{},root); var g=el('g',{transform:'translate('+pos[0]+' '+pos[1]+') scale('+sc.toFixed(3)+') translate('+(-it.cx)+' '+(-it.cy)+')'},w); el('path',{d:it.d,'fill-rule':'evenodd',fill:c},g); return w; });
    (function(){ var m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c); if(m){ var l=[1,2,3].map(function(k){ var v=parseInt(m[k],16); return Math.round(v+(255-v)*0.2); }); bolt.forEach(function(g){ g.firstChild.setAttribute('fill','rgb('+l.join(',')+')'); }); } })();
    /* chaque rayon pivote autour de son pied (cote plante) pour viser son etoile, et sa pointe s arrete a 13 unites du centre de l etoile : rien ne depasse derriere */
    rays.forEach(function(g){ var b=g.firstChild.getBBox(); var left=g.__it.cx<0; var ix=left?b.x+b.width:b.x, iy=b.y+b.height, ex=left?b.x:b.x+b.width, ey=b.y; var st=[so[left?0:1][0],so[left?0:1][1]-DY];
      var a0=Math.atan2(ey-iy,ex-ix), a1=Math.atan2(st[1]-iy,st[0]-ix); var L0=Math.hypot(ex-ix,ey-iy); var tx=st[0]-13*Math.cos(a1)-(ix+L0*Math.cos(a1)), ty=st[1]-13*Math.sin(a1)-(iy+L0*Math.sin(a1)); var px=st[0]-13*Math.cos(a1), py=st[1]-13*Math.sin(a1); g.__pre='translate('+px.toFixed(2)+' '+py.toFixed(2)+') scale(1.3) translate('+(-px).toFixed(2)+' '+(-py).toFixed(2)+') translate('+tx.toFixed(2)+' '+ty.toFixed(2)+') translate('+ix+' '+iy+') rotate('+((a1-a0)*180/Math.PI).toFixed(2)+') translate('+(-ix)+' '+(-iy)+')'; g.__ix=ix; g.__iy=iy; });   /* meme longueur qu a l origine, pivote et glisse : la pointe a 13 unites de l etoile */
    var plants=[].slice.call(root.querySelectorAll('.mt_plant')); var base=plants.map(function(p){ return p.getAttribute('transform')||''; });
    var top=Math.min.apply(null,bolt.map(function(g){ return g.firstChild.getBBox().y; })); var HIT=480, END=e.tip[1]+2;
    return { duration:2200, render:function(ms){
      var d=co(seg(ms,0,HIT)); rect.setAttribute('y',top-1); rect.setAttribute('height',Math.max(0,(END-top+1)*d));
      var hit=ms>=HIT; var t=(ms-HIT)/1000; var rot=hit?Math.sin(t*28)*4.5*Math.exp(-t*4.5):0; var sc=hit?1+0.04*Math.exp(-t*6)*Math.cos(t*22):1;
      plants.forEach(function(p,i){ p.setAttribute('transform','rotate('+rot.toFixed(2)+' 0 66) translate(0 '+(-1.5*(sc-1)*40).toFixed(2)+') scale('+sc.toFixed(3)+') '+base[i]); });
      rays.forEach(function(g,i){ var k=co(seg(ms,HIT,HIT+260)); var sx=g.__it.cx<0?1:-1; var ox=g.__it.cx+sx*9, oy=g.__it.cy+9; T(g,g.__pre+' '+about(g.__ix,g.__iy,'scale('+Math.max(k,0.001).toFixed(3)+')')); O(g,k>0?1:0); });
      stars.forEach(function(st,i){ var k=co(clamp((ms-HIT-60-i*50)/260,0,1)); var dx=(i===0?-1:1)*8*(1-k); st.setAttribute('transform','translate('+(dx+so[i][0]*(1-k)).toFixed(2)+' '+(-6*(1-k)+so[i][1]*(1-k)).toFixed(2)+') scale('+k.toFixed(3)+')'); st.setAttribute('opacity',k>0?1:0); }); } };
  };
  /* --- botella : vif, 1,5 s. La base et le corps se remplissent de bas en haut, les ecailles des cotes et de l epaule s allument, le medaillon tamponne, le col et la couronne poussent en place --- */
  A.botella=function(root,o){
    var e=D.botella, P=e.parts, c=o.color, mc=e.medal_c;
    var uid='btc'+Math.floor(Math.random()*1e6); var defs=el('defs',{},root); var cp=el('clipPath',{id:uid},defs); var rect=el('rect',{x:-120,y:-120,width:240,height:240},cp);
    var base=group(root,P.base,c), body=group(root,P.body,c), side=group(root,P.side,c), sh=group(root,P.shoulder,c), medal=group(root,P.medal,c), neck=group(root,P.neck.concat(P.collar),c), crown=group(root,P.crown,c);
    /* la caresse (Raouf, 17 aout) : le bord de la bouteille repond (pied, flanc, epaule, col, couronne), le dedans a peine (corps, medaillon a 15 %) */
    base.concat(side,sh,neck,crown).forEach(function(g){ g.setAttribute('data-caresse','1'); }); body.forEach(function(g){ g.setAttribute('data-caresse','0.45'); }); medal.forEach(function(g){ g.setAttribute('data-caresse','0.15'); });   /* le corps (dont le bas de la bouteille) suit a 45 %, le medaillon a 15 % */
    body[0].setAttribute('clip-path','url(#'+uid+')'); var bb=body[0].firstChild.getBBox();
    side.sort(function(a,b){ return b.__it.cy-a.__it.cy; }); sh.sort(function(a,b){ return Math.abs(a.__it.cx)-Math.abs(b.__it.cx); }); crown.sort(function(a,b){ return Math.abs(a.__it.cx)-Math.abs(b.__it.cx); });
    /* le nom de la bouteille ecrit dans l espace du ticket (o.label), une seule ligne, capitales espacees, encre */
    var tk=(function(){ var bx=base[0].firstChild.getBBox(); return null; })();
    if(o.label){ var lab=el('text',{x:0,y:0,'text-anchor':'middle','dominant-baseline':'central','font-family':o.font||'Georgia, "Times New Roman", serif','font-size':'7.2','letter-spacing':'0.9',fill:c},root); lab.textContent=String(o.label).toUpperCase();
      /* l espace du ticket : le trou de la piece base ; on le trouve par le centre du corps (x=0) et le haut de la base */
      var bb0=base[0].firstChild.getBBox(); lab.setAttribute('x',0); lab.setAttribute('y',(bb0.y+bb0.height*0.36).toFixed(2)); }
    var crownState={t0:-1};
    return { duration:1600, playCrown:function(){ crownState.t0=performance.now(); var self=this; (function f(){ var ms=performance.now()-crownState.t0; self.renderCrown(ms); if(ms<1100) requestAnimationFrame(f); else { crownState.t0=-1; self.renderCrown(1e9); } })(); },
      renderCrown:function(ms){ /* le bouchon seul : les feuilles se referment vers l axe puis se rouvrent avec un petit ressort, comme une plante */
        crown.forEach(function(g,i){ var a=Math.atan2(g.__it.cx,-(g.__it.cy+63))*180/Math.PI; var k1=io(seg(ms,0,380)), k2=back(seg(ms,380,1100)); var closeAmt=k1*(1-k2); T(g,about(0,-63,'rotate('+(-a*0.85*closeAmt).toFixed(2)+') scale('+(1-0.35*closeAmt).toFixed(3)+' '+(1-0.15*closeAmt).toFixed(3)+')')); O(g,1); }); },
      render:function(ms){
      var k=co(seg(ms,0,350)); base.forEach(function(g){ T(g,'translate(0 '+(8*(1-k)).toFixed(2)+')'); O(g,k); });
      var kb=co(seg(ms,150,750)); rect.setAttribute('y',(bb.y+bb.height*(1-kb)).toFixed(2)); rect.setAttribute('height',(bb.height*kb+1).toFixed(2)); O(body[0],kb>0?1:0);
      side.forEach(function(g,i){ var st=250+i*40; var kk=co(seg(ms,st,st+250)); O(g,kk); });
      sh.forEach(function(g,i){ var st=550+i*25; var kk=pop(seg(ms,st,st+300)); T(g,about(g.__it.cx,g.__it.cy,'scale('+kk.toFixed(3)+')')); O(g,kk>0?1:0); });
      medal.forEach(function(g){ var kk=seg(ms,600,1000), ee=co(kk); T(g,about(mc[0],mc[1],'scale('+(1.4-0.4*ee).toFixed(3)+') rotate('+(-12*(1-ee)).toFixed(2)+')')); O(g,ee); });
      neck.forEach(function(g){ var kk=co(seg(ms,700,1050)); T(g,about(0,-18,'scale(1 '+(0.6+0.4*kk).toFixed(3)+')')); O(g,kk); });
      crown.forEach(function(g,i){ var st=900+i*45; var kk=back(seg(ms,st,st+420)); T(g,about(0,-63,'scale('+Math.max(kk,0).toFixed(3)+')')); O(g,seg(ms,st,st+120)); }); } };
  };

  /* --- libro (La Historia) : le livre se pose, les lignes s ecrivent, la fleur du sceau s ouvre sur la page, l etoile --- */
  A.libro=function(root,o){
    var e=D.libro, P=e.parts, Q=e.paper, c=o.color, fc=e.flower_c;
    var wrap=el('g',{},root); var book=group(wrap,P.cover.concat(P.pageL,P.pageR),c); var lines=group(wrap,Q.line,o.paper), flower=group(wrap,Q.flower,o.paper), star=group(wrap,Q.star,o.paper), petals=group(wrap,P.petal,c);
    lines.sort(function(a,b){ return a.__it.cy-b.__it.cy; }); var lb=lines.map(function(g){ return g.firstChild.getBBox().x; });
    return { duration:2300, render:function(ms){
      var k=co(seg(ms,0,600)); T(wrap,'translate(0 '+(10*(1-k)).toFixed(2)+')'); O(wrap,k);
      lines.forEach(function(g,i){ var st=450+i*110; var kk=co(seg(ms,st,st+420)); T(g,'translate('+lb[i]+' 0) scale('+Math.max(kk,0.001).toFixed(3)+' 1) translate('+(-lb[i])+' 0)'); O(g,kk>0?1:0); });
      var fk=back(seg(ms,900,1600)); flower.concat(petals).forEach(function(g){ T(g,about(fc[0],fc[1]+14,'scale('+Math.max(fk,0.001).toFixed(3)+')')); O(g,co(seg(ms,900,1150))); });
      star.forEach(function(g){ var kk=pop(seg(ms,1500,1900)); T(g,about(g.__it.cx,g.__it.cy,'scale('+kk.toFixed(3)+') rotate('+(25*(1-Math.min(kk,1))).toFixed(1)+')')); O(g,seg(ms,1500,1580)); blink(ms,2050,g); }); } };
  };

  /* --- brindis (Eventos) : les deux copitas se penchent l une vers l autre et trinquent, le liquide bouge dans les verres, les etoiles paraissent au choc --- */
  A.brindis=function(root,o){
    var e=D.brindis, P=e.parts, Q=e.paper, c=o.color;
    var uid='brc'+Math.floor(Math.random()*1e6); var defs=el('defs',{},root);
    function side(k){ var g=el('g',{},root); var glass=group(g,P['glass'+k],c)[0]; var cp=el('clipPath',{id:uid+k},defs); el('path',{d:glass.__it.d},cp);
      var clipG=el('g',{'clip-path':'url(#'+uid+k+')'},g); var air=group(clipG,Q['air'+k],o.paper)[0]; var line=group(g,Q['line'+k],o.paper)[0];
      var b=glass.firstChild.getBBox(); return {g:g,air:air,base:{x:b.x+b.width/2,y:b.y+b.height},ac:{x:air.__it.cx,y:air.__it.cy}}; }
    var L=side('L'), R=side('R'); var stars=group(root,P.star,c); stars.sort(function(a,b){ return a.__it.cx-b.__it.cx; });
    var HIT=520;
    return { duration:2400, render:function(ms){
      /* 0..HIT : les verres s ecartent un peu puis viennent l un vers l autre ; au choc un petit rebond */
      var t1=io(seg(ms,0,HIT)); var t2=ms>HIT?Math.sin(Math.min((ms-HIT)/500,1)*Math.PI)*Math.exp(-(ms-HIT)/400):0;
      var ang=-6*(1-t1)+3*t2;   /* negatif = penche vers l exterieur ; au repos 0 = le dessin */
      T(L.g,about(L.base.x,L.base.y,'rotate('+(-ang).toFixed(2)+')')); T(R.g,about(R.base.x,R.base.y,'rotate('+ang.toFixed(2)+')'));
      /* le liquide : la surface (le trou blanc) penche a l oppose du verre puis se balance en s amortissant apres le choc */
      var sl=ms>HIT?Math.sin((ms-HIT)/90)*7*Math.exp(-(ms-HIT)/650):-ang*0.9;
      T(L.air,about(L.ac.x,L.ac.y,'rotate('+sl.toFixed(2)+')')); T(R.air,about(R.ac.x,R.ac.y,'rotate('+(-sl).toFixed(2)+')'));
      stars.forEach(function(g,i){ var st=HIT+40+i*90; var k=pop(seg(ms,st,st+420)); T(g,about(g.__it.cx,g.__it.cy,'translate(0 '+(6*(1-Math.min(k,1))).toFixed(2)+') scale('+k.toFixed(3)+') rotate('+(25*(1-Math.min(k,1))).toFixed(1)+')')); O(g,seg(ms,st,st+80)); if(i===1) blink(ms,1900,g); }); } };
  };

  /* --- caja (Boutique) : la caisse se monte planche par planche, du bas vers le haut, puis les trois bouteilles se dressent dedans, l une apres l autre --- */
  A.caja=function(root,o){
    var e=D.caja, P=e.parts, c=o.color;
    var uid='cjc'+Math.floor(Math.random()*1e6); var defs=el('defs',{},root);
    var bottles=['L','C','R'].map(function(k){ var g=el('g',{},root); var parts=group(g,P['bottle'+k]||[],c); var ys=parts.map(function(q){ var b=q.firstChild.getBBox(); return b.y+b.height; }); return {g:g,base:Math.max.apply(null,ys)}; });
    var boards=group(root,P.board,c); boards.sort(function(a,b){ return b.__it.cy-a.__it.cy; }); var rim=group(root,P.rim,c);
    return { duration:2000, render:function(ms){
      boards.forEach(function(g,i){ var st=Math.floor(i/2)*160+(i%2)*60; var k=co(seg(ms,st,st+380)); T(g,'translate(0 '+(10*(1-k)).toFixed(2)+')'); O(g,k); });
      rim.forEach(function(g){ var k=co(seg(ms,520,900)); O(g,k); });
      bottles.forEach(function(bt,i){ var st=[900,780,1020][i]; var k=back(seg(ms,st,st+520)); T(bt.g,'translate(0 '+bt.base+') scale(1 '+Math.max(k,0.001).toFixed(3)+') translate(0 '+(-bt.base)+')'); O(bt.g,k>0?1:0); }); } };
  };

  window.EMBLEMES_ANIME={
    names:['botella','libro','historia','historia_mains','palenque','mito3','registro','ritual_mains','ritual_couple','brindis','caja','espadin','tobala','coyote'],
    mount:function(name,svg,o){
      o=o||{}; o.color=o.color||'#2b2118'; o.paper=o.paper||'#FEF9F3';
      var root=el('g',{},svg); var c=A[name](root,o); var raf=null, t0=0;
      c.play=function(){ if(raf) cancelAnimationFrame(raf); t0=performance.now(); (function f(){ var ms=performance.now()-t0; c.render(ms); if(ms<c.duration+3000) raf=requestAnimationFrame(f); else raf=null; })(); };
      c.stop=function(){ if(raf) cancelAnimationFrame(raf); raf=null; c.render(c.duration); };   /* on ne s arrete jamais au milieu d un clignotement : l embleme revient complet */
      c.render(c.duration); return c;   /* au repos l embleme est complet ; la lecture repart de 0 */
    }
  };
})();
