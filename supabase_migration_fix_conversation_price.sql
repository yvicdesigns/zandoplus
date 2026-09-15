-- ============================================================================
-- Fix : get_user_conversations() ne renvoyait jamais le prix de l'annonce
-- (jsonb_build_object omettait price/currency) -> "0 FCFA" affiche partout
-- dans la messagerie (en-tete de conversation + carte "Produit concerne"),
-- quel que soit le vrai prix. Trouve le 15/09/2026 via une capture utilisateur.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_conversations()
 RETURNS TABLE(id uuid, listing jsonb, participant jsonb, last_message jsonb, unread_count bigint, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'listing_slug', l.listing_slug,
      'price',        l.price,
      'currency',     l.currency
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
$function$
