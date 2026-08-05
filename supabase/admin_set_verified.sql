-- Fonction SECURITY DEFINER permettant aux admins de modifier verified
-- sans être bloqués par RLS
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
  -- Vérifie que l'appelant est admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (is_admin = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Permission refusée : vous n''êtes pas administrateur';
  END IF;

  UPDATE public.profiles
  SET verified = is_verified,
      updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Donne les droits d'exécution aux utilisateurs authentifiés (RLS vérifie le rôle)
GRANT EXECUTE ON FUNCTION public.admin_set_verified(UUID, BOOLEAN) TO authenticated;
