// Sert /.well-known/assetlinks.json (App Links Android).
// ⚠️ N'inclut pour l'instant que l'empreinte de la clé d'UPLOAD locale.
// Il FAUT ajouter l'empreinte SHA-256 de la clé "Play App Signing"
// (Play Console → App integrity → App signing) dans le tableau ci-dessous,
// sinon la vérification échoue pour les installs Play Store. Voir DEEP_LINKS.md.
const ASSETLINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.zando.app',
      sha256_cert_fingerprints: [
        '06:25:4E:C7:04:D5:AB:B3:E3:30:DE:A7:1A:54:51:01:B5:D3:5D:9F:02:A7:7B:26:52:C6:D7:4C:D1:CE:EB:33',
      ],
    },
  },
];

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(JSON.stringify(ASSETLINKS));
}
