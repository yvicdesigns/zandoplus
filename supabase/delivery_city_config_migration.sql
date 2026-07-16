-- ═══════════════════════════════════════════════════════════════
-- Gestion des modes de livraison par ville — Zando+
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS delivery_city_config (
  city                     text PRIMARY KEY,
  zando_delivery_enabled   boolean NOT NULL DEFAULT false,
  cod_enabled              boolean NOT NULL DEFAULT false,
  seller_delivery_enabled  boolean NOT NULL DEFAULT true,
  active                   boolean NOT NULL DEFAULT true,
  updated_at               timestamptz DEFAULT now()
);

-- RLS : lecture publique, écriture admin uniquement
ALTER TABLE delivery_city_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read delivery_city_config"
  ON delivery_city_config FOR SELECT USING (true);

CREATE POLICY "Admin write delivery_city_config"
  ON delivery_city_config FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));

-- Données initiales
INSERT INTO delivery_city_config (city, zando_delivery_enabled, cod_enabled, seller_delivery_enabled, active)
VALUES
  ('Brazzaville',  true,  true,  true, true),
  ('Pointe-Noire', false, false, true, true),
  ('Dolisie',      false, false, true, true)
ON CONFLICT (city) DO NOTHING;
