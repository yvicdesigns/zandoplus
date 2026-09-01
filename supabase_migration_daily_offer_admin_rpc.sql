-- RPC sécurisée pour basculer "Offre du jour" (is_daily_offer) sur une annonce depuis l'admin.
-- Miroir exact de set_featured_status_as_admin : un .update() client direct est bloqué en
-- silence par la RLS "Users can update their own listings" (auth.uid() = user_id) dès que
-- l'admin n'est pas propriétaire de l'annonce — pas d'erreur renvoyée, le toggle ne persiste
-- juste jamais. Appliqué en base le 01/09/2026.

CREATE OR REPLACE FUNCTION public.set_daily_offer_status_as_admin(p_listing_id uuid, p_daily_offer boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_user boolean;
BEGIN
  SELECT COALESCE(((auth.jwt() -> 'user_metadata') ->> 'is_admin')::boolean, false)
  INTO is_admin_user;

  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent changer le statut "offre du jour".';
  END IF;

  UPDATE public.listings
  SET is_daily_offer = p_daily_offer
  WHERE id = p_listing_id;
END;
$function$;
