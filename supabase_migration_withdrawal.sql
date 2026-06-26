-- ============================================================
-- MIGRATION: Système de retrait vendeur avec minuterie
-- Nouveaux statuts: paiement_valide, retrait_demande
-- Run in Supabase SQL Editor
-- ============================================================

-- Nouvelles colonnes sur transactions_escrow
ALTER TABLE transactions_escrow
  ADD COLUMN IF NOT EXISTS paiement_valide_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_confirm_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawal_available_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawal_requested_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vendeur_momo_number        TEXT;

-- ============================================================
-- RPC: Admin valide le paiement reçu (fonds_bloques → paiement_valide)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_validate_payment(p_transaction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE transactions_escrow
  SET
    statut             = 'paiement_valide',
    paiement_valide_at = NOW()
  WHERE id = p_transaction_id;
END;
$$;

-- ============================================================
-- RPC: Auto-confirme les transactions livrées dont le délai 72h est dépassé
-- Appelé côté client au chargement de la page
-- ============================================================
DROP FUNCTION IF EXISTS auto_confirm_transactions();
CREATE OR REPLACE FUNCTION auto_confirm_transactions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE transactions_escrow
  SET
    statut                   = 'confirme',
    date_confirmation        = NOW(),
    withdrawal_available_at  = NOW() + INTERVAL '24 hours'
  WHERE statut = 'livre'
    AND auto_confirm_at IS NOT NULL
    AND auto_confirm_at < NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- ============================================================
-- RPC: Acheteur confirme la réception (livre → confirme)
-- Déclenche la minuterie 24h pour le vendeur
-- ============================================================
CREATE OR REPLACE FUNCTION buyer_confirm_receipt(p_transaction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE transactions_escrow
  SET
    statut                  = 'confirme',
    date_confirmation       = NOW(),
    withdrawal_available_at = NOW() + INTERVAL '24 hours'
  WHERE id = p_transaction_id
    AND acheteur_id = auth.uid()
    AND statut = 'livre';
END;
$$;

-- ============================================================
-- RPC: Vendeur demande le retrait (confirme → retrait_demande)
-- Copie le numéro MoMo du vendeur dans la transaction
-- ============================================================
DROP FUNCTION IF EXISTS vendor_request_withdrawal(UUID);
CREATE OR REPLACE FUNCTION vendor_request_withdrawal(p_transaction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_momo TEXT;
BEGIN
  SELECT momo_number INTO v_momo
  FROM profiles
  WHERE id = auth.uid();

  UPDATE transactions_escrow
  SET
    statut                   = 'retrait_demande',
    withdrawal_requested_at  = NOW(),
    vendeur_momo_number      = v_momo
  WHERE id              = p_transaction_id
    AND vendeur_id       = auth.uid()
    AND statut           = 'confirme'
    AND withdrawal_available_at IS NOT NULL
    AND withdrawal_available_at < NOW();
END;
$$;

-- ============================================================
-- RPC: Admin marque le retrait comme effectué (retrait_demande → complete)
-- ============================================================
DROP FUNCTION IF EXISTS admin_complete_withdrawal(UUID);
CREATE OR REPLACE FUNCTION admin_complete_withdrawal(p_transaction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE transactions_escrow
  SET statut = 'complete'
  WHERE id = p_transaction_id;
END;
$$;
