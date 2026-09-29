# ZANDO+ SOCIAL COMMERCE — PHASE 0 : architecture et environnement de développement

*Préparé le 27/09/2026. Document de planification uniquement — aucun code écrit, aucune migration jouée, aucune branche créée, aucun service souscrit. Conformément à la demande : je m'arrête ici et j'attends validation avant d'implémenter quoi que ce soit.*

Chaque décision est étiquetée : **EXISTANT** (déjà vérifié dans Zando+), **RÉUTILISÉ** (brique existante conservée), **NOUVEAU** (à créer), **À VALIDER** (décision qui vous revient).

---

## 1. Vérification Git

**EXISTANT** (vérifié à l'instant) :
- `redesign` = production (zandopluscg.com), dernier commit `f5f23a5`.
- `hero-builder-v2` = **37 commits en avance** sur `redesign`, un gros chantier séparé non fusionné (le Hero Builder v2 + tout le travail de cette semaine sur les corrections Android/iOS, l'aide, etc.).
- `main` = **330 commits en retard** sur `redesign`. Ce n'est pas la production, ne sert à rien dans cette stratégie.

**À VALIDER / recommandation** : créer `feature/social-commerce` **à partir de `redesign`**, pas à partir de `hero-builder-v2`.

Raison : `hero-builder-v2` contient un chantier indépendant (l'éditeur Hero façon Canva) qui n'est pas encore prêt à fusionner. Si `feature/social-commerce` partait de `hero-builder-v2`, chaque fusion future devrait démêler les deux chantiers l'un de l'autre. En partant de `redesign`, la nouvelle branche a exactement la base réellement en production aujourd'hui, sans rien d'inachevé.

```
redesign (production, f5f23a5)
   └── feature/social-commerce   ← nouvelle branche, créée ici
```

`hero-builder-v2` continue son cycle de vie normal (commit → cherry-pick vers `redesign`) sans aucune interférence. Aucune fusion automatique ne sera faite : je créerai la branche et j'attendrai votre feu vert avant d'y toucher.

---

## 2. Staging Supabase

**EXISTANT** (vérifié) : **un seul projet Supabase** (`axlpfskrrlwibcnxkfvb`, région `eu-central-1`). Pas de second projet "staging" trouvé. Tout le développement de cette session s'est fait en pointant directement la base de production (confirmé par l'usage répété de `psql` sur ce projet pendant tout ce chantier).

**À VALIDER** : c'est la décision la plus importante de cette Phase 0, et je recommande fortement de ne pas la sauter, pour ce chantier précis. Créer des tables, de la RLS et potentiellement du stockage vidéo directement en production, même isolé par un feature flag, veut dire que la moindre erreur de migration (contrainte mal écrite, policy RLS trop permissive) touche la vraie base de vos vrais utilisateurs pendant qu'on développe sur plusieurs semaines.

Deux options, à choisir selon votre plan Supabase actuel (non déterminé depuis le code — à vérifier dans le dashboard Supabase, section Billing) :

- **Option A — Nouveau projet Supabase séparé** (le plus sûr, le plus classique). On recrée le schéma nécessaire (uniquement les tables touchées par ce chantier + celles dont elles dépendent : `profiles`, `listings`, `shop_follows`, `notifications`), avec des données de test fictives, jamais de vraies données personnelles. Coût : un second projet Supabase (gratuit jusqu'à un certain seuil selon le plan actuel — à vérifier).
- **Option B — Database Branching Supabase** (fonctionnalité native de Supabase, si le plan actuel y donne accès — généralement réservée aux plans payants Pro/Team). Une branche de base de données éphémère, créée depuis la prod, qui se synchronise plus facilement. Plus rapide à mettre en place si disponible, mais je n'ai pas pu vérifier depuis le code si votre plan Supabase l'inclut.

**Schéma à reproduire côté staging** (que l'option choisie soit A ou B) :
- Tables : `profiles`, `listings`, `shop_follows`, `notifications` (dépendances directes des nouvelles tables), plus les nouvelles tables de la §4.
- Storage : buckets `listing_images` et `profile_assets` (pour que les posts puissent référencer des visuels existants pendant les tests) + un futur bucket dédié aux médias de posts (§4).
- Auth : la configuration Auth (Google/Apple OAuth) devra être reconfigurée séparément sur le projet staging si Option A — c'est un vrai travail à part (on l'a vécu cette semaine avec la connexion Google Android, ce n'est pas instantané).
- Edge Functions : uniquement celles concernées par ce chantier au fur et à mesure (aucune au départ, potentiellement une future `ai-moderation-posts` en Phase 1).
- RLS : reproduire les policies des tables listées ci-dessus (je peux extraire un script depuis la prod, sans les données).
- Variables d'environnement : un nouveau `.env.staging.local` avec `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` du projet staging, jamais commité.
- Données de test : profils fictifs (pas de vrais numéros de téléphone/e-mails clients), quelques `listings` de test copiées de structure mais pas de contenu réel.

**Aucune donnée personnelle de production ne sera copiée** vers staging sans anonymisation, comme demandé.

---

## 3. Feature flag

**RÉUTILISÉ, et c'est une bonne nouvelle** : Zando+ a déjà exactement ce mécanisme, utilisé pour le Hero Builder v2. Colonne booléenne `site_settings.hero_v2_enabled` (table à une seule ligne, `id=1`), lue par une requête isolée dans le composant concerné plutôt que via le contexte partagé (`SiteSettingsContext.jsx`) — voir `src/components/home/HeroSection.jsx:175-188` et `src/components/admin/AdminHeroTab.jsx`. Le commentaire dans le code explique pourquoi : une requête isolée évite de casser le contexte partagé si la colonne n'existe pas encore pendant le déploiement progressif.

**NOUVEAU** : `site_settings.social_commerce_enabled boolean DEFAULT false`, exactement le même pattern :
- `AdminSocialCommerceTab.jsx` (nouveau, sur le modèle d'`AdminHeroTab.jsx`) pour basculer le flag en un clic.
- `FeedPage.jsx` et toute entrée de navigation vers le feed (icône dans le header, section sur l'accueil) vérifient `social_commerce_enabled` avant de s'afficher.

**Pour les paliers progressifs demandés (OFF global / ON admins / ON progressif / ON global)** :
- **ON pour admins** : **RÉUTILISÉ** directement — `profiles.role === 'admin'` est déjà vérifié partout dans le code (ex. `isAdmin` dans plusieurs composants). Même trick que `heroPreview=v2` dans l'URL pour `HeroSection.jsx` : un paramètre `?feedPreview=1` réservé aux admins peut donner un accès en avant-première sans toucher au flag global.
- **ON progressif pour certains utilisateurs** : **À VALIDER**. Il existe une table `testers` (programme bêta-testeurs, `src/pages/TesterDashboardPage.jsx`, onglet admin "Testeurs Beta") — mais elle est **actuellement vide en production** (0 ligne). C'est un mécanisme réel mais inutilisé aujourd'hui. Deux choix : (a) la réactiver pour ce chantier — replonger dans le programme bêta existant, cohérent avec son intention d'origine ; (b) pour une si petite équipe (vous + moi), sauter ce palier intermédiaire et passer directement d'"admins" à "tout le monde" une fois que ça marche en interne. Je recommande (b) pour la simplicité, sauf si vous avez déjà des testeurs externes en tête pour ce chantier spécifique.
- **ON global** : bascule simple du booléen sur `site_settings`.

---

## 4. Architecture DB proposée (à ne PAS appliquer maintenant)

Toutes les tables suivent exactement le style déjà utilisé dans ce projet (voir `supabase_migration_shop_follows.sql` comme référence directe) : `uuid` généré par `gen_random_uuid()`, `timestamptz DEFAULT now()`, contraintes nommées `table_purpose`, index nommés `table_col_idx`, RLS avec policies nommées entre guillemets, fonctions `SECURITY DEFINER` avec `SET search_path = public`.

### `posts` — NOUVEAU

```sql
CREATE TABLE IF NOT EXISTS public.posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption       text,
  media_type    text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')), -- vidéo prévue, pas gérée avant Phase 3
  media_urls    text[] NOT NULL DEFAULT '{}',   -- images (Phase 1) ; 1 seule entrée vidéo en Phase 3
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'needs_changes', 'rejected', 'archived')),
  moderation_flags  text[],
  moderation_reason text,
  likes_count    integer NOT NULL DEFAULT 0,    -- dénormalisé, comme listings.favorites_count
  comments_count integer NOT NULL DEFAULT 0,
  views_count    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz                      -- soft delete : on garde l'historique (modération, litiges)
);

CREATE INDEX IF NOT EXISTS posts_author_idx  ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS posts_status_idx  ON public.posts (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS posts_created_idx ON public.posts (created_at DESC) WHERE status = 'active' AND deleted_at IS NULL;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads active posts" ON public.posts
  FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "author manages own posts" ON public.posts
  FOR ALL USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "admin full access on posts" ON public.posts
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR ((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true'
  );
```

*Pourquoi le soft delete (`deleted_at`) plutôt qu'un vrai DELETE : les posts auront des likes/commentaires/vues et potentiellement des ventes attribuées (§9) — supprimer une ligne casserait l'historique d'attribution. Même logique que `listings.status` qui ne supprime jamais vraiment une annonce.*

### `post_products` — NOUVEAU (le cœur de l'architecture)

```sql
CREATE TABLE IF NOT EXISTS public.post_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  listing_id  uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  is_primary  boolean NOT NULL DEFAULT false,   -- le produit "principal" si plusieurs sont tagués
  display_order integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_products_unique UNIQUE (post_id, listing_id)
);

CREATE INDEX IF NOT EXISTS post_products_post_idx    ON public.post_products (post_id);
CREATE INDEX IF NOT EXISTS post_products_listing_idx ON public.post_products (listing_id);

ALTER TABLE public.post_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads post_products of active posts" ON public.post_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.status = 'active' AND p.deleted_at IS NULL)
  );

CREATE POLICY "author manages own post_products" ON public.post_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
  );
```

*Aucune donnée commerciale dupliquée ici : ni prix, ni disponibilité. Le prix et le stock restent uniquement dans `listings`, comme demandé — cette table n'est qu'un lien.*

### `post_likes` — NOUVEAU

```sql
CREATE TABLE IF NOT EXISTS public.post_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_likes_unique UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_likes_post_idx ON public.post_likes (post_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "user manages own likes" ON public.post_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

*Compteur dénormalisé `posts.likes_count`, maintenu par trigger (même logique que `listings.favorites_count`, déjà en place) — trigger `trg_post_likes_count` (AFTER INSERT/DELETE) à écrire en Phase 1, pas maintenant.*

### `post_comments` — NOUVEAU

```sql
CREATE TABLE IF NOT EXISTS public.post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reported', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at  timestamptz,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS post_comments_post_idx ON public.post_comments (post_id) WHERE deleted_at IS NULL;

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads active comments" ON public.post_comments
  FOR SELECT USING (status = 'active' AND deleted_at IS NULL);
CREATE POLICY "author manages own comments" ON public.post_comments
  FOR ALL USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
```

*Signalement de commentaire : réutilise le pattern de la table `reports` existante (ajouter `target_type`/`target_id` généralisés serait une refonte de `reports` — à trancher en Phase 1, pas ici. Pour l'instant, `status='reported'` suffit pour la Phase 1.)*

### `post_views` — NOUVEAU, **mais probablement pas en Phase 1**

Comme demandé, seulement si nécessaire. `listings.views_count` s'incrémente aujourd'hui par un simple `UPDATE` synchrone via RPC (`increment_listing_view`) — count par chargement de page, pas de déduplication par visiteur identifiée dans le code lu. Pour des posts consultés en boucle dans un feed (défilement rapide, contrairement à une fiche produit qu'on ouvre une fois), le même pattern synchrone taperait beaucoup plus souvent sur la base. **À VALIDER en Phase 1** : soit on réutilise le même pattern simple pour commencer (cohérent, mais potentiellement à revoir si le volume grimpe), soit on prévoit direct un compteur agrégé de manière asynchrone. Je recommande de démarrer simple (même pattern que `listings`) et de ne complexifier que si la charge le justifie réellement — pas de sur-ingénierie avant d'avoir de vrais chiffres.

### `post_follows` : PAS créée

Conforme à la demande — `shop_follows` (déjà en place, `follower_id`/`seller_id`) remplit exactement ce rôle. Un "auteur" de post est un `profiles`, suivre un auteur = suivre un vendeur = `shop_follows`. Aucune nouvelle table nécessaire ici.

---

## 5. Association aux produits

Couvert dans le schéma `post_products` ci-dessus (§4) :
- **1 post → N listings** et **1 listing → N posts** : garanti par la table de jonction, pas de contrainte d'unicité sur `listing_id` seul.
- **Produit principal** : colonne `is_primary`.
- **Ordre d'affichage** : colonne `display_order`.
- **Date d'association** : `created_at`.
- Aucune duplication de prix/stock — toujours lu depuis `listings` au moment de l'affichage.

---

## 6. Architecture frontend

**NOUVEAU**, en respectant les conventions déjà en place (PascalCase pour les composants, dossier par domaine sous `src/components/`, pages sous `src/pages/`) :

```
src/pages/FeedPage.jsx                    (liste/scroll infini des posts)
src/pages/PostDetailPage.jsx              (un post seul + ses commentaires, pour le partage/deep link)
src/components/social/PostCard.jsx        (une carte de post dans le feed)
src/components/social/PostComposer.jsx    (création d'un post, sélection des annonces à tagger)
src/components/social/PostProductCTA.jsx  (🛒 Acheter — X FCFA, quand 1 seul produit tagué)
src/components/social/PostProductsSheet.jsx (🛍 Voir les N produits, panneau à plusieurs produits)
src/components/social/PostActions.jsx     (like, commenter, partager — like utilise ShareMenu.jsx existant pour le partage)
src/components/social/CommentsSheet.jsx   (liste + saisie de commentaires)
src/contexts/PostsContext.jsx             (sur le modèle de ListingsContext.jsx)
```

**Réutilisé tel quel** : `src/components/ui/carousel.jsx` (Embla, déjà une dépendance) pour un post à plusieurs images ; `src/lib/imageUtils.js` pour la compression/filigrane des images de post ; `ShareMenu.jsx` pour le partage externe (WhatsApp/Facebook) d'un post.

**Admin** : nouvel onglet `src/components/admin/AdminPostsTab.jsx`, ajouté à `AdminDashboard.jsx` dans le groupe "Gestion", sur le modèle exact d'`AdminListingsTab.jsx` (mêmes statuts `pending_review`/`needs_changes`).

Les noms ci-dessus sont une proposition, pas gravés dans le marbre — à ajuster si vous préférez une autre organisation une fois qu'on voit le premier composant en vrai.

---

## 7. Data fetching : React Query, oui, mais isolé

**À VALIDER, ma recommandation : oui, réservé au module social**, sans migrer le reste de Zando+.

**EXISTANT** : aucune lib de cache de requêtes aujourd'hui (`@tanstack/react-query` absent de `package.json`), uniquement du React Context + `useState`/`useEffect` manuels partout (`ListingsContext.jsx` et les 6 autres contexts).

Pourquoi ça vaut le coup ici spécifiquement : un feed avec pagination infinie, des likes optimistes (l'utilisateur clique, le cœur se remplit tout de suite, avant confirmation serveur) et potentiellement du temps réel plus tard sont exactement le cas d'usage pour lequel React Query existe. Le reconstruire à la main en Context, comme le reste du projet, serait un vrai effort dupliqué et plus fragile.

Pourquoi ne PAS migrer le reste de Zando+ en même temps : aucune raison de toucher `ListingsContext.jsx` ou `AuthContext.jsx`, qui fonctionnent bien tels quels — risque inutile sur du code qui marche, pour un chantier qui n'en a pas besoin. React Query serait ajouté comme dépendance et utilisé **uniquement** dans `PostsContext.jsx` et les composants sous `src/components/social/`. Les deux systèmes cohabitent sans se gêner (React Query ne remplace pas les Context Providers, il vit à côté).

---

## 8. Feed V1 — classement déterministe, pas d'IA

**À VALIDER**, proposition de formule simple pour démarrer (à ajuster une fois qu'il y a de vraies données) :

```
score = poids_recence     × fraîcheur(post.created_at)
      + poids_engagement  × (post.likes_count + post.comments_count × 2)
      + poids_suivi       × (auteur suivi par l'utilisateur ? 1 : 0)
      + poids_disponible  × (au moins 1 produit tagué encore actif/en stock ? 1 : 0)
      + poids_boost       × (post boosté actif ? valeur du boost : 0)
```

Un simple `ORDER BY score DESC` calculé à la requête (ou un `score` dénormalisé recalculé périodiquement si le volume grandit). Aucun moteur de recommandation, aucun ML — exactement ce qui est demandé pour cette étape. Les poids exacts (`poids_recence`, etc.) sont à définir avec de vraies données, pas avant.

---

## 9. Analytics et attribution

**NOUVEAU**, en étendant ce qui existe déjà plutôt qu'en construisant un système séparé :

- `posts.views_count` (déjà dans le schéma §4) capture l'impression.
- Au clic sur `PostProductCTA`/`PostProductsSheet`, on navigue vers `listings/:id?source=social_feed&post_id=:postId` — **EXISTANT réutilisé** : les query params sont déjà lus ailleurs dans le code (ex. `heroPreview`), pattern connu.
- **NOUVEAU** : `cart_payments` et `transactions_escrow` gagnent une colonne nullable `attribution_source text` et `attribution_post_id uuid REFERENCES posts(id)`, renseignées si les query params sont présents au moment de l'ajout au panier/achat. Nullable et sans contrainte NOT NULL : **aucune transaction existante n'est affectée**, le funnel classique (achat direct depuis une annonce) continue de fonctionner exactement pareil, ces colonnes restent simplement vides.
- Funnel mesurable au final : `posts.views_count` (impression/vue) → clic (event pixel existant, `MetaPixel`/`GoogleAnalytics`, déjà déclenchés ailleurs pour les événements de conversion) → `cart_payments`/`transactions_escrow` avec `attribution_post_id` rempli (achat attribué).

---

## 10. Modération

**RÉUTILISÉ** : mêmes statuts que `listings` (`draft`, `pending_review`, `active`, `needs_changes`, `rejected`, `archived` — déjà dans le schéma `posts` §4). Le pipeline `ai-moderation` existant (Claude vision, modère déjà photo + texte pour les annonces, avec détection d'incohérence prix/photo ajoutée le 24/09/2026) est **directement adaptable** : même appel, en changeant juste le contexte envoyé au prompt (post au lieu d'annonce, pas de vérification prix puisque un post n'a pas de prix propre). Réutilisation du edge function existant avec un paramètre `content_type: 'post'`, plutôt qu'une nouvelle fonction dupliquée — **À VALIDER** selon la complexité réelle une fois qu'on regarde le prompt de `ai-moderation` en détail (pas fait dans cette Phase 0).

Commentaires : `post_comments.status = 'reported'` (§4) plutôt qu'un système de signalement séparé — un admin filtre les commentaires à ce statut dans le nouvel onglet `AdminPostsTab.jsx`.

---

## 11. Tests

**RÉUTILISÉ** : l'infrastructure existe déjà (Playwright pour le web, Maestro pour mobile natif — confirmé dans l'audit précédent). Scénarios à ajouter, dans `tests/` (Playwright) et `.maestro/` (mobile), une fois le code écrit :

- Créer une publication (image + légende).
- Associer un produit existant (`listing_id`) à la publication.
- Publier (passage `draft` → `pending_review` ou `active` selon modération).
- Vérifier l'affichage dans le feed (`FeedPage.jsx`).
- Aimer une publication (optimistic update, puis confirmation).
- Commenter une publication.
- Suivre l'auteur (réutilise `shop_follows`, donc potentiellement un test déjà existant à étendre plutôt qu'à dupliquer).
- Ouvrir le produit tagué depuis le post (`PostProductCTA`).
- Acheter via le système Zando existant (réutilise les tests d'achat déjà existants, juste depuis un point d'entrée différent).
- Vérifier qu'un utilisateur **sans** accès au feature flag ne voit **rien** (`social_commerce_enabled = false` → aucune trace de feed nulle part dans l'UI, y compris navigation).

---

## 12. Étude vidéo (pas d'implémentation, pas de souscription)

Contrainte confirmée dans l'audit précédent : **aucune brique vidéo n'existe aujourd'hui** dans Zando+. Les buckets Supabase Storage actuels plafonnent à 5 Mo/fichier et n'ont aucun mécanisme de transcodage — inadaptés tels quels à de la vidéo verticale même courte.

Besoins identifiés pour la Phase 3 (plus tard, pas maintenant) : upload depuis mobile, transcodage multi-résolution, thumbnails automatiques, streaming adaptatif (HLS/DASH), CDN, contrôle de l'autoplay (respecter la consommation de données mobiles, un vrai sujet au Congo d'après les échanges de cette semaine sur le poids des photos), modération vidéo (probablement hors de portée de Claude vision actuel, qui traite des images fixes), et un coût qui dépend directement du volume de vues.

Pistes à comparer sérieusement avant de choisir (**À VALIDER, aucune ne doit être souscrite maintenant**) :
- **Mux** — spécialisé vidéo, bonne réputation pour le transcodage/analytics, facturation à l'usage (minutes encodées + minutes vues).
- **Cloudflare Stream** — également à l'usage, intéressant si vous êtes déjà dans l'écosystème Cloudflare (non déterminé si c'est le cas), CDN inclus.
- **Bunny Stream** — souvent moins cher à gros volume, moins connu, à vérifier sur la fiabilité en Afrique centrale spécifiquement (latence CDN locale, non déterminé).
- **Cloudinary Video** — déjà une brique "média" généraliste (image + vidéo), pourrait simplifier si vous vouliez unifier la gestion des médias à terme, mais généralement plus cher pour de la vidéo pure.

Aucun chiffre de coût réel n'est avancé ici volontairement : les tarifs affichés publiquement ne reflètent pas toujours le coût réel à votre volume, et ce n'est pas une décision technique mais une décision de coût/produit qui vous revient — un vrai devis/essai gratuit sur 2-3 fournisseurs serait la bonne étape avant la Phase 3, pas avant.

---

## Liste exacte des fichiers à créer/modifier (récapitulatif)

**Nouveaux fichiers** :
- `supabase_migration_social_commerce_phase1.sql` (tables `posts`, `post_products`, `post_likes`, `post_comments`, RLS, triggers de compteurs)
- `src/contexts/PostsContext.jsx`
- `src/pages/FeedPage.jsx`, `src/pages/PostDetailPage.jsx`
- `src/components/social/PostCard.jsx`, `PostComposer.jsx`, `PostProductCTA.jsx`, `PostProductsSheet.jsx`, `PostActions.jsx`, `CommentsSheet.jsx`
- `src/components/admin/AdminPostsTab.jsx`
- `.env.staging.local` (si Option A §2 retenue, jamais commité)

**Fichiers existants à modifier** (légèrement, jamais leur cœur) :
- `src/App.jsx` (nouvelles routes `/feed`, `/posts/:id`)
- `src/pages/AdminDashboard.jsx` (nouvel onglet)
- `supabase_migration_*` séparée pour `site_settings.social_commerce_enabled` et les colonnes d'attribution sur `cart_payments`/`transactions_escrow`
- `package.json` (ajout `@tanstack/react-query`, scope social uniquement)

**Non touchés** : `ListingsContext.jsx`, `AuthContext.jsx`, tout le système de paiement/escrow existant (réutilisé, jamais modifié dans sa logique), `ai-moderation` (étendu via paramètre, pas réécrit).

---

## Ordre recommandé d'implémentation

1. Valider ce document avec vous (où nous en sommes).
2. Staging Supabase (§2) — rien d'autre ne devrait commencer avant que ce soit en place, c'est la fondation de sécurité de tout le chantier.
3. Créer `feature/social-commerce` depuis `redesign` (§1).
4. Migration DB Phase 1 (`posts`, `post_products`, `post_likes`, `post_comments`) sur staging uniquement.
5. `PostsContext.jsx` + `PostComposer.jsx` (créer un post, sans feed pour l'instant) — testable en isolation.
6. `FeedPage.jsx` + `PostCard.jsx` + pagination React Query.
7. `PostProductCTA.jsx`/`PostProductsSheet.jsx` — le branchement au système d'achat existant.
8. `AdminPostsTab.jsx` + extension `ai-moderation`.
9. Attribution (§9) sur `cart_payments`/`transactions_escrow`.
10. Tests Playwright/Maestro (§11).
11. Feature flag en production, `OFF` par défaut, testé en interne via `?feedPreview=1`.
12. Validation avec vous avant bascule `ON`.

---

*Fin de la Phase 0. Comme demandé : je ne développe rien de tout ceci avant votre validation. La vidéo (§12) reste une étude, aucun engagement pris. Dites-moi ce qui doit changer dans ce plan avant qu'on avance.*
