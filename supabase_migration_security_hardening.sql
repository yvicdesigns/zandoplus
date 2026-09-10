-- =====================================================================
-- Durcissement sécurité — 10/09/2026
-- Corrige : (1) élévation de privilège via la table profiles [CRITIQUE]
--           (2) 4 tables sans RLS [MOYEN]
-- Appliqué via psql direct (voir reference_deploy_and_automation_quirks).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CRITIQUE — Geler les colonnes privilégiées de `profiles`
-- ---------------------------------------------------------------------
-- La policy UPDATE de profiles autorise un utilisateur à modifier
-- n'importe quelle colonne de SA fiche, y compris `role`, `verified`,
-- `housing_verified`. Un simple PATCH REST permettait de devenir admin.
--
-- Ce trigger gèle ces colonnes à leur ancienne valeur SAUF si :
--   - l'appel vient du serveur (auth.uid() IS NULL : service_role,
--     edge function, migration SQL, cron) ;
--   - OU l'appelant est déjà admin (dashboard admin, RPC admin_*).
--
-- `is_seller` n'est volontairement PAS gelé : l'activation de l'espace
-- vendeur est un self-service assumé (page /devenir-vendeur) et ne
-- donne accès à aucune donnée privilégiée (les policies "argent"
-- s'appuient sur `role`, pas sur `is_seller`).

CREATE OR REPLACE FUNCTION public.protect_privileged_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;  -- appel côté serveur : autorisé
  END IF;

  SELECT (role = 'admin') INTO v_caller_is_admin
  FROM public.profiles WHERE id = auth.uid();

  IF COALESCE(v_caller_is_admin, false) THEN
    RETURN NEW;  -- admin : autorisé
  END IF;

  -- Utilisateur normal : on remet les colonnes sensibles à l'ancienne valeur.
  NEW.role             := OLD.role;
  NEW.verified         := OLD.verified;
  NEW.housing_verified := OLD.housing_verified;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_privileged_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_privileged_profile_columns();


-- ---------------------------------------------------------------------
-- 2. MOYEN — Activer la RLS sur les 4 tables qui ne l'avaient pas
-- ---------------------------------------------------------------------

-- 2a. hero_slides : possède déjà les bonnes policies (admin ALL via
--     is_admin(), lecture publique des slides actives) — elles étaient
--     simplement inertes faute de RLS activée.
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- 2b. site_visuals : bannière affichée sur l'accueil (lecture publique),
--     gérée depuis le dashboard admin (écriture admin uniquement).
ALTER TABLE public.site_visuals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view site visuals" ON public.site_visuals;
CREATE POLICY "Public can view site visuals" ON public.site_visuals
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage site visuals" ON public.site_visuals;
CREATE POLICY "Admins manage site visuals" ON public.site_visuals
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 2c. scheduled_posts / replied_comments : outillage marketing interne,
--     aucun accès depuis le front. RLS + policy admin uniquement.
--     (service_role, utilisé par les edge functions campagne, garde
--     l'accès complet en contournant la RLS.)
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage scheduled posts" ON public.scheduled_posts;
CREATE POLICY "Admins manage scheduled posts" ON public.scheduled_posts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE public.replied_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage replied comments" ON public.replied_comments;
CREATE POLICY "Admins manage replied comments" ON public.replied_comments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
