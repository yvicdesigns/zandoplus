-- ============================================================
-- Migration : listing_slug pour les pages annonces
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. Colonne listing_slug sur listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_listings_listing_slug ON listings(listing_slug);

-- 2. Générer les slugs pour les annonces existantes
DO $$
DECLARE
  rec       RECORD;
  base_slug TEXT;
  candidate TEXT;
  counter   INTEGER;
BEGIN
  FOR rec IN
    SELECT id, title
    FROM listings
    WHERE title IS NOT NULL AND listing_slug IS NULL
    ORDER BY created_at ASC
  LOOP
    base_slug := LOWER(TRIM(BOTH '-' FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(unaccent(rec.title), '[^a-zA-Z0-9\s]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    ));

    -- Tronquer à 80 caractères max
    base_slug := LEFT(base_slug, 80);
    base_slug := TRIM(BOTH '-' FROM base_slug);

    IF base_slug = '' THEN CONTINUE; END IF;

    candidate := base_slug;
    counter   := 1;
    WHILE EXISTS (SELECT 1 FROM listings WHERE listing_slug = candidate) LOOP
      candidate := base_slug || '-' || counter;
      counter   := counter + 1;
    END LOOP;

    UPDATE listings SET listing_slug = candidate WHERE id = rec.id;
  END LOOP;
END $$;

-- 3. Trigger : génère le slug automatiquement pour les nouvelles annonces
CREATE OR REPLACE FUNCTION auto_generate_listing_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter   INTEGER := 1;
BEGIN
  IF NEW.listing_slug IS NULL AND NEW.title IS NOT NULL THEN
    base_slug := LEFT(LOWER(TRIM(BOTH '-' FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(unaccent(NEW.title), '[^a-zA-Z0-9\s]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    )), 80);
    base_slug := TRIM(BOTH '-' FROM base_slug);

    IF base_slug != '' THEN
      candidate := base_slug;
      WHILE EXISTS (SELECT 1 FROM listings WHERE listing_slug = candidate AND id != NEW.id) LOOP
        candidate := base_slug || '-' || counter;
        counter   := counter + 1;
      END LOOP;
      NEW.listing_slug := candidate;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_listing_slug ON listings;
CREATE TRIGGER trigger_auto_listing_slug
  BEFORE INSERT OR UPDATE OF title ON listings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_listing_slug();

-- 4. Mettre à jour get_user_conversations pour inclure listing_slug
DROP FUNCTION IF EXISTS get_user_conversations();
CREATE OR REPLACE FUNCTION get_user_conversations()
RETURNS TABLE(
  id            UUID,
  listing       JSONB,
  participant   JSONB,
  last_message  JSONB,
  unread_count  BIGINT,
  updated_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  WITH last_msgs AS (
    SELECT DISTINCT ON (conversation_id)
      conversation_id,
      content,
      created_at
    FROM messages
    ORDER BY conversation_id, created_at DESC
  ),
  unread AS (
    SELECT conversation_id, COUNT(*) AS cnt
    FROM messages
    WHERE receiver_id = v_user_id AND is_read = false
    GROUP BY conversation_id
  )
  SELECT
    c.id,
    jsonb_build_object(
      'id',           l.id,
      'title',        l.title,
      'images',       l.images,
      'listing_slug', l.listing_slug
    ) AS listing,
    jsonb_build_object(
      'id',         p.id,
      'full_name',  p.full_name,
      'avatar_url', p.avatar_url,
      'last_seen',  p.last_seen,
      'verified',   p.verified,
      'phone',      p.phone,
      'shop_slug',  p.shop_slug
    ) AS participant,
    CASE WHEN lm.content IS NOT NULL THEN
      jsonb_build_object('content', lm.content, 'created_at', lm.created_at)
    ELSE NULL END AS last_message,
    COALESCE(u.cnt, 0) AS unread_count,
    c.updated_at
  FROM conversations c
  JOIN listings l ON l.id = c.listing_id
  JOIN profiles p ON p.id = CASE
    WHEN c.buyer_id = v_user_id THEN c.seller_id
    ELSE c.buyer_id
  END
  LEFT JOIN last_msgs lm ON lm.conversation_id = c.id
  LEFT JOIN unread u ON u.conversation_id = c.id
  WHERE c.buyer_id = v_user_id OR c.seller_id = v_user_id
  ORDER BY c.updated_at DESC NULLS LAST;
END;
$$;

-- 5. Mettre à jour get_user_deliveries pour inclure listing_slug
DROP FUNCTION IF EXISTS get_user_deliveries();
CREATE OR REPLACE FUNCTION get_user_deliveries()
RETURNS TABLE(
  id            UUID,
  status        TEXT,
  tracking_code TEXT,
  created_at    TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  listing       JSONB,
  buyer         JSONB,
  seller        JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.statut        AS status,
    d.tracking_code,
    d.created_at,
    d.delivered_at,
    jsonb_build_object(
      'id',           l.id,
      'title',        l.title,
      'images',       l.images,
      'price',        l.price,
      'currency',     l.currency,
      'listing_slug', l.listing_slug
    ) AS listing,
    jsonb_build_object('id', pa.id, 'full_name', pa.full_name) AS buyer,
    jsonb_build_object('id', pv.id, 'full_name', pv.full_name) AS seller
  FROM deliveries d
  JOIN listings l  ON l.id  = d.annonce_id
  JOIN profiles pa ON pa.id = d.acheteur_id
  JOIN profiles pv ON pv.id = d.vendeur_id
  WHERE d.acheteur_id = auth.uid() OR d.vendeur_id = auth.uid()
  ORDER BY d.created_at DESC;
END;
$$;
