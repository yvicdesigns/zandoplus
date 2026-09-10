-- Fix : colonne `channel` manquante sur campaign_jobs (10/09/2026)
-- send-whatsapp-campaign (INSERT ... channel:'whatsapp'),
-- send-campaign et process-campaign-queue (SELECT/filter sur channel)
-- attendaient tous cette colonne qui n'existait pas -> toute campagne
-- "en boucle" (drip) échouait en silence (INSERT en erreur côté WhatsApp,
-- SELECT en erreur côté cron de traitement).
-- Appliqué en prod via psql.

ALTER TABLE public.campaign_jobs
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email';

ALTER TABLE public.campaign_jobs DROP CONSTRAINT IF EXISTS campaign_jobs_channel_check;
ALTER TABLE public.campaign_jobs ADD CONSTRAINT campaign_jobs_channel_check
  CHECK (channel IN ('email','whatsapp'));

COMMENT ON COLUMN public.campaign_jobs.channel IS
  'email | whatsapp — attendu par send-whatsapp-campaign, send-campaign et process-campaign-queue';
