-- Trigger : envoie un email de bienvenue Zando+ à chaque nouvelle inscription
-- À exécuter dans Supabase → SQL Editor

CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.id;

  IF v_email IS NOT NULL THEN
    PERFORM net.http_post(
      url     := 'https://axlpfskrrlwibcnxkfvb.supabase.co/functions/v1/send-welcome-email',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := jsonb_build_object(
        'email', v_email,
        'name',  COALESCE(NEW.full_name, '')
      )::text
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'trigger_welcome_email error for profile %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Attache le trigger à la table profiles (INSERT seulement)
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();
