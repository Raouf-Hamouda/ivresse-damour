/* 22 oct 2026. Publication des textes modifies en MODE TEXTE (deux appuis sur Shift sur le site).
   Fonction Vercel : recoit { motdepasse, modifications:[{page, langue, ancien, nouveau}] }, verifie le mot de passe
   (variable TEXTES_MDP), reporte chaque modification dans la page HTML du depot GitHub (variable GITHUB_TOKEN,
   GITHUB_REPO) et commite. Vercel et GitHub Pages redeploient tout seuls depuis le depot. */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const formes = (langue, texte) => { const a = `data-${langue}="${esc(texte)}"`; return [a, a.replace(/&#x27;/g, "'")]; };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'POST seulement' });
  const { motdepasse, modifications } = req.body || {};
  if (!process.env.TEXTES_MDP || motdepasse !== process.env.TEXTES_MDP) return res.status(401).json({ erreur: 'Mot de passe refusé.' });
  if (!Array.isArray(modifications) || !modifications.length) return res.status(400).json({ erreur: 'Rien à publier.' });
  const repo = process.env.GITHUB_REPO || 'Raouf-Hamouda/ivresse-damour', token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ erreur: 'GITHUB_TOKEN absent.' });
  const gh = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'ivresse-damour-textes' };
  const parPage = {};
  for (const m of modifications) {
    const page = String(m.page || '').split('/').pop();
    if (!/^[a-z0-9-]+\.html$/.test(page) || !['fr', 'es', 'en'].includes(m.langue)) continue;
    (parPage[page] = parPage[page] || []).push(m);
  }
  const stamp = 'v=' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + Math.random().toString(36).slice(2, 5);
  const rapport = [];
  for (const page of Object.keys(parPage)) {
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${page}`, { headers: gh });
    if (!r.ok) { rapport.push({ page, erreur: 'page introuvable sur GitHub' }); continue; }
    const f = await r.json();
    let s = Buffer.from(f.content, 'base64').toString('utf8'), ok = 0, ko = [];
    for (const m of parPage[page]) {
      const [a, b] = formes(m.langue, String(m.ancien)), neuf = `data-${m.langue}="${esc(String(m.nouveau))}"`;
      const vieux = s.includes(a) ? a : (s.includes(b) ? b : null);
      if (!vieux) { ko.push(m.ancien.slice(0, 60)); continue; }
      s = s.replace(vieux, neuf); ok++;
    }
    if (ok) {
      s = s.replace(/\?v=[0-9a-z]+/g, '?' + stamp);   /* le cache des visiteurs se renouvelle */
      const put = await fetch(`https://api.github.com/repos/${repo}/contents/${page}`, {
        method: 'PUT', headers: { ...gh, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Textes modifiés par la maison : ${page} (${ok})`, content: Buffer.from(s, 'utf8').toString('base64'), sha: f.sha })
      });
      if (!put.ok) { rapport.push({ page, erreur: 'écriture refusée par GitHub (' + put.status + ')' }); continue; }
    }
    rapport.push({ page, appliquees: ok, introuvables: ko });
  }
  return res.status(200).json({ ok: true, rapport });
}
