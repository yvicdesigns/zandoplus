export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  const id = req.query.id;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const ua = req.headers['user-agent'] || '';

  // Only social/messaging crawlers need this server-rendered OG HTML.
  // Search engines (Googlebot, Bingbot, Applebot) execute JavaScript and can
  // read react-helmet meta tags from the SPA — sending them a thin HTML causes
  // "Crawled - currently not indexed" in Google Search Console.
  const isSocialCrawler = /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot/i.test(ua);

  if (!isSocialCrawler) {
    // Serve the SPA for browsers AND search engines (Google, Bing, Apple).
    // The SPA renders full seller content + react-helmet meta tags that Google reads.
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const indexRes = await fetch(`${proto}://${host}/index.html`);
    const html = await indexRes.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(html);
  }

  // Social crawlers: fetch seller data and return rich OG HTML
  let seller = null;
  try {
    const filter = isUUID
      ? `id=eq.${encodeURIComponent(id)}`
      : `shop_slug=eq.${encodeURIComponent(id)}`;
    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?${filter}&select=id,full_name,bio,avatar_url,banner_url,location,shop_slug`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const data = await dbRes.json();
    seller = Array.isArray(data) ? data[0] : null;
  } catch (_) {}

  const sellerSlug = seller?.shop_slug || id;
  const shopUrl = `https://www.zandopluscg.com/seller/${sellerSlug}`;
  const title = seller?.full_name
    ? `Boutique de ${seller.full_name} | Zando+ Congo`
    : 'Zando+ Congo - Achetez, Vendez, Simplement.';
  const description = seller?.bio
    ? seller.bio
    : seller?.full_name
    ? `Découvrez toutes les annonces de ${seller.full_name} sur Zando+, la marketplace du Congo.`
    : 'Découvrez des milliers d\'annonces sur Zando+ Congo.';
  const image =
    seller?.banner_url ||
    seller?.avatar_url ||
    'https://www.zandopluscg.com/og-image.jpg';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${shopUrl}" />

  <!-- Open Graph -->
  <meta property="og:type"         content="website" />
  <meta property="og:url"          content="${shopUrl}" />
  <meta property="og:title"        content="${title}" />
  <meta property="og:description"  content="${description}" />
  <meta property="og:image"        content="${image}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name"    content="Zando+ Congo" />
  <meta property="og:locale"       content="fr_CG" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image"       content="${image}" />
</head>
<body>
  <p><a href="${shopUrl}">${title}</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.send(html);
}
