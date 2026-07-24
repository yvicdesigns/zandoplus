-- ============================================================
-- Migration : système d'avis vendeur
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. S'assurer que la table seller_ratings existe avec les bonnes colonnes
CREATE TABLE IF NOT EXISTS seller_ratings (
  seller_id     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count  INTEGER DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger : mettre à jour seller_ratings automatiquement à chaque avis
CREATE OR REPLACE FUNCTION sync_seller_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id UUID;
  v_avg       NUMERIC(3,2);
  v_count     INTEGER;
BEGIN
  v_seller_id := COALESCE(NEW.seller_id, OLD.seller_id);

  SELECT
    ROUND(AVG(rating)::NUMERIC, 2),
    COUNT(*)
  INTO v_avg, v_count
  FROM reviews
  WHERE seller_id = v_seller_id;

  INSERT INTO seller_ratings (seller_id, average_rating, review_count, updated_at)
  VALUES (v_seller_id, COALESCE(v_avg, 0), COALESCE(v_count, 0), NOW())
  ON CONFLICT (seller_id)
  DO UPDATE SET
    average_rating = COALESCE(v_avg, 0),
    review_count   = COALESCE(v_count, 0),
    updated_at     = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_seller_rating ON reviews;
CREATE TRIGGER trigger_sync_seller_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_seller_rating();

-- 3. Initialiser seller_ratings pour tous les avis existants
INSERT INTO seller_ratings (seller_id, average_rating, review_count, updated_at)
SELECT
  seller_id,
  ROUND(AVG(rating)::NUMERIC, 2),
  COUNT(*),
  NOW()
FROM reviews
GROUP BY seller_id
ON CONFLICT (seller_id)
DO UPDATE SET
  average_rating = EXCLUDED.average_rating,
  review_count   = EXCLUDED.review_count,
  updated_at     = NOW();

-- 4. Colonne verified_purchase sur reviews (pour affichage futur)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT FALSE;

-- Marquer les avis existants comme vérifiés s'il existe une transaction liée
UPDATE reviews r
SET verified_purchase = TRUE
WHERE EXISTS (
  SELECT 1 FROM transactions_escrow t
  WHERE t.acheteur_id = r.reviewer_id
    AND t.annonce_id  = r.listing_id
    AND t.statut IN ('confirme', 'complete', 'retrait_demande', 'withdrawal_sent')
);
