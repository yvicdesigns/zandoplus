-- Fonction SECURITY DEFINER permettant aux admins de modifier verified
-- sans être bloqués par RLS
-- NOTE: profiles.is_admin n'existe pas → on vérifie via auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION public.admin_set_verified(
  target_user_id UUID,
  is_verified BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    (SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ) THEN
    RAISE EXCEPTION 'Permission refusée : vous n''êtes pas administrateur';
  END IF;

  UPDATE public.profiles
  SET verified = is_verified,
      updated_at = now()
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_verified(UUID, BOOLEAN) TO authenticated;


-- RPC publique pour lire les IDs des vendeurs vérifiés côté frontend
-- SECURITY DEFINER = bypasse le RLS sur profiles
CREATE OR REPLACE FUNCTION public.get_verified_seller_ids()
RETURNS TABLE(user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE verified = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_verified_seller_ids() TO anon, authenticated;
