// Sert /.well-known/apple-app-site-association (Universal Links iOS).
// Passe par une fonction serverless car Vercel ne sert pas de façon fiable
// les fichiers d'un dossier commençant par un point derrière le rewrite SPA
// (même approche que api/sitemap.js).
const AASA = {
  applinks: {
    apps: [],
    details: [
      {
        appID: 'LJ73XSDBTK.com.zandoplus.app',
        appIDs: ['LJ73XSDBTK.com.zandoplus.app'],
        paths: ['NOT /api/*', '*'],
        components: [
          { '/': '/api/*', exclude: true },
          { '/': '*' },
        ],
      },
    ],
  },
  webcredentials: {
    apps: ['LJ73XSDBTK.com.zandoplus.app'],
  },
};

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(JSON.stringify(AASA));
}
