-- Migration: table isolée pour le nouveau Hero Builder (drag & drop)
-- Run this in Supabase SQL Editor
--
-- Table complètement séparée de `hero_slides` (utilisée en production par
-- HeroSection.jsx / HeroSlideEditor.jsx) — aucune donnée ni comportement
-- existant n'est modifié par cette migration.

CREATE TABLE IF NOT EXISTS public.hero_slides_v2 (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL DEFAULT 'Nouveau slide',
  "order"     SMALLINT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT false,
  background  JSONB NOT NULL DEFAULT '{"desktop":"","tablet":"","mobile":""}'::jsonb,
  elements    JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_v2_order ON public.hero_slides_v2 ("order");

ALTER TABLE public.hero_slides_v2 ENABLE ROW LEVEL SECURITY;

-- Lecture publique (même modèle que hero_slides, pour un futur rendu homepage)
CREATE POLICY "hero_slides_v2_select_public" ON public.hero_slides_v2
  FOR SELECT USING (true);

-- Écriture réservée aux admins (même pattern que le reste du projet)
CREATE POLICY "hero_slides_v2_write_admin" ON public.hero_slides_v2
  FOR ALL USING (
    (SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true'
  )
  WITH CHECK (
    (SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true'
  );

CREATE OR REPLACE FUNCTION public.set_updated_at_hero_slides_v2()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hero_slides_v2_updated_at ON public.hero_slides_v2;
CREATE TRIGGER trg_hero_slides_v2_updated_at
  BEFORE UPDATE ON public.hero_slides_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_hero_slides_v2();
