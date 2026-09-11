-- ============================================================================
-- Anti-fraude preuve de paiement manuelle : le code de transaction MTN/Airtel
-- devient obligatoire (pas seulement une image), format vérifié, et un même
-- code ne peut pas être réutilisé sur deux commandes différentes.
-- Appliqué en prod le 11/09/2026
-- ============================================================================

ALTER TABLE public.transactions_escrow
  ADD COLUMN IF NOT EXISTS momo_transaction_code text;

-- unicité (NULL autorisé plusieurs fois, ex: paiements COD/autopay sans code manuel)
CREATE UNIQUE INDEX IF NOT EXISTS transactions_escrow_momo_code_unique
  ON public.transactions_escrow (momo_transaction_code)
  WHERE momo_transaction_code IS NOT NULL;

DROP FUNCTION IF EXISTS public.buyer_submit_payment_proof(uuid, text);

CREATE OR REPLACE FUNCTION public.buyer_submit_payment_proof(
  p_transaction_id uuid,
  p_proof_url text,
  p_momo_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_tx RECORD;
  v_code text;
BEGIN
  v_code := regexp_replace(coalesce(p_momo_code, ''), '\s', '', 'g');
  IF v_code !~ '^[0-9]{8,12}$' THEN
    RAISE EXCEPTION 'Code de transaction invalide. Entrez uniquement les chiffres de l''ID de transaction reçu par SMS après le paiement.';
  END IF;

  SELECT id, acheteur_id, statut INTO v_tx FROM public.transactions_escrow WHERE id = p_transaction_id;
  IF v_tx.id IS NULL THEN RAISE EXCEPTION 'Transaction introuvable'; END IF;
  IF v_tx.acheteur_id != auth.uid() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF v_tx.statut != 'en_attente_paiement' THEN RAISE EXCEPTION 'Paiement déjà soumis'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.transactions_escrow
    WHERE momo_transaction_code = v_code AND id != p_transaction_id
  ) THEN
    RAISE EXCEPTION 'Ce code de transaction a déjà été utilisé pour une autre commande.';
  END IF;

  UPDATE public.transactions_escrow
    SET preuve_paiement_url = p_proof_url,
        momo_transaction_code = v_code,
        statut = 'fonds_bloques'
    WHERE id = p_transaction_id;
END;
$function$;
