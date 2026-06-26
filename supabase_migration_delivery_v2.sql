-- ============================================================
-- MIGRATION: delivery_choice sur transactions_escrow
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Ajouter les colonnes de livraison sur transactions_escrow
ALTER TABLE public.transactions_escrow
  ADD COLUMN IF NOT EXISTS delivery_choice TEXT
    CHECK (delivery_choice IN ('zando', 'seller', 'pickup')),
  ADD COLUMN IF NOT EXISTS delivery_fee_paid DECIMAL(12,2) DEFAULT 0;

-- 2. Table des livraisons Zando (pour le suivi)
DROP TABLE IF EXISTS public.deliveries CASCADE;
CREATE TABLE public.deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    UUID REFERENCES public.transactions_escrow(id) ON DELETE SET NULL,
  annonce_id        UUID NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  acheteur_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  vendeur_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  statut            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (statut IN ('pending', 'in_transit', 'delivered', 'cancelled')),
  tracking_code     TEXT UNIQUE,
  livreur_notes     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at      TIMESTAMPTZ
);

-- Générer le tracking_code automatiquement via trigger
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code := 'ZND-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tracking_code ON public.deliveries;
CREATE TRIGGER trg_tracking_code
  BEFORE INSERT ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION generate_tracking_code();

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view their deliveries" ON public.deliveries
  FOR SELECT USING (auth.uid() = acheteur_id OR auth.uid() = vendeur_id);

CREATE POLICY "Admin full access on deliveries" ON public.deliveries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_deliveries_acheteur ON public.deliveries(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_vendeur  ON public.deliveries(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_statut   ON public.deliveries(statut);

-- 3. Fonction pour récupérer les livraisons de l'utilisateur
DROP FUNCTION IF EXISTS get_user_deliveries();
CREATE OR REPLACE FUNCTION get_user_deliveries()
RETURNS TABLE(
  id            UUID,
  statut        TEXT,
  tracking_code TEXT,
  created_at    TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  annonce       JSONB,
  acheteur      JSONB,
  vendeur       JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.statut,
    d.tracking_code,
    d.created_at,
    d.delivered_at,
    jsonb_build_object('id', l.id, 'title', l.title, 'images', l.images, 'price', l.price, 'currency', l.currency) AS annonce,
    jsonb_build_object('full_name', pa.full_name) AS acheteur,
    jsonb_build_object('full_name', pv.full_name) AS vendeur
  FROM deliveries d
  JOIN listings l ON l.id = d.annonce_id
  JOIN profiles pa ON pa.id = d.acheteur_id
  JOIN profiles pv ON pv.id = d.vendeur_id
  WHERE d.acheteur_id = auth.uid() OR d.vendeur_id = auth.uid()
  ORDER BY d.created_at DESC;
END;
$$;
