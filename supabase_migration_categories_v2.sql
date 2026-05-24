-- Migration: Expanded categories & subcategories (v2)
-- Run in Supabase SQL Editor
-- Safe: uses ON CONFLICT DO NOTHING + NOT EXISTS to avoid duplicates

-- ============================================================
-- 1. INSERT NEW + EXISTING CATEGORIES (ON CONFLICT = skip)
-- ============================================================
INSERT INTO categories (slug, name, type, display_order) VALUES
  ('electronics',           'Électronique',                   'product',  1),
  ('phones-tablets',        'Téléphones & Tablettes',         'product',  2),
  ('vehicles',              'Véhicules',                      'product',  3),
  ('real-estate',           'Immobilier',                     'product',  4),
  ('fashion',               'Mode & Vêtements',               'product',  5),
  ('maison-meubles',        'Maison & Meubles',               'product',  6),
  ('beaute-soins',          'Beauté & Soins personnels',      'product',  7),
  ('services',              'Des services',                   'service',  8),
  ('reparation-construction','Réparation & Construction',     'product',  9),
  ('equipement-commercial', 'Équipement & Outils Pro',        'product', 10),
  ('loisirs-sports',        'Loisirs & Sports',               'product', 11),
  ('bebes-enfants',         'Bébés & Enfants',                'product', 12),
  ('animaux',               'Animaux & Compagnie',            'product', 13),
  ('agro-alimentaire',      'Alimentation & Agriculture',     'product', 14),
  ('jobs',                  'Emplois',                        'job',     15),
  ('traditional-medicine',  'Médecine traditionnelle',        'product', 16)
ON CONFLICT (slug) DO UPDATE SET display_order = EXCLUDED.display_order;

-- ============================================================
-- 2. HELPER: insert subcategory only if not already present
-- ============================================================
-- We use NOT EXISTS on (category_id, name) pairs

-- ─── ÉLECTRONIQUE ───────────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Téléphones portables',           1),
  ('Accessoires Téléphones',         2),
  ('Tablettes',                      3),
  ('Montres connectées',             4),
  ('Écouteurs & Casques',            5),
  ('Ordinateurs Portables',          6),
  ('Ordinateurs de Bureau',          7),
  ('Écrans d''ordinateur',           8),
  ('TV & Équipement Vidéo',          9),
  ('Consoles de Jeux vidéo',        10),
  ('Jeux Vidéo',                    11),
  ('Équipement Audio & Musique',    12),
  ('Caméras & Appareils Photo',     13),
  ('Imprimantes & Scanners',        14),
  ('Équipement réseau',             15),
  ('Sécurité & Surveillance',       16),
  ('Accessoires Informatiques',     17),
  ('Logiciels',                     18)
) AS v(name, ord)
WHERE c.slug = 'electronics'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── TÉLÉPHONES & TABLETTES ─────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Téléphones portables',           1),
  ('Accessoires Téléphones & Tablettes', 2),
  ('Tablettes',                      3),
  ('Montres connectées',             4),
  ('Écouteurs & Casques',            5)
) AS v(name, ord)
WHERE c.slug = 'phones-tablets'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── VÉHICULES ──────────────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Voitures',                       1),
  ('Motos & Scooters',               2),
  ('Camions',                        3),
  ('Bus & Minibus',                  4),
  ('Vélos',                          5),
  ('Taxis & VTC',                    6),
  ('Bateaux & Pirogues',             7),
  ('Pièces & Accessoires Auto',      8),
  ('Pièces Motos',                   9)
) AS v(name, ord)
WHERE c.slug = 'vehicles'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── IMMOBILIER ─────────────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Appartement à Louer',            1),
  ('Appartement à Vendre',           2),
  ('Maison à Louer',                 3),
  ('Maison à Vendre',                4),
  ('Terrain',                        5),
  ('Bureau & Commerce',              6),
  ('Entrepôt & Hangar',              7),
  ('Location de Vacances',           8),
  ('Colocation',                     9)
) AS v(name, ord)
WHERE c.slug = 'real-estate'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── MODE & VÊTEMENTS ───────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Mode Femme',                     1),
  ('Mode Homme',                     2),
  ('Mode Enfant',                    3),
  ('Chaussures Femme',               4),
  ('Chaussures Homme',               5),
  ('Chaussures Enfant',              6),
  ('Sacs & Maroquinerie',            7),
  ('Bijoux',                         8),
  ('Montres',                        9),
  ('Accessoires Mode',              10),
  ('Vêtements Traditionnels',       11),
  ('Lunettes',                      12)
) AS v(name, ord)
WHERE c.slug = 'fashion'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── MAISON & MEUBLES ───────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Meubles Salon',                  1),
  ('Meubles Chambre',                2),
  ('Meubles Bureau',                 3),
  ('Cuisine & Salle à manger',       4),
  ('Éclairage',                      5),
  ('Décoration',                     6),
  ('Literie',                        7),
  ('Électroménager',                 8),
  ('Appareils de Cuisine',           9),
  ('Rangement & Organisation',      10),
  ('Produits Ménagers',             11),
  ('Jardinage',                     12),
  ('Fournitures de Maison',         13)
) AS v(name, ord)
WHERE c.slug = 'maison-meubles'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── BEAUTÉ & SOINS ─────────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Soins du Visage',                1),
  ('Soins des Cheveux',              2),
  ('Soins du Corps',                 3),
  ('Parfums',                        4),
  ('Maquillage',                     5),
  ('Bien-être & Relaxation',         6),
  ('Vitamines & Compléments',        7),
  ('Outils & Accessoires Beauté',    8),
  ('Services de Santé & Beauté',     9)
) AS v(name, ord)
WHERE c.slug = 'beaute-soins'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── SERVICES ───────────────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Services à Domicile',            1),
  ('Réparation & Dépannage',         2),
  ('Services Informatiques',         3),
  ('Transport & Déménagement',       4),
  ('Chauffeur & Transfert',          5),
  ('Événements & Fêtes',             6),
  ('Cours & Formation',              7),
  ('Coiffure & Beauté',              8),
  ('Nettoyage',                      9),
  ('Cuisine & Traiteur',            10),
  ('Services Juridiques',           11),
  ('Services Financiers',           12),
  ('Services de Santé',             13),
  ('Impression & Design',           14),
  ('Climatisation & Froid',         15),
  ('Plomberie',                     16),
  ('Électricité',                   17),
  ('Voyages & Circuits',            18)
) AS v(name, ord)
WHERE c.slug = 'services'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── RÉPARATION & CONSTRUCTION ──────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Matériaux de Construction',      1),
  ('Outillage Électroportatif',      2),
  ('Outils Manuels',                 3),
  ('Plomberie & Hydraulique',        4),
  ('Électricité & Éclairage',        5),
  ('Menuiserie & Bois',              6),
  ('Peinture & Revêtements',         7),
  ('Quincaillerie & Fixations',      8),
  ('Portes & Sécurité',              9),
  ('Fenêtres & Vitrerie',           10),
  ('Climatisation & Ventilation',   11),
  ('Carrelage & Sols',              12)
) AS v(name, ord)
WHERE c.slug = 'reparation-construction'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── ÉQUIPEMENT & OUTILS PRO ────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Équipement de Commerce',         1),
  ('Équipement de Restauration',     2),
  ('Équipement de Bureau',           3),
  ('Papeterie & Fournitures',        4),
  ('Équipement de Salon & Beauté',   5),
  ('Équipement Médical',             6),
  ('Équipement de Sécurité',         7),
  ('Équipement d''Impression',       8),
  ('Équipement Scénique',            9),
  ('Matériaux de Fabrication',      10)
) AS v(name, ord)
WHERE c.slug = 'equipement-commercial'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── LOISIRS & SPORTS ───────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Équipement Sportif',             1),
  ('Fitness & Musculation',          2),
  ('Sports d''Eau',                  3),
  ('Vélos & Trottinettes',           4),
  ('Instruments de Musique',         5),
  ('Livres & Magazines',             6),
  ('Jeux de Société',                7),
  ('Camping & Randonnée',            8),
  ('Arts & Loisirs Créatifs',        9),
  ('Musique & Vidéo',               10),
  ('Jeux de Plein Air',             11)
) AS v(name, ord)
WHERE c.slug = 'loisirs-sports'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── BÉBÉS & ENFANTS ────────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Jouets & Jeux',                  1),
  ('Vêtements Enfant',               2),
  ('Chaussures Enfant',              3),
  ('Équipement Bébé',                4),
  ('Meubles Enfant',                 5),
  ('Poussettes & Transport',         6),
  ('Alimentation Bébé',              7),
  ('Puériculture',                   8),
  ('Maternité & Grossesse',          9),
  ('Garde d''Enfants & Éducation',  10)
) AS v(name, ord)
WHERE c.slug = 'bebes-enfants'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── ANIMAUX & COMPAGNIE ────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Chiens & Chiots',                1),
  ('Chats & Chatons',                2),
  ('Oiseaux',                        3),
  ('Poissons & Aquariums',           4),
  ('Accessoires Animaux',            5),
  ('Alimentation Animaux',           6),
  ('Services Vétérinaires',          7),
  ('Autres Animaux',                 8)
) AS v(name, ord)
WHERE c.slug = 'animaux'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── ALIMENTATION & AGRICULTURE ─────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Produits Maraîchers',            1),
  ('Fruits Tropicaux',               2),
  ('Élevage & Bétail',               3),
  ('Pêche & Produits de Mer',        4),
  ('Repas & Boissons',               5),
  ('Produits Transformés',           6),
  ('Graines & Engrais',              7),
  ('Machines Agricoles',             8),
  ('Aliments pour Animaux',          9),
  ('Bois & Charbon',                10)
) AS v(name, ord)
WHERE c.slug = 'agro-alimentaire'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── EMPLOIS ────────────────────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Informatique & Tech',            1),
  ('Commerce & Vente',               2),
  ('Administration & Secrétariat',   3),
  ('Comptabilité & Finance',         4),
  ('Construction & BTP',             5),
  ('Transport & Logistique',         6),
  ('Santé & Médical',                7),
  ('Éducation & Formation',          8),
  ('Hôtellerie & Restauration',      9),
  ('Marketing & Communication',     10),
  ('Banque & Assurance',            11),
  ('Agriculture & Élevage',         12),
  ('Sécurité & Gardiennage',        13),
  ('Artisanat',                     14),
  ('Stage',                         15),
  ('Freelance',                     16)
) AS v(name, ord)
WHERE c.slug = 'jobs'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );

-- ─── MÉDECINE TRADITIONNELLE ─────────────────────────────────
INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, v.name, v.ord FROM categories c,
(VALUES
  ('Herbes & Plantes médicinales',   1),
  ('Potions & Remèdes',              2),
  ('Traitements traditionnels',      3),
  ('Consultations',                  4)
) AS v(name, ord)
WHERE c.slug = 'traditional-medicine'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.name = v.name
  );
