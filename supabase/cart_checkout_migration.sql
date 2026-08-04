-- ═══════════════════════════════════════════════════════════════
-- Cart Checkout System — Zando+
-- Tables + colonnes nécessaires au nouveau checkout unifié
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Table cart_payments (paiement global du panier)
CREATE TABLE IF NOT EXISTS cart_payments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount  integer     NOT NULL,
  items_count   integer     NOT NULL DEFAULT 1,
  statut        text        NOT NULL DEFAULT 'pending'
    CHECK (statut IN ('pending', 'proof_submitted', 'cod_pending', 'confirmed', 'cancelled')),
  proof_url     text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cart_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can manage own cart_payments" ON cart_payments;
CREATE POLICY "users can manage own cart_payments" ON cart_payments
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Table user_addresses (adresses de livraison sauvegardées)
CREATE TABLE IF NOT EXISTS user_addresses (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  label       text        DEFAULT 'Maison',
  full_name   text,
  phone       text,
  street      text        NOT NULL,
  city        text        DEFAULT 'Brazzaville',
  is_default  boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can manage own addresses" ON user_addresses;
CREATE POLICY "users can manage own addresses" ON user_addresses
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Colonnes manquantes sur transactions_escrow
ALTER TABLE transactions_escrow
  ADD COLUMN IF NOT EXISTS commission_amount  integer,
  ADD COLUMN IF NOT EXISTS delivery_fee_paid  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_address   text,
  ADD COLUMN IF NOT EXISTS cart_payment_id    uuid REFERENCES cart_payments(id),
  ADD COLUMN IF NOT EXISTS preuve_paiement_url text;

-- 4. Mettre à jour le CHECK de statut pour inclure cod_pending
ALTER TABLE transactions_escrow
  DROP CONSTRAINT IF EXISTS transactions_escrow_statut_check;

ALTER TABLE transactions_escrow
  ADD CONSTRAINT transactions_escrow_statut_check CHECK (
    statut IN (
      'en_attente_paiement', 'fonds_bloques', 'paiement_valide',
      'livre', 'confirme', 'retrait_demande', 'complete',
      'litige', 'rembourse',
      'cod_pending',
      'cod_en_attente', 'cod_livre', 'cod_annule'
    )
  );

-- 5. Ajouter cart_payments à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cart_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE user_addresses;
