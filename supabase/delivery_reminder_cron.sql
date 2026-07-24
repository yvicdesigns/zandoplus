-- ============================================================
-- Cron job : rappel de confirmation de réception (toutes les heures)
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Planifier le job toutes les heures
SELECT cron.schedule(
  'notify-delivery-reminder',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://axlpfskrrlwibcnxkfvb.supabase.co/functions/v1/notify-delivery-reminder',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
