-- ============================================================================
-- Admin : marquer le prix d'une annonce comme vérifié ("Prix correct").
--
-- Onglet Annonces > filtre "Prix suspects" : les annonces actives à prix très bas
-- sont listées pour que l'admin contacte les vendeurs. Quand l'admin constate que
-- le prix est en fait normal (article vraiment vendu à ce prix), il l'écarte de la
-- liste. On garde ça dans moderation_flags ('prix_confirme'), sans nouvelle colonne.
-- Même contrôle d'accès que admin_approve_listing / admin_request_changes.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_confirm_price(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  UPDATE listings
     SET moderation_flags = array_append(COALESCE(moderation_flags, '{}'), 'prix_confirme')
   WHERE id = p_listing_id
     AND NOT ('prix_confirme' = ANY (COALESCE(moderation_flags, '{}')));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_confirm_price(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_confirm_price(uuid) TO authenticated;
