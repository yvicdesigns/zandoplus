-- ============================================================================
-- Paliers vendeurs : Zando Libre (gratuit, plafond 15) / Boutique (12 000
-- FCFA/an, plafond 100) / Entreprise (déjà existant, 20 000 FCFA/an, plafond
-- 500). Conçu sur plusieurs sessions de discussion (voir plan
-- peppy-mixing-rose.md). Boutique fonctionne exactement comme Entreprise
-- (inclut aussi le badge Vérifié) mais avec un badge et un prix différents.
-- ============================================================================

-- 1. verification_requests : autoriser le 3e type de demande.
ALTER TABLE public.verification_requests
  DROP CONSTRAINT IF EXISTS verification_requests_request_type_check;
ALTER TABLE public.verification_requests
  ADD CONSTRAINT verification_requests_request_type_check CHECK (request_type IN ('individual', 'business', 'boutique'));

-- 2. profiles : statut Boutique + expiration annuelle + bannière Entreprise.
--    ATTENTION : `banner_url` existe déjà et sert à la bannière de PROFIL
--    PERSONNELLE (ProfilePage.jsx, ouverte à tous) — sans rapport avec la
--    bannière marketing Entreprise affichée sur l'accueil. D'où un nom dédié.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_boutique boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS boutique_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS entreprise_banner_url text;

-- 3. RPC : basculer le statut Boutique (même schéma que admin_set_business).
--    Activer Boutique confère aussi Vérifié ; désactiver ne retire pas Vérifié.
CREATE OR REPLACE FUNCTION public.admin_set_boutique(
  target_user_id uuid,
  is_boutique_enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    (SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ) THEN RAISE EXCEPTION 'Permission refusée'; END IF;

  IF is_boutique_enabled THEN
    UPDATE public.profiles
      SET is_boutique = true,
          verified = true,
          boutique_expires_at = now() + interval '1 year',
          updated_at = now()
      WHERE id = target_user_id;
  ELSE
    UPDATE public.profiles
      SET is_boutique = false,
          boutique_expires_at = NULL,
          updated_at = now()
      WHERE id = target_user_id;
  END IF;
END;
$function$;

-- 4. Expiration automatique (cron quotidien), même principe qu'Entreprise.
CREATE OR REPLACE FUNCTION public.expire_boutique_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
    SET is_boutique = false, updated_at = now()
    WHERE is_boutique = true AND boutique_expires_at IS NOT NULL AND boutique_expires_at < now();
END;
$function$;

DO $do$ BEGIN
  PERFORM cron.unschedule('expire-boutique-badges');
EXCEPTION WHEN OTHERS THEN NULL; END $do$;

SELECT cron.schedule('expire-boutique-badges', '5 3 * * *', $cron$
  SELECT public.expire_boutique_badges();
$cron$);

-- 5. Plafond d'annonces par palier — appliqué en base (pas juste côté front),
--    calculé à la volée depuis le palier du vendeur, pas de colonne stockée.
--    Le message d'erreur préfixé LISTING_CAP_REACHED: permet au front
--    d'afficher un message clair plutôt que l'erreur Postgres brute.
CREATE OR REPLACE FUNCTION public.check_listing_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  seller_cap integer;
  current_count integer;
BEGIN
  SELECT CASE
    WHEN is_business THEN 500
    WHEN is_boutique THEN 100
    ELSE 15
  END INTO seller_cap
  FROM public.profiles WHERE id = NEW.user_id;

  SELECT count(*) INTO current_count
  FROM public.listings WHERE user_id = NEW.user_id AND status = 'active';

  IF current_count >= COALESCE(seller_cap, 15) THEN
    RAISE EXCEPTION 'LISTING_CAP_REACHED:%', COALESCE(seller_cap, 15);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_listing_cap ON public.listings;
CREATE TRIGGER enforce_listing_cap
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.check_listing_cap();

-- 6. Boost inclus Entreprise : pas de nouvelle table, on réutilise ad_boosts
--    avec un boost_type dédié 'entreprise_inclus' (montant 0, activé
--    directement par le vendeur, jamais de preuve de paiement). La limite
--    "1x/mois" est vérifiée côté application (pas de contrainte SQL ici).
ALTER TABLE public.ad_boosts
  DROP CONSTRAINT IF EXISTS ad_boosts_boost_type_check;
-- (Pas de CHECK existant trouvé sur boost_type — la ligne ci-dessus est un
-- filet de sécurité si une contrainte a été ajoutée hors migration suivie.)
