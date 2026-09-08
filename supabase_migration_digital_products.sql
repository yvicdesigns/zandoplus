-- Migration : produits numériques (fichiers vendus avec téléchargement
-- sécurisé après achat, au lieu d'une livraison physique).
-- Exécuté directement via psql (voir reference_deploy_and_automation_quirks).

-- 1. Colonnes sur listings ---------------------------------------------
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS is_digital boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS digital_file_path text,
  ADD COLUMN IF NOT EXISTS digital_file_name text,
  ADD COLUMN IF NOT EXISTS digital_file_size bigint;

-- 2. 'digital' devient un choix de livraison valide (frais = 0, déjà géré
--    par create_escrow_transaction() dont la branche ELSE met le frais à 0
--    pour tout choix autre que 'zando'/'seller') --------------------------
ALTER TABLE transactions_escrow DROP CONSTRAINT IF EXISTS transactions_escrow_delivery_choice_check;
ALTER TABLE transactions_escrow ADD CONSTRAINT transactions_escrow_delivery_choice_check
  CHECK (delivery_choice = ANY (ARRAY['zando','seller','pickup','digital']));

-- 3. Bucket privé pour les fichiers numériques ---------------------------
-- Jamais d'URL publique : seule l'edge function get-digital-download-url
-- (clé service_role, qui contourne la RLS) génère un lien signé et
-- temporaire, après avoir vérifié que l'appelant a bien payé cette annonce.
INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-products', 'digital-products', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Sellers upload own digital files" ON storage.objects;
CREATE POLICY "Sellers upload own digital files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'digital-products' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Sellers view own digital files" ON storage.objects;
CREATE POLICY "Sellers view own digital files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'digital-products' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Sellers delete own digital files" ON storage.objects;
CREATE POLICY "Sellers delete own digital files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'digital-products' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Livraison automatique dès le paiement validé -------------------------
-- Un produit numérique n'a rien à "expédier" : dès que statut passe à
-- 'paiement_valide' (webhook MoMo automatique OU admin_validate_payment
-- pour le dépôt manuel de preuve), on saute directement à 'livre' et on
-- démarre le même délai de confirmation que pour le physique (24h vendeur
-- vérifié / 72h sinon — cf. vendor_declare_delivery). L'acheteur peut
-- ensuite confirmer via buyer_confirm_receipt (même bouton, juste relabellisé
-- côté UI pour le numérique), ou auto_confirm_transactions() libère les
-- fonds automatiquement si personne ne fait rien.
CREATE OR REPLACE FUNCTION auto_advance_digital_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_digital BOOLEAN;
  v_seller_verified BOOLEAN;
  v_delay INTERVAL;
BEGIN
  IF NEW.statut = 'paiement_valide' AND (OLD.statut IS DISTINCT FROM 'paiement_valide') THEN
    SELECT is_digital INTO v_is_digital FROM listings WHERE id = NEW.annonce_id;
    IF COALESCE(v_is_digital, false) THEN
      SELECT verified INTO v_seller_verified FROM profiles WHERE id = NEW.vendeur_id;
      v_delay := CASE WHEN v_seller_verified = TRUE THEN INTERVAL '24 hours' ELSE INTERVAL '72 hours' END;
      NEW.statut := 'livre';
      NEW.date_livraison_declaree := NOW();
      NEW.auto_confirm_at := NOW() + v_delay;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_digital_auto_deliver ON transactions_escrow;
CREATE TRIGGER trg_digital_auto_deliver
  BEFORE UPDATE OF statut ON transactions_escrow
  FOR EACH ROW
  EXECUTE FUNCTION auto_advance_digital_delivery();

-- 5. Catégorie "Produits numériques" -------------------------------------
-- Le formulaire de publication (Step1BasicInfo → useCategories()) lit la
-- table categories en base, pas postAdConstants.js — les deux doivent
-- rester synchronisés (même slug/type) puisque PostAdPage.jsx dérive
-- ensuite categoryType depuis postAdConstants à partir du slug choisi.
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_type_check
  CHECK (type = ANY (ARRAY['product', 'job', 'service', 'digital']));

INSERT INTO categories (slug, name, type, display_order)
VALUES ('digital-goods', 'Produits numériques', 'digital', 17)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (category_id, name, display_order)
SELECT c.id, s.name, s.ord
FROM categories c
CROSS JOIN (VALUES
  ('E-books', 1),
  ('Templates & Designs', 2),
  ('Logiciels & Applications', 3),
  ('Formations & Cours', 4),
  ('Musique & Audio', 5),
  ('Photos & Vidéos', 6),
  ('Autres fichiers numériques', 7)
) AS s(name, ord)
WHERE c.slug = 'digital-goods'
  AND NOT EXISTS (
    SELECT 1 FROM subcategories sc WHERE sc.category_id = c.id AND sc.name = s.name
  );
