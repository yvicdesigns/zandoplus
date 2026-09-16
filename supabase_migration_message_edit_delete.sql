-- ============================================================================
-- Permet de modifier ou supprimer un message deja envoye (comme WhatsApp),
-- suite a l'incident du 16/09/2026 (prix errone envoye a un client, corrige
-- a la main via psql faute de fonctionnalite).
--
-- Choix produit :
--  - Suppression = "soft delete" (deleted_at pose, contenu conserve en base
--    pour tracabilite, mais affiche comme "Message supprime" aux deux
--    utilisateurs) - jamais de reecriture silencieuse d'un message deja lu.
--  - Modification = autorisee a tout moment, mais marquee "(modifie)" cote
--    UI des que edited_at est pose, pour rester honnete envers le
--    destinataire meme si le message a deja ete lu.
--  - Seul l'auteur du message (sender_id = auth.uid()) peut le modifier ou
--    le supprimer.
-- ============================================================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS edited_at  timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE OR REPLACE FUNCTION public.edit_message(p_message_id uuid, p_new_content text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF p_new_content IS NULL OR btrim(p_new_content) = '' THEN
    RAISE EXCEPTION 'Le message ne peut pas etre vide.';
  END IF;

  UPDATE messages
  SET content = p_new_content,
      edited_at = now()
  WHERE id = p_message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message introuvable ou vous n''etes pas l''auteur.';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE messages
  SET deleted_at = now()
  WHERE id = p_message_id
    AND sender_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message introuvable ou vous n''etes pas l''auteur.';
  END IF;
END;
$function$;

-- get_conversation_messages doit desormais renvoyer edited_at/deleted_at
-- pour que l'UI sache afficher "(modifie)" ou le placeholder de suppression.
DROP FUNCTION IF EXISTS public.get_conversation_messages(uuid);

CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id uuid)
RETURNS TABLE(
  id uuid, content text, sender_id uuid, receiver_id uuid,
  is_read boolean, created_at timestamptz,
  edited_at timestamptz, deleted_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT
    m.id, m.content, m.sender_id, m.receiver_id,
    m.is_read, m.created_at, m.edited_at, m.deleted_at
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at ASC;
$function$;
