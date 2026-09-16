-- ============================================================================
-- 1) Corrige create_cod_transaction : cette fonction ecrivait dans des
--    colonnes qui n'existent plus (commission, montant_vendeur, frais_livraison)
--    -> chaque commande "paiement a la livraison" echouait avec une erreur
--    Postgres depuis toujours. Corrige les noms de colonnes reels
--    (commission_amount, delivery_fee_paid) et retire montant_vendeur
--    (n'existe pas comme colonne, calcule a la volee ailleurs comme
--    montant - commission_amount).
--    COD reste a 0% de commission (decide le 16/09/2026), coherent avec la
--    page A propos ("sinon vous vendez en direct sans aucun frais").
-- 2) Supprime le doublon a 3 arguments (jamais appele par le frontend, mort).
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_cod_transaction(uuid, text, text);

CREATE OR REPLACE FUNCTION public.create_cod_transaction(
  p_annonce_id uuid,
  p_adresse_livraison text DEFAULT NULL,
  p_telephone_contact text DEFAULT NULL,
  p_zone text DEFAULT 'zone2'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_listing      record;
  v_delivery_fee integer;
  v_tx_id        uuid;
BEGIN
  v_delivery_fee := CASE p_zone
    WHEN 'zone1' THEN 1000   -- Proche : Poto-Poto, Moungali, Centre-ville
    WHEN 'zone2' THEN 2000   -- Moyen : Bacongo, Makélékélé, Ouenzé
    WHEN 'zone3' THEN 3500   -- Éloigné : Talangaï, Mfilou, Madibou, Djiri
    ELSE 2000
  END;

  SELECT l.*, p.full_name AS seller_name
  INTO v_listing
  FROM listings l
  JOIN profiles p ON p.id = l.user_id
  WHERE l.id = p_annonce_id AND l.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Annonce introuvable ou inactive';
  END IF;

  IF v_listing.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Vous ne pouvez pas acheter votre propre annonce';
  END IF;

  IF NOT v_listing.accepts_cash_on_delivery THEN
    RAISE EXCEPTION 'Cette annonce n''accepte pas le paiement à la livraison';
  END IF;

  INSERT INTO transactions_escrow (
    annonce_id, acheteur_id, vendeur_id,
    montant, commission_amount,
    delivery_fee_paid, statut, payment_method,
    delivery_choice, adresse_livraison, telephone_contact
  ) VALUES (
    p_annonce_id, auth.uid(), v_listing.user_id,
    v_listing.price, 0,
    v_delivery_fee, 'cod_en_attente', 'cod',
    'zando', p_adresse_livraison, p_telephone_contact
  )
  RETURNING id INTO v_tx_id;

  INSERT INTO notifications (user_id, type, content, link)
  VALUES (
    v_listing.user_id,
    'new_cod_order',
    jsonb_build_object('message', 'Nouvelle commande à livrer : ' || v_listing.title),
    '/transactions'
  );

  RETURN v_tx_id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_vendor_wallet(p_vendor_id uuid)
 RETURNS TABLE(solde_total numeric, solde_disponible numeric, solde_en_attente numeric, solde_retire numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF auth.uid() != p_vendor_id AND v_role NOT IN ('admin', 'monetisation', 'gestion') THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  RETURN QUERY
  WITH earnings AS (
    SELECT
      te.montant,
      te.commission_amount,
      te.statut,
      te.date_confirmation,
      te.withdrawal_available_at,
      (te.montant - COALESCE(te.commission_amount, ROUND(te.montant * 0.10, 2))) AS net
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
$function$

