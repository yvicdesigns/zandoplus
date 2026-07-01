-- ═══════════════════════════════════════════════════════════════
-- Cash on Delivery (Paiement à la livraison) — Zando+
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Colonne sur listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS accepts_cash_on_delivery boolean DEFAULT false;

-- 2. Colonne payment_method sur transactions_escrow
ALTER TABLE transactions_escrow
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'escrow'
  CHECK (payment_method IN ('escrow', 'cod'));

-- 3. Ajouter les nouveaux statuts COD au check existant
ALTER TABLE transactions_escrow
  DROP CONSTRAINT IF EXISTS transactions_escrow_statut_check;

ALTER TABLE transactions_escrow
  ADD CONSTRAINT transactions_escrow_statut_check CHECK (
    statut IN (
      -- Flux escrow classique
      'en_attente_paiement', 'fonds_bloques', 'paiement_valide',
      'livre', 'confirme', 'retrait_demande', 'complete',
      'litige', 'rembourse',
      -- Flux COD (paiement à la livraison)
      'cod_en_attente',   -- commande placée, en attente livraison
      'cod_livre',        -- livré + cash collecté par livreur Zando
      'cod_annule'        -- annulé avant livraison
    )
  );

-- 4. RPC pour créer une transaction COD
CREATE OR REPLACE FUNCTION create_cod_transaction(
  p_annonce_id uuid,
  p_adresse_livraison text DEFAULT NULL,
  p_telephone_contact text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing         record;
  v_commission_rate numeric := 0.07;
  v_delivery_fee    integer := 1500;
  v_commission      integer;
  v_montant_vendeur integer;
  v_tx_id           uuid;
BEGIN
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
    annonce_id,
    acheteur_id,
    vendeur_id,
    montant,
    commission,
    montant_vendeur,
    frais_livraison,
    statut,
    payment_method,
    delivery_choice,
    adresse_livraison,
    telephone_contact
  ) VALUES (
    p_annonce_id,
    auth.uid(),
    v_listing.user_id,
    v_listing.price,
    v_commission,
    v_montant_vendeur,
    v_delivery_fee,
    'cod_en_attente',
    'cod',
    'zando',
    p_adresse_livraison,
    p_telephone_contact
  )
  RETURNING id INTO v_tx_id;

  -- Notification vendeur
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_listing.user_id,
    'new_cod_order',
    '📦 Nouvelle commande à livrer',
    'Vous avez une commande "paiement à la livraison" pour : ' || v_listing.title,
    jsonb_build_object('transaction_id', v_tx_id, 'url', '/transactions')
  );

  RETURN v_tx_id;
END;
$$;

-- 5. Colonnes adresse/téléphone sur transactions_escrow (si pas existantes)
ALTER TABLE transactions_escrow
  ADD COLUMN IF NOT EXISTS adresse_livraison text,
  ADD COLUMN IF NOT EXISTS telephone_contact text;

-- 6. RPC admin: marquer COD comme livré (cash collecté)
CREATE OR REPLACE FUNCTION admin_confirm_cod_delivery(p_tx_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tx record;
BEGIN
  -- Vérifier admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT * INTO v_tx FROM transactions_escrow WHERE id = p_tx_id;
  IF NOT FOUND OR v_tx.statut != 'cod_en_attente' THEN
    RAISE EXCEPTION 'Transaction COD introuvable ou déjà traitée';
  END IF;

  -- Marquer livré + crediter le wallet vendeur
  UPDATE transactions_escrow
  SET statut = 'cod_livre', date_confirmation = now(), updated_at = now()
  WHERE id = p_tx_id;

  -- Créditer wallet vendeur (Zando a collecté le cash, on verse la part vendeur)
  UPDATE wallet_withdrawals SET statut = 'paid' WHERE transaction_id = p_tx_id;

  -- Notification vendeur
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_tx.vendeur_id,
    'cod_livre',
    '💰 Paiement reçu — livraison confirmée',
    'Votre commande a été livrée et le paiement collecté. Votre solde sera crédité.',
    jsonb_build_object('transaction_id', p_tx_id, 'url', '/wallet')
  );

  -- Notification acheteur
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_tx.acheteur_id,
    'cod_livre',
    '✅ Livraison confirmée',
    'Votre commande a été marquée comme livrée.',
    jsonb_build_object('transaction_id', p_tx_id, 'url', '/transactions')
  );
END;
$$;
