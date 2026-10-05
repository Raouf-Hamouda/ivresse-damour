// LA JIMA. Ecrit de zero le 4 octobre 2026. Aucun fichier charge : la plante, le champ, le sol, le ciel et les outils sont du code.
// L'idee qui tient tout : la pina n'est pas un objet a part. Chaque penca s'attache au coeur par une base epaisse dont
// l'empreinte est un losange. Couper, c'est trancher cette base : la face creme qui apparait est la penca elle-meme.
// Toutes coupees, il reste l'oeuf pave de losanges, et sous le collet les souches seches des annees passees, la tige et le chevelu.
import * as THREE from './three.js';

// ---------------------------------------------------------------- outils
let graine = 7;
const rnd = () => { graine |= 0; graine = graine + 0x6D2B79F5 | 0; let t = Math.imul(graine ^ graine >>> 15, 1 | graine); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const uni = (a, b) => a + (b - a) * rnd();
const gauss = (s) => s * Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(6.2832 * rnd());
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const interp = (x, xs, ys) => { if (x <= xs[0]) return ys[0]; for (let i = 1; i < xs.length; i++) if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / ((xs[i] - xs[i - 1]) || 1); return ys[ys.length - 1]; };
const damp = (c, t, r, dt) => t + (c - t) * Math.exp(-r * dt);
const rad = (d) => d * Math.PI / 180, GA = 2.399963;
const h2 = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
const vn2 = (x, z) => { const i = Math.floor(x), j = Math.floor(z); let fx = x - i, fz = z - j; fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
  return (h2(i, j) * (1 - fx) + h2(i + 1, j) * fx) * (1 - fz) + (h2(i, j + 1) * (1 - fx) + h2(i + 1, j + 1) * fx) * fz; };
const fbm2 = (x, z) => vn2(x, z) * 0.5 + vn2(x * 2.03 + 7, z * 2.03 + 3) * 0.25 + vn2(x * 4.1 + 13, z * 4.1 + 5) * 0.125 + vn2(x * 8.3, z * 8.3 + 11) * 0.0625;
const QS = new URLSearchParams(location.search), LEGER = QS.has('leger');

// le sol : relief doux, et une fosse autour du pied (on a degage la terre pour atteindre les bases)
const FOSSE = 0.0;   // pas de fosse : la plante est posee sur la terre, rien n'est degage d'avance
function solY(x, z) { const r = Math.hypot(x, z);
  return (fbm2(x * 0.30 + 40, z * 0.30) - 0.47) * 0.55 * smooth(2.5, 10, r) + (fbm2(x * 1.9, z * 1.9 + 20) - 0.47) * 0.045 - FOSSE * (1 - smooth(0.44, 0.98, r)); }

// ---------------------------------------------------------------- la plante
// Le coeur : un oeuf. y = 0 au collet (niveau du sol), la tige en bas, l'apex en haut.
// Tout ce bloc est MESURE au pixel sur refs/*.png par mesure_refs.py (refs/mesures.json), pina de 0.64 m de haut. Ne rien regler a l'oeil ici.
const EY = [0.0, 0.0192, 0.0512, 0.1024, 0.1792, 0.256, 0.3328, 0.4096, 0.4864, 0.5504, 0.5952, 0.6272, 0.64], ER = [0.1092, 0.1115, 0.1557, 0.1954, 0.228, 0.2434, 0.2549, 0.2299, 0.2056, 0.1474, 0.1006, 0.0539, 0.03];   // silhouette de gen_1, moins la saillie des souches
const TUILE_L = 0.1433, TUILE_H = 0.1243, Y_SOMMET = 0.626, R_TIGE = 0.0752, Y_TIGE = -0.075, RDS = 0.246;   // tuile : largeur et hauteur du losange ; sommet tranche a plat (disque creme de 0.209 D) ; tige coupee et couronne d'ecailles seches (gen_4)
const Rr = (y) => interp(y, EY, ER), dRr = (y) => (Rr(y + 0.002) - Rr(y - 0.002)) / 0.004;
const LARG_FACE = (y) => interp(y, [0, 0.06, 0.14, 0.24, 0.33], [0.55, 0.60, 0.75, 0.90, 1]);
const PATAS = [0.004, 0.020, 0.040], PENTE_BAS = +(QS.get('pb') || 2);   // sous l'equateur la coupe se redresse : vue d'en bas on doit voir les faces (gen_4)
const ASPECT = 0.56,   // regle par la mesure : donne des faces 0,525 fois plus hautes que larges a l'image, comme gen_1
      PENTE = 0.28;   // refs/gen_1_pina.png : 5,6 faces en travers, faces 0,63 fois plus hautes que larges, blanc 41 %, vert 40 %                    // mesures sur la photo : losange 1,26 fois plus haut que large ; PENTE = inclinaison de la coupe (rad), reglee pour 33 % de vert                   // les trois hauteurs de coupe, en metres AU-DESSUS de la peau de la pina (a ras, juste, haute)
const GAINE = [0, 0.02, 0.04, 0.06, 0.09, 0.13];             // anneaux serres dans la gaine : c'est la que la lame passe

function construire(detail) {
  const P = [], A = [], D = [], Fi = [], I = [], pencas = [];
  const som = (p, u, x, al, age, genre, coupe, f) => { P.push(p[0], p[1], p[2]); A.push(u, x, al); D.push(age, genre, coupe); Fi.push(f); return P.length / 3 - 1; };
  const K = detail === 2 ? 16 : detail === 1 ? 8 : 4, NB = detail === 2 ? 11 : detail === 1 ? 5 : 3, NL0 = detail === 1 ? 44 : 24;
  // aire cumulee de l'oeuf depuis l'apex : chaque base recoit la meme surface, donc elles pavent
  const NY = 240, ys = [], cum = [0]; for (let i = 0; i <= NY; i++) ys.push(0.64 - 0.62 * i / NY);
  // les faces retrecissent vers la tige (vue de dessous de gen_4 : largeur 0.21 de celle de l'equateur pres des restes, 0.24 a 0.7 R, 0.47 a 0.86 R) : chaque penca recoit la meme aire PONDEREE
  const cumV = [0];
  for (let i = 1; i <= NY; i++) { const dA = Math.PI * (Rr(ys[i]) + Rr(ys[i - 1])) * Math.hypot(ys[i] - ys[i - 1], Rr(ys[i]) - Rr(ys[i - 1])), w = detail === 2 ? LARG_FACE((ys[i] + ys[i - 1]) / 2) : 1;
    cum.push(cum[i - 1] + dA / (w * w)); cumV.push(cumV[i - 1] + dA); }
  const A1 = cum[NY], yDe = (a) => interp(a, cum, ys), NL = detail === 2 ? Math.round(A1 / (TUILE_L * TUILE_H / 2)) : NL0;
  const tDe = (y) => 1 - interp(y, ys.slice().reverse(), cumV.slice().reverse()) / cumV[NY];   // l'age d'une penca suit sa hauteur, comme avant : 0 = en bas   // autant de pencas que de tuiles mesurees sur la surface du coeur

  // un repere sur l'oeuf : radiale, tangente du parallele, normale sortante, meridien montant
  const repere = (az, y) => { const er = [Math.cos(az), 0, Math.sin(az)], c = [-Math.sin(az), 0, Math.cos(az)], sl = dRr(y), nn = Math.hypot(1, sl);
    return { er, c, n: [er[0] / nn, -sl / nn, er[2] / nn], m: [er[0] * sl / nn, 1 / nn, er[2] * sl / nn], S: [er[0] * Rr(y), y, er[2] * Rr(y)] }; };
  // un anneau de section : superellipse (exposant 1.25 = losange, 2 = lentille) avec gouttiere
  // un anneau de section. Dans la gaine (cel.w = 1) la section EST la cellule de la penca sur le coeur ; plus haut c'est la lame (superellipse avec gouttiere).
  const anneau = (Pc, C, B, hx, hb, p, g, u, al, age, genre, f, cel) => { const d = P.length / 3, e = 2 / p, w = cel ? cel.w : 0;
    for (let k = 0; k < K; k++) { const th = 6.2832 * k / K, cx = Math.cos(th), sx = Math.sin(th), X = Math.sign(cx) * Math.pow(Math.abs(cx), e), Y = Math.sign(sx) * Math.pow(Math.abs(sx), e), b = hb * Y * (Y < 0 ? 1.35 : 0.65) + g * hx * X * X;
      const q = [0, 1, 2].map((a) => Pc[a] + C[a] * hx * X + B[a] * b);
      if (w > 0) for (let a = 0; a < 3; a++) q[a] += w * (Pc[a] + cel.r[k] * (cel.c[a] * cx + cel.m[a] * sx) - q[a]);
      som(q, u, X, al, age, genre, 0, f); }
    return d; };
  const peau = (a, b) => { for (let k = 0; k < K; k++) { const k2 = (k + 1) % K; I.push(a + k, b + k, b + k2, a + k, b + k2, a + k2); } };
  const croix = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norme = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  // ---- les pencas, du sol jusqu'au coeur. 0 = la plus vieille, tout en bas : seche, couleur paille, couchee sur la terre.
  // Rien n'est coupe d'avance : la pina n'existe que par les coupes du joueur.
  const aireL = A1 / NL, REP = [];
  for (let i = 0; i < NL; i++) REP.push(repere(i * GA + gauss(0.015), yDe(A1 * (1 - (i + 0.5) / NL))));
  // la cellule d'une penca : la part du coeur plus proche d'elle que de toute autre, en distance |dx| + |dy| / ASPECT. Cette distance donne des losanges,
  // et les cellules pavent le coeur sans trou ni recouvrement, par construction. On la lit en K rayons autour du point d'attache.
  const rmax = 2.2 * Math.sqrt(aireL);
  const cellule = (i) => { const R = REP[i], vo = [], out = [];
    for (let j = 0; j < NL; j++) if (j !== i) { const dv = [0, 1, 2].map((q) => REP[j].S[q] - R.S[q]); if (Math.hypot(dv[0], dv[1], dv[2]) < rmax * 1.7) vo.push([dv[0] * R.c[0] + dv[1] * R.c[1] + dv[2] * R.c[2], dv[0] * R.m[0] + dv[1] * R.m[1] + dv[2] * R.m[2]]); }
    const f = (x, y) => { let mn = 1e9; for (const v of vo) mn = Math.min(mn, Math.abs(x - v[0]) + Math.abs(y - v[1]) / ASPECT); return mn - Math.abs(x) - Math.abs(y) / ASPECT; };
    for (let k = 0; k < K; k++) { const th = 6.2832 * k / K, cx = Math.cos(th), sx = Math.sin(th); let hi = rmax / (Math.abs(cx) + Math.abs(sx) / ASPECT) * 0.5;
      if (sx * R.m[1] < 0) hi = Math.max(0.004, Math.min(hi, (R.S[1] - 0.004) / (-sx * R.m[1])));      // jamais sous la terre
      let lo = 0, h2 = -1, prec = 0; for (let q = 1; q <= 24; q++) { const r = hi * q / 24; if (f(r * cx, r * sx) < 0) { lo = prec; h2 = r; break; } prec = r; }
      if (h2 > 0) { for (let q = 0; q < 10; q++) { const mid = (lo + h2) / 2; if (f(mid * cx, mid * sx) < 0) h2 = mid; else lo = mid; } hi = lo; }
      out.push(hi * 0.97); }
    return out; };
  let rayon = 0, hauteur = 0;
  for (let i = 0; i < NL; i++) {
    const R = REP[i], t = detail === 2 ? tDe(R.S[1]) : NL > 1 ? i / (NL - 1) : 0, cel = cellule(i), hx0 = cel[0], pt = detail === 2 ? 0.55 + 0.45 * LARG_FACE(R.S[1]) : 1;
    const sec = 1 - smooth(0.05, 0.22, t), ag = sec > 0.03 ? -sec : t;                      // sec : 1 = feuille morte, 0 = vivante
    const e0 = rad(64 - 60 * Math.pow(t, 0.8) + 34 * sec) + gauss(0.04), L = pt * 1.171 * (1 - 0.14 * t * t) * uni(0.93, 1.07) * (1 - 0.32 * sec * uni(0.6, 1.2)),   // mesure : plante haute de 1.63 m, rosette de 0.77 m de rayon
     Wh = L * 0.058 * (1 + 0.25 * (1 - t)) * (1 - 0.25 * sec);
    const arc = (t < 0.35 ? 0.30 : -0.18) * uni(0.6, 1.2) + 0.2 * sec, al = rnd(), tors = gauss(0.10 + 0.55 * sec);
    const sAnn = detail === 2 ? GAINE.slice() : [0, 0.13]; const nBase = sAnn.length;
    for (let k = 1; k <= NB; k++) sAnn.push(0.13 + (L - 0.13) * Math.pow(k / NB, 1.2));
    const beta = rad(56), T0 = [0, 1, 2].map((q) => R.m[q] * Math.cos(beta) + R.n[q] * Math.sin(beta));
    let Pc = [0, 1, 2].map((q) => R.S[q] - T0[q] * 0.03), sPrec = 0, T = T0, B = R.m;
    const v0 = P.length / 3, i0 = I.length, centres = [], axes = [], epine = [], marges = [];
    for (let j = 0; j < sAnn.length; j++) { const s = sAnn[j], u = s / L;
      // la base sort a la normale de l'oeuf, puis la penca s'ouvre vers son angle : c'est la gaine
      const sm = (s + sPrec) / 2, w = smooth(0.06, 0.26, sm), e = e0 + arc * (sm / L) * (sm / L), Dd = [R.er[0] * Math.sin(e), Math.cos(e), R.er[2] * Math.sin(e)];
      T = norme([T0[0] * (1 - w) + Dd[0] * w, T0[1] * (1 - w) + Dd[1] * w, T0[2] * (1 - w) + Dd[2] * w]);
      Pc = [Pc[0] + T[0] * (s - sPrec), Pc[1] + T[1] * (s - sPrec), Pc[2] + T[2] * (s - sPrec)]; sPrec = s;
      if (s > 0.13 && Pc[1] < 0.022) Pc[1] = 0.022;                                     // elle ne traverse pas la terre : elle s'y couche
      const Cc = norme([R.c[0] + R.m[0] * tors * u, R.c[1] + R.m[1] * tors * u, R.c[2] + R.m[2] * tors * u]); B = norme(croix(Cc, T));
      const wb = smooth(0.0, 0.20, s), lame = Wh * interp(u, [0, .1, .25, .5, .75, .9, 1], [0.85, 0.95, 1, 0.86, 0.58, 0.30, 0.02]);
      const hx = hx0 * (1 - wb) + lame * wb, tb = (0.013 * (1 - 0.75 * u) + 0.002) * (1 - 0.55 * sec), hb = tb + (0.0434 - tb) * (1 - smooth(0.07, 0.22, s));   // base de penca : epaisseur mesuree sur gen_4
      anneau(Pc, Cc, B, hx, hb, 1.45 + 0.55 * smooth(0.05, 0.20, s), 0.45 * smooth(0.10, 0.35, s) * (1 - 0.4 * u) * (1 + 1.1 * sec), u, al, ag, 0, i, { r: cel, c: R.c, m: R.m, w: 1 - smooth(0.05, 0.16, s) });
      if (j) peau(v0 + (j - 1) * K, v0 + j * K);
      centres.push(Pc.slice()); axes.push(T.slice()); marges.push([Pc.slice(), Cc, B.slice(), T.slice(), hx, u, s]);
      if (j === nBase - 1 || j === nBase - 1 + Math.round(NB / 3) || j === nBase - 1 + Math.round(2 * NB / 3) || j === sAnn.length - 1) epine.push([Pc[0], Pc[1], Pc[2], u]);
    }
    const nR = sAnn.length, pointe = som([Pc[0] + T[0] * 0.03, Pc[1] + T[1] * 0.03, Pc[2] + T[2] * 0.03], 1, 0, al, ag, 3, 0, i);
    for (let k = 0; k < K; k++) I.push(v0 + (nR - 1) * K + k, pointe, v0 + (nR - 1) * K + (k + 1) % K);
    rayon = Math.max(rayon, Math.hypot(Pc[0], Pc[2])); hauteur = Math.max(hauteur, Pc[1]);
    // les dents de la marge : petites, serrees, brun rouge
    const d0 = P.length / 3;
    if (detail === 2) for (let j = nBase; j < nR - 1; j++) for (let q = 0; q < 2; q++) { const a = marges[j], b = marges[j + 1], f = (q + rnd() * 0.6) / 2;
      const u = a[5] + (b[5] - a[5]) * f; if (a[6] < 0.16 || u > 0.92) continue;
      for (const sg of [-1, 1]) { const hx = a[4] + (b[4] - a[4]) * f, g = 0.45 * (1 - 0.4 * u) * (1 + 1.1 * sec), M = [0, 1, 2].map((q2) => a[0][q2] + (b[0][q2] - a[0][q2]) * f + a[1][q2] * hx * sg + a[2][q2] * g * hx);
        const s = 0.0060 * uni(0.7, 1.3) * (0.5 + 0.5 * Math.sqrt(Math.sin(Math.PI * u))), cr = (rnd() < 0.5 ? -1 : 1) * uni(0.3, 0.9);
        const pt = (x, y2, z) => [0, 1, 2].map((q2) => M[q2] + a[3][q2] * x * s + a[2][q2] * y2 * s + a[1][q2] * z * sg * s);
        const v = som(pt(-1.5, 0, 0), u, sg, al, ag, 3, 0, i); som(pt(1.5, 0, 0), u, sg, al, ag, 3, 0, i); som(pt(0, -0.6, -0.2), u, sg, al, ag, 3, 0, i); som(pt(0, 0.5, -0.2), u, sg, al, ag, 3, 0, i);
        som(pt(cr * 0.25, 0, 0.9), u, sg, al, ag, 3, 0, i); som(pt(cr, 0, 2.1), u, sg, al, ag, 3, 0, i);
        for (const [x, y2] of [[0, 2], [2, 1], [1, 3], [3, 0]]) I.push(v + x, v + y2, v + 4, v + x, v + 4, v + 5); } }
    pencas.push({ v0, nR, pointe, d0, vFin: P.length / 3, i0, i1: I.length, S: R.S, n: R.n, m: R.m, rh: Math.min(cel[K / 4], TUILE_H / 2), epine, az: Math.atan2(R.er[2], R.er[0]), t, L, coupee: -1 });
  }
  // ---- le coeur plein (on ne le voit qu'au fond des joints), le dessous, la tige tranchee par la barreta
  // Le dessous est MESURE sur la vue de dessous de refs/gen_4_planche.png (refs/dessous_ref.png, outils/mesure_dessous.py) ; R = rayon de la pina vue d'en bas.
  // Disque de tige : 0.297 R, creme, anneau tan a 0.818 du rayon de tige, trait sombre au bord. Pas de racines : la pina sortie de terre a la tige nette.
  { const SEG = detail === 2 ? 48 : 8, d = P.length / 3, rows = [];
    for (const f of [0.0015, 0.25, 0.5, 0.68, 0.76, 0.80, 0.84, 0.88, 0.93, 0.965, 1]) rows.push([Y_TIGE, R_TIGE * f, 6, 0, f]);   // le disque, u = r / R_TIGE (genre 6)
    rows.push([Y_TIGE, R_TIGE, 1, 0, 0], [-0.004, R_TIGE + 0.006, 1, 0, 0], [0.0, ER[0] - 0.012, 1, 0, 0]);
    for (let q = 0; q <= 16; q++) { const y = 0.01 + (Y_SOMMET - 0.012) * q / 16; rows.push([y, Math.max(0.004, Rr(y) - 0.014), 2, 0, 0]); }
    rows.push([Y_SOMMET, Rr(Y_SOMMET) - 0.014, 0, 1, 1], [Y_SOMMET, 0.001, 0, 1, 0]);   // le sommet tranche a plat
    const bordT = (a) => 1 + 0.035 * Math.sin(3 * a + 0.7) + 0.02 * Math.sin(7 * a + 2.1);   // bord du disque : ni rond ni centre (gen_4)
    for (const [y, r, genre, coupe, uu] of rows) for (let k = 0; k < SEG; k++) { const a = 6.2832 * k / SEG, dc = genre === 6 ? uu : 0, rr = genre === 6 ? r * bordT(a) : r;
      som([rr * Math.cos(a) - 0.006 * dc, y, rr * Math.sin(a) + 0.005 * dc], uu, 0, 0.5, 0, genre, coupe, -1); }
    for (let q = 0; q < rows.length - 1; q++) for (let k = 0; k < SEG; k++) { const a = d + q * SEG + k, b = d + q * SEG + (k + 1) % SEG; I.push(a, b + SEG, b, a, a + SEG, b + SEG); } }
  // ---- les gaines tranchees : trois lames creme empilees sous le disque, bord brun (gen_4, autour de la tige)
  if (detail === 2) { const SEG = 48;
    for (const [y, r0, r1, ph] of [[Y_TIGE + 0.012, 0.92, 1.12, 0.4], [Y_TIGE + 0.026, 1.02, 1.22, 2.2], [Y_TIGE + 0.042, 1.12, 1.32, 4.1]]) { const d = P.length / 3;
      for (const f of [0, 0.5, 0.8, 1]) for (let k = 0; k < SEG; k++) { const a = 6.2832 * k / SEG, bo = 1 + 0.06 * Math.sin(2 * a + ph) + 0.04 * Math.sin(5 * a + ph * 2), r = R_TIGE * (r0 + (r1 - r0) * f * bo);
        som([r * Math.cos(a) - 0.004, y + 0.006 * f, r * Math.sin(a) + 0.003], 0.88 + 0.12 * f, 1, ph, 0, 6, 0, -1); }
      for (let q = 0; q < 3; q++) for (let k = 0; k < SEG; k++) { const a = d + q * SEG + k, b = d + q * SEG + (k + 1) % SEG; I.push(a, b + SEG, b, a, a + SEG, b + SEG); } } }
  // ---- les restes secs : bases des plus vieilles feuilles, en eventail autour de la tige, couchees sur le dessous de la pina (genre 7)
  if (detail === 2 && !QS.has("sansrestes")) { let gr = 7; const r2 = () => { gr = gr + 0x6D2B79F5 | 0; let t = Math.imul(gr ^ gr >>> 15, 1 | gr); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const yBas = (rho) => { if (rho <= ER[0]) return 0; for (let q = 1; q <= 6; q++) if (rho <= ER[q]) return EY[q - 1] + (EY[q] - EY[q - 1]) * (rho - ER[q - 1]) / (ER[q] - ER[q - 1]); return EY[6]; };
    // un point couche sur la pina, vu d'en bas a la distance rho de l'axe, a l'azimut az, decolle de h le long de la normale
    const surface = (rho, az, h) => { const re = Math.min(rho, ER[6]), y = yBas(re), sl = y > 0 ? dRr(y) : 99, nn = Math.hypot(1, sl), nr = 1 / nn, ny = -sl / nn;
      return [Math.cos(az) * (re + nr * h), y + ny * h, Math.sin(az) * (re + nr * h)]; };
    const eventail = (th, r0, r1, wb, h0, age) => { const az = Math.PI - th * Math.PI / 180, NL2 = 12, NW = 9, v = P.length / 3, al = r2(), dent = [], biais = (r2() - 0.5) * 0.7, plis = 1 + Math.floor(r2() * 3), asy = (r2() - 0.5) * 0.5;
      wb *= 0.65 + 0.45 * r2(); h0 += r2() * 0.012;
      for (let w = 0; w < NW; w++) dent.push(1 - (w % 2 ? 0.18 + 0.20 * r2() : 0.04 * r2()));       // le bout dechire : des dents
      for (let l = 0; l < NL2; l++) { const t = l / (NL2 - 1);
        for (let w = 0; w < NW; w++) { const x = w / (NW - 1) * 2 - 1, tt = t * (l === NL2 - 1 ? dent[w] : 1), rho = (r0 + (r1 - r0) * tt) * RDS, hw = 0.5 * wb * RDS * (1.0 + 0.25 * Math.sin(tt * 2.6) - 0.65 * Math.pow(tt, 2.2)) * (1 + asy * x);
          som(surface(rho, az + (x * hw + biais * tt * (r1 - r0) * RDS * 0.5) / rho, h0 + 0.012 * x * x * (0.5 + tt) + 0.010 * tt + 0.010 * Math.abs(Math.sin(x * plis * 1.6 + al * 9 + tt * 3)) * (0.3 + tt) + 0.006 * Math.sin(tt * 7 + al * 5) * Math.abs(x)), tt, x, al, age, 7, 0, -1); } }
      for (let l = 0; l < NL2 - 1; l++) for (let w = 0; w < NW - 1; w++) { const a = v + l * NW + w; I.push(a, a + NW, a + 1, a + 1, a + NW, a + NW + 1); } };
    // angles a l'ecran de la vue de dessous (0 = droite, 90 = bas, sens horaire), bout = etendue mesuree du secteur (px / 424.8)
    const EXT = [403, 382, 410, 414, 363, 366, 347, 238, 284, 257, 230, 339], ext = (th) => EXT[Math.floor(((th % 360) + 360) % 360 / 30)] / 424.8;
    // un amas, pas une fleur : 16 longues a angles irreguliers (rien dans le trou 291-307 mesure), 3 couches, longueurs tirees sous l'etendue du secteur
    for (let q = 0; q < 12; q++) { let th; do th = q * 30 + (r2() - 0.5) * 34; while (th > 285 && th < 312);
      const haut = th > 210 && th < 330; eventail(th, 0.30, ext(th) * (haut ? 0.50 + 0.25 * r2() : 0.62 + 0.34 * r2()), 0.28 + 0.12 * r2(), 0.020 + 0.010 * (q % 3), haut && r2() < 0.5 ? 2 : 0); }
    for (let q = 0; q < 10; q++) { const th = r2() * 360; eventail(th, 0.29, 0.38 + 0.10 * r2(), 0.24 + 0.10 * r2(), 0.034, 1); } }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('luv', new THREE.Float32BufferAttribute(A, 3));
  geo.setAttribute('dat', new THREE.Float32BufferAttribute(D, 3)); geo.setAttribute('fid', new THREE.Float32BufferAttribute(Fi, 1));
  geo.setIndex(I); geo.computeVertexNormals(); geo.computeBoundingSphere();
  return { geo, pencas, rayon, hauteur, I, K };
}

// ---------------------------------------------------------------- la matiere de la plante : tout le detail au pixel, rien a charger
const uSur = { value: -1 };
const BRUIT = `float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * vn3(p); p *= 2.03; a *= 0.5; } return s; }
vec3 S(float r, float g, float b){ return pow(vec3(r, g, b), vec3(2.2)); }
vec3 bosse(vec3 pos, vec3 n, float h){ vec3 sx = dFdx(pos), sy = dFdy(pos); vec3 r1 = cross(sy, n), r2 = cross(n, sx); float det = dot(sx, r1);
  vec3 gr = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2); return normalize(abs(det) * n - gr); }
`;
function matiereChamp() {
  const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.65, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute vec3 luv; attribute vec3 dat; varying vec3 vLuv; varying vec3 vDat;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLuv = luv; vDat = dat;');
    sh.fragmentShader = 'varying vec3 vLuv; varying vec3 vDat;\n' + sh.fragmentShader.replace('#include <color_fragment>', `
  vec3 c = mix(pow(vec3(0.435, 0.467, 0.388), vec3(2.2)), pow(vec3(0.455, 0.498, 0.435), vec3(2.2)), pow(max(vDat.x, 0.0), 1.4)) * (0.88 + 0.24 * vLuv.z);
  c = mix(c, pow(vec3(0.663, 0.533, 0.408), vec3(2.2)) * (0.8 + 0.4 * vLuv.z), clamp(-vDat.x, 0.0, 1.0) * smoothstep(0.08, 0.26, vLuv.x));
  c = mix(c, pow(vec3(0.12, 0.06, 0.04), vec3(2.2)), smoothstep(0.90, 0.98, vLuv.x)); if (vDat.y > 1.5) c = pow(vec3(0.20, 0.27, 0.18), vec3(2.2));
  diffuseColor.rgb = c;`); };
  return m;
}
function matierePlante() {
  const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6, metalness: 0 });
  m.onBeforeCompile = (sh) => { sh.uniforms.uSur = uSur;
    sh.vertexShader = 'attribute vec3 luv; attribute vec3 dat; attribute float fid; uniform float uSur; varying vec3 vLuv; varying vec3 vDat; varying vec3 vObj; varying float vSur;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLuv = luv; vDat = dat; vObj = position; vSur = (uSur >= 0.0 && abs(fid - uSur) < 0.5) ? 1.0 : 0.0;');
    sh.fragmentShader = 'varying vec3 vLuv; varying vec3 vDat; varying vec3 vObj; varying float vSur;\n' + BRUIT + sh.fragmentShader.replace('#include <color_fragment>', `
  float u = vLuv.x, X = vLuv.y, al = vLuv.z, aX = abs(X), age = vDat.x, genre = vDat.y, coupe = vDat.z;
  float px = length(fwidth(vObj));           // metres par pixel : un detail plus fin que deux pixels s'efface au lieu de grouiller
  #define FONDU(f) clamp(1.0 - px * (f) * 0.6, 0.0, 1.0)
  vec3 tC; float tR = 0.6, tH = 0.0;
  if (coupe > 1.5) {
    // vieille coupe : la chair a seche, paille et terre, bord brun
    float f = mix(0.5, vn3(vObj * vec3(150.0, 40.0, 150.0)), FONDU(150.0)), r = u + (fbm3(vObj * 20.0) - 0.5) * 0.3;
    tC = S(0.957, 0.914, 0.847) * (0.82 + 0.30 * f); tC = mix(tC, S(0.42, 0.31, 0.19), smoothstep(0.45, 0.75, fbm3(vObj * 9.0 + al)) * 0.6);
    tC = mix(tC, S(0.30, 0.23, 0.14), smoothstep(0.62, 0.95, r)); tR = 0.92; tH = (f - 0.5) * 0.0012;
  } else if (coupe > 0.5) {
    // coupe fraiche : chair ivoire, fibreuse, humide ; anneau vert tendre puis la peau ; un peu d'oxydation ; les traits de la lame
    float grain = mix(0.5, vn3(vObj * 900.0), FONDU(900.0)), cell = mix(0.5, vn3(vObj * 240.0), FONDU(240.0)), fibre = mix(0.5, vn3(vObj * vec3(160.0, 40.0, 160.0)), FONDU(160.0));
    float trait = sin(dot(vObj, normalize(vec3(cos(al * 40.0), sin(al * 40.0), cos(al * 17.0)))) * 700.0 + fbm3(vObj * 30.0) * 3.0) * FONDU(110.0);
    float r = u + (cell - 0.5) * 0.06 + (fbm3(vObj * 18.0) - 0.5) * 0.14;
    tC = S(0.910, 0.886, 0.800) * 1.25 * (0.92 + 0.14 * cell) * (0.985 + 0.015 * trait);
    tC = mix(tC, S(0.98, 0.97, 0.90), smoothstep(0.70, 0.90, grain) * 0.5);
    tC = mix(tC, S(0.96, 0.85, 0.70), smoothstep(0.55, 0.72, fbm3(vObj * 13.0 + al * 3.0)) * 0.75);   // taches jaune tan de la chair (gen_4 dessous : 6.7 % ; gen_1 : chair plus chaude)
    tC = mix(tC, S(0.693, 0.545, 0.370), smoothstep(0.30, 0.85, r) * smoothstep(0.52, 0.70, fbm3(vObj * 22.0 + al * 5.0)) * 0.85);
    tC = mix(tC, S(0.30, 0.20, 0.11), smoothstep(0.62, 0.74, fbm3(vObj * 9.0 + al * 11.0)) * smoothstep(0.45, 0.9, r) * 0.8);
    tC = mix(tC, S(0.506, 0.561, 0.357), smoothstep(0.80, 0.90, r)); tC = mix(tC, S(0.435, 0.529, 0.247), smoothstep(0.92, 0.985, r));   // lisere puis peau : la peau fait 5.5 mm (gen_4)
    tC = mix(tC, S(0.30, 0.19, 0.10), smoothstep(0.66, 0.74, fbm3(vObj * vec3(55.0, 140.0, 55.0) + al * 13.0)) * smoothstep(0.55, 0.65, fbm3(vObj * 9.0 + al)) * (1.0 - smoothstep(0.75, 0.85, r)) * 0.9);   // mouchetures brunes (gen_4)
    tR = 0.30 + 0.30 * grain; tH = ((grain - 0.5) * 0.5 + (cell - 0.5) + (fibre - 0.5)) * 0.0005 + trait * 0.00008 + (1.0 - u * u) * 0.010;   // la face bombe
  } else if (genre > 6.5) {
    // reste sec : brun moyen, clair au milieu, fibres sombres le long, bords releves sombres, bout dechire ; age 1 = couche courte plus sombre, 2 = pale
    float fib = mix(0.5, vn3(vec3(X * 34.0, u * 4.0, al * 41.0)), FONDU(40.0)), tache = fbm3(vObj * 11.0 + al * 7.0);
    tC = mix(S(0.553, 0.427, 0.329), S(0.80, 0.67, 0.54), smoothstep(0.30, 0.70, tache) * (1.0 - aX * 0.6));
    tC = mix(tC, S(0.47, 0.42, 0.36), step(0.5, fract(al * 7.3)) * 0.45);                                      // certaines gris brun, d'autres chaudes
    float pli = pow(abs(sin(X * (3.0 + floor(al * 4.0)) * 1.6 + al * 9.0)), 6.0);
    tC = mix(tC, S(0.16, 0.10, 0.06), smoothstep(0.62, 1.0, 1.0 - abs(sin(X * 6.0 + al * 9.0 + u * 2.0))) * smoothstep(0.35, 0.55, fbm3(vObj * 5.0 + al * 3.0)) * 0.9);
    tC = mix(tC, S(0.20, 0.13, 0.08), smoothstep(0.82, 0.97, aX) * 0.8);   // les plis : traits sombres le long
    tC *= 0.70 + 0.30 * smoothstep(0.0, 0.35, u);                                                                // a l'ombre du disque a la base
    // dechiquete : des brins separes par des fentes, de plus en plus ouvertes vers le bout (vue de dessous : 17 a 34 morceaux par cercle, 14 a 18 px)
    // papier sec : nervures fines le long, quelques veines sombres, dechire seulement au bout
    if (u > 0.82 && vn3(vec3(X * 9.0, u * 6.0, al * 23.0)) + (u - 0.82) * 2.5 > 0.95) discard;
    float nerv = mix(0.5, vn3(vec3(X * 90.0, u * 2.0, al * 13.0)), FONDU(25.0));
    tC *= 0.90 + 0.20 * nerv;
    tC = mix(tC, S(0.259, 0.161, 0.098), smoothstep(0.70, 0.86, fib) * smoothstep(0.4, 0.7, fbm3(vObj * 6.0 + al)) * 0.85);
    tC = mix(tC, S(0.259, 0.161, 0.098), smoothstep(0.90, 1.0, aX) * 0.75);
    tC = mix(tC, S(0.30, 0.20, 0.12), smoothstep(0.85, 1.0, u) * 0.5);
    if (age > 1.5) tC = mix(tC, S(0.82, 0.72, 0.60), 0.45); else if (age > 0.5) tC *= 0.78;
    tR = 0.92; tH = (fib - 0.5) * 0.004 + (nerv - 0.5) * 0.002;
  } else if (genre > 5.5) {
    // la tige tranchee : creme, anneau tan a 0.818, couronne creme, trait sombre au bord
    float grain = mix(0.5, vn3(vObj * 700.0), FONDU(700.0)), r = u + (fbm3(vObj * 25.0) - 0.5) * 0.07, ray = mix(0.5, vn3(vec3(atan(vObj.z, vObj.x) * 60.0, u * 6.0, 0.0)), FONDU(80.0));
    tC = S(0.953, 0.906, 0.831) * (0.94 + 0.06 * grain + 0.06 * ray);
    tC = mix(tC, S(0.80, 0.66, 0.48), smoothstep(0.6, 0.8, fbm3(vObj * 18.0)) * smoothstep(0.55, 0.9, r) * 0.6);
    tC *= 0.93 + 0.07 * sin(r * 70.0 + fbm3(vObj * 30.0) * 4.0);                                                  // cernes de fibres
    tC = mix(tC, S(0.62, 0.48, 0.33), smoothstep(0.88, 0.93, r) * (1.0 - smoothstep(0.95, 0.96, r)) * smoothstep(0.4, 0.7, fbm3(vObj * 22.0)) * (1.0 - X));   // couronne brune tachee
    tC = mix(tC, S(0.45, 0.33, 0.22), smoothstep(0.80, 0.86, vn3(vObj * 160.0)) * smoothstep(0.5, 0.95, r) * 0.7);       // points bruns
    tC = mix(tC, S(0.941, 0.878, 0.780), 1.0 - smoothstep(0.0, 0.06, r));
    tC = mix(tC, S(0.914, 0.812, 0.678), smoothstep(0.72, 0.77, r) * (1.0 - smoothstep(0.86, 0.91, r)));
    tC = mix(tC, S(0.812, 0.651, 0.459), smoothstep(0.765, 0.80, r) * (1.0 - smoothstep(0.835, 0.87, r)));
    tC = mix(tC, S(0.941, 0.875, 0.788), smoothstep(0.88, 0.90, r) * (1.0 - smoothstep(0.95, 0.97, r)));
    tC = mix(tC, mix(S(0.188, 0.102, 0.063), S(0.50, 0.36, 0.22), X), smoothstep(0.955, 0.985, r));   // X = 1 : gaine, bord brun et non noir
    tR = 0.55; tH = (grain - 0.5) * 0.0004;
  } else if (genre < 0.5) {
    // la peau : vieilles pencas sombres et bleutees dehors, coeur pale et jaune ; pruine, plaques, taches, empreintes, marge cornee, epine
    float sec = clamp(-age, 0.0, 1.0) * smoothstep(0.08, 0.26, u), strie0 = mix(0.5, vn3(vec3(X * 30.0, al * 20.0, vObj.y * 3.0)), FONDU(60.0));
    vec3 c = mix(S(0.435, 0.467, 0.388), S(0.455, 0.498, 0.435), pow(max(age, 0.0), 1.4));
    c = mix(S(0.40, 0.50, 0.31) * (0.80 + 0.40 * strie0) * (0.42 + 0.58 * smoothstep(0.0, 0.05, u)), c, smoothstep(0.04, 0.22, u));
    float strie = mix(0.5, vn3(vec3(X * 26.0, u * 1.2, al * 37.0)), FONDU(60.0));
    c = mix(c, c * vec3(0.72, 0.84, 0.80), smoothstep(0.42, 0.72, fbm3(vObj * 5.0)) * 0.6);
    c = mix(c, c * 1.22 + 0.012, smoothstep(0.45, 0.80, fbm3(vObj * 1.6 + al * 9.0)) * 0.5);
    c *= 0.86 + 0.28 * strie;
    float ph = u * 7.0 + aX * 1.3 + fbm3(vObj * 3.0) * 1.1, ligne = pow(abs(sin(ph * 3.14159)), 12.0) * smoothstep(0.12, 0.30, u) * (1.0 - smoothstep(0.60, 0.85, u));
    c = mix(c, c * 1.5 + 0.02, ligne * 0.16);
    c = mix(c, c * 1.35 + 0.02, smoothstep(0.86, 0.90, vn3(vec3(X * 16.0, u * 70.0, al * 50.0))) * 0.5 * smoothstep(0.1, 0.25, u) * FONDU(90.0));
    c = mix(c, S(0.56, 0.47, 0.30), smoothstep(0.72, 0.93, u) * smoothstep(0.50, 0.72, fbm3(vObj * 14.0)) * 0.5);
    c = mix(c, mix(S(0.663, 0.533, 0.408), S(0.411, 0.330, 0.253), smoothstep(0.35, 0.70, fbm3(vObj * 7.0 + al * 4.0))) * (0.80 + 0.40 * strie), sec);
    float marge = smoothstep(0.93, 0.985, aX) * smoothstep(0.10, 0.18, u), epine = smoothstep(0.93, 0.975, u);
    c = mix(c, S(0.34, 0.19, 0.12), marge); c = mix(c, S(0.12, 0.06, 0.04), epine);
    tC = c; tR = mix(0.62 - 0.14 * max(marge, epine), 0.92, sec); tH = ((strie - 0.5) * 0.5 + (vn3(vObj * 700.0) - 0.5) * FONDU(700.0)) * 0.0005;
  } else if (genre < 1.5) {
    float f = mix(0.5, vn3(vObj * vec3(90.0, 25.0, 90.0)), FONDU(90.0));
    tC = mix(S(0.589, 0.441, 0.304), S(0.353, 0.265, 0.182), smoothstep(0.35, 0.70, fbm3(vObj * 8.0 + al * 3.0))) * (0.78 + 0.40 * f); tR = 0.9; tH = (f - 0.5) * 0.002;
  } else if (genre < 2.5) { tC = S(0.12, 0.19, 0.12); tR = 0.9;
  } else if (genre < 3.5) { tC = mix(S(0.34, 0.15, 0.09), S(0.12, 0.06, 0.04), smoothstep(0.90, 0.99, u)); tR = 0.5;
  } else { float f = fbm3(vec3(X * 9.0, u * 30.0, al * 30.0));
    tC = mix(S(0.36, 0.27, 0.17), S(0.62, 0.50, 0.34), f); tC = mix(tC, S(0.22, 0.15, 0.09), smoothstep(0.45, 0.70, fbm3(vObj * 9.0)) * 0.7); tR = 0.9; tH = (f - 0.5) * 0.002 * FONDU(60.0); }
  diffuseColor.rgb = tC + vSur * vec3(0.10, 0.09, 0.05);`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = tR;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = bosse(-vViewPosition, normal, tH);'); };
  return m;
}

// ---------------------------------------------------------------- rendu, ciel, lumiere
const rendu = new THREE.WebGLRenderer({ antialias: !LEGER, powerPreference: 'low-power' });
rendu.setPixelRatio(LEGER ? 1 : Math.min(devicePixelRatio, 1.75)); rendu.setSize(innerWidth, innerHeight);
rendu.toneMapping = THREE.ACESFilmicToneMapping; rendu.toneMappingExposure = 0.92;
rendu.shadowMap.enabled = true; rendu.shadowMap.type = THREE.PCFSoftShadowMap; rendu.shadowMap.autoUpdate = false;
(document.getElementById("scene") || document.body).appendChild(rendu.domElement);
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.05, 500);
const SOLEIL = new THREE.Vector3(-0.55, 0.62, 0.56).normalize();
const BRUME = new THREE.Color().setRGB(0.52, 0.60, 0.70); scene.fog = new THREE.Fog(BRUME, 22, 150);
const ciel = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, uniforms: { dsol: { value: SOLEIL } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 dsol; varying vec3 vD;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
    float fb(vec2 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 5; k++){ s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
    void main(){ vec3 D = normalize(vD); float e = max(D.y, 0.0);
      vec3 c = mix(vec3(0.56, 0.66, 0.78), vec3(0.11, 0.27, 0.62), pow(e, 0.50));
      if (D.y > 0.01) { vec2 uv = D.xz / (D.y + 0.12) * 1.3; float n = fb(uv + 5.3), cl = smoothstep(0.58, 0.74, n) * smoothstep(0.01, 0.14, D.y); c = mix(c, vec3(0.95, 0.95, 0.96) * (0.82 + 0.18 * e), cl * 0.9); }
      float s = max(dot(D, dsol), 0.0); c += vec3(1.0, 0.93, 0.80) * (pow(s, 800.0) * 1.5 + pow(s, 10.0) * 0.10);
      c = mix(vec3(0.52, 0.60, 0.70), c, smoothstep(-0.02, 0.06, D.y)); gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }` }));
ciel.renderOrder = -1; ciel.frustumCulled = false; scene.add(ciel);
{ const pm = new THREE.PMREMGenerator(rendu), s2 = new THREE.Scene(); s2.add(ciel.clone()); scene.environment = pm.fromScene(s2, 0.04).texture; scene.environmentIntensity = 0.85; }
const soleil = new THREE.DirectionalLight(0xfff0d8, 3.1); soleil.position.copy(SOLEIL).multiplyScalar(30); soleil.castShadow = true;
soleil.shadow.mapSize.set(LEGER ? 1024 : 2048, LEGER ? 1024 : 2048); soleil.shadow.bias = -0.0005; soleil.shadow.normalBias = 0.015;
Object.assign(soleil.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 10, far: 60 }); scene.add(soleil, soleil.target);
scene.add(new THREE.HemisphereLight(new THREE.Color().setRGB(0.55, 0.68, 0.90), new THREE.Color().setRGB(0.42, 0.30, 0.20), 1.25));

// ---------------------------------------------------------------- le sol : une seule nappe, tres fine au pied, large au loin ; terre rouge, cailloux, grain
{ const N = 300, E = 95, pos = [], idx = [], co = (g) => Math.sign(g) * Math.pow(Math.abs(g), 3) * E;
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const x = co(i / N * 2 - 1), z = co(j / N * 2 - 1); pos.push(x, solY(x, z), z); }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i; idx.push(a, a + N + 1, a + 1, a + 1, a + N + 1, a + N + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 });
  m.onBeforeCompile = (sh) => { sh.vertexShader = 'varying vec3 vObj;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vObj = position;');
    sh.fragmentShader = 'varying vec3 vObj;\n' + BRUIT + sh.fragmentShader.replace('#include <color_fragment>', `
  float px = length(fwidth(vObj));
  #define FONDU(f) clamp(1.0 - px * (f) * 0.6, 0.0, 1.0)
  float gros = fbm3(vObj * 0.9), moyen = fbm3(vObj * 6.0), fin = mix(0.5, fbm3(vObj * 45.0), FONDU(45.0)), grain = mix(0.5, vn3(vObj * 260.0), FONDU(260.0));
  vec3 c = mix(S(0.414, 0.304, 0.210), S(0.537, 0.393, 0.272), gros); c = mix(c, S(0.339, 0.248, 0.172), smoothstep(0.45, 0.75, moyen) * 0.55);
  c *= 0.80 + 0.40 * fin; c = mix(c, S(0.74, 0.66, 0.55), smoothstep(0.80, 0.86, vn3(vObj * 70.0)) * 0.7 * FONDU(70.0));
  float tH = (fin - 0.5) * 0.02 + (grain - 0.5) * 0.004 + (moyen - 0.5) * 0.03 * FONDU(6.0);
  diffuseColor.rgb = c;`).replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = bosse(-vViewPosition, normal, tH);'); };
  const sol = new THREE.Mesh(g, m); sol.receiveShadow = true; scene.add(sol); }
// les collines au loin, dans la brume
{ const g = new THREE.CylinderGeometry(170, 170, 40, 96, 1, true), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, 5 + 16 * fbm2(a * 2.2 + 9, 1.5) + 6 * vn2(a * 9, 4)); } else p.setY(i, -3);
  scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.20, 0.24, 0.26), side: THREE.BackSide }))); }

// ---------------------------------------------------------------- la plante du joueur, le champ, les cailloux, l'herbe seche
const matPlante = matierePlante(), matChamp = matiereChamp();
const PL = construire(2), N = PL.pencas.length;
const plante = new THREE.Mesh(PL.geo, matPlante); plante.castShadow = true; plante.receiveShadow = true; plante.frustumCulled = false; scene.add(plante);
{ const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'), rg = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  rg.addColorStop(0, 'rgba(38,24,15,0.95)'); rg.addColorStop(0.45, 'rgba(58,36,22,0.85)'); rg.addColorStop(0.75, 'rgba(92,58,36,0.45)'); rg.addColorStop(1, 'rgba(110,70,44,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  for (let q = 0; q < 900; q++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 120; g.fillStyle = `rgba(${150 + Math.random() * 60 | 0},${100 + Math.random() * 40 | 0},${60 + Math.random() * 30 | 0},${0.25 + Math.random() * 0.4})`; g.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 1 + Math.random() * 3, 1 + Math.random() * 2); }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const t = new THREE.Mesh(new THREE.CircleGeometry(0.30, 48), new THREE.MeshStandardMaterial({ map: tx, transparent: true, depthWrite: false, roughness: 1 })); t.rotation.x = -Math.PI / 2; t.position.y = solY(0, 0) + 0.012; t.receiveShadow = true; scene.add(t); }
const aPos = PL.geo.attributes.position, aLuv = PL.geo.attributes.luv, aDat = PL.geo.attributes.dat, aNor = PL.geo.attributes.normal;
{ const M = new THREE.Matrix4(), q = new THREE.Quaternion(), haut = new THREE.Vector3(0, 1, 0), proches = [], loin = [];
  for (let ix = -22; ix <= 22; ix++) for (let iz = -22; iz <= 22; iz++) { const x = ix * 3.3 + gauss(0.25), z = iz * 2.9 + (ix & 1) * 1.45 + gauss(0.25), r = Math.hypot(x, z); if (r < 3.1 || r > 52 || rnd() < 0.06) continue;
    const e = uni(0.72, 1.12); q.setFromAxisAngle(haut, rnd() * 6.28); (r < 24 ? proches : loin).push(M.compose(new THREE.Vector3(x, solY(x, z) - 0.03, z), q, new THREE.Vector3(e, e * uni(0.9, 1.1), e)).clone()); }
  for (const [liste, det] of [[proches, 1], [loin, 0]]) { const im = new THREE.InstancedMesh(construire(det).geo, matChamp, liste.length); liste.forEach((m, i) => im.setMatrixAt(i, m));
    im.frustumCulled = false; im.castShadow = false; im.receiveShadow = det === 1; scene.add(im); } }
{ const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.75 + 0.5 * h2(Math.round(p.getX(i) * 7), Math.round(p.getY(i) * 7 + p.getZ(i) * 13)); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.6, p.getZ(i) * k); } g.computeVertexNormals();
  const im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.36, 0.31, 0.26), roughness: 0.95, flatShading: true }), 90), M = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < 90; i++) { const a = rnd() * 6.28, r = 2.4 + Math.pow(rnd(), 1.4) * 30, x = Math.cos(a) * r, z = Math.sin(a) * r, s = (0.025 + Math.pow(rnd(), 3) * 0.16) * (r < 5 ? 0.6 : 1);
    q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 6, rnd() * 3)); im.setMatrixAt(i, M.compose(new THREE.Vector3(x, solY(x, z) + s * 0.2, z), q, new THREE.Vector3(s, s, s))); }
  im.castShadow = true; im.receiveShadow = true; scene.add(im); }
{ const pos = [], idx = []; for (let b = 0; b < 9; b++) { const a = rnd() * 6.28, l = uni(0.16, 0.42), pen = uni(0.1, 0.6), w = 0.004, d = pos.length / 3, c = Math.cos(a), s = Math.sin(a);
    pos.push(-s * w, 0, c * w, s * w, 0, -c * w, c * l * pen * 0.5, l * 0.6, s * l * pen * 0.5, c * l * pen, l, s * l * pen); idx.push(d, d + 1, d + 2, d + 2, d + 1, d + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const n = 700, im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.62, 0.52, 0.30), roughness: 1, side: THREE.DoubleSide }), n), M = new THREE.Matrix4(), q = new THREE.Quaternion(), haut = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = 1.9 + Math.pow(rnd(), 1.3) * 34, x = Math.cos(a) * r, z = Math.sin(a) * r, e = uni(0.45, 1.0) * (r < 4.5 ? 0.6 : 1); q.setFromAxisAngle(haut, rnd() * 6.28); im.setMatrixAt(i, M.compose(new THREE.Vector3(x, solY(x, z), z), q, new THREE.Vector3(e, e, e))); }
  im.frustumCulled = false; scene.add(im); }

// ---------------------------------------------------------------- les outils : la coa (disque d'acier au bout d'un long manche) et la barreta
const acier = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.55, 0.57, 0.58), roughness: 0.32, metalness: 0.9 }), bois = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.36, 0.20, 0.09), roughness: 0.75 });
const fer = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.10, 0.10, 0.10), roughness: 0.55, metalness: 0.8 });
const coa = new THREE.Group();
{ const lame = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.004, 48), acier); lame.rotation.x = Math.PI / 2; lame.scale.y = 1; lame.scale.z = 1;
  const fil = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.003, 6, 48), new THREE.MeshStandardMaterial({ color: 0xd9dcdc, roughness: 0.2, metalness: 1 }));
  const douille = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.20, 12), fer); douille.position.y = 0.16;
  const manche = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.019, 1.5, 12), bois); manche.position.y = 1.0;
  coa.add(lame, fil, douille, manche); coa.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(coa); }
const barreta = new THREE.Group();
{ const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 1.35, 10), fer); tige.position.y = 0.675; const bec = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.14, 8), fer); bec.rotation.x = Math.PI; bec.position.y = -0.07;
  barreta.add(tige, bec); barreta.traverse((o) => { if (o.isMesh) o.castShadow = true; }); barreta.visible = false; scene.add(barreta); }

// ---------------------------------------------------------------- etat du jeu, interface
const J = { acte: 'jima', coupees: 0, patas: [], gel: 0, secousse: 0, levier: 0, levierVu: 0, crans: 0, tFin: 0 };
const UI = { titre: document.getElementById('titre'), sous: document.getElementById('sous'), compte: document.getElementById('compte'), jauge: document.getElementById('barres').children, mot: document.getElementById('verdict'), aide: document.getElementById('aide') };
// dans le site (?site) : la page porte le texte et la barre, le jeu ne fait que lui dire ou on en est
const SITE = QS.has('site');
const dire = (quoi) => { if (SITE && parent !== window) parent.postMessage(Object.assign({ jima: 1, coupees: J.coupees, total: N, acte: J.acte, levier: J.levier || 0 }, quoi || {}), '*'); };
function majUI() { dire(); UI.compte.textContent = J.coupees + ' / ' + N; const n = [0, 0, 0]; J.patas.forEach((b) => { if (b !== undefined) n[b]++; });
  for (let i = 0; i < 3; i++) UI.jauge[i].style.flexBasis = (100 * n[i] / N) + '%';
  const moy = J.coupees ? (n[1] + 2 * n[2]) / J.coupees : 0;
  UI.mot.textContent = J.coupees < 4 ? '' : moy < 0.45 ? 'Rasée à ras. La piña sort blanche.' : moy < 1.15 ? 'Pata juste. Correcte.' : 'Pata haute. Trop de vert reste.'; }
let ac = null;
function son(grave, force) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); const t = ac.currentTime, n = Math.floor(ac.sampleRate * 0.14), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
    const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = grave ? 'lowpass' : 'bandpass'; f.frequency.value = grave ? 420 : 1100 + Math.random() * 700; f.Q.value = 0.9;
    const g = ac.createGain(); g.gain.value = 0.35 * force; s.connect(f).connect(g).connect(ac.destination); s.start(t);
    const o = ac.createOscillator(), g2 = ac.createGain(); o.frequency.setValueAtTime(grave ? 90 : 170, t); o.frequency.exponentialRampToValueAtTime(grave ? 36 : 60, t + 0.09);
    g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.10 * force, t + 0.005); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g2).connect(ac.destination); o.start(t); o.stop(t + 0.13); } catch (e) { /* pas de son, pas grave */ } }

// ---------------------------------------------------------------- la coupe
const tombees = [], HAUT = new THREE.Vector3(0, 1, 0);
const NE = 320, ePos = new Float32Array(NE * 3).fill(-99), eCol = new Float32Array(NE * 3), eVit = new Float32Array(NE * 3), eVie = new Float32Array(NE); let eTete = 0, eActif = 0;
const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3)); eGeo.setAttribute('color', new THREE.BufferAttribute(eCol, 3));
const eclats = new THREE.Points(eGeo, new THREE.PointsMaterial({ size: 0.014, vertexColors: true, sizeAttenuation: true })); eclats.frustumCulled = false; scene.add(eclats);
function gicler(C, X, n, teintes, force) { for (let e = 0; e < n; e++) { const q = eTete, c = teintes[e % teintes.length]; eTete = (eTete + 1) % NE;
    ePos[q * 3] = C[0] + gauss(0.03); ePos[q * 3 + 1] = C[1] + gauss(0.03); ePos[q * 3 + 2] = C[2] + gauss(0.03); eCol[q * 3] = c[0]; eCol[q * 3 + 1] = c[1]; eCol[q * 3 + 2] = c[2];
    eVit[q * 3] = X[0] * uni(0.3, 1.3) * force + gauss(0.4); eVit[q * 3 + 1] = X[1] * uni(0.3, 1.3) * force + uni(0.4, 1.5); eVit[q * 3 + 2] = X[2] * uni(0.3, 1.3) * force + gauss(0.4); eVie[q] = uni(0.5, 1.0); }
  eActif = 1.1; eGeo.attributes.color.needsUpdate = true; }
const CHAIR_T = [[0.85, 0.82, 0.62], [0.62, 0.72, 0.42], [0.93, 0.92, 0.80]], TERRE_T = [[0.20, 0.12, 0.07], [0.30, 0.19, 0.11]];

// un coup de coa emporte la penca visee et ses voisines encore debout : 3 le plus souvent, 2 sinon (Raouf, 5 oct)
function voisines(i, n) { const S = PL.pencas[i].S; return PL.pencas.map((f, j) => [j, f]).filter(([j, f]) => j !== i && f.coupee < 0)
  .map(([j, f]) => [j, Math.hypot(f.S[0] - S[0], f.S[1] - S[1], f.S[2] - S[2])]).sort((a, b) => a[1] - b[1]).slice(0, n).map((a) => a[0]); }
function couper(i, bande, dir, muet) {
  const f = PL.pencas[i]; if (!f || f.coupee >= 0 || J.acte !== 'jima') return false;
  const K = PL.K, nR = f.nR, v0 = f.v0, p = aPos.array, l = aLuv.array, d = aDat.array, n = aNor.array;
  // la coupe suit la pina : la lame glisse sur sa peau, a la hauteur de la pata. Toutes les faces finissent donc a fleur du meme oeuf.
  // La lame penche toujours un peu, jamais deux fois pareil.
  const psi = (QS.get('pv') !== '1' ? PENTE * Math.max(-0.3, Math.min(1, 3 * f.n[1])) : f.n[1] < 0 ? PENTE * (1 + f.n[1] * PENTE_BAS) : PENTE) + gauss(0.05), h = PATAS[bande] + uni(0, 0.003) + f.rh * Math.tan(psi) * 0.45, Q = [f.S[0] + f.n[0] * h, f.S[1] + f.n[1] * h, f.S[2] + f.n[2] * h];
  let nc = [0, 1, 2].map((q) => f.n[q] * Math.cos(psi) + f.m[q] * Math.sin(psi) + gauss(0.04)); { const ln = Math.hypot(nc[0], nc[1], nc[2]); nc = nc.map((a) => a / ln); }
  if (f.S[1] > Y_SOMMET - 0.012) { nc = [gauss(0.03), 1, gauss(0.03)]; const ln = Math.hypot(nc[0], nc[1], nc[2]); nc = nc.map((a) => a / ln); Q[0] = 0; Q[1] = Y_SOMMET + 0.004 + bande * 0.015; Q[2] = 0; }   // le cogollo se tranche a plat
  const dist = (q) => (p[q * 3] - Q[0]) * nc[0] + (p[q * 3 + 1] - Q[1]) * nc[1] + (p[q * 3 + 2] - Q[2]) * nc[2];
  // pour chaque fil (une ligne de sommets de la base a la pointe) : le point ou il traverse le plan
  const X = new Float32Array(K * 3), jk = new Int32Array(K), C = [0, 0, 0];
  for (let k = 0; k < K; k++) { let j = 0; while (j < nR && dist(v0 + j * K + k) <= 0) j++;
    if (j >= nR) { j = nR - 1; const q = v0 + j * K + k; X[k * 3] = p[q * 3]; X[k * 3 + 1] = p[q * 3 + 1]; X[k * 3 + 2] = p[q * 3 + 2]; }
    else if (j === 0) { const q = v0 + k, dd = dist(q); X[k * 3] = p[q * 3] - nc[0] * dd; X[k * 3 + 1] = p[q * 3 + 1] - nc[1] * dd; X[k * 3 + 2] = p[q * 3 + 2] - nc[2] * dd; }
    else { const a = v0 + (j - 1) * K + k, b = v0 + j * K + k, da = dist(a), db = dist(b), t = da / ((da - db) || 1); for (let q = 0; q < 3; q++) X[k * 3 + q] = p[a * 3 + q] + (p[b * 3 + q] - p[a * 3 + q]) * t; }
    jk[k] = j; C[0] += X[k * 3] / K; C[1] += X[k * 3 + 1] / K; C[2] += X[k * 3 + 2] / K; }
  // 1. la lame qui tombe : la penca au-dela du plan, fermee par sa propre section de chair
  if (!muet) { const mp = [], ml = [], md = [], mf = [], mi = [];
    for (let q = v0; q < f.vFin; q++) { const r = q - v0, k = r % K, sous = r < nR * K && Math.floor(r / K) < jk[k];
      if (sous) mp.push(X[k * 3] - C[0], X[k * 3 + 1] - C[1], X[k * 3 + 2] - C[2]); else mp.push(p[q * 3] - C[0], p[q * 3 + 1] - C[1], p[q * 3 + 2] - C[2]);
      ml.push(l[q * 3], l[q * 3 + 1], l[q * 3 + 2]); md.push(d[q * 3], d[q * 3 + 1], 0); mf.push(-1); }
    for (let q = f.i0; q < f.i1; q++) mi.push(PL.I[q] - v0);
    const cc = mp.length / 3, al = l[v0 * 3 + 2]; mp.push(0, 0, 0); ml.push(0, 0, al); md.push(f.t, 0, 1); mf.push(-1);
    for (let k = 0; k < K; k++) { mp.push(X[k * 3] - C[0], X[k * 3 + 1] - C[1], X[k * 3 + 2] - C[2]); ml.push(1, 0, al); md.push(f.t, 0, 1); mf.push(-1); }
    for (let k = 0; k < K; k++) mi.push(cc + 1 + (k + 1) % K, cc + 1 + k, cc);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); g.setAttribute('luv', new THREE.Float32BufferAttribute(ml, 3)); g.setAttribute('dat', new THREE.Float32BufferAttribute(md, 3));
    g.setAttribute('fid', new THREE.Float32BufferAttribute(mf, 1)); g.setIndex(mi); g.computeVertexNormals();
    const m = new THREE.Mesh(g, matPlante); m.castShadow = true; m.position.set(C[0], C[1], C[2]); scene.add(m);
    const er = new THREE.Vector3(Math.cos(f.az), 0, Math.sin(f.az)), cote = new THREE.Vector3(dir ? dir[0] : 0, 0, dir ? dir[1] : 0);
    tombees.push({ m, v: er.multiplyScalar(uni(0.5, 0.9)).add(cote.multiplyScalar(0.7)).add(new THREE.Vector3(0, uni(0.9, 1.5), 0)), w: new THREE.Vector3(gauss(2.2), gauss(1.5), gauss(2.2)), vie: 0, pose: false, fond: -1 });
    gicler(C, nc, 16, CHAIR_T, 1); son(false, bande === 0 ? 1 : 0.7); J.gel = bande === 0 ? 0.05 : 0.02; J.secousse = Math.min(1, J.secousse + (bande === 0 ? 0.5 : 0.28)); }
  // 2. la plante : chaque fil s'arrete au plan. Le dernier anneau et la pointe deviennent la face de chair, a plat dans le plan.
  for (let k = 0; k < K; k++) for (let j = jk[k]; j < nR; j++) { const q = v0 + j * K + k; p[q * 3] = X[k * 3]; p[q * 3 + 1] = X[k * 3 + 1]; p[q * 3 + 2] = X[k * 3 + 2]; }
  for (let k = 0; k < K; k++) { const q = v0 + (nR - 1) * K + k; l[q * 3] = 1; d[q * 3 + 2] = 1; n[q * 3] = nc[0]; n[q * 3 + 1] = nc[1]; n[q * 3 + 2] = nc[2]; }
  { const q = f.pointe; p[q * 3] = C[0] + nc[0] * 0.003; p[q * 3 + 1] = C[1] + nc[1] * 0.003; p[q * 3 + 2] = C[2] + nc[2] * 0.003; l[q * 3] = 0; d[q * 3 + 1] = 0; d[q * 3 + 2] = 1; n[q * 3] = nc[0]; n[q * 3 + 1] = nc[1]; n[q * 3 + 2] = nc[2]; }
  for (let q = f.d0; q < f.vFin; q++) { p[q * 3] = C[0]; p[q * 3 + 1] = C[1]; p[q * 3 + 2] = C[2]; }
  aPos.needsUpdate = aLuv.needsUpdate = aDat.needsUpdate = aNor.needsUpdate = true; rendu.shadowMap.needsUpdate = true;
  f.coupee = bande; J.patas[i] = bande; J.coupees++; uSur.value = -1; majUI(); reveil(3);
  if (J.coupees >= N) { J.acte = 'barreta'; J.gel = 0.1; dire(); UI.titre.textContent = 'La barreta'; UI.sous.textContent = 'Tirez vers le haut pour la sortir de terre.'; UI.aide.textContent = 'Tirez la barreta vers le haut'; poserBarreta(); }
  return true;
}

// ---------------------------------------------------------------- la barreta : on separe la pina de ses racines et on la sort
const ARR = { cote: new THREE.Vector3(), vue: new THREE.Vector3(), pied: new THREE.Vector3(), repos: new THREE.Vector3() };
function poserBarreta() { ARR.vue.set(Math.sin(camLacet), 0, Math.cos(camLacet)); ARR.cote.set(Math.cos(camLacet), 0, -Math.sin(camLacet));
  ARR.pied.copy(ARR.vue).multiplyScalar(0.22).addScaledVector(ARR.cote, -0.36); ARR.pied.y = solY(ARR.pied.x, ARR.pied.z) + 0.02;
  ARR.repos.copy(ARR.cote).multiplyScalar(1.05).addScaledVector(ARR.vue, 0.15); ARR.repos.y = solY(ARR.repos.x, ARR.repos.z) + 0.30; barreta.visible = true; }
function tirer(dt) {
  J.levierVu = damp(J.levierVu, J.levier, 9, dt); const k = smooth(0, 1, J.levierVu), cran = Math.min(3, Math.floor(J.levier * 3 + 1e-6));
  while (J.crans < cran) { J.crans++; J.secousse = Math.min(1, J.secousse + 0.45); J.gel = 0.04; son(true, 0.9); gicler([ARR.pied.x, ARR.pied.y, ARR.pied.z], [0, 1, 0], 22, TERRE_T, 0.7);
    if (J.crans < 3 && J.acte === 'barreta') UI.sous.textContent = J.crans === 1 ? 'Une racine cède. Encore.' : 'Elle bouge. Encore.'; }
  const pen = new THREE.Vector3().copy(ARR.cote).multiplyScalar(0.55).addScaledVector(ARR.vue, -0.25).normalize(), ang = rad(24 + 38 * k);
  barreta.position.copy(ARR.pied); barreta.quaternion.setFromUnitVectors(HAUT, new THREE.Vector3().copy(pen).multiplyScalar(-Math.sin(ang)).addScaledVector(HAUT, Math.cos(ang)).normalize());
  let y = 0.16 * k, bascule = 0.10 * k; const pos = new THREE.Vector3(0, y, 0);
  if (J.acte === 'fini') { J.tFin += dt; const t = J.tFin, a = smooth(0, 0.4, t), b = smooth(0.35, 1.7, t);
    pos.set(0, 0.16 + 0.34 * a, 0).lerp(new THREE.Vector3(ARR.repos.x, ARR.repos.y + Math.sin(b * Math.PI) * 0.30, ARR.repos.z), b); bascule = 0.10 + 0.25 * a + 1.22 * b;
    if (b >= 1 && !J.pose) { J.pose = true; J.secousse = Math.min(1, J.secousse + 0.4); son(true, 0.6); gicler([ARR.repos.x, ARR.repos.y - 0.2, ARR.repos.z], [0, 1, 0], 18, TERRE_T, 0.5); }
    if (t > 0.5) barreta.visible = false; }
  plante.position.copy(pos); plante.quaternion.setFromAxisAngle(ARR.vue, -bascule); rendu.shadowMap.needsUpdate = true;
}

// ---------------------------------------------------------------- camera
let camLacet = 0.6, zoomEssai = 1; const camPos = new THREE.Vector3(), camVise = new THREE.Vector3();
function poseCam(dt, net) {
  const etroit = Math.max(0, 1 / cam.aspect - 1), fov = 34 + 16 * clamp(etroit / 0.9, 0, 1); if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
  const jima = J.acte === 'jima', R = PL.rayon, d = (jima ? Math.max(R * 2.75, PL.hauteur * 2.5) : R * 1.9) * (1 + 0.6 * etroit), h = (jima ? PL.hauteur * 0.72 : R * 0.62) * (zoomEssai < 1 ? 0.55 : 1);
  const cible = J.acte === 'fini' ? new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0.3, 0), plante.position, 0.8) : new THREE.Vector3(0, jima ? PL.hauteur * 0.40 : 0.30, 0);
  if (J.acte === 'barreta' || J.acte === 'fini') camLacet = damp(camLacet, 0.95, 0.6, dt);
  const but = new THREE.Vector3(Math.sin(camLacet) * d * zoomEssai, h, Math.cos(camLacet) * d * zoomEssai);
  if (net) { camPos.copy(but); camVise.copy(cible); } else { camPos.set(damp(camPos.x, but.x, 2, dt), damp(camPos.y, but.y, 2, dt), damp(camPos.z, but.z, 2, dt)); camVise.set(damp(camVise.x, cible.x, 2.6, dt), damp(camVise.y, cible.y, 2.6, dt), damp(camVise.z, cible.z, 2.6, dt)); }
  cam.position.copy(camPos);
  if (J.secousse > 0.001) { const s = J.secousse * J.secousse * 0.05, t = performance.now() * 0.001; cam.position.x += Math.sin(t * 47.3) * s; cam.position.y += Math.sin(t * 39.1 + 1.7) * s; cam.position.z += Math.sin(t * 53.7 + 3.1) * s; }
  cam.lookAt(camVise); ciel.position.copy(cam.position);
}

// ---------------------------------------------------------------- le geste : un trait de coa en travers d'une penca la coupe. Une penca par trait.
const el = rendu.domElement, souris = { x: innerWidth * 0.78, y: innerHeight * 0.7, vx: 0, actif: false, angle: -0.5, coup: 0 }; let trace = null;
const _v = new THREE.Vector3();
const ecran = (q) => { _v.set(q[0], q[1], q[2]).project(cam); return [(_v.x * 0.5 + 0.5) * innerWidth, (-_v.y * 0.5 + 0.5) * innerHeight, _v.z]; };
// le trait [a,b] croise-t-il la nervure d'une penca ? On garde la plus proche de l'oeil.
function viser(x1, y1, x2, y2) { let best = null;
  for (let i = 0; i < N; i++) { const f = PL.pencas[i]; if (f.coupee >= 0) continue; let A = ecran(f.epine[0]);
    for (let s = 1; s < f.epine.length; s++) { const B = ecran(f.epine[s]); if (A[2] < 1 && B[2] < 1) { const rx = B[0] - A[0], ry = B[1] - A[1], sx = x2 - x1, sy = y2 - y1, den = rx * sy - ry * sx;
        if (Math.abs(den) > 1e-6) { const t = ((x1 - A[0]) * sy - (y1 - A[1]) * sx) / den, w = ((x1 - A[0]) * ry - (y1 - A[1]) * rx) / den;
          if (t >= 0 && t <= 1 && w >= 0 && w <= 1) { const z = A[2] + (B[2] - A[2]) * t, u = f.epine[s - 1][3] + (f.epine[s][3] - f.epine[s - 1][3]) * t; if (!best || z < best.z) best = { i, z, u }; } } }
      A = B; } }
  return best; }
function survol(x, y) { let best = -1, bd = 40; if (J.acte === 'jima') for (let i = 0; i < N; i++) { const f = PL.pencas[i]; if (f.coupee >= 0) continue; let A = ecran(f.epine[0]);
    for (let s = 1; s < f.epine.length; s++) { const B = ecran(f.epine[s]), dx = B[0] - A[0], dy = B[1] - A[1], t = clamp(((x - A[0]) * dx + (y - A[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1), dd = Math.hypot(x - A[0] - dx * t, y - A[1] - dy * t) + A[2] * 8; if (dd < bd) { bd = dd; best = i; } A = B; } }
  if (uSur.value !== best) { uSur.value = best; } }
el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); trace = { pts: [[e.clientX, e.clientY]], fait: false, t0: performance.now() }; souris.actif = true; reveil(2); });
el.addEventListener('pointermove', (e) => { souris.vx = e.clientX - souris.x; souris.x = e.clientX; souris.y = e.clientY; reveil(1.5);
  if (!trace) { survol(e.clientX, e.clientY); return; }
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : []; for (const q of (evs.length ? evs : [e])) trace.pts.push([q.clientX, q.clientY]);
  const n = trace.pts.length, a = trace.pts[Math.max(0, n - 5)], b = trace.pts[n - 1];
  if (J.acte === 'jima' && !trace.fait && J.gel <= 0 && Math.hypot(b[0] - a[0], b[1] - a[1]) > 12) { const c = viser(a[0], a[1], b[0], b[1]);
    if (c) { trace.fait = true; souris.coup = 1; { const im = document.getElementById('impact'); im.style.left = b[0] + 'px'; im.style.top = b[1] + 'px'; im.classList.remove('frappe'); void im.offsetWidth; im.classList.add('frappe'); const tk = document.querySelector('.ticket'); tk.classList.remove('frappe'); void tk.offsetWidth; tk.classList.add('frappe'); } const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, dr = new THREE.Vector3(dx / l, -dy / l, 0).applyQuaternion(cam.quaternion);
      const bande = c.u < 0.16 ? 0 : c.u < 0.32 ? 1 : 2; if (couper(c.i, bande, [dr.x, dr.z])) for (const j of voisines(c.i, Math.random() < 0.7 ? 2 : 1)) couper(j, bande, [dr.x, dr.z], true); } }
  if (J.acte === 'barreta' && n > 1) { const dy = trace.pts[n - 2][1] - b[1]; if (dy > 0) { J.levier = Math.min(1, J.levier + dy / (innerHeight * 0.8)); dire(); J.secousse = Math.min(1, J.secousse + dy * 0.001);
      if (J.levier >= 1) finir(); } } });
function finir() { if (J.acte !== 'barreta') return; J.acte = 'fini'; dire({ fini: 1 }); { let code = 'JIMA10'; try { const R = parent.siteChrome && parent.siteChrome.remise; if (R) { code = R.donner('espadin') || code; R.poser(code); } } catch (e) {}
    document.getElementById('codeval').textContent = code; if (!SITE) document.getElementById('codelien').remove(); setTimeout(() => document.getElementById('ticketcode').classList.add('vu'), 1400); } J.tFin = 0; UI.titre.textContent = 'Arrachée.'; UI.sous.textContent = 'La piña part au palenque.'; UI.aide.textContent = 'Piña prête pour le palenque'; reveil(6); }
const finTrait = () => { trace = null; souris.actif = false; }; el.addEventListener('pointerup', finTrait); el.addEventListener('pointercancel', finTrait);
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); rendu.setSize(innerWidth, innerHeight); reveil(1); });

// ---------------------------------------------------------------- la boucle : elle ne dessine que s'il se passe quelque chose
let eveil = 0, avant = performance.now(); const reveil = (s) => { eveil = Math.max(eveil, performance.now() + s * 1000); };
function pas(dt) {
  if (J.gel > 0) { J.gel -= dt; return; }
  J.secousse = Math.max(0, J.secousse - dt * 2.6);
  let auSol = 0; for (const o of tombees) { if (o.fini) continue; o.vie += dt;
    if (!o.pose) { o.v.y -= 9.2 * dt; o.m.position.addScaledVector(o.v, dt); o.m.rotateOnWorldAxis(HAUT, o.w.y * dt); o.m.rotateX(o.w.x * dt); o.m.rotateZ(o.w.z * dt);
      const s = solY(o.m.position.x, o.m.position.z) + 0.04; if (o.m.position.y < s && o.v.y < 0) { o.m.position.y = s; o.pose = true; } reveil(0.5); rendu.shadowMap.needsUpdate = true; }
    else { auSol++; if (o.fond >= 0) { o.fond += dt; o.m.position.y -= dt * 0.25; o.m.scale.setScalar(Math.max(0.001, 1 - o.fond / 0.9)); reveil(0.3); rendu.shadowMap.needsUpdate = true; if (o.fond > 0.9) { scene.remove(o.m); o.m.geometry.dispose(); o.fini = true; } } } }
  if (auSol > 9 || J.acte !== 'jima') { const o = tombees.find((q) => !q.fini && q.pose && q.fond < 0 && (q.vie > 2.5 || J.acte !== 'jima')); if (o) o.fond = 0; }
  if (eActif > 0) { eActif -= dt; reveil(0.2); for (let q = 0; q < NE; q++) { if (eVie[q] <= 0) continue; eVie[q] -= dt; eVit[q * 3 + 1] -= 9.2 * dt; ePos[q * 3] += eVit[q * 3] * dt; ePos[q * 3 + 1] += eVit[q * 3 + 1] * dt; ePos[q * 3 + 2] += eVit[q * 3 + 2] * dt; if (eVie[q] <= 0) ePos[q * 3 + 1] = -99; } eGeo.attributes.position.needsUpdate = true; }
  if (J.acte !== 'jima') { tirer(dt); if (J.acte === 'barreta' || J.tFin < 3) reveil(0.5); }
}
function poserCoa(dt) { coa.visible = J.acte === 'jima'; if (!coa.visible) return;
  _v.set(souris.x / innerWidth * 2 - 1, -(souris.y / innerHeight) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize();
  const but = new THREE.Vector3().copy(cam.position).addScaledVector(_v, cam.position.distanceTo(camVise) * 0.72);
  coa.position.set(damp(coa.position.x, but.x, 26, dt), damp(coa.position.y, but.y, 26, dt), damp(coa.position.z, but.z, 26, dt));
  souris.angle = damp(souris.angle, clamp(-0.5 + souris.vx * 0.012, -1.1, 0.3), 14, dt); souris.vx *= 0.8; souris.coup = Math.max(0, souris.coup - dt * 7);
  coa.quaternion.copy(cam.quaternion); coa.rotateZ(souris.angle + Math.sin(souris.coup * Math.PI) * 0.25); }
function image(t) { const dt = clamp((t - avant) / 1000, 0, 0.05); avant = t;
  if (t < eveil && !fige) { pas(dt); poseCam(dt, false); poserCoa(dt); rendu.render(scene, cam); }
  requestAnimationFrame(image); }
rendu.shadowMap.needsUpdate = true; majUI(); poseCam(0, true); reveil(3); requestAnimationFrame(image);

// ---------------------------------------------------------------- pour les essais et les captures
document.getElementById('chargement').classList.add('parti');
window.JEU = J; window.INFO = { triangles: PL.I.length / 3, pencas: N, rayon: PL.rayon, hauteur: PL.hauteur };
window.COUPER = (i, bande, muet) => couper(i, bande || 0, null, muet);
window.COUPER_AUTO = (n, bande) => { for (let i = 0, c = 0; i < N && c < n; i++) if (PL.pencas[i].coupee < 0) { couper(i, bande || 0, null, true); c++; } };
window.LEVIER = (x) => { J.levier = x; if (x >= 1) finir(); reveil(6); };
window.VUE = (lacet, zoom) => { camLacet = lacet; zoomEssai = zoom || 1; poseCam(0, true); reveil(1); };
window.AVANCER = (s) => { for (let t = 0; t < s; t += 1 / 60) { pas(1 / 60); poseCam(1 / 60, false); } poserCoa(1); rendu.render(scene, cam); };
// ?coupe=60 : ouvre la plante avec 60 pencas deja coupees ; ?coupe=tout : toutes sauf une, pour voir la pina sans passer par la barreta
if (QS.has('coupe')) { const v = QS.get('coupe'), n = v === 'tout' ? N - 1 : Math.min(N - 1, +v || 0); window.COUPER_AUTO(n, 0); if (v === 'tout') { zoomEssai = 0.5; camLacet = 0.95; } poseCam(0, true); reveil(3); }
// vue de mesure : de face, a hauteur du milieu de la pina, longue focale, sans outils (la meme prise que refs/gen_1_pina.png)
let fige = false;
window.FACE = (az) => { fige = true; scene.traverse((o) => { if (o.isMesh || o.isPoints) o.visible = o === plante; }); scene.background = new THREE.Color(1, 1, 1); scene.fog = null; rendu.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)]; coa.visible = false; barreta.visible = false; cam.fov = 16; cam.updateProjectionMatrix(); cam.position.set(Math.sin(az) * 3.4, 0.30, Math.cos(az) * 3.4); cam.lookAt(0, 0.30, 0); ciel.position.copy(cam.position); rendu.render(scene, cam); };
window.ECRAN_PENCA = (i) => PL.pencas[i].epine.map(ecran);
// vue de mesure du dessous : la pina sortie de terre, vue d'en bas, lumiere douce egale (la meme prise que la vue de dessous de refs/gen_4_planche.png)
window.DESSOUS = () => { fige = true; scene.traverse((o) => { if (o.isMesh || o.isPoints) o.visible = o === plante; }); scene.background = new THREE.Color(1, 1, 1); scene.fog = null; rendu.clippingPlanes = []; coa.visible = false; barreta.visible = false;
  plante.position.set(0, 0, 0); plante.rotation.set(0, 0, 0); scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 1.35)); const d = new THREE.DirectionalLight(0xffffff, 2.1); d.position.set(1.2, -5, -2.2); scene.add(d);
  cam.fov = 12; cam.aspect = 1; cam.updateProjectionMatrix(); cam.up.set(0, 0, -1); cam.position.set(0, -4, 0.0001); cam.lookAt(0, 0.3, 0); ciel.visible = false; rendu.render(scene, cam); };
// ?dessous : la pina rasee, vue d'en bas comme la planche gen_4
if (QS.has('dessous')) { window.COUPER_AUTO(999, 0); window.AVANCER(1); window.DESSOUS(); }
