-- ============================================================================
-- Distingue "a vendre" vs "a louer" pour les Vehicules et l'Immobilier.
-- Avant : une voiture postee "a louer" recevait quand meme les boutons
-- d'achat en ligne (panier, Achat Securise, paiement a la livraison), ce qui
-- n'a pas de sens pour une location. "Maison a louer" est deja une categorie
-- a part entiere (toujours une location, type 'service') et n'est pas
-- concernee par ce changement.
-- ============================================================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS listing_purpose text NOT NULL DEFAULT 'sale'
  CHECK (listing_purpose IN ('sale', 'rent'));

-- "Maison a louer" est toujours une location, meme pour les annonces
-- deja publiees avant ce changement.
UPDATE public.listings
SET listing_purpose = 'rent'
WHERE category = 'maison-a-louer' AND listing_purpose <> 'rent';
