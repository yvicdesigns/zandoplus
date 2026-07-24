-- ============================================================
-- Migration : système d'avis vendeur
-- Exécutée avec succès le 2026-07-24
-- ============================================================

-- seller_ratings est une VIEW auto-calculée depuis reviews — pas de trigger nécessaire

-- Colonne verified_purchase sur reviews
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
