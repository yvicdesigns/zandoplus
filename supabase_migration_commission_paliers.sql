-- Passe la commission Zando Sécurisé d'un taux plat (5%, plafond 10 000 FCFA)
-- à un barème à paliers, décidé le 22/09/2026 :
--   - montant < 10 000 FCFA  : 8%
--   - 10 000 <= montant <= 200 000 FCFA : 5%
--   - montant > 200 000 FCFA : plafonnée à 10 000 FCFA
-- compute_commission() centralise la formule pour create_escrow_transaction
-- et get_vendor_wallet (même principe que src/lib/commission.js côté front).

CREATE OR REPLACE FUNCTION public.compute_commission(p_montant numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_montant < 10000 THEN ROUND(p_montant * 0.08, 2)
    WHEN p_montant <= 200000 THEN ROUND(p_montant * 0.05, 2)
    ELSE 10000
  END;
$$;

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

  v_commission := public.compute_commission(v_listing.price);

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
      (te.montant - COALESCE(te.commission_amount, public.compute_commission(te.montant))) AS net
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
