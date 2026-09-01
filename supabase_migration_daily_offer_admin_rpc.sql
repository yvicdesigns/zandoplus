-- RPC sécurisée pour basculer "Offre du jour" (is_daily_offer) sur une annonce depuis l'admin.
-- Miroir exact de set_featured_status_as_admin : un .update() client direct est bloqué en
-- silence par la RLS "Users can update their own listings" (auth.uid() = user_id) dès que
-- l'admin n'est pas propriétaire de l'annonce — pas d'erreur renvoyée, le toggle ne persiste
-- juste jamais. Appliqué en base le 01/09/2026.

-- ── Fix n°2 (même session) : get_all_listings_admin() avait un RETURNS TABLE(...) explicite
-- qui omettait is_daily_offer, quantity, moderation_flags, moderation_reason — ces colonnes
-- arrivaient donc toujours `undefined` côté front, peu importe leur vraie valeur en base.
-- C'est ce qui faisait croire que le toggle "Offre du jour" ne marchait toujours pas après le
-- fix n°1 ci-dessous : la persistance fonctionnait, seul l'affichage de la liste ne recevait
-- jamais la donnée.
DROP FUNCTION IF EXISTS public.get_all_listings_admin();

CREATE OR REPLACE FUNCTION public.get_all_listings_admin()
 RETURNS TABLE(
   id uuid, created_at timestamp with time zone, title text, price numeric,
   currency character varying, category text, status text, featured boolean,
   is_daily_offer boolean, quantity integer, moderation_flags text[], moderation_reason text,
   images text[], seller_id uuid, seller_full_name text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT (
        SELECT COALESCE(((auth.jwt()->>'user_metadata')::jsonb->>'is_admin')::boolean, false)
    ) THEN
        RAISE EXCEPTION 'Seuls les administrateurs peuvent accéder à cette fonction.';
    END IF;

    RETURN QUERY
    SELECT
        l.id, l.created_at, l.title, l.price, l.currency, l.category, l.status, l.featured,
        l.is_daily_offer, l.quantity, l.moderation_flags, l.moderation_reason, l.images,
        p.id as seller_id, p.full_name as seller_full_name
    FROM public.listings l
    LEFT JOIN public.profiles p ON l.user_id = p.id
    ORDER BY l.created_at DESC;
END;
$function$;

-- ── Fix n°1 : RPC manquante pour persister le toggle (RLS silencieuse) ──
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
