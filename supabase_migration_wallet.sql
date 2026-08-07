-- ============================================================
-- MIGRATION: wallet_withdrawals + momo_number sur profiles
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Ajouter momo_number sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS momo_number TEXT;

-- 2. Ajouter commission_amount sur transactions_escrow
ALTER TABLE public.transactions_escrow
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2);

-- 3. Table des demandes de retrait vendeur
CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendeur_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  montant         DECIMAL(12,2) NOT NULL,
  momo_number     TEXT NOT NULL,
  statut          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (statut IN ('pending', 'processing', 'paid', 'rejected')),
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at         TIMESTAMPTZ
);

ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendeur peut voir ses retraits" ON public.wallet_withdrawals
  FOR SELECT USING (auth.uid() = vendeur_id);

CREATE POLICY "Vendeur peut créer un retrait" ON public.wallet_withdrawals
  FOR INSERT WITH CHECK (auth.uid() = vendeur_id);

CREATE POLICY "Admin full access on withdrawals" ON public.wallet_withdrawals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_withdrawals_vendeur ON public.wallet_withdrawals(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_statut ON public.wallet_withdrawals(statut);

-- 4. Fonction pour calculer le solde vendeur
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
