-- Ajoute le toggle "Retrait en personne" par ville
ALTER TABLE public.delivery_city_config
  ADD COLUMN IF NOT EXISTS pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Met à jour les villes existantes : retrait activé par défaut (il l'était implicitement avant)
UPDATE public.delivery_city_config
  SET pickup_enabled = TRUE
  WHERE pickup_enabled IS NULL;
