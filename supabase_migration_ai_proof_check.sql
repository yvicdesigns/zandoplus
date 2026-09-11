-- ============================================================================
-- Vérification IA des preuves de paiement (screenshot) avant soumission.
-- L'IA ne remplace pas la validation admin finale — elle filtre juste les
-- envois évidemment hors-sujet (photo sans rapport) ou incohérents (montant/
-- code qui ne correspondent pas) avant que ça atterrisse chez l'admin.
-- Appliqué en prod le 11/09/2026
-- ============================================================================

ALTER TABLE public.transactions_escrow
  ADD COLUMN IF NOT EXISTS ai_proof_verdict text,   -- 'ok' | 'uncertain'
  ADD COLUMN IF NOT EXISTS ai_proof_reason  text;

-- Nouvelle signature : accepte le verdict IA (informatif pour l'admin).
DROP FUNCTION IF EXISTS public.buyer_submit_payment_proof(uuid, text, text);

CREATE OR REPLACE FUNCTION public.buyer_submit_payment_proof(
  p_transaction_id uuid,
  p_proof_url text,
  p_momo_code text,
  p_ai_verdict text DEFAULT NULL,
  p_ai_reason text DEFAULT NULL
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
        ai_proof_verdict = p_ai_verdict,
        ai_proof_reason = p_ai_reason,
        statut = 'fonds_bloques'
    WHERE id = p_transaction_id;
END;
$function$;

-- Le blocage IA doit être un vrai mur, pas juste une case cochée côté client :
-- seule la fonction serveur submit-payment-proof (service_role) peut encore
-- appeler cette RPC. Un client authentifié qui l'appellerait directement pour
-- sauter le contrôle IA se heurte maintenant à un refus de permission.
REVOKE EXECUTE ON FUNCTION public.buyer_submit_payment_proof(uuid, text, text, text, text) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.buyer_submit_payment_proof(uuid, text, text, text, text) TO service_role;
