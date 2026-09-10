-- ============================================================================
-- « Suivre la boutique » : table shop_follows + compteur + alerte nouveau produit
-- Appliqué en prod le 10/09/2026
-- ============================================================================

-- 1. Table des abonnements boutique -------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_follows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shop_follows_no_self CHECK (follower_id <> seller_id),
  CONSTRAINT shop_follows_unique   UNIQUE (follower_id, seller_id)
);

CREATE INDEX IF NOT EXISTS shop_follows_seller_idx   ON public.shop_follows (seller_id);
CREATE INDEX IF NOT EXISTS shop_follows_follower_idx ON public.shop_follows (follower_id);

-- 2. RLS --------------------------------------------------------------------
ALTER TABLE public.shop_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follower manages own follows"   ON public.shop_follows;
DROP POLICY IF EXISTS "follower reads own follows"     ON public.shop_follows;
DROP POLICY IF EXISTS "seller reads its followers"     ON public.shop_follows;

-- le client peut créer / supprimer SES abonnements
CREATE POLICY "follower manages own follows" ON public.shop_follows
  FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- le vendeur peut voir qui le suit
CREATE POLICY "seller reads its followers" ON public.shop_follows
  FOR SELECT
  USING (auth.uid() = seller_id);

-- 3. Compteur public d'abonnés (lisible même déconnecté) --------------------
CREATE OR REPLACE FUNCTION public.get_shop_follower_count(p_seller uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::int FROM public.shop_follows WHERE seller_id = p_seller;
$$;

GRANT EXECUTE ON FUNCTION public.get_shop_follower_count(uuid) TO anon, authenticated;

-- 4. Alerte « nouveau produit » aux abonnés -------------------------------
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS followers_notified_at timestamptz;

CREATE OR REPLACE FUNCTION public.notify_followers_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_name text;
BEGIN
  -- ne déclenche que si l'annonce est active et n'a jamais notifié
  IF NEW.status IS DISTINCT FROM 'active' OR NEW.followers_notified_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- sur UPDATE : seulement au passage inactif -> actif
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'La boutique') INTO v_shop_name
  FROM public.profiles WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, content, link)
  SELECT
    sf.follower_id,
    'shop_new_listing',
    jsonb_build_object(
      'message',    format('%s vient de publier : %s', v_shop_name, NEW.title),
      'seller_id',  NEW.user_id,
      'listing_id', NEW.id
    ),
    '/listings/' || NEW.id::text
  FROM public.shop_follows sf
  WHERE sf.seller_id = NEW.user_id;

  NEW.followers_notified_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_followers_new_listing ON public.listings;
CREATE TRIGGER trg_notify_followers_new_listing
  BEFORE INSERT OR UPDATE OF status ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_followers_new_listing();
