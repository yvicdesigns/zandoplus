-- Avis (reviews) — enforcement "acheteur vérifié" côté base (10/09/2026)
-- Avant : la policy INSERT n'exigeait que auth.uid() = reviewer_id
--   -> n'importe quel compte pouvait poster un faux avis via l'API REST,
--      même sans avoir jamais acheté l'article.
-- Après : il faut une transaction de CET acheteur, sur CETTE annonce,
--   à un statut "livré ou mieux" (paiement sécurisé ou cash à la livraison).

-- 1. Une seule policy INSERT stricte (on retire les 2 permissives existantes)
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;

CREATE POLICY "Verified buyers can insert reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.transactions_escrow t
      WHERE t.acheteur_id = auth.uid()
        AND t.annonce_id  = reviews.listing_id
        AND t.statut = ANY (ARRAY['livre','cod_livre','confirme','retrait_demande','complete'])
    )
  );

-- 2. Un seul avis par acheteur et par annonce (anti-spam d'avis)
--    (aucune ligne existante -> pas de conflit)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_buyer_per_listing
  ON public.reviews (listing_id, reviewer_id);
