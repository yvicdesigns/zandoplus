# AUDIT TECHNIQUE DE ZANDO+ — photographie factuelle du repository

*Réalisé le 27/09/2026, en lecture seule. Aucun fichier n'a été modifié pendant cet audit. Chaque affirmation cite le fichier ou la table qui la démontre ; quand ce n'est pas vérifiable dans le dépôt, c'est marqué « non déterminé ».*

## 1. Architecture générale

- **Technologies** : React 18 + Vite (`package.json`, `vite.config.js`), pas de framework SSR (pas de Next.js). Application mobile via **Capacitor 8** (`capacitor.config.ts`, dossiers `ios/` et `android/`), même code source web/mobile (pas de code React Native séparé).
- **Applications présentes** :
  - Web + admin dans le même bundle React (`src/pages/AdminDashboard.jsx` et ses onglets), routées par rôle (`profiles.role`).
  - App mobile iOS/Android : le même build web, embarqué dans une WebView Capacitor.
  - Backend : pas de serveur applicatif dédié. **Supabase** (Postgres + Auth + Storage + Edge Functions Deno) fait office de backend complet, plus quelques fonctions serverless **Vercel** (`api/*.js`, Node) pour du rendu spécifique (OG tags, sitemap, deep links).
- **Organisation du repo** : monorepo simple, pas de workspaces/lerna/turborepo. `src/` (app web), `android/` et `ios/` (projets natifs générés par Capacitor), `supabase/functions/` (Edge Functions), `api/` (fonctions Vercel), et environ 35 fichiers `supabase_migration_*.sql` à la racine (migrations appliquées manuellement via `psql`, pas de dossier `supabase/migrations` versionné par la CLI Supabase — non déterminé si `supabase db push` est utilisé).
- **Environnements et déploiement** : Vercel pour le web (`vercel.json`, dossier `.vercel/`), déploiement manuel de branche `redesign` = production (pas de CI/CD automatisé trouvé, aucun dossier `.github/workflows`). Builds natifs iOS/Android faits en local via `xcodebuild`/`./gradlew`, publiés manuellement sur App Store Connect / Play Console.
- **Hébergement** : Vercel (frontend), Supabase (projet `axlpfskrrlwibcnxkfvb`, région `eu-central-1`) pour DB/Auth/Storage/Edge Functions.
- **Services externes** : Firebase (push notifications, `firebase`, `@capacitor-firebase/messaging`), Sentry (`@sentry/react`, `@sentry/capacitor`), Anthropic/Claude API (modération IA, chatbot — voir §8), MTN/Airtel Mobile Money (paiement), Resend (e-mail, déduit des noms de fichiers `RESEND_EMAIL_TROUBLESHOOTING.md`, `sync-contacts-resend`), Google/Meta/TikTok pixels (`src/components/analytics/`).

## 2. Frontend Web

- **Framework** : React 18.2 + React Router 6 (`react-router-dom`), pas de meta-framework.
- **Routes** : toutes déclarées dans `src/App.jsx` (56 `<Route>`), fichiers correspondants dans `src/pages/` (63 fichiers).
- **Composants principaux** : `src/components/` organisé par domaine (`listings/`, `listing/`, `admin/`, `home/`, `post-ad/`, `profile/`, `help/`, `analytics/`, `ui/` — ce dernier étant des primitives shadcn/Radix).
- **Gestion de l'état** : **React Context uniquement**, pas de Redux/Zustand/Recoil dans les dépendances. Contexts principaux : `AuthContext.jsx`, `ListingsContext.jsx`, `MessagesDrawerContext.jsx`, `NotificationsContext.jsx`, `PaymentContext.jsx`, `SiteSettingsContext.jsx`, `SupabaseAuthContext.jsx`.
- **Authentification** : Supabase Auth (e-mail/mot de passe + OAuth Google/Apple). Sur mobile natif, connexion Google/Apple via SDK natif (`@capawesome/capacitor-google-sign-in`, `@capawesome/capacitor-apple-sign-in`) → `supabase.auth.signInWithIdToken()` (web/PWA gardent le flux OAuth classique par redirection).
- **Page d'accueil** : `src/pages/HomePage.jsx`, composée de sections dans `src/components/home/` (hero, catégories populaires, annonces urgentes/boostées, offres du jour, boutiques suivies, etc.).
- **Fiches produit** : `src/pages/ListingDetailPage.jsx` — galerie photo, description, badges (urgent/boosté/populaire), bouton Achat Sécurisé ou Envoyer un message, incrément de vue via `supabase.rpc('increment_listing_view', ...)`.
- **Panier** : `src/pages/CartPage.jsx` + `CartCheckoutPage.jsx`, contexte `PaymentContext.jsx`, table `cart_payments`.
- **Recherche** : `src/pages/ListingsPage.jsx`, filtres (catégorie, prix, localisation), tri incluant `views_count` (popularité).
- **Favoris** : table `favorites` (`user_id`, `listing_id`), colonne dénormalisée `listings.favorites_count`.
- **Profils vendeurs/boutiques** : `src/pages/SellerShopPage.jsx` (vitrine publique), `SellerDashboardPage.jsx` (gestion vendeur), `shop_follows` (abonnement à une boutique, déjà en place — pertinent pour la fonctionnalité envisagée).

## 3. Application mobile

- **Technologie** : Capacitor 8 (pas de React Native). Le code React du web tourne tel quel dans une WebView native.
- **Architecture/navigation** : identique au web (React Router), pas de navigation native séparée.
- **Relation avec le backend** : identique au web, mêmes appels `@supabase/supabase-js` côté client — aucune API intermédiaire propre au mobile.
- **Différences avec le site web** : quelques branches de code conditionnées par `Capacitor.isNativePlatform()` / `Capacitor.getPlatform()` (ex. connexion Google/Apple, gestion des marges système Android — `src/index.css`, `android/app/.../MainActivity.java`).
- **Publication** : manuelle, versionnage dans `android/app/build.gradle` (`versionCode`/`versionName`) et `ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION`/`CURRENT_PROJECT_VERSION`), build local puis upload App Store Connect / Play Console. Pas de fastlane ni de CI trouvée.

## 4. Backend / API

- **Technologie** : Supabase (Postgres + PostgREST auto-généré pour les tables, RPC en PL/pgSQL pour toute logique métier sensible) + **Edge Functions Deno** pour ce qui touche des secrets serveur ou des appels tiers.
- **Modules (Edge Functions)**, dossier `supabase/functions/` : `ai-chatbot`, `ai-listing-helper`, `ai-moderation`, `ai-price-estimator`, `get-digital-download-url`, `momo-auto-payout`, `momo-collection-status-poll`, `momo-collection-webhook`, `momo-initiate-collection`, `momo-payout-webhook`, `notify-admin-payment`, `notify-delivery-reminder`, `notify-new-message`, `notify-purchase`, `notify-withdrawal-request`, `process-campaign-queue`, `queue-reengagement`, `send-campaign`, `send-contact-email`, `send-push-notification`, `send-tester-activation-email`, `send-welcome-email`, `send-welcome-whatsapp`, `send-whatsapp-campaign`, `submit-payment-proof`, `sync-contacts-resend`.
- **API Vercel** (`api/*.js`, Node serverless, pas Supabase) : `aasa.js`/`assetlinks.js` (deep links iOS/Android), `listing-og.js`/`seller-og.js` (balises Open Graph dynamiques pour le partage social), `sitemap.js`.
- **Authentification/autorisations** : RLS (Row Level Security) Postgres sur toutes les tables sensibles + vérification de rôle dans les fonctions RPC (`profiles.role in ('admin', ...)`). Les Edge Functions utilisent le `service_role` pour les opérations qui doivent contourner RLS (ex. modération, paiement).
- **Utilisateurs** : table `profiles` (id = `auth.users.id`), rôles observés : `viewer`, `admin`, `monetisation` (d'autres rôles comme `gestion`/`editor` référencés côté code mais non trouvés en usage actuel dans les données — non déterminé s'ils sont encore utilisés).
- **Vendeurs/boutiques** : pas de table séparée — un vendeur est un `profiles` avec `is_seller=true`, `shop_slug`, `is_business`/`is_boutique` (paliers), `entreprise_banner_url`.
- **Annonces/produits** : table `listings` (58 colonnes — voir §5).
- **Commandes** : table `transactions_escrow` (Achat Sécurisé) + `cart_payments` (paiement panier) + `deliveries`.
- **Paiements** : Mobile Money manuel (upload de preuve + vérification IA, `submit-payment-proof`) et infrastructure de paiement automatique MTN/Airtel présente mais **désactivée par défaut** (`VITE_MOMO_AUTOPAY_ENABLED=false` dans `.env.example`, fonctions `momo-*` existent).
- **Portefeuille** : table `wallet_withdrawals`, page `src/pages/WalletPage.jsx`.
- **Notifications** : table `notifications` (in-app) + `send-push-notification` (Firebase push) + `push_tokens`.
- **Médias/images** : voir §6.
- **Recherche** : côté client, filtrage sur les colonnes de `listings` via PostgREST (pas de moteur de recherche dédié type Algolia/Elasticsearch trouvé).

## 5. Base de données

- **SGBD** : PostgreSQL (Supabase managé).
- **ORM** : aucun. Client `@supabase/supabase-js` (requêtes PostgREST) + appels RPC directs pour la logique métier. Pas de Prisma/Drizzle/TypeORM.
- **52 tables** au total dans le schéma `public`. Les plus pertinentes pour le projet social commerce :

**`listings`** (58 colonnes) — champs clés : `id`, `user_id`, `title`, `description`, `price`, `currency`, `category`/`subcategory`/`category_id`, `images` (array de texte, URLs), `status`, `views_count`, `favorites_count`, `is_boosted`, `is_urgent`, `is_daily_offer`, `moderation_flags`/`moderation_reason`/`moderation_risk`, `is_digital` + `digital_file_*` (produits numériques), `preview_video_url` (texte simple, **pas de stockage vidéo natif** — un vendeur peut juste coller un lien externe), `listing_purpose`, `delivery_*` (plusieurs modes de livraison).

**`profiles`** (31 colonnes) — `id`, `full_name`, `avatar_url`, `is_seller`, `is_business`/`is_boutique` (paliers vendeur), `role`, `shop_slug`, `verified`.

**`transactions_escrow`** (34 colonnes) — la commande/paiement protégé : `annonce_id`, `acheteur_id`, `vendeur_id`, `montant`, `statut`, `commission_amount`, `preuve_paiement_url`, `ai_proof_verdict`.

**`ad_boosts`** — `annonce_id`, `user_id`, `montant`, `statut`, `boost_type`, `days`, `date_debut`/`date_fin`.

**`favorites`** (id, user_id, listing_id) et **`shop_follows`** (id, follower_id, seller_id) — mécanique d'abonnement à une boutique **déjà existante**, directement réutilisable pour "s'abonner à un créateur".

**`messages`**/**`conversations`** — chat par annonce entre acheteur/vendeur.

**`reviews`** — avis liés à `listing_id` + `seller_id`.

Relations : pas de clés étrangères formelles observées entre `listings.user_id` et `profiles.id` dans le nommage (à confirmer par `\d+ listings` — non fait ici, RLS suggère une relation logique via `auth.uid()`), mais le code applicatif les traite comme liées 1-N partout.

## 6. Gestion des médias

- **Stockage actuel** : Supabase Storage, 8 buckets : `listing_images` (public, 5 Mo max, jpeg/png/webp/gif), `profile_assets`, `site_assets`, `ad_banners` (public), `payment_proofs`/`verification_documents`/`digital-products` (privés), `downloads` (public).
- **Processus d'upload** : `src/lib/imageUtils.js` — compression + redimensionnement **côté client** (`browser-image-compression`), recadrage max **1280px**, ré-encodage WebP qualité **0.75**, filigrane dessiné sur canvas avant upload. Choix récent (15/09/2026), documenté en commentaire dans le fichier, pour réduire le poids moyen des photos.
- **CDN** : celui de Supabase Storage (pas de CDN tiers type Cloudinary/Cloudflare Images identifié).
- **Vidéo** : **aucune infrastructure actuelle**. `preview_video_url` est un simple champ texte où le vendeur colle un lien externe (YouTube/autre, non déterminé le comportement exact au rendu). **Il n'y a ni bucket vidéo, ni transcodage, ni streaming adaptatif.** Ajouter de la vidéo hébergée nativement (upload utilisateur, pas juste un lien) demanderait une infrastructure spécifique : stockage vidéo + transcodage (les buckets Supabase actuels ont une limite de 5 Mo et aucun mécanisme de transcodage), très probablement un service tiers (Mux, Cloudflare Stream, ou équivalent) plutôt que Supabase Storage brut.

## 7. Fonctionnalités promotionnelles existantes

- **Annonces boostées** : `ad_boosts` + `listings.is_boosted`. Deux types (`boost_type`) : Boost Simple (150 FCFA/jour) et Boost Urgent (300 FCFA/jour, → `listings.is_urgent=true`), durée en jours (`days`, 1 à 365). Paiement manuel (upload preuve) + validation admin (`src/components/admin/AdminBoostsTab.jsx`), activation sous 24h.
- **Annonces urgentes** : `listings.is_urgent`, affichage prioritaire + popup dédié (`src/components/home/UrgentPopup.jsx`).
- **Offres du jour** : `listings.is_daily_offer`, activable côté admin (`set_daily_offer_status_as_admin`).
- **Mise en avant "Entreprise"** : palier vendeur payant (`profiles.is_business`), bannière sur l'accueil (`entreprise_banner_url`), 1 boost de 7 jours inclus par mois.
- **Classement** : tri par `views_count` (popularité), badges automatiques (`> 100 vues` = "populaire", seuil d'affichage des compteurs à 15 vues côté carte).
- **Publicité display** : tables `advertisements` et `homepage_ads`, onglets admin dédiés (`Publicités`, `Publicités Homepage`).

## 8. Analytics et tracking

- **Vues** : `listings.views_count`, incrémenté côté serveur via RPC `increment_listing_view` à l'ouverture de la fiche produit (pas de dédoublonnage par utilisateur identifié dans le code lu — non déterminé si un même visiteur peut faire monter le compteur plusieurs fois).
- **Visites du site** : `site_visits` + RPC `increment_site_visit` (`src/hooks/useVisitor.js`).
- **Outils tiers** : Google Analytics (`GoogleAnalytics.jsx`), Meta Pixel (`MetaPixel.jsx`), TikTok Pixel (`TikTokPixel.jsx`) — événements de conversion (Purchase, InitiateCheckout, CompletePayment) déclenchés à plusieurs endroits (boost, paiement panier).
- **Statistiques vendeur** : nombre de vues par annonce visible dans `SellerListingsInline.jsx`. Pas de tableau de bord analytics vendeur dédié plus poussé identifié (clics, taux de conversion par annonce — non déterminé/probablement absent).
- **IA** : modération de contenu (`ai-moderation`, Claude vision, détecte aussi les incohérences prix/photo), chatbot d'aide (`ai-chatbot`), estimation de prix (`ai-price-estimator`) — montre que l'intégration d'un LLM dans le pipeline de publication est un pattern déjà établi et éprouvé dans ce projet.

## 9. Sécurité et modération

- **Signalement** : table `reports` (listing_id, reporter_id, reason, status), bouton "Signaler cette annonce" côté utilisateur, onglet admin `Signalements`.
- **Validation des annonces** : statuts `pending_review`/`needs_changes`/`active` sur `listings`, modération IA automatique à la publication (`ai-moderation`, contenu illicite + désormais cohérence prix/photo) + validation manuelle admin (`AdminListingsTab.jsx`, RPC `admin_approve_listing`/`admin_request_changes`).
- **Rôles admin** : `role` sur `profiles` (`admin`, `monetisation`, et `viewer` par défaut ; le code référence aussi `editor`/`gestion` dans certaines vérifications de permission, présence effective en base non confirmée).
- **Blocage/suspension** : géré au niveau de l'annonce (statuts ci-dessus) plutôt qu'au niveau compte utilisateur — pas de colonne `banned`/`suspended` trouvée sur `profiles` (non déterminé s'il existe un mécanisme de bannissement de compte).
- **Modération de contenu** : voir §8 (IA) + `change_requests`, `audit_logs`/`system_logs` pour la traçabilité des actions admin.

## 10. Administration / back-office

Un seul tableau de bord (`src/pages/AdminDashboard.jsx`), organisé en 3 groupes d'onglets :
- **Gestion** : Utilisateurs, Annonces, Livraisons, Catégories, Signalements, Vérifications.
- **Monétisation** : Transactions (escrow), Paiements, Retraits, Publicités, Boosts.
- **Configuration** : Paramètres, Approbations, Logs d'activité, Config Livraison, Gestion du site, Slides Hero, Cartes Accueil, Bannières & Hero, Publicités Homepage, Campagnes Email, WhatsApp, Test E-mail, QA & Tests, Testeurs Beta.

C'est un back-office déjà large et modulaire par onglet — une future section "Publications" ou "Modération vidéo" s'insérerait naturellement dans ce même pattern.

## 11. Contraintes techniques identifiées

- **Vidéo** : contrainte la plus lourde. Aucune brique de stockage/transcodage vidéo actuelle ; les buckets Supabase (5 Mo/fichier) sont inadaptés à de la vidéo en l'état. Nécessitera un service dédié.
- **Vues/likes/commentaires à fort volume** : `views_count` est aujourd'hui une simple colonne entière incrémentée par RPC — fonctionne pour des annonces, mais un flux social avec beaucoup de vues (comme du contenu vidéo consulté en boucle) demanderait de réfléchir à un système de comptage plus tolérant à la charge (ex. agrégation asynchrone plutôt qu'UPDATE synchrone par vue) pour ne pas cogner la base au moment où le trafic monterait.
- **Notifications** : le système actuel (table `notifications` + push Firebase) fonctionne pour des événements ponctuels (message, paiement, avertissement) ; un flux social (likes, commentaires, nouveaux abonnés) générerait un volume d'écritures et de push bien plus élevé — à dimensionner.
- **Modération** : le pipeline IA existant (Claude vision) est pensé pour des photos d'annonces, pas pour de la vidéo ni pour un flux de commentaires en continu — extension nécessaire, pas un simple branchement.
- **Recherche/flux** : pas de moteur de flux/recommandation existant ; un "fil" social (type For You) demanderait une brique de tri/recommandation qui n'existe pas aujourd'hui (le tri actuel est un simple ORDER BY sur des colonnes).
- **État applicatif** : React Context pur, sans lib de cache de requêtes (pas de React Query/SWR identifié dans les dépendances) — un flux avec pagination infinie/mise à jour en temps réel (likes qui montent en direct) sera plus simple à construire proprement avec une lib de ce type plutôt qu'en Context brut.

## 12. Schéma d'architecture (texte)

```
Web (React/Vite) ─┐
                   ├─→ Supabase JS Client ─→ PostgREST (tables + RLS) ─┐
App mobile         │                                                    │
(Capacitor, même   ├─→ Supabase Auth (email + Google/Apple natif)      ├─→ PostgreSQL (52 tables)
code React) ───────┤                                                    │
                   ├─→ Supabase Edge Functions (Deno) ──→ Claude API   ─┘
                   │                                  ─→ MTN/Airtel MoMo API
                   │                                  ─→ Firebase (push)
                   │                                  ─→ Resend (email)
                   │
                   ├─→ Supabase Storage (8 buckets images) ─→ CDN Supabase
                   │
                   └─→ Vercel Edge Functions (api/*.js) ─→ OG tags / sitemap / deep links

Déploiement : Vercel (web, branche `redesign`) · App Store Connect / Play Console (natif, manuel)
```

## 13. Fichiers concernés par une future fonctionnalité de social commerce

- **Données** : nouveau fichier `supabase_migration_*.sql` (suivre le pattern existant), probablement une table `posts` (ou `publications`) + une table de jonction `post_products` (many-to-many vers `listings`) plutôt que de surcharger `listings`.
- **Contexte** : nouveau `src/contexts/PostsContext.jsx` (ou extension de `ListingsContext.jsx`), suivant le pattern des contexts existants.
- **Pages** : nouvelle route dans `src/App.jsx`, nouvelle page type `src/pages/FeedPage.jsx`, en s'inspirant de `ListingsPage.jsx` (pagination) et `ListingDetailPage.jsx` (affichage détaillé + achat).
- **Composants** : `src/components/listing/ImageGallery.jsx` et `src/components/ui/carousel.jsx` (Embla, déjà utilisé) sont réutilisables pour un carrousel photo ; rien d'équivalent pour la vidéo.
- **Réutilisable directement** : `favorites`/`shop_follows` (mécanique like/abonnement déjà là), `ai-moderation` (pattern de modération IA à étendre), `notifications` (à étendre), `ad_boosts` (pattern de boost payant à dupliquer pour "publication boostée"), `ShareMenu.jsx` (partage déjà générique).
- **Admin** : nouvel onglet dans `src/pages/AdminDashboard.jsx`, sur le modèle de `AdminListingsTab.jsx` ou `AdminBoostsTab.jsx`.

## 14. État du repository

- **Branche actuelle** : `hero-builder-v2` (dépôt local). **Branche de production** : `redesign` (confirmé en mémoire projet, jamais `main`). `main` existe mais n'est pas la prod.
- **Branches importantes** : `main`, `redesign` (prod), `hero-builder-v2` (travail en cours), `fix/mobile-store-prep`.
- **Tests** : oui, réels. Playwright (`tests/*.spec.js`, captures dans `tests/screenshots/`) + **Maestro** pour du end-to-end mobile natif (`.maestro/*.yaml` : navigation, recherche, favoris, publication d'annonce, checkout, profil/déconnexion). Existence confirmée, couverture réelle non mesurée.
- **CI/CD** : aucune trouvée (pas de `.github/workflows`, pas de `vercel` build hooks spécifiques au-delà du déploiement Git standard). Déploiement manuel documenté par la pratique de ce projet (commit → cherry-pick vers `redesign` → push).
- **Migrations DB** : pas de dossier `supabase/migrations` versionné par la CLI Supabase — ce sont des fichiers `.sql` autonomes à la racine, appliqués manuellement via `psql`. Pas de table de suivi de migrations identifiée (non déterminé si Supabase CLI est utilisée en parallèle).
- **Variables d'environnement nécessaires** : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GA_MEASUREMENT_ID` (optionnel), `VITE_MOMO_AUTOPAY_ENABLED` (optionnel, désactivé par défaut) côté client (`.env.example`) ; secrets serveur (clés Anthropic, Firebase, Resend, MTN/Airtel, Sentry) définis côté Supabase Edge Functions et Vercel, non présents dans ce fichier par conception.
- **Environnements dev/staging/production** : un seul environnement Supabase identifié (pas de projet Supabase "staging" séparé trouvé) — le développement se fait en pointant directement la base de production, avec des branches Git pour isoler le code avant fusion. **Non déterminé** s'il existe un second projet Supabase pour du staging.

---

## A. Ce qui peut être réutilisé tel quel
- `favorites` et surtout `shop_follows` (abonnement à un vendeur/créateur, exactement le besoin "follow").
- Le pattern de boost payant (`ad_boosts`, upload preuve + validation admin) pour un futur "boost de publication".
- Le pipeline de modération IA (`ai-moderation`) comme modèle à dupliquer.
- Le système de notifications (table + push Firebase) comme squelette.
- `ShareMenu.jsx`, `embla-carousel` (carrousel), l'upload/compression d'images (`imageUtils.js`).
- Le pattern d'association many-to-many implicite : `listings` liées à des commandes/favoris/avis donne un modèle clair pour lier une publication à plusieurs annonces.

## B. Ce qui devrait être étendu
- `notifications` (volume et types d'événements sociaux).
- Le comptage de vues (`increment_listing_view`) vers un mécanisme plus tolérant à la charge si le volume grimpe fortement avec de la vidéo.
- La modération IA, pour couvrir vidéo et commentaires, pas seulement photo/texte d'annonce.
- Le back-office admin, un nouvel onglet "Publications".

## C. Ce qui devrait probablement être créé
- Stockage et diffusion vidéo (service tiers, aucune brique existante).
- Table(s) `posts` + `post_products` (jonction many-to-many vers `listings`).
- Système de likes/commentaires (tables dédiées, RLS, compteurs).
- Un flux/algorithme de tri des publications (rien d'équivalent à un "feed" n'existe aujourd'hui).
- Éventuellement une lib de cache de requêtes (React Query ou équivalent) si le flux doit supporter pagination infinie + mises à jour en temps réel.

## D. Risques techniques identifiés
- **Vidéo = le vrai chantier**, pas une extension mineure : coût d'infrastructure (stockage + bande passante + éventuel transcodage), à chiffrer avant de s'engager.
- **Charge base de données** si les interactions sociales (vues, likes) sont écrites en direct sur Postgres sans agrégation, ça peut ralentir la marketplace existante qui tourne sur la même base.
- **Un seul environnement Supabase** identifié : développer une fonctionnalité aussi structurante directement contre la production (même isolée par une branche Git et des feature flags) est plus risqué que sur un vrai staging séparé — à vérifier/mettre en place avant de commencer.
- **Pas de CI/CD** : sans tests automatisés qui tournent à chaque changement, une fonctionnalité aussi large augmente le risque de régression silencieuse sur la marketplace en production.

## E. Questions auxquelles le repository seul ne permet pas de répondre
- Existe-t-il un second projet Supabase (staging) séparé de la production ? Non déterminé.
- Le rôle `role` sur `profiles` a-t-il d'autres valeurs en usage réel (`editor`, `gestion`) au-delà de `viewer`/`admin`/`monetisation` observées ? Non déterminé sans requête plus large sur les données.
- Y a-t-il un budget/contrainte déjà fixé pour un service vidéo tiers (Mux, Cloudflare Stream, etc.) ? Non déterminé, c'est une décision produit, pas technique.
- Le compteur `views_count` actuel déduplique-t-il par visiteur, ou compte-t-il chaque chargement de page ? Le code RPC lui-même n'a pas été inspecté ligne à ligne (juste son point d'appel) — à vérifier avant de s'appuyer dessus pour un flux social à fort trafic.
