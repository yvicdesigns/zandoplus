const CRAWLERS = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Googlebot/i;

export const config = {
  matcher: '/listings/:id+',
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';

  if (!CRAWLERS.test(ua)) return;

  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const id = parts[parts.length - 1];

  if (!id) return;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/listings?id=eq.${encodeURIComponent(id)}&select=title,description,images&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const [listing] = await res.json();
    if (!listing) return;

    const title = escapeHtml(listing.title || 'Annonce - Zando+');
    const description = escapeHtml(
      String(listing.description || '')
        .replace(/<[^>]+>/g, '')
        .substring(0, 160)
    );
    const image = escapeHtml(
      Array.isArray(listing.images) && listing.images[0]
        ? listing.images[0]
        : `${url.origin}/og-image.jpg`
    );
    const pageUrl = escapeHtml(request.url);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${title} - Zando+</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Zando+">
  <meta property="og:title" content="${title} - Zando+">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${pageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} - Zando+">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
</head>
<body></body>
</html>`;

    return new Response(html, {
      headers: { 'content-type': 'text/html;charset=utf-8' },
    });
  } catch {
    return;
  }
}
