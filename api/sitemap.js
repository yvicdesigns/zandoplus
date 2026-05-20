export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  const staticPages = [
    { loc: 'https://www.zandopluscg.com/', changefreq: 'daily', priority: '1.0' },
    { loc: 'https://www.zandopluscg.com/listings', changefreq: 'hourly', priority: '0.9' },
    { loc: 'https://www.zandopluscg.com/listings?category=electronics', changefreq: 'daily', priority: '0.8' },
    { loc: 'https://www.zandopluscg.com/listings?category=vehicles', changefreq: 'daily', priority: '0.8' },
    { loc: 'https://www.zandopluscg.com/listings?category=real-estate', changefreq: 'daily', priority: '0.8' },
    { loc: 'https://www.zandopluscg.com/listings?category=fashion', changefreq: 'daily', priority: '0.8' },
    { loc: 'https://www.zandopluscg.com/listings?category=jobs', changefreq: 'daily', priority: '0.8' },
    { loc: 'https://www.zandopluscg.com/listings?category=services', changefreq: 'daily', priority: '0.8' },
    { loc: 'https://www.zandopluscg.com/listings?category=agro-alimentaire', changefreq: 'daily', priority: '0.7' },
    { loc: 'https://www.zandopluscg.com/listings?category=traditional-medicine', changefreq: 'daily', priority: '0.7' },
    { loc: 'https://www.zandopluscg.com/about', changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://www.zandopluscg.com/contact', changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://www.zandopluscg.com/help', changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://www.zandopluscg.com/privacy', changefreq: 'yearly', priority: '0.3' },
    { loc: 'https://www.zandopluscg.com/terms', changefreq: 'yearly', priority: '0.3' },
  ];

  let listingUrls = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/listings?statut=eq.active&select=id,updated_at&order=created_at.desc&limit=1000`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      const listings = await response.json();
      if (Array.isArray(listings)) {
        listingUrls = listings.map((l) => ({
          loc: `https://www.zandopluscg.com/listings/${l.id}`,
          lastmod: l.updated_at ? l.updated_at.split('T')[0] : undefined,
          changefreq: 'weekly',
          priority: '0.7',
        }));
      }
    } catch {
      // On error, proceed with static pages only
    }
  }

  const allUrls = [...staticPages, ...listingUrls];

  const urlEntries = allUrls
    .map((u) => {
      const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${u.loc}</loc>${lastmod}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
}
