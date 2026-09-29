-- ============================================================================
-- ZANDO SOCIAL — Phase 1 : publications photo/affiche + association aux
-- annonces + likes + commentaires. Pas de vidéo (Phase 3), pas encore de vues
-- dédiées (post_views, à ajouter seulement si le volume le justifie).
--
-- À APPLIQUER UNIQUEMENT SUR LE PROJET STAGING (tymsnbwogarazftvzkzt) TANT QUE
-- CE COMMENTAIRE EST LÀ. Ne jamais jouer ce fichier sur la production
-- (axlpfskrrlwibcnxkfvb) sans validation explicite — voir SOCIAL_COMMERCE_PHASE0_PLAN.md.
--
-- Convention : même style que supabase_migration_shop_follows.sql (uuid +
-- gen_random_uuid(), timestamptz + now(), policies nommées, fonctions
-- SECURITY DEFINER avec search_path fixé).
-- ============================================================================

-- 1. posts ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption        text,
  media_type     text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')), -- 'video' réservé, pas géré avant Phase 3
  media_urls     text[] NOT NULL DEFAULT '{}',
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'needs_changes', 'rejected', 'archived')),
  moderation_flags  text[],
  moderation_reason text,
  likes_count    integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  views_count    integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);

CREATE INDEX IF NOT EXISTS posts_author_idx  ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS posts_status_idx  ON public.posts (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS posts_created_idx ON public.posts (created_at DESC) WHERE status = 'active' AND deleted_at IS NULL;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads active posts"   ON public.posts;
DROP POLICY IF EXISTS "author manages own posts"    ON public.posts;
DROP POLICY IF EXISTS "admin full access on posts"  ON public.posts;

CREATE POLICY "anyone reads active posts" ON public.posts
  FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "author manages own posts" ON public.posts
  FOR ALL USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "admin full access on posts" ON public.posts
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR ((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true'
  );

-- updated_at auto ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_posts_updated_at();


-- 2. post_products (le lien central marketplace <-> social) ----------------

CREATE TABLE IF NOT EXISTS public.post_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  listing_id    uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  is_primary    boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_products_unique UNIQUE (post_id, listing_id)
);

CREATE INDEX IF NOT EXISTS post_products_post_idx    ON public.post_products (post_id);
CREATE INDEX IF NOT EXISTS post_products_listing_idx ON public.post_products (listing_id);

ALTER TABLE public.post_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads post_products of active posts" ON public.post_products;
DROP POLICY IF EXISTS "author manages own post_products"           ON public.post_products;

CREATE POLICY "anyone reads post_products of active posts" ON public.post_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.status = 'active' AND p.deleted_at IS NULL)
  );

CREATE POLICY "author manages own post_products" ON public.post_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid())
  );


-- 3. post_likes --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.post_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_likes_unique UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS post_likes_post_idx ON public.post_likes (post_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads likes"      ON public.post_likes;
DROP POLICY IF EXISTS "user manages own likes"  ON public.post_likes;

CREATE POLICY "anyone reads likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "user manages own likes" ON public.post_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Compteur dénormalisé posts.likes_count, même logique que listings.favorites_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();


-- 4. post_comments -------------------------------------------------------

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

DROP POLICY IF EXISTS "anyone reads active comments"  ON public.post_comments;
DROP POLICY IF EXISTS "author manages own comments"   ON public.post_comments;

CREATE POLICY "anyone reads active comments" ON public.post_comments
  FOR SELECT USING (status = 'active' AND deleted_at IS NULL);
CREATE POLICY "author manages own comments" ON public.post_comments
  FOR ALL USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- Compteur dénormalisé posts.comments_count (ne compte que les commentaires actifs et non supprimés)
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' AND NEW.deleted_at IS NULL THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.deleted_at IS NULL THEN
    UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count
  AFTER INSERT OR UPDATE OF deleted_at OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();


-- 5. site_settings.social_commerce_enabled (feature flag, meme pattern que hero_v2_enabled) --

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS social_commerce_enabled boolean NOT NULL DEFAULT false;


-- 6. Attribution des ventes issues du feed (nullable, ne touche aucune transaction existante) --

ALTER TABLE public.cart_payments
  ADD COLUMN IF NOT EXISTS attribution_source  text,
  ADD COLUMN IF NOT EXISTS attribution_post_id uuid REFERENCES public.posts(id);

ALTER TABLE public.transactions_escrow
  ADD COLUMN IF NOT EXISTS attribution_source  text,
  ADD COLUMN IF NOT EXISTS attribution_post_id uuid REFERENCES public.posts(id);

-- Pas de post_follows : shop_follows (deja en place) remplit deja ce role.
-- Pas de post_views pour l'instant : voir SOCIAL_COMMERCE_PHASE0_PLAN.md §4, a
-- ajouter seulement si le pattern RPC increment_listing_view s'avere trop
-- couteux une fois de vraies donnees de volume disponibles.
