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

## ⚠️ Étape restante : empreinte de la clé de signature Google Play

`public/.well-known/assetlinks.json` ne contient pour l'instant que
l'empreinte de la **clé d'upload** locale
(`06:25:4E:...:33`). Or Google Play re-signe l'app avec **sa propre clé**
(Play App Signing). Android vérifie les App Links contre **cette** clé.

➡️ Récupérer dans **Play Console → (app) → Test and release → App integrity
→ App signing → "SHA-256 certificate fingerprint"** (section *App signing
key certificate*, pas *Upload key certificate*), et l'AJOUTER dans le
tableau `sha256_cert_fingerprints` (garder aussi celle d'upload pour les
tests par APK direct).

Tant que ce n'est pas fait, les App Links ne se vérifieront pas sur les
installs Play Store (le lien ouvrira le site, comme avant — aucune
régression).

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
