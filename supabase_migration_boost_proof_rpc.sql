-- ============================================================================
-- Preuve de paiement des boosts : correctif du lien jamais enregistré.
--
-- Bug : ad_boosts n'a aucune politique UPDATE pour le vendeur. L'upload de la
-- capture dans le bucket payment_proofs réussissait, mais le
-- UPDATE ad_boosts SET preuve_paiement_url = ... touchait 0 ligne SANS erreur
-- (RLS filtre silencieusement). Résultat : le vendeur voyait "Preuve envoyée !"
-- et l'admin ne voyait aucune preuve (1 boost sur 21 avait un lien).
--
-- On n'ouvre PAS un UPDATE large (le vendeur pourrait alors modifier statut /
-- montant de son propre boost). Cette RPC n'écrit que l'URL de la preuve, sur
-- un boost qui appartient à l'appelant et qui est encore en attente.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.submit_boost_proof(p_boost_id uuid, p_proof_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  UPDATE public.ad_boosts
     SET preuve_paiement_url = p_proof_url
   WHERE id = p_boost_id
     AND user_id = auth.uid()
     AND statut = 'pending';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'Boost introuvable ou déjà traité';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_boost_proof(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_boost_proof(uuid, text) TO authenticated;

-- Rattrapage : rattacher aux boosts les captures déjà téléversées mais jamais
-- liées (fichiers boosts/<boost_id>_<timestamp>.<ext>). On garde la plus
-- récente par boost, et on ne touche que les boosts sans preuve.
UPDATE public.ad_boosts b
   SET preuve_paiement_url = 'https://axlpfskrrlwibcnxkfvb.supabase.co/storage/v1/object/public/payment_proofs/' || o.name
  FROM (
    SELECT DISTINCT ON (split_part(split_part(name, '/', 2), '_', 1))
           split_part(split_part(name, '/', 2), '_', 1) AS boost_id_text,
           name
      FROM storage.objects
     WHERE bucket_id = 'payment_proofs' AND name LIKE 'boosts/%'
     ORDER BY split_part(split_part(name, '/', 2), '_', 1), created_at DESC
  ) o
 WHERE b.id::text = o.boost_id_text
   AND b.preuve_paiement_url IS NULL;

-- Supabase donne EXECUTE a anon par defaut : retire apres coup (appliqué le 25/09/2026)
REVOKE EXECUTE ON FUNCTION public.submit_boost_proof(uuid, text) FROM anon;
