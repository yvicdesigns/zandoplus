export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  // Extract seller ID from the rewritten path or query param
  const pathParts = req.url.split('?')[0].split('/').filter(Boolean);
  const id = pathParts[pathParts.length - 1] || req.query.id;

  const ua = req.headers['user-agent'] || '';
  const isCrawler = /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|applebot|bingbot|googlebot/i.test(ua);

  if (!isCrawler) {
    // Serve the SPA for normal browsers
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const indexRes = await fetch(`${proto}://${host}/index.html`);
    const html = await indexRes.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(html);
  }

  // Fetch seller from Supabase
  let seller = null;
  try {
    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=full_name,bio,avatar_url,banner_url,location`,
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

  const shopUrl = `https://www.zandopluscg.com/seller/${id}`;
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

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${shopUrl}" />
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image"       content="${image}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name"   content="Zando+ Congo" />
  <meta property="og:locale"      content="fr_CG" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image"       content="${image}" />

  <!-- Redirect browsers that somehow land here -->
  <meta http-equiv="refresh" content="0;url=${shopUrl}" />
</head>
<body>
  <p>Redirection vers <a href="${shopUrl}">${title}</a>…</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  return res.send(html);
}
