-- ============================================================
-- Cron : automatisation des paiements MTN MoMo / Airtel Money
-- À exécuter dans Supabase → SQL Editor, APRÈS avoir déployé les
-- fonctions edge momo-auto-payout et momo-collection-status-poll
-- avec `--no-verify-jwt` (voir supabase/config.toml).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ------------------------------------------------------------
-- 1. Confirmation automatique de réception (déjà écrit dans
-- supabase_migration_withdrawal.sql, mais jamais appelé que
-- côté client au chargement de page — on ferme cette lacune de
-- fiabilité avec un vrai cron). Appel SQL direct, pas besoin de
-- pg_net puisqu'il n'y a pas de fonction edge à invoquer.
-- ------------------------------------------------------------
SELECT cron.schedule(
  'auto-confirm-transactions',
  '*/15 * * * *',
  $$ SELECT auto_confirm_transactions(); $$
);

-- ------------------------------------------------------------
-- 2. Reversement automatique au vendeur (claim → process →
-- finalize), toutes les 15 min. C'est le remplaçant automatique
-- du clic "demander le retrait" + email à l'admin.
-- ------------------------------------------------------------
SELECT cron.schedule(
  'momo-auto-payout',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://axlpfskrrlwibcnxkfvb.supabase.co/functions/v1/momo-auto-payout',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- ------------------------------------------------------------
-- 3. Filet de sécurité pour la collecte acheteur : vérifie
-- activement le statut des paiements 'pending' au cas où le
-- webhook momo-collection-webhook n'arrive pas.
-- ------------------------------------------------------------
SELECT cron.schedule(
  'momo-collection-status-poll',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://axlpfskrrlwibcnxkfvb.supabase.co/functions/v1/momo-collection-status-poll',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
