-- ============================================================================
-- Rend le nombre de favoris visible publiquement sur les annonces (comme les
-- vues, decide le 16/09/2026). Colonne mise a jour par trigger a chaque
-- ajout/retrait de favori, pour eviter un COUNT() a chaque affichage de la
-- liste d'annonces (meme logique que views_count, deja incremente cote appli).
-- ============================================================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS favorites_count integer NOT NULL DEFAULT 0;

-- Backfill sur les favoris deja existants
UPDATE public.listings l
SET favorites_count = sub.cnt
FROM (
  SELECT listing_id, count(*) AS cnt
  FROM public.favorites
  GROUP BY listing_id
) sub
WHERE l.id = sub.listing_id;

CREATE OR REPLACE FUNCTION public.sync_listing_favorites_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings SET favorites_count = favorites_count + 1 WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_listing_favorites_count ON public.favorites;
CREATE TRIGGER trg_sync_listing_favorites_count
AFTER INSERT OR DELETE ON public.favorites
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_favorites_count();
