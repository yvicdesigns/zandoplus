-- Run in Supabase SQL Editor
-- Fonctions admin pour modifier les profils utilisateurs (contourne RLS)

-- 1. Changer le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION admin_update_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé : administrateur requis';
  END IF;

  IF p_role NOT IN ('admin', 'monetisation', 'gestion', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Rôle invalide : %', p_role;
  END IF;

  UPDATE profiles SET role = p_role WHERE id = p_user_id;
END;
$$;

-- 2. Activer / désactiver le statut vendeur
CREATE OR REPLACE FUNCTION admin_toggle_seller(p_user_id UUID, p_is_seller BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé : administrateur requis';
  END IF;

  UPDATE profiles SET is_seller = p_is_seller WHERE id = p_user_id;
END;
$$;
