# SEO / GEO / SEA, Ivresse d'Amour, diagnostic mesure le 1er septembre 2026

Site : raouf-hamouda.github.io/ivresse-damour (repo Raouf-Hamouda/ivresse-damour, HEAD 51f2e76, arbre propre)

## Mesures (HTML brut tel que lu par GPTBot / ClaudeBot / PerplexityBot / Bing, sans JavaScript)
- index.html : 31 mots lisibles, 166 dans les attributs data-fr. la-historia : 6 mots / 457. el-registro : 6 / 204. cgv : 8 / 441. faq : 44 / 577.
- Tout le texte vit dans data-fr / data-es / data-en et est injecte par site.js (appliquerLangue). alt="" partout, texte dans data-fr-alt.
- Le menu est construit par site.js (MENU, GROUPES). Sans JS la page d'accueil pointe vers 5 pages.
- Pages a 0 lien entrant : PLAN_DU_SITE, 404, paiement. Pages a 1 ou 2 : campagne-*, eventos, faq, presse, points-de-vente, cgv, mentions-legales.
- Aucune meta description, aucun canonical, aucun Open Graph, aucun JSON-LD, aucun hreflang. Titre identique en 3 langues sur chaque page.
- robots.txt 404, sitemap.xml 404, llms.txt 404.
- 3 langues sur 1 URL : Google n'indexe que le francais.
- Domaine : sous-dossier de github.io. Aucune autorite de marque ne s'accumule.
- Poids : 200 Ko de JS avant peinture sur l'accueil, emblemes_parts.js 305 Ko. Pas prioritaire.

## Ce que dit la recherche 2026
- Citations IA : correlees aux mentions hors site (listicles, Reddit, YouTube, presse), recouvrement Google top 10 / sources citees par l'IA passe sous 20 %.
- Sur la page : reponse dans les 100 a 200 premiers mots, chiffres, sources nommees, dates, schema.org.
- llms.txt : ignore par OpenAI, Google, Anthropic, Perplexity (Q1 2026). Coute 2 minutes, on l'ajoute quand meme.
- Gris / noir : PBN, domaines expires, liens achetes, pages parasites : duree de vie 6 a 8 semaines puis penalite (SpamBrain, site reputation abuse). Refuse pour une marque a 3 references et un seul domaine.
- Gris qui marche encore : entite Wikidata, reponses Reddit r/mezcal, bases de donnees (Mezcal Reviews, Difford's, Untappd, Distiller), articles sur plateformes a forte autorite (Medium, LinkedIn, Substack) pointant vers le site, fiche Google Business du palenque.
- SEA : Google Ads accepte les spiritueux en France sous Loi Evin (informatif seul : origine, composition, degre, terroir, mode de consommation ; message sanitaire obligatoire ; pas de mise en scene de vie ; ciblage 18+). Mise a jour de la politique alcool Google le 30 septembre 2026. Blocage : pas de vente avant societe + permis d'import.

## Plan (aucun changement visible, sauf un mot "Plan du site" en pied de page)
1. outils/seo_build.py : copie data-fr dans le texte des elements et data-fr-alt dans alt (site.js reecrit au chargement, rendu identique), title + description + canonical + OG uniques par page, robots.txt, sitemap.xml, llms.txt. Verification par rendu 390/930/1600 et diff des captures.
2. JSON-LD : Organization, Product + Offer x3 (140 EUR, 700 ml, 50 %, Villa Sola de Vega, Gilberto Vasquez), FAQPage, BreadcrumbList, WebSite. Copie statique de la navigation dans le HTML brut. Lien "Plan du site" en pied.
3. Domaine de marque + Search Console + Bing Webmaster + IndexNow. Besoin : nom de domaine, ~12 EUR/an, compte Google de Raouf.
4. GEO hors site : entite Wikidata, 6 fiches bases de donnees, plan Reddit, 3 articles plateformes, fiche Google Business. Textes prepares, publication par Raouf / client.
5. SEA : carte de mots-cles, structure de campagne, annonces conformes Loi Evin, page d'atterrissage, prete a allumer le jour ou le panier est legal.
