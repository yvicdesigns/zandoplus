// Sert /.well-known/assetlinks.json (App Links Android).
// Deux empreintes SHA-256 :
//   - clé "Play App Signing" (Google re-signe l'app livrée) -> installs Play Store
//   - clé d'upload locale -> APK direct / tests internes
const ASSETLINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.zando.app',
      sha256_cert_fingerprints: [
        '0C:43:23:D2:7B:8E:A7:CB:B3:E3:3D:99:01:58:D4:65:3D:17:30:B0:2B:64:82:49:EC:0F:4E:06:7C:D2:DE:54',
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
