-- ============================================================
-- Système de drip email — 50 emails/jour automatiques
-- Exécuter dans Supabase SQL Editor APRÈS avoir déployé
-- la fonction process-campaign-queue avec --no-verify-jwt
-- ============================================================

-- Extensions (déjà activées via momo_payments_cron.sql)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ------------------------------------------------------------
-- Table de file d'attente des campagnes email
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaign_jobs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   text NOT NULL,
  segment       text NOT NULL DEFAULT 'all',
  email         text NOT NULL,
  name          text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'pending',   -- pending | sent | failed
  created_at    timestamptz DEFAULT now(),
  sent_at       timestamptz,
  UNIQUE (campaign_id, email)  -- évite les doublons si on relance
);

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_status_created
  ON campaign_jobs(status, created_at);

-- RLS
ALTER TABLE campaign_jobs ENABLE ROW LEVEL SECURITY;

-- Seul le service role (Edge Functions) peut lire/écrire
CREATE POLICY "service_role_all"
  ON campaign_jobs
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ------------------------------------------------------------
-- Cron : traitement automatique chaque jour à 9h00 UTC
-- (= 10h00 heure de Brazzaville, WAT = UTC+1)
-- ------------------------------------------------------------
SELECT cron.schedule(
  'process-email-campaign-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://axlpfskrrlwibcnxkfvb.supabase.co/functions/v1/process-campaign-queue',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- Vérification : lister les crons actifs
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'process-email-campaign-daily';
