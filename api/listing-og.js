// api/listing-og.js
// Sert le HTML avec les bonnes meta OG/Twitter aux crawlers sociaux (WhatsApp, Facebook, etc.)
// Les moteurs de recherche (Googlebot, Bingbot) reçoivent la SPA — ils exécutent le JS et lisent react-helmet.

const SITE_URL = 'https://www.zandopluscg.com';
const FALLBACK_IMAGE = `${SITE_URL}/og-image.jpg`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Crawlers sociaux qui ne savent pas exécuter le JavaScript
const SOCIAL_CRAWLER_RE = /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|baiduspider|applebot/i;

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  const param = req.query.id; // slug ou UUID
  const ua    = req.headers['user-agent'] || '';
  const isSocialCrawler = SOCIAL_CRAWLER_RE.test(ua);

  // Navigateurs + moteurs de recherche → SPA normale
  if (!isSocialCrawler) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host  = req.headers['x-forwarded-host'] || req.headers.host;
    const indexRes = await fetch(`${proto}://${host}/index.html`);
    const html = await indexRes.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(html);
  }

  // Crawlers sociaux → récupérer l'annonce et servir les meta tags
  let listing = null;
  if (supabaseUrl && supabaseKey && param) {
    try {
      const isUUID = UUID_RE.test(param);
      const filter = isUUID
        ? `id=eq.${encodeURIComponent(param)}`
        : `listing_slug=eq.${encodeURIComponent(param)}`;

      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/listings?${filter}&select=id,title,description,price,currency,images,location,listing_slug,status&limit=1`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const data = await dbRes.json();
      listing = Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (_) {}
  }

  const slug        = listing?.listing_slug || param || '';
  const canonicalUrl = `${SITE_URL}/listings/${slug}`;

  const rawTitle    = listing?.title || 'Annonce sur Zando+ Congo';
  const pageTitle   = `${rawTitle} — Zando+ Congo`;

  const price       = listing?.price
    ? `${Number(listing.price).toLocaleString('fr-FR')} ${listing.currency || 'FCFA'}`
    : null;

  const description = listing?.description
    ? listing.description.slice(0, 155)
    : price
    ? `${rawTitle} à ${price} sur Zando+, la marketplace du Congo.`
    : 'Découvrez cette annonce sur Zando+, la marketplace du Congo Brazzaville.';

  // images peut être un tableau JSON ou une chaîne JSON sérialisée
  let images = [];
  try {
    images = Array.isArray(listing?.images)
      ? listing.images
      : JSON.parse(listing?.images || '[]');
  } catch (_) {}
  const ogImage = images[0] || FALLBACK_IMAGE;

  const locationLine = listing?.location ? ` · ${listing.location}` : '';
  const priceLine    = price ? ` · ${price}` : '';
  const fullDesc     = `${description}${priceLine}${locationLine}`;

  const esc = (s) =>
    String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${esc(pageTitle)}</title>
  <meta name="description" content="${esc(fullDesc)}" />
  <link rel="canonical" href="${esc(canonicalUrl)}" />

  <!-- Open Graph -->
  <meta property="og:type"         content="product" />
  <meta property="og:url"          content="${esc(canonicalUrl)}" />
  <meta property="og:title"        content="${esc(rawTitle)}" />
  <meta property="og:description"  content="${esc(fullDesc)}" />
  <meta property="og:image"        content="${esc(ogImage)}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name"    content="Zando+ Congo" />
  <meta property="og:locale"       content="fr_CG" />
  ${price ? `<meta property="product:price:amount"   content="${esc(String(listing?.price || ''))}" />
  <meta property="product:price:currency" content="${esc(listing?.currency || 'XAF')}" />` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(rawTitle)}" />
  <meta name="twitter:description" content="${esc(fullDesc)}" />
  <meta name="twitter:image"       content="${esc(ogImage)}" />
</head>
<body>
  <h1>${esc(rawTitle)}</h1>
  ${price ? `<p><strong>${esc(price)}</strong></p>` : ''}
  <p>${esc(description)}</p>
  ${listing?.location ? `<p>${esc(listing.location)}</p>` : ''}
  <a href="${esc(canonicalUrl)}">Voir l'annonce sur Zando+</a>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.send(html);
}
