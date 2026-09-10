# Deep links (Universal Links iOS / App Links Android)

Objectif : qu'un lien `https://www.zandopluscg.com/...` (WhatsApp, email, SMS,
navigateur) ouvre **l'app** si elle est installée, et le **site** sinon.

## Ce qui est déjà en place (branche `redesign`)

| Élément | Fichier |
|---|---|
| AASA iOS (servie en JSON) | `api/aasa.js` — rewrite `/.well-known/apple-app-site-association` |
| assetlinks Android (servie en JSON) | `api/assetlinks.js` — rewrite `/.well-known/assetlinks.json` |
| Routage dans l'app | `src/hooks/useDeepLinks.js` (monté dans `App.jsx`) |
| Entitlement iOS | `ios/App/App/App.entitlements` (`applinks:...`) |
| Intent-filter Android | `android/app/src/main/AndroidManifest.xml` (MainActivity, `autoVerify`) |

> Les 2 fichiers `.well-known` sont servis par des **fonctions serverless**
> (comme `api/sitemap.js`) : Vercel ne sert pas de façon fiable un dossier
> commençant par un point derrière le rewrite SPA. Le contenu à éditer est
> donc dans `api/aasa.js` et `api/assetlinks.js`.

Identifiants : Team ID `LJ73XSDBTK`, bundle iOS `com.zandoplus.app`,
package Android `com.zando.app`.

## Empreintes SHA-256 (récupérées le 10/09/2026)

`api/assetlinks.js` contient les 2 :
- **Play App Signing** (clé Google, installs Play Store) :
  `0C:43:23:D2:7B:8E:A7:CB:B3:E3:3D:99:01:58:D4:65:3D:17:30:B0:2B:64:82:49:EC:0F:4E:06:7C:D2:DE:54`
- **Clé d'upload** (APK direct / tests) :
  `06:25:4E:C7:04:D5:AB:B3:E3:30:DE:A7:1A:54:51:01:B5:D3:5D:9F:02:A7:7B:26:52:C6:D7:4C:D1:CE:EB:33`

Source : Play Console → Protected with Play → App signing (`/keymanagement`),
bloc "Digital Asset Links JSON".

## Activation

Ces changements ne prennent effet qu'avec un **nouveau build natif** :
- iOS : rebuild + soumission App Store (l'entitlement `associated-domains`
  déclenche le téléchargement de l'AASA par iOS à l'install).
- Android : rebuild + soumission Play Store (le `autoVerify` déclenche la
  vérification de `assetlinks.json`).

Après publication : tester un lien `https://www.zandopluscg.com/listings`
depuis Notes/SMS (pas WhatsApp iOS, qui ouvre souvent son navigateur
interne).

## Vérif rapide des fichiers web (déployés)

```
curl -s https://www.zandopluscg.com/.well-known/apple-app-site-association | jq .
curl -s https://www.zandopluscg.com/.well-known/assetlinks.json | jq .
```
Doivent renvoyer du JSON avec `Content-Type: application/json`, sans redirection.
