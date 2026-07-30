-- Offre du jour : sélection manuelle par admin
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_daily_offer BOOLEAN DEFAULT false;

-- Index pour la requête homepage
CREATE INDEX IF NOT EXISTS idx_listings_daily_offer ON listings(is_daily_offer) WHERE is_daily_offer = true;
