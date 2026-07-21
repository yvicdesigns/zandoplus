-- ============================================================
-- Migration : shop_slug pour les pages vendeurs
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. Extension pour gérer les accents (déjà dispo sur Supabase)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Colonne shop_slug sur profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shop_slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_shop_slug ON profiles(shop_slug);

-- 3. Générer les slugs pour les profils existants
DO $$
DECLARE
  rec       RECORD;
  base_slug TEXT;
  candidate TEXT;
  counter   INTEGER;
BEGIN
  FOR rec IN
    SELECT id, full_name
    FROM profiles
    WHERE full_name IS NOT NULL AND shop_slug IS NULL
    ORDER BY created_at ASC
  LOOP
    base_slug := LOWER(TRIM(BOTH '-' FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(unaccent(rec.full_name), '[^a-zA-Z0-9\s]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    ));

    IF base_slug = '' THEN CONTINUE; END IF;

    candidate := base_slug;
    counter   := 1;
    WHILE EXISTS (SELECT 1 FROM profiles WHERE shop_slug = candidate) LOOP
      candidate := base_slug || '-' || counter;
      counter   := counter + 1;
    END LOOP;

    UPDATE profiles SET shop_slug = candidate WHERE id = rec.id;
  END LOOP;
END $$;

-- 4. Trigger : génère le slug automatiquement pour les nouveaux profils
CREATE OR REPLACE FUNCTION auto_generate_shop_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter   INTEGER := 1;
BEGIN
  IF NEW.shop_slug IS NULL AND NEW.full_name IS NOT NULL THEN
    base_slug := LOWER(TRIM(BOTH '-' FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(unaccent(NEW.full_name), '[^a-zA-Z0-9\s]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    ));

    IF base_slug != '' THEN
      candidate := base_slug;
      WHILE EXISTS (SELECT 1 FROM profiles WHERE shop_slug = candidate AND id != NEW.id) LOOP
        candidate := base_slug || '-' || counter;
        counter   := counter + 1;
      END LOOP;
      NEW.shop_slug := candidate;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_shop_slug ON profiles;
CREATE TRIGGER trigger_auto_shop_slug
  BEFORE INSERT OR UPDATE OF full_name ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_shop_slug();

-- 5. Mettre à jour get_user_conversations pour inclure shop_slug dans participant
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
      'id', l.id,
      'title', l.title,
      'images', l.images
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
