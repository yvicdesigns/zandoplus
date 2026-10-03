-- ============================================================================
-- Validation admin de la bannière Entreprise (accueil Zando+)
--
-- Contexte : le vendeur Entreprise pouvait déjà téléverser une bannière
-- (profiles.entreprise_banner_url), publiée instantanément sans contrôle sur
-- EntrepriseBanniereSection.jsx (page d'accueil). Décision du 03/10/2026 :
-- ajouter une validation manuelle avant publication, sans jamais dépublier une
-- bannière déjà approuvée pendant qu'une nouvelle est en attente de revue.
--
-- Aucune donnée existante à migrer (0 ligne avec entreprise_banner_url au
-- moment de cette migration).
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS entreprise_banner_pending_url text,
  ADD COLUMN IF NOT EXISTS entreprise_banner_status text NOT NULL DEFAULT 'none'
    CHECK (entreprise_banner_status IN ('none', 'pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS entreprise_banner_rejection_reason text;

-- Même convention que admin_review_housing_verification : vérifie l'admin via
-- le JWT, SECURITY DEFINER pour contourner RLS sur profiles.
CREATE OR REPLACE FUNCTION public.admin_review_entreprise_banner(
  p_user_id uuid,
  p_status text,
  p_rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_user boolean;
  v_pending_url text;
BEGIN
  SELECT COALESCE(((auth.jwt() -> 'user_metadata') ->> 'is_admin')::boolean, false) INTO is_admin_user;
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent examiner les bannières Entreprise.';
  END IF;
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Statut invalide.';
  END IF;

  SELECT entreprise_banner_pending_url INTO v_pending_url
  FROM public.profiles WHERE id = p_user_id;

  IF p_status = 'approved' THEN
    UPDATE public.profiles
    SET entreprise_banner_url = v_pending_url,
        entreprise_banner_pending_url = NULL,
        entreprise_banner_status = 'approved',
        entreprise_banner_rejection_reason = NULL
    WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET entreprise_banner_pending_url = NULL,
        entreprise_banner_status = 'rejected',
        entreprise_banner_rejection_reason = p_rejection_reason
    WHERE id = p_user_id;
  END IF;
END;
$function$;
