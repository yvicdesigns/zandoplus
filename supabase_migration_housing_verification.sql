-- Vérification GRATUITE des propriétaires "Maison à louer" — distincte du système
-- de vérification vendeur payant existant (verification_requests, 10 000 FCFA).
-- Table séparée pour ne jamais interférer avec le flux payant (contrainte
-- unique(user_id), logique de paiement). Jamais obligatoire pour publier —
-- juste un badge de confiance optionnel. Appliqué le 01/09/2026.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS housing_verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.housing_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending', -- pending | approved | rejected
  id_document_url text,
  selfie_url text,
  proof_of_address_url text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

ALTER TABLE public.housing_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own housing verification request"
  ON public.housing_verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own housing verification request"
  ON public.housing_verification_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending/rejected housing verification request"
  ON public.housing_verification_requests FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'rejected'));

CREATE POLICY "Staff can read all housing verification requests"
  ON public.housing_verification_requests FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
  ));

-- RPC sécurisée (même pattern que set_featured_status_as_admin) : approuver/rejeter
-- + synchroniser profiles.housing_verified en une seule opération atomique.
CREATE OR REPLACE FUNCTION public.admin_review_housing_verification(
  p_request_id uuid, p_status text, p_rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_user boolean;
  v_user_id uuid;
BEGIN
  SELECT COALESCE(((auth.jwt() -> 'user_metadata') ->> 'is_admin')::boolean, false) INTO is_admin_user;
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent examiner les vérifications.';
  END IF;
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Statut invalide.';
  END IF;

  UPDATE public.housing_verification_requests
  SET status = p_status, rejection_reason = p_rejection_reason, updated_at = now()
  WHERE id = p_request_id
  RETURNING user_id INTO v_user_id;

  UPDATE public.profiles SET housing_verified = (p_status = 'approved') WHERE id = v_user_id;
END;
$function$;
