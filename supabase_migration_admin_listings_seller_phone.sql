-- Ajoute le telephone du vendeur a la liste des annonces cote admin, pour
-- pouvoir le contacter directement (WhatsApp) sans requete manuelle -
-- besoin reel rencontre le 17/09/2026 (annonce "Gle53" ambigue vente/location,
-- prix de location introuvable sans contacter le vendeur).
DROP FUNCTION IF EXISTS public.get_all_listings_admin();

CREATE OR REPLACE FUNCTION public.get_all_listings_admin()
RETURNS TABLE(
  id uuid, created_at timestamptz, title text, price numeric, currency varchar,
  category text, status text, featured boolean, is_daily_offer boolean,
  quantity integer, moderation_flags text[], moderation_reason text, images text[],
  seller_id uuid, seller_full_name text, seller_phone text
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
        l.id, l.created_at, l.title, l.price, l.currency, l.category, l.status,
        l.featured, l.is_daily_offer, l.quantity, l.moderation_flags,
        l.moderation_reason, l.images,
        p.id as seller_id, p.full_name as seller_full_name, p.phone as seller_phone
    FROM public.listings l
    LEFT JOIN public.profiles p ON l.user_id = p.id
    ORDER BY l.created_at DESC;
END;
$function$;
