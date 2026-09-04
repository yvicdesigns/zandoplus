-- Bandeau "Nouvelle version disponible" dans l'app native — l'App Store/Play
-- Store ne préviennent jamais l'app elle-même qu'une nouvelle version existe ;
-- il faut donc que l'app compare sa propre version à une valeur qu'on contrôle.
-- min_*_version reste vide pour l'instant (aucun blocage forcé) — réservé aux
-- urgences (faille de sécurité, incompatibilité serveur). Appliqué le 04/09/2026.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS latest_ios_version text,
  ADD COLUMN IF NOT EXISTS latest_android_version text,
  ADD COLUMN IF NOT EXISTS min_ios_version text,
  ADD COLUMN IF NOT EXISTS min_android_version text;

UPDATE public.site_settings
SET latest_ios_version = '1.4.0', latest_android_version = '1.4.0'
WHERE id = 1;
