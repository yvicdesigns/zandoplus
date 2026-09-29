-- ============================================================================
-- ZANDO SOCIAL — Phase 1 : actions admin (approuver / demander modification /
-- supprimer une publication), + lecture admin de toutes les publications.
--
-- Correctif au passage : la policy "admin full access on posts" (dans
-- supabase_migration_social_commerce_phase1.sql) vérifiait auth.jwt()->>'role'
-- et user_metadata.is_admin — ni l'un ni l'autre ne correspond à ce que le
-- reste de Zando+ utilise pour décider qui est admin (profiles.role, voir
-- admin_approve_listing/admin_request_changes). Un admin réel (profiles.role
-- = 'admin') n'aurait donc jamais pu agir sur une publication depuis l'app.
-- Remplacée ici par le même motif que staff_read_all_boosts (EXISTS sur
-- profiles.role) pour la lecture, et par des RPC SECURITY DEFINER pour les
-- écritures, exactement comme admin_approve_listing / admin_request_changes.
-- ============================================================================

DROP POLICY IF EXISTS "admin full access on posts" ON public.posts;

CREATE POLICY "admin reads all posts" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'monetisation', 'gestion')
    )
  );

CREATE OR REPLACE FUNCTION public.admin_approve_post(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE posts SET status = 'active', moderation_flags = '{}', moderation_reason = NULL
  WHERE id = p_post_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_request_post_changes(p_post_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE posts SET status = 'needs_changes', moderation_reason = p_reason
  WHERE id = p_post_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_post(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  DELETE FROM posts WHERE id = p_post_id;
END; $$;

REVOKE ALL ON FUNCTION public.admin_approve_post(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_request_post_changes(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_post(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_request_post_changes(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_post(uuid) TO authenticated;
