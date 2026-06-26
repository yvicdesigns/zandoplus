-- ============================================================
-- MIGRATION: RPCs pour le système de messagerie
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. get_conversation_messages — retourne les messages d'une conversation
DROP FUNCTION IF EXISTS get_conversation_messages(UUID);
CREATE OR REPLACE FUNCTION get_conversation_messages(p_conversation_id UUID)
RETURNS TABLE(
  id              UUID,
  content         TEXT,
  sender_id       UUID,
  receiver_id     UUID,
  is_read         BOOLEAN,
  created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est participant de la conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_conversation_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Accès refusé à cette conversation';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.sender_id,
    m.receiver_id,
    m.is_read,
    m.created_at
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
END;
$$;

-- 2. create_conversation_and_message — crée ou récupère une conversation et envoie un message
DROP FUNCTION IF EXISTS create_conversation_and_message(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS create_conversation_and_message(UUID, TEXT);
CREATE OR REPLACE FUNCTION create_conversation_and_message(
  p_listing_id      UUID,
  p_content         TEXT,
  p_conversation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_seller_id       UUID;
  v_message_id      UUID;
  v_buyer_id        UUID := auth.uid();
BEGIN
  -- Récupérer le vendeur de l'annonce
  SELECT user_id INTO v_seller_id FROM listings WHERE id = p_listing_id;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Annonce introuvable';
  END IF;

  IF v_seller_id = v_buyer_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous envoyer un message';
  END IF;

  -- Utiliser la conversation existante ou en chercher une
  IF p_conversation_id IS NOT NULL THEN
    v_conversation_id := p_conversation_id;
  ELSE
    -- Chercher une conversation existante entre ces deux utilisateurs pour cette annonce
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE listing_id = p_listing_id
      AND (
        (buyer_id = v_buyer_id AND seller_id = v_seller_id)
        OR
        (buyer_id = v_seller_id AND seller_id = v_buyer_id)
      )
    LIMIT 1;

    -- Si aucune conversation, en créer une
    IF v_conversation_id IS NULL THEN
      INSERT INTO conversations (listing_id, buyer_id, seller_id)
      VALUES (p_listing_id, v_buyer_id, v_seller_id)
      RETURNING id INTO v_conversation_id;
    END IF;
  END IF;

  -- Insérer le message
  INSERT INTO messages (conversation_id, sender_id, receiver_id, content, is_read)
  VALUES (v_conversation_id, v_buyer_id, v_seller_id, p_content, false)
  RETURNING id INTO v_message_id;

  -- Mettre à jour updated_at de la conversation
  UPDATE conversations SET updated_at = now() WHERE id = v_conversation_id;

  RETURN jsonb_build_object(
    'conversation_id', v_conversation_id,
    'message_id', v_message_id
  );
END;
$$;

-- 3. get_user_conversations — remplace/corrige la version existante
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
      'id', p.id,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'last_seen', p.last_seen,
      'verified', p.verified,
      'phone', p.phone
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
