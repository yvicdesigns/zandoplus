-- Run in Supabase SQL Editor

-- RPC: admin_delete_listing
-- Bypasses RLS to allow admin to delete any listing
CREATE OR REPLACE FUNCTION admin_delete_listing(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check caller is admin
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé : administrateur requis';
  END IF;

  DELETE FROM listings WHERE id = p_listing_id;
END;
$$;
