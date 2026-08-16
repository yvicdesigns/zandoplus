-- Migration: interrupteur global pour activer le nouveau Hero Builder (v2) en production
-- Run this in Supabase SQL Editor
--
-- Tant que `hero_v2_enabled` est à false, la page d'accueil continue d'afficher l'ancien
-- Hero (table `hero_slides`) pour tous les visiteurs. Seuls les admins peuvent voir le
-- nouveau Hero (table `hero_slides_v2`) via /?heroPreview=v2. Passer la colonne à true
-- bascule le nouveau Hero pour tout le monde — modifiable depuis l'admin (AdminSiteTab)
-- ou directement en SQL, sans redéploiement.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_v2_enabled boolean NOT NULL DEFAULT false;
