-- ============================================================
-- MIGRATION: admin_message_buyer — permet à un admin d'ouvrir/continuer
-- une conversation avec l'acheteur d'une transaction escrow (ex: litige
-- preuve de paiement suspecte), sans passer par le flux acheteur/vendeur
-- normal de create_conversation_and_message.
-- Run in Supabase SQL Editor
-- ============================================================

DROP FUNCTION IF EXISTS admin_message_buyer(UUID, TEXT);
CREATE OR REPLACE FUNCTION admin_message_buyer(
  p_transaction_id UUID,
  p_content        TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin        BOOLEAN;
  v_buyer_id        UUID;
  v_listing_id      UUID;
  v_admin_id        UUID := auth.uid();
  v_conversation_id UUID;
BEGIN
  SELECT
    (SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = v_admin_id) = 'true'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin_id AND role IN ('admin', 'editor'))
  INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Accès refusé : réservé aux administrateurs';
  END IF;

  SELECT acheteur_id, annonce_id INTO v_buyer_id, v_listing_id
  FROM transactions_escrow
  WHERE id = p_transaction_id;

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Transaction introuvable';
  END IF;

  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE listing_id = v_listing_id
    AND buyer_id = v_buyer_id
    AND seller_id = v_admin_id
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (listing_id, buyer_id, seller_id)
    VALUES (v_listing_id, v_buyer_id, v_admin_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  INSERT INTO messages (conversation_id, sender_id, receiver_id, content, is_read)
  VALUES (v_conversation_id, v_admin_id, v_buyer_id, p_content, false);

  UPDATE conversations SET updated_at = now() WHERE id = v_conversation_id;

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_message_buyer(UUID, TEXT) TO authenticated;
