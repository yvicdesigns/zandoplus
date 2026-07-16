-- ═══════════════════════════════════════════════════════════════
-- COD : frais livraison par zone (Brazzaville)
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Mise à jour du RPC create_cod_transaction
-- Nouveau paramètre : p_zone (zone de livraison)
-- Le frais est calculé côté serveur selon la zone → non manipulable
CREATE OR REPLACE FUNCTION create_cod_transaction(
  p_annonce_id        uuid,
  p_adresse_livraison text DEFAULT NULL,
  p_telephone_contact text DEFAULT NULL,
  p_zone              text DEFAULT 'zone2'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing         record;
  v_commission_rate numeric := 0.07;
  v_delivery_fee    integer;
  v_commission      integer;
  v_montant_vendeur integer;
  v_tx_id           uuid;
BEGIN
  -- Calculer les frais selon la zone (définis par Zando, non transmis par le client)
  v_delivery_fee := CASE p_zone
    WHEN 'zone1' THEN 1000   -- Proche : Poto-Poto, Moungali, Centre-ville
    WHEN 'zone2' THEN 2000   -- Moyen : Bacongo, Makélékélé, Ouenzé
    WHEN 'zone3' THEN 3500   -- Éloigné : Talangaï, Mfilou, Madibou, Djiri
    WHEN 'hors'  THEN 7000   -- Hors Brazzaville : Pointe-Noire, Dolisie…
    ELSE 2000
  END;

  -- Récupérer l'annonce
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

  v_commission      := ROUND(v_listing.price * v_commission_rate);
  v_montant_vendeur := v_listing.price - v_commission;

  INSERT INTO transactions_escrow (
    annonce_id, acheteur_id, vendeur_id,
    montant, commission, montant_vendeur,
    frais_livraison, statut, payment_method,
    delivery_choice, adresse_livraison, telephone_contact
  ) VALUES (
    p_annonce_id, auth.uid(), v_listing.user_id,
    v_listing.price, v_commission, v_montant_vendeur,
    v_delivery_fee, 'cod_en_attente', 'cod',
    'zando', p_adresse_livraison, p_telephone_contact
  )
  RETURNING id INTO v_tx_id;

  -- Notification vendeur
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_listing.user_id, 'new_cod_order',
    '📦 Nouvelle commande à livrer',
    'Commande paiement à la livraison : ' || v_listing.title,
    jsonb_build_object('transaction_id', v_tx_id, 'url', '/transactions')
  );

  RETURN v_tx_id;
END;
$$;
