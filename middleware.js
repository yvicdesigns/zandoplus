// Vercel Edge Middleware — serves OG meta tags for social bots (Facebook, Twitter, etc.)
// Bots don't execute JS, so react-helmet tags are invisible to them.
// This middleware intercepts bot requests and returns static HTML with correct OG tags.

const BOT_AGENTS = /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|googlebot|bingbot|applebot/i;

export const config = {
  matcher: ['/listings/:path*'],
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';

  if (!BOT_AGENTS.test(ua)) {
    return; // Not a bot — pass through normally
  }

  const url = new URL(request.url);
  const parts = url.pathname.split('/listings/');
  const listingId = parts[1]?.split('/')[0];

  if (!listingId) return;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/listings?id=eq.${listingId}&select=title,description,images,price,currency,location&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const data = await res.json();
    const listing = Array.isArray(data) ? data[0] : null;

    if (!listing) return;

    const title = escapeHtml(`${listing.title} - Zando+`);
    const rawDesc = (listing.description || '').replace(/<[^>]*>/g, '').substring(0, 200);
    const priceStr = listing.price
      ? ` — ${Number(listing.price).toLocaleString('fr-FR')} ${listing.currency || 'FCFA'}`
      : '';
    const description = escapeHtml(rawDesc + priceStr);
    const image = escapeHtml(
      listing.images?.[0] || 'https://www.zandopluscg.com/og-image.jpg'
    );
    const pageUrl = escapeHtml(`https://www.zandopluscg.com/listings/${listingId}`);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Zando+">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
</head>
<body>
  <script>window.location.replace("${pageUrl}")</script>
</body>
</html>`;

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    return; // On error, let the normal request through
  }
}
