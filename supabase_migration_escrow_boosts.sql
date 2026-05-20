-- ============================================================
-- MIGRATION: ad_boosts + transactions_escrow
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. ad_boosts table
CREATE TABLE IF NOT EXISTS public.ad_boosts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id            UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  montant               INTEGER NOT NULL DEFAULT 500,
  statut                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (statut IN ('pending','active','expired','rejected')),
  date_debut            TIMESTAMPTZ,
  date_fin              TIMESTAMPTZ,
  preuve_paiement_url   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_boosts ENABLE ROW LEVEL SECURITY;

-- Users can see & create their own boosts
CREATE POLICY "Users can view own boosts" ON public.ad_boosts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boosts" ON public.ad_boosts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins have full access (service role bypasses RLS anyway)
CREATE POLICY "Admins full access on ad_boosts" ON public.ad_boosts
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true'
  );

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_ad_boosts_annonce ON public.ad_boosts(annonce_id);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_user   ON public.ad_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_statut ON public.ad_boosts(statut);


-- 2. transactions_escrow table
CREATE TABLE IF NOT EXISTS public.transactions_escrow (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id                 UUID NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  acheteur_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  vendeur_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  montant                    DECIMAL(12,2) NOT NULL,
  statut                     TEXT NOT NULL DEFAULT 'en_attente_paiement'
                               CHECK (statut IN (
                                 'en_attente_paiement','fonds_bloques','livre',
                                 'confirme','complete','litige','rembourse'
                               )),
  preuve_paiement_url        TEXT,
  date_limite_confirmation   TIMESTAMPTZ,
  date_livraison_declaree    TIMESTAMPTZ,
  date_confirmation          TIMESTAMPTZ,
  notes_litige               TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions_escrow ENABLE ROW LEVEL SECURITY;

-- Acheteur can see & insert their own transactions
CREATE POLICY "Acheteur can view own transactions" ON public.transactions_escrow
  FOR SELECT USING (auth.uid() = acheteur_id OR auth.uid() = vendeur_id);

CREATE POLICY "Acheteur can insert transactions" ON public.transactions_escrow
  FOR INSERT WITH CHECK (auth.uid() = acheteur_id);

-- Both buyer and seller can update (confirm, litige, livraison)
CREATE POLICY "Parties can update their transactions" ON public.transactions_escrow
  FOR UPDATE USING (auth.uid() = acheteur_id OR auth.uid() = vendeur_id);

-- Admins have full access
CREATE POLICY "Admins full access on transactions_escrow" ON public.transactions_escrow
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true'
  );

CREATE INDEX IF NOT EXISTS idx_escrow_acheteur ON public.transactions_escrow(acheteur_id);
CREATE INDEX IF NOT EXISTS idx_escrow_vendeur  ON public.transactions_escrow(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_escrow_annonce  ON public.transactions_escrow(annonce_id);
CREATE INDEX IF NOT EXISTS idx_escrow_statut   ON public.transactions_escrow(statut);


-- 3. Add is_boosted column to listings if not exists
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_listings_is_boosted ON public.listings(is_boosted);


-- 4. Storage bucket for payment proofs (run once)
-- In Supabase dashboard: Storage > New bucket > "payment_proofs" (public: false)
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (allow authenticated users to upload, service role to read all)
CREATE POLICY "Authenticated users can upload proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment_proofs' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can read own proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment_proofs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
