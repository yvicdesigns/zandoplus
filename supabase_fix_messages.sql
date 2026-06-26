-- Fix get_conversation_messages — version simplifiée sans check strict
DROP FUNCTION IF EXISTS get_conversation_messages(UUID);

CREATE OR REPLACE FUNCTION get_conversation_messages(p_conversation_id UUID)
RETURNS TABLE(
  id          UUID,
  content     TEXT,
  sender_id   UUID,
  receiver_id UUID,
  is_read     BOOLEAN,
  created_at  TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
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
$$;
