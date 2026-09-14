-- ============================================================================
-- Badge "Entreprise" (20 000 FCFA/an, inclut le badge Vérifié) — voir memoire
-- project_badge_entreprise_plan.md pour le contexte produit complet.
-- Appliqué en prod le 14/09/2026
-- ============================================================================

-- 1. verification_requests : distinguer une demande individuelle d'une demande
--    entreprise, dans la même table (pas de table séparée).
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.verification_requests
  DROP CONSTRAINT IF EXISTS verification_requests_request_type_check;
ALTER TABLE public.verification_requests
  ADD CONSTRAINT verification_requests_request_type_check CHECK (request_type IN ('individual', 'business'));

-- Une personne peut avoir une demande "individual" ET une demande "business"
-- au fil du temps (ex: déjà Vérifié, puis passe Entreprise plus tard).
ALTER TABLE public.verification_requests
  DROP CONSTRAINT IF EXISTS verification_requests_user_id_key;
ALTER TABLE public.verification_requests
  DROP CONSTRAINT IF EXISTS verification_requests_user_id_type_key;
ALTER TABLE public.verification_requests
  ADD CONSTRAINT verification_requests_user_id_type_key UNIQUE (user_id, request_type);

-- 2. profiles : statut entreprise + expiration annuelle + RCCM optionnel.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_business boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS rccm_number text;

-- 3. RPC : basculer le statut Entreprise (même schéma de permission que
--    admin_set_verified). Activer Entreprise confère aussi Vérifié
--    (l'un inclut l'autre, comme décidé) ; désactiver Entreprise ne retire
--    pas Vérifié (laissé au jugement de l'admin séparément).
CREATE OR REPLACE FUNCTION public.admin_set_business(
  target_user_id uuid,
  is_business_enabled boolean,
  p_business_name text DEFAULT NULL
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

  IF is_business_enabled THEN
    UPDATE public.profiles
      SET is_business = true,
          verified = true,
          business_name = COALESCE(p_business_name, business_name),
          business_expires_at = now() + interval '1 year',
          updated_at = now()
      WHERE id = target_user_id;
  ELSE
    UPDATE public.profiles
      SET is_business = false,
          business_expires_at = NULL,
          updated_at = now()
      WHERE id = target_user_id;
  END IF;
END;
$function$;

-- 4. Expiration automatique (cron hebdo) : repasse is_business à false quand
--    business_expires_at est dépassée. Le rappel de renouvellement (WhatsApp/
--    e-mail) sera géré séparément, sur le même principe que le rappel de
--    réengagement déjà en place.
CREATE OR REPLACE FUNCTION public.expire_business_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
    SET is_business = false, updated_at = now()
    WHERE is_business = true AND business_expires_at IS NOT NULL AND business_expires_at < now();
END;
$function$;

DO $do$ BEGIN
  PERFORM cron.unschedule('expire-business-badges');
EXCEPTION WHEN OTHERS THEN NULL; END $do$;

SELECT cron.schedule('expire-business-badges', '0 3 * * *', $cron$
  SELECT public.expire_business_badges();
$cron$);
-- Le type de retour change (ajout request_type/business_name) : il faut
-- DROP avant de recréer, Postgres refuse de changer les colonnes OUT en place.
DROP FUNCTION IF EXISTS public.get_all_verification_requests();

CREATE OR REPLACE FUNCTION public.get_all_verification_requests()
 RETURNS TABLE(id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, status text, id_document_url text, selfie_url text, proof_of_address_url text, rejection_reason text, request_type text, business_name text, "user" json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT (SELECT COALESCE(((auth.jwt()->>'user_metadata')::jsonb->>'is_admin')::boolean, false)) THEN
        RAISE EXCEPTION 'Only admins can access this function.';
    END IF;

    RETURN QUERY
    SELECT
        vr.id,
        vr.created_at,
        vr.updated_at,
        vr.status,
        vr.id_document_url,
        vr.selfie_url,
        vr.proof_of_address_url,
        vr.rejection_reason,
        vr.request_type,
        vr.business_name,
        json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', u.email
        ) as "user"
    FROM public.verification_requests vr
    LEFT JOIN public.profiles p ON vr.user_id = p.id
    LEFT JOIN auth.users u ON vr.user_id = u.id
    ORDER BY
        CASE vr.status
            WHEN 'pending' THEN 1
            WHEN 'rejected' THEN 2
            WHEN 'approved' THEN 3
            ELSE 4
        END,
        vr.created_at DESC;
END;
$function$;
