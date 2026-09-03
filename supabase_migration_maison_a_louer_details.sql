-- Champs détaillés pour "Maison à louer" — demandés par l'utilisateur après avoir vu
-- que le formulaire générique "service" ne posait pas les bonnes questions (chambres,
-- annexe, indépendance, meublée, eau/électricité, avance demandée). Appliqué 01/09/2026.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS bedrooms integer,
  ADD COLUMN IF NOT EXISTS is_furnished boolean,
  ADD COLUMN IF NOT EXISTS has_separate_living_room boolean,
  ADD COLUMN IF NOT EXISTS bathroom_location text,   -- 'interior' | 'exterior'
  ADD COLUMN IF NOT EXISTS has_running_water boolean,
  ADD COLUMN IF NOT EXISTS has_electricity boolean,
  ADD COLUMN IF NOT EXISTS has_annex boolean,
  ADD COLUMN IF NOT EXISTS advance_months integer;   -- avance demandée par le propriétaire, en mois

-- "Indépendance" = un type de logement (petit logement séparé, avec son propre
-- accès, distinct de la maison principale) — ajouté comme sous-catégorie, pas
-- comme caractéristique booléenne.
INSERT INTO public.subcategories (category_id, name, display_order)
SELECT id, 'Indépendance', 7 FROM public.categories WHERE slug = 'maison-a-louer';
