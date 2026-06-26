-- ============================================================
-- MIGRATION: cart_payments
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cart_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_amount DECIMAL(12,2) NOT NULL,
  items_count  INTEGER NOT NULL DEFAULT 1,
  proof_url    TEXT,
  statut       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (statut IN ('pending', 'proof_submitted', 'confirmed', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own cart payments" ON public.cart_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert own cart payments" ON public.cart_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own cart payments" ON public.cart_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin full access on cart_payments" ON public.cart_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Ajouter cart_payment_id sur transactions_escrow
ALTER TABLE public.transactions_escrow
  ADD COLUMN IF NOT EXISTS cart_payment_id UUID REFERENCES public.cart_payments(id) ON DELETE SET NULL;
