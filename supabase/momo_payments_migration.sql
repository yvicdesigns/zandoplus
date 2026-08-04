-- ============================================================
-- MIGRATION: Automatisation des paiements MTN MoMo / Airtel Money
-- Phase 1 (mode mock) — voir supabase/functions/momo-*
-- À exécuter dans Supabase → SQL Editor
--
-- N'ALTÈRE PAS le CHECK existant sur transactions_escrow.statut
-- (déjà modifié deux fois en prod par cod_migration.sql /
-- cart_checkout_migration.sql). Le suivi du virement automatique
-- vit dans une colonne séparée (payout_status), indépendante de
-- statut.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Colonnes de suivi du reversement automatique (disbursement)
-- ------------------------------------------------------------
ALTER TABLE public.transactions_escrow
  ADD COLUMN IF NOT EXISTS payout_status         TEXT
                              CHECK (payout_status IN ('processing', 'sent', 'failed')),
  ADD COLUMN IF NOT EXISTS payout_provider        TEXT
                              CHECK (payout_provider IN ('mtn', 'airtel')),
  ADD COLUMN IF NOT EXISTS payout_provider_ref    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS payout_attempts        INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_failure_reason  TEXT,
  ADD COLUMN IF NOT EXISTS payout_sent_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_claimed_at      TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 2. Colonnes de suivi de la collecte automatique (buyer payment)
-- ------------------------------------------------------------
ALTER TABLE public.transactions_escrow
  ADD COLUMN IF NOT EXISTS collection_provider     TEXT
                              CHECK (collection_provider IN ('mtn', 'airtel')),
  ADD COLUMN IF NOT EXISTS collection_provider_ref TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS collection_status       TEXT
                              CHECK (collection_status IN ('pending', 'successful', 'failed', 'expired'));

-- Index pour le cron de reversement (claim_payout_batch)
CREATE INDEX IF NOT EXISTS idx_escrow_payout_eligible
  ON public.transactions_escrow (withdrawal_available_at)
  WHERE payout_status IS NULL;

-- Index pour le poll de collecte (momo-collection-status-poll)
CREATE INDEX IF NOT EXISTS idx_escrow_collection_pending
  ON public.transactions_escrow (collection_status)
  WHERE collection_status = 'pending';

-- ------------------------------------------------------------
-- 3. Provider MoMo du vendeur (mtn_number ≠ airtel_number, on ne
--    devine jamais depuis le préfixe du numéro)
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS momo_provider TEXT
    CHECK (momo_provider IN ('mtn', 'airtel'));

-- ------------------------------------------------------------
-- 4. Journal des appels API (collecte + reversement), pour la
--    réconciliation et les litiges — argent réel, on garde tout.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_provider_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID REFERENCES public.transactions_escrow(id) ON DELETE SET NULL,
  direction        TEXT NOT NULL CHECK (direction IN ('collection', 'disbursement')),
  provider         TEXT NOT NULL CHECK (provider IN ('mtn', 'airtel', 'mock')),
  request_payload  JSONB,
  response_payload JSONB,
  http_status      INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_provider_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment logs" ON public.payment_provider_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction ON public.payment_provider_logs(transaction_id);

-- ============================================================
-- RPC: claim_payout_batch
-- Étape "claim" du pattern claim → process → finalize.
-- Verrouille et réserve un lot de transactions éligibles au
-- reversement automatique en une seule opération atomique
-- (FOR UPDATE SKIP LOCKED), pour que deux exécutions de cron
-- qui se chevauchent ne prennent jamais la même ligne.
-- Appelée uniquement par la fonction edge momo-auto-payout
-- (clé service_role) ou un admin.
-- ============================================================
CREATE OR REPLACE FUNCTION claim_payout_batch(p_batch_size INT DEFAULT 50)
RETURNS TABLE (
  id                  UUID,
  montant             DECIMAL,
  commission_amount   DECIMAL,
  vendeur_id          UUID,
  vendeur_momo_number TEXT,
  payout_provider     TEXT,
  payout_provider_ref TEXT,
  payout_attempts     INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Références qualifiées : RETURNS TABLE déclare "id" comme
  -- variable locale à toute la fonction, donc "id" seul dans cette
  -- sous-requête serait ambigu avec profiles.id (bug détecté en
  -- testant contre un vrai Postgres, pas juste à la lecture).
  IF NOT (auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  RETURN QUERY
  UPDATE transactions_escrow te
  SET
    payout_status           = 'processing',
    payout_attempts         = te.payout_attempts + 1,
    payout_claimed_at       = NOW(),
    payout_provider         = COALESCE(te.payout_provider, p.momo_provider),
    payout_provider_ref     = COALESCE(te.payout_provider_ref, gen_random_uuid()::text),
    statut                  = CASE WHEN te.statut = 'confirme' THEN 'retrait_demande' ELSE te.statut END,
    withdrawal_requested_at = COALESCE(te.withdrawal_requested_at, NOW()),
    vendeur_momo_number     = COALESCE(te.vendeur_momo_number, p.momo_number)
  FROM profiles p
  WHERE te.vendeur_id = p.id
    AND te.id IN (
      SELECT t.id
      FROM transactions_escrow t
      JOIN profiles pr ON pr.id = t.vendeur_id
      WHERE t.statut IN ('confirme', 'retrait_demande')
        AND t.withdrawal_available_at IS NOT NULL
        AND t.withdrawal_available_at < NOW()
        AND (t.payout_status IS NULL OR (t.payout_status = 'failed' AND t.payout_attempts < 5))
        AND pr.momo_number IS NOT NULL
        AND pr.momo_provider IS NOT NULL
      ORDER BY t.withdrawal_available_at
      LIMIT p_batch_size
      FOR UPDATE OF t SKIP LOCKED
    )
  RETURNING te.id, te.montant, te.commission_amount, te.vendeur_id,
            te.vendeur_momo_number, te.payout_provider, te.payout_provider_ref, te.payout_attempts;
END;
$$;

-- ============================================================
-- RPC: finalize_payout
-- Étape "finalize" — appelée une fois par ligne réclamée, après
-- l'appel réseau au provider (jamais pendant, aucun verrou tenu
-- pendant l'appel HTTP).
-- ============================================================
CREATE OR REPLACE FUNCTION finalize_payout(
  p_transaction_id UUID,
  p_success        BOOLEAN,
  p_provider_ref   TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  IF p_success THEN
    UPDATE transactions_escrow
    SET
      payout_status       = 'sent',
      statut               = 'complete',
      payout_sent_at       = NOW(),
      payout_provider_ref  = COALESCE(p_provider_ref, payout_provider_ref)
    WHERE id = p_transaction_id;
  ELSE
    UPDATE transactions_escrow
    SET
      payout_status         = 'failed',
      payout_failure_reason = p_failure_reason
    WHERE id = p_transaction_id;
  END IF;
END;
$$;

-- ============================================================
-- RPC: get_stuck_payouts
-- Réconciliation — lignes bloquées en 'processing' (fonction edge
-- crashée en plein appel réseau). Ne JAMAIS relancer directement:
-- l'appelant doit d'abord vérifier le statut réel côté provider
-- (getDisbursementStatus) avant de décider processing→failed.
-- ============================================================
CREATE OR REPLACE FUNCTION get_stuck_payouts(p_minutes INT DEFAULT 10)
RETURNS TABLE (id UUID, payout_provider TEXT, payout_provider_ref TEXT, payout_claimed_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Voir la note dans claim_payout_batch : "id" seul serait
  -- ambigu ici (RETURNS TABLE déclare id comme variable locale).
  IF NOT (auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  RETURN QUERY
  SELECT te.id, te.payout_provider, te.payout_provider_ref, te.payout_claimed_at
  FROM transactions_escrow te
  WHERE te.payout_status = 'processing'
    AND te.payout_claimed_at < NOW() - (p_minutes || ' minutes')::interval;
END;
$$;

-- ============================================================
-- RPC: admin_retry_payout
-- Filet de sécurité manuel — un admin relance une ligne en échec
-- définitif (payout_attempts >= 5) sans attendre le cron.
-- ============================================================
CREATE OR REPLACE FUNCTION admin_retry_payout(p_transaction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  UPDATE transactions_escrow
  SET
    payout_status         = NULL,
    payout_attempts       = 0,
    payout_failure_reason = NULL
  WHERE id = p_transaction_id
    AND payout_status = 'failed';
END;
$$;

-- ============================================================
-- RPC: system_confirm_collection
-- Confirmation de paiement acheteur reçue via webhook provider —
-- remplace la validation manuelle admin (admin_validate_payment)
-- pour les paiements passés par la collecte automatique.
-- Appelable uniquement par la clé service_role (jamais le client,
-- jamais un admin) : c'est la frontière de confiance qui atteste
-- que l'argent a réellement été reçu.
-- ============================================================
CREATE OR REPLACE FUNCTION system_confirm_collection(
  p_transaction_id UUID,
  p_provider       TEXT,
  p_provider_ref   TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  UPDATE transactions_escrow
  SET
    statut                  = 'paiement_valide',
    paiement_valide_at       = NOW(),
    collection_status        = 'successful',
    collection_provider      = p_provider,
    collection_provider_ref  = p_provider_ref
  WHERE id = p_transaction_id
    AND statut IN ('en_attente_paiement', 'fonds_bloques');
END;
$$;

-- ============================================================
-- CORRECTIF: get_vendor_wallet — l'ancienne version comparait
-- date_confirmation à un "48 hours" codé en dur, indépendant de
-- withdrawal_available_at (le vrai délai utilisé par
-- vendor_request_withdrawal / claim_payout_batch, qui vaut 24h
-- aujourd'hui). Résultat : le solde "disponible" affiché au
-- vendeur ne correspondait pas à ce qui était réellement
-- retirable. On aligne les deux sur withdrawal_available_at.
-- ============================================================
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
  IF auth.uid() != p_vendor_id AND v_role != 'admin' THEN
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
      (te.montant - COALESCE(te.commission_amount, ROUND(te.montant * 0.07, 2))) AS net
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
    COALESCE(SUM(CASE
      WHEN e.withdrawal_available_at IS NOT NULL
       AND e.withdrawal_available_at < now()
      THEN e.net ELSE 0
    END), 0)::DECIMAL - (SELECT total FROM withdrawn) AS solde_disponible,
    COALESCE(SUM(CASE
      WHEN e.withdrawal_available_at IS NULL
        OR e.withdrawal_available_at >= now()
      THEN e.net ELSE 0
    END), 0)::DECIMAL AS solde_en_attente,
    (SELECT total FROM withdrawn)::DECIMAL AS solde_retire
  FROM earnings e;
END;
$$;
