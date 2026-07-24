-- Migration: 24h auto-confirm for verified sellers (vs 72h for unverified)
-- Run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION vendor_declare_delivery(p_transaction_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id UUID;
  v_is_verified BOOLEAN;
  v_delay INTERVAL;
BEGIN
  -- Verify caller is the seller
  SELECT t.vendeur_id INTO v_seller_id
  FROM transactions_escrow t
  WHERE t.id = p_transaction_id AND t.statut = 'paiement_valide';

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Transaction introuvable ou statut incorrect';
  END IF;

  IF v_seller_id != auth.uid() THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  -- Check if seller is verified
  SELECT verified INTO v_is_verified
  FROM profiles
  WHERE id = v_seller_id;

  -- Verified sellers: 24h auto-confirm, others: 72h
  v_delay := CASE WHEN v_is_verified = TRUE THEN INTERVAL '24 hours' ELSE INTERVAL '72 hours' END;

  UPDATE transactions_escrow
  SET
    statut = 'livre',
    date_livraison_declaree = NOW(),
    auto_confirm_at = NOW() + v_delay
  WHERE id = p_transaction_id;
END;
$$;
