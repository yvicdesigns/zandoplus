-- Nouvelle catégorie "Maison à louer" : logements publiés gratuitement par les
-- propriétaires eux-mêmes, sans démarcheur, sans frais. Réutilise type='service'
-- (déjà géré partout dans l'app : formulaire simplifié sans condition/quantité/
-- livraison, et pas de bouton Acheter/Panier sur la fiche annonce — juste message
-- et appel direct au propriétaire). Appliqué le 01/09/2026.

INSERT INTO public.categories (slug, name, type, display_order)
VALUES ('maison-a-louer', 'Maison à louer', 'service', 4);

INSERT INTO public.subcategories (category_id, name, display_order)
SELECT id, sub.name, sub.ord
FROM public.categories, (VALUES
  ('Studio', 1), ('Chambre', 2), ('Appartement', 3),
  ('Maison', 4), ('Villa', 5), ('Terrain', 6)
) AS sub(name, ord)
WHERE slug = 'maison-a-louer';

-- Statut 'rented' (texte libre, listings.status n'a pas de CHECK constraint) :
-- utilisé par le propriétaire lui-même (bouton "Marquer louée" dans son espace
-- vendeur, RLS déjà OK car il est propriétaire de sa propre annonce) pour retirer
-- instantanément son annonce de la recherche publique, sans passer par un admin.
-- Aucune migration de schéma nécessaire pour ce statut.
