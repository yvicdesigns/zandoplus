-- Unifie la commission Zando Sécurisé à 5% du montant, plafonnée à 10 000 FCFA,
-- toujours à la charge du vendeur (déduite de son paiement).
--
-- Avant cette migration, deux taux différents étaient déjà appliqués en
-- production sans que ça n'ait jamais été décidé ainsi :
--   - create_escrow_transaction (achat direct d'une annonce) : 7% flat
--   - CartCheckoutPage.jsx (achat panier multi-articles)     : 10% flat
--   - get_vendor_wallet (solde vendeur)                      : fallback 7%
-- Cette migration aligne le taux DB sur le nouveau modèle décidé le
-- 22/09/2026 : 5% plafonné à 10 000 FCFA, cohérent avec le front (voir
-- src/lib/commission.js).

CREATE OR REPLACE FUNCTION public.create_escrow_transaction(p_annonce_id uuid, p_delivery_choice text DEFAULT 'pickup'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_listing       RECORD;
  v_delivery_fee  DECIMAL(12,2);
  v_commission    DECIMAL(12,2);
  v_tx_id         UUID;
  ZANDO_FEE       CONSTANT DECIMAL := 1500;
  COM_RATE        CONSTANT DECIMAL := 0.05;
  COM_CAP         CONSTANT DECIMAL := 10000;
BEGIN
  SELECT id, price, user_id, delivery_fee, delivery_method, status
    INTO v_listing FROM listings WHERE id = p_annonce_id;
  IF v_listing.id IS NULL THEN RAISE EXCEPTION 'Annonce introuvable'; END IF;
  IF v_listing.status != 'active' THEN RAISE EXCEPTION 'Annonce inactive'; END IF;
  IF v_listing.user_id = auth.uid() THEN RAISE EXCEPTION 'Impossible d''acheter sa propre annonce'; END IF;

  IF p_delivery_choice = 'zando' THEN
    v_delivery_fee := ZANDO_FEE;
  ELSIF p_delivery_choice = 'seller' THEN
    v_delivery_fee := COALESCE(v_listing.delivery_fee, 0);
  ELSE
    v_delivery_fee := 0;
  END IF;

  v_commission := LEAST(ROUND(v_listing.price * COM_RATE, 2), COM_CAP);

  INSERT INTO transactions_escrow (
    annonce_id, acheteur_id, vendeur_id,
    montant, commission_amount,
    delivery_choice, delivery_fee_paid,
    statut, date_limite_confirmation
  ) VALUES (
    p_annonce_id, auth.uid(), v_listing.user_id,
    v_listing.price, v_commission,
    p_delivery_choice, v_delivery_fee,
    'en_attente_paiement', now() + INTERVAL '72 hours'
  ) RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$function$;

CREATE OR REPLACE FUNCTION get_vendor_wallet(p_vendor_id UUID)
RETURNS TABLE(
  solde_total       DECIMAL,
  solde_disponible  DECIMAL,
  solde_en_attente  DECIMAL,
  solde_retire      DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF auth.uid() != p_vendor_id AND v_role NOT IN ('admin', 'monetisation', 'gestion') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  RETURN QUERY
  WITH earnings AS (
    SELECT
      te.montant,
      te.commission_amount,
      te.statut,
      te.date_confirmation,
      te.withdrawal_available_at,
      (te.montant - COALESCE(te.commission_amount, LEAST(ROUND(te.montant * 0.05, 2), 10000))) AS net
    FROM transactions_escrow te
    WHERE te.vendeur_id = p_vendor_id
      AND te.statut IN ('confirme', 'complete')
  ),
  withdrawn AS (
    SELECT COALESCE(SUM(montant), 0) AS total
    FROM wallet_withdrawals
    WHERE vendeur_id = p_vendor_id AND statut IN ('pending', 'processing', 'paid')
  )
  SELECT
    COALESCE(SUM(e.net), 0)::DECIMAL AS solde_total,
    GREATEST(
      COALESCE(SUM(CASE
        WHEN (e.date_confirmation IS NOT NULL AND now() - e.date_confirmation > INTERVAL '48 hours')
          OR (e.withdrawal_available_at IS NOT NULL AND now() >= e.withdrawal_available_at)
        THEN e.net ELSE 0
      END), 0)::DECIMAL - (SELECT total FROM withdrawn),
      0
    ) AS solde_disponible,
    COALESCE(SUM(CASE
      WHEN (e.date_confirmation IS NULL OR now() - e.date_confirmation <= INTERVAL '48 hours')
        AND (e.withdrawal_available_at IS NULL OR now() < e.withdrawal_available_at)
      THEN e.net ELSE 0
    END), 0)::DECIMAL AS solde_en_attente,
    (SELECT total FROM withdrawn)::DECIMAL AS solde_retire
  FROM earnings e;
END;
$$;
