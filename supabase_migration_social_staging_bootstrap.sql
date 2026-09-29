-- ============================================================================
-- STAGING UNIQUEMENT (zando-social-staging, tymsnbwogarazftvzkzt).
-- Recree en version minimale les tables de production dont dependent les
-- nouvelles tables "posts" (FK), pour pouvoir tester sans copier de vraies
-- donnees. Pas la structure complete de production, juste ce qui est
-- reference par les migrations Zando Social. Ne JAMAIS jouer ce fichier sur
-- la production (axlpfskrrlwibcnxkfvb) : il ecraserait le vrai schema.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'viewer',
  verified    boolean NOT NULL DEFAULT false,
  is_business boolean NOT NULL DEFAULT false,
  is_boutique boolean NOT NULL DEFAULT false,
  shop_slug   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  price       numeric,
  currency    varchar DEFAULT 'FCFA',
  images      text[] DEFAULT '{}',
  status      text NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id smallint PRIMARY KEY DEFAULT 1
);
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cart_payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions_escrow (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS minimal pour pouvoir tester en tant qu'utilisateur authentifie (pas les
-- vraies policies de prod, juste assez pour ne pas tout bloquer en dev).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staging: anyone reads profiles" ON public.profiles;
CREATE POLICY "staging: anyone reads profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "staging: user manages own profile" ON public.profiles;
CREATE POLICY "staging: user manages own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staging: anyone reads active listings" ON public.listings;
CREATE POLICY "staging: anyone reads active listings" ON public.listings FOR SELECT USING (status = 'active');
DROP POLICY IF EXISTS "staging: user manages own listings" ON public.listings;
CREATE POLICY "staging: user manages own listings" ON public.listings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger standard Supabase : crée automatiquement un profil à l'inscription
-- (existe déjà en production sous ce nom, on le reproduit ici pour pouvoir
-- créer un compte de test normalement).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
