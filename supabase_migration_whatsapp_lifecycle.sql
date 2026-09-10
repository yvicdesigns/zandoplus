-- WhatsApp cycle de vie (10/09/2026)
--   A. Message de bienvenue quand un numéro est ajouté à un compte
--   B. Relance auto hebdo "on vous a manqué" pour les inactifs avec numéro
-- Appliqué en prod via psql. Nécessite les templates Meta approuvés :
--   'zandoplus_bienvenue' (Marketing, 1 var = prénom)
--   'zandoplus_rappel'    (Marketing, 1 var = prénom)
-- Tant qu'ils ne sont pas approuvés, les envois échouent proprement
-- (journalisés dans email_send_log, pas d'erreur bloquante).

-- ── Colonnes de suivi ────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_whatsapp_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reengaged_at             timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_opted_out      boolean NOT NULL DEFAULT false;

-- ── A. Trigger : WhatsApp de bienvenue à l'ajout d'un numéro ─────────
CREATE OR REPLACE FUNCTION public.trigger_welcome_whatsapp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net', 'extensions'
AS $$
BEGIN
  IF NEW.phone IS NOT NULL
     AND NEW.welcome_whatsapp_sent_at IS NULL
     AND NOT NEW.marketing_opted_out
     AND (TG_OP = 'INSERT' OR OLD.phone IS DISTINCT FROM NEW.phone)
  THEN
    PERFORM net.http_post(
      url     := 'https://axlpfskrrlwibcnxkfvb.supabase.co/functions/v1/send-welcome-whatsapp',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := jsonb_build_object(
        'user_id', NEW.id::text,
        'phone',   NEW.phone,
        'name',    COALESCE(NEW.full_name, '')
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'trigger_welcome_whatsapp error: % — %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_whatsapp ON public.profiles;
CREATE TRIGGER trg_welcome_whatsapp
  AFTER INSERT OR UPDATE OF phone ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_whatsapp();

-- ── B. Cron : relance hebdo des inactifs ────────────────────────────
-- Interrupteur : la fonction queue-reengagement ne fait rien tant que
-- site_settings.reengagement_enabled = false. On l'active (UPDATE ... = true)
-- une fois le template 'zandoplus_rappel' approuvé par Meta.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS reengagement_enabled boolean NOT NULL DEFAULT false;

DO $$ BEGIN PERFORM cron.unschedule('weekly-reengagement'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'weekly-reengagement',
  '0 10 * * 1',   -- lundi 10:00 UTC (~11:00 Brazzaville)
  $CRON$
    SELECT net.http_post(
      url     := 'https://axlpfskrrlwibcnxkfvb.supabase.co/functions/v1/queue-reengagement',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $CRON$
);

-- ── Écouler la file plus souvent (toutes les 6h au lieu de 1x/jour) ──
-- 50 msg / passage * 4 passages = 200/j max -> sous la limite Meta de
-- 250 conversations/24h d'un compte non vérifié.
DO $$ BEGIN PERFORM cron.unschedule('process-email-campaign-daily'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('process-campaign-queue-6h');    EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'process-campaign-queue-6h',
  '0 */6 * * *',
  $CRON$
    SELECT net.http_post(
      url     := 'https://axlpfskrrlwibcnxkfvb.supabase.co/functions/v1/process-campaign-queue',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $CRON$
);
