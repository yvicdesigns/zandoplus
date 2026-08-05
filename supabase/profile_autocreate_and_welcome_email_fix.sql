-- Fix : certains utilisateurs (surtout inscription via Google) ne recevaient jamais
-- l'email de bienvenue. Cause : la création de la ligne `profiles` se faisait
-- uniquement côté client (fetchUserProfile dans AuthContext.jsx), après la
-- redirection OAuth. Si le JS n'a pas le temps de s'exécuter (app mobile en
-- arrière-plan pendant la redirection Google, connexion coupée, onglet fermé...),
-- la ligne profiles n'est jamais créée → le trigger d'email de bienvenue
-- (attaché à `AFTER INSERT ON profiles`) ne se déclenche jamais.
--
-- Ce fix crée la ligne `profiles` côté serveur, de façon fiable, dès que
-- Supabase Auth crée la ligne `auth.users` — quel que soit le mode
-- d'inscription (formulaire ou Google). Le trigger d'email de bienvenue
-- existant continue de fonctionner sans changement.
--
-- À exécuter dans Supabase → SQL Editor (projet axlpfskrrlwibcnxkfvb).

-- 1. Création automatique du profil dès la création du compte Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    'viewer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Rattrapage (OPTIONNEL — à lancer séparément, voir note ci-dessous) :
--    créer les profils manquants pour les comptes déjà inscrits qui n'en
--    ont jamais eu, et donc jamais reçu l'email de bienvenue.
--
--    ATTENTION : ceci va déclencher le trigger d'email de bienvenue pour
--    CHAQUE compte concerné, y compris d'éventuels comptes très anciens.
--    Limité ici aux 30 derniers jours pour éviter d'envoyer un email
--    "Bienvenue" tardif et surprenant à des comptes dormants depuis des mois.
--    Ajuster l'intervalle si besoin, ou vérifier d'abord avec le SELECT
--    juste en dessous avant de lancer l'INSERT.

-- Vérification avant rattrapage (à lancer d'abord pour voir combien de comptes sont concernés) :
-- SELECT u.id, u.email, u.created_at
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.id = u.id
-- WHERE p.id IS NULL
-- ORDER BY u.created_at DESC;

INSERT INTO public.profiles (id, full_name, avatar_url, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Utilisateur'),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
  'viewer'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.created_at > now() - interval '30 days'
ON CONFLICT (id) DO NOTHING;

-- 3. Table de log pour rendre visibles les échecs d'envoi d'email
--    (jusqu'ici net.http_post échouait silencieusement, sans aucune trace).
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text NOT NULL,
  type       text NOT NULL,
  status     text NOT NULL, -- 'sent' | 'error' | 'skipped'
  error      text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_send_log_email ON public.email_send_log(email);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_email_send_log"
  ON public.email_send_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
