-- ============================================================
-- BETA TESTERS PROGRAM — Zando+ CG
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. TESTERS TABLE
CREATE TABLE IF NOT EXISTS testers (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name             TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  device_model          TEXT NOT NULL,
  android_version       TEXT NOT NULL,
  internet_frequency    TEXT NOT NULL CHECK (internet_frequency IN ('daily', 'several_times_week', 'weekly', 'occasional')),
  marketplace_experience TEXT NOT NULL CHECK (marketplace_experience IN ('two_or_more', 'one', 'none')),
  motivation            TEXT NOT NULL,
  daily_availability    TEXT NOT NULL CHECK (daily_availability IN ('1', '2', '3', '4+')),
  score                 INTEGER NOT NULL DEFAULT 0,
  score_breakdown       JSONB DEFAULT '{}',
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'waitlist', 'rejected')),
  points                INTEGER NOT NULL DEFAULT 0,
  activation_date       TIMESTAMPTZ,
  admin_notes           TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testers_user_id  ON testers(user_id);
CREATE INDEX IF NOT EXISTS idx_testers_status   ON testers(status);
CREATE INDEX IF NOT EXISTS idx_testers_score    ON testers(score DESC);
CREATE INDEX IF NOT EXISTS idx_testers_email    ON testers(email);

-- 2. BUG REPORTS TABLE
CREATE TABLE IF NOT EXISTS bug_reports (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tester_id       UUID REFERENCES testers(id) ON DELETE CASCADE NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('ui', 'performance', 'logic', 'crash', 'other')),
  severity        TEXT NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'suggestion')),
  description     TEXT NOT NULL,
  screenshot_url  TEXT,
  page_url        TEXT,
  device_info     JSONB DEFAULT '{}',
  session_id      TEXT,
  resolved        BOOLEAN DEFAULT FALSE,
  admin_notes     TEXT,
  points_awarded  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_tester_id ON bug_reports(tester_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity  ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_reports_resolved  ON bug_reports(resolved);

-- 3. BETA MISSIONS TABLE
CREATE TABLE IF NOT EXISTS beta_missions (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL,
  points                INTEGER NOT NULL DEFAULT 10,
  category              TEXT DEFAULT 'exploration' CHECK (category IN ('exploration', 'social', 'transaction', 'feedback')),
  completion_criteria   TEXT,
  is_active             BOOLEAN DEFAULT TRUE,
  order_index           INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MISSION COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS beta_mission_completions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tester_id   UUID REFERENCES testers(id) ON DELETE CASCADE NOT NULL,
  mission_id  UUID REFERENCES beta_missions(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  proof_notes TEXT,
  validated   BOOLEAN DEFAULT FALSE,
  UNIQUE(tester_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_mission_completions_tester   ON beta_mission_completions(tester_id);
CREATE INDEX IF NOT EXISTS idx_mission_completions_mission  ON beta_mission_completions(mission_id);

-- 5. BETA EVENTS TABLE (lightweight tracking)
CREATE TABLE IF NOT EXISTS beta_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tester_id   UUID REFERENCES testers(id) ON DELETE CASCADE NOT NULL,
  event_type  TEXT NOT NULL,
  event_data  JSONB DEFAULT '{}',
  page_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beta_events_tester    ON beta_events(tester_id);
CREATE INDEX IF NOT EXISTS idx_beta_events_type      ON beta_events(event_type);
CREATE INDEX IF NOT EXISTS idx_beta_events_created   ON beta_events(created_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE testers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_missions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_events              ENABLE ROW LEVEL SECURITY;

-- testers: anyone can insert (public application), testers see own row, admin sees all
CREATE POLICY "testers_insert_public"   ON testers FOR INSERT WITH CHECK (true);
CREATE POLICY "testers_select_own"      ON testers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "testers_select_admin"    ON testers FOR SELECT USING ((SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true');
CREATE POLICY "testers_update_admin"    ON testers FOR UPDATE USING ((SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true');

-- bug_reports: testers insert/select own, admin sees all
CREATE POLICY "bugs_insert_tester"  ON bug_reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM testers WHERE id = tester_id AND user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "bugs_select_own"     ON bug_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM testers WHERE id = tester_id AND user_id = auth.uid())
);
CREATE POLICY "bugs_select_admin"   ON bug_reports FOR SELECT USING ((SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true');
CREATE POLICY "bugs_update_admin"   ON bug_reports FOR UPDATE USING ((SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true');

-- beta_missions: public read, admin write
CREATE POLICY "missions_select_all"    ON beta_missions FOR SELECT USING (true);
CREATE POLICY "missions_write_admin"   ON beta_missions FOR ALL USING ((SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true');

-- mission_completions: testers manage own, admin sees all
CREATE POLICY "completions_insert_tester" ON beta_mission_completions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM testers WHERE id = tester_id AND user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "completions_select_own"    ON beta_mission_completions FOR SELECT USING (
  EXISTS (SELECT 1 FROM testers WHERE id = tester_id AND user_id = auth.uid())
);
CREATE POLICY "completions_select_admin"  ON beta_mission_completions FOR SELECT USING ((SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true');
CREATE POLICY "completions_update_admin"  ON beta_mission_completions FOR UPDATE USING ((SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true');

-- beta_events: testers insert own, admin reads all
CREATE POLICY "events_insert_tester" ON beta_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM testers WHERE id = tester_id AND user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "events_select_admin"  ON beta_events FOR SELECT USING ((SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE id = auth.uid()) = 'true');

-- ============================================================
-- DEFAULT MISSIONS (seed data)
-- ============================================================

INSERT INTO beta_missions (title, description, points, category, completion_criteria, order_index) VALUES
  ('Première annonce',      'Publiez votre première annonce sur Zando+',                                        50, 'exploration',  'Annonce visible sur la plateforme',                    1),
  ('Premier contact',       'Envoyez un message à un vendeur ou démarrez une conversation',                     30, 'social',       'Conversation créée dans Messagerie',                   2),
  ('Explorateur',           'Consultez 10 annonces différentes en une session',                                 25, 'exploration',  'Historique de navigation confirmé',                    3),
  ('Achat Sécurisé',        'Initiez une transaction via l''Achat Sécurisé Zando',                              60, 'transaction',  'Transaction créée avec statut en_attente_paiement',    4),
  ('Chasseur de bugs',      'Soumettez 3 rapports de bugs via le bouton flottant',                              45, 'feedback',     '3 rapports enregistrés dans le système',               5),
  ('Bug critique',          'Trouvez et signalez un bug de sévérité Critique',                                  40, 'feedback',     'Rapport severity=critical validé par admin',           6),
  ('Fidélité 7 jours',      'Connectez-vous et utilisez l''app 7 jours consécutifs',                           50, 'exploration',  '7 sessions enregistrées sur 7 jours consécutifs',     7),
  ('Profil complet',        'Complétez 100% de votre profil (photo, bio, téléphone, localisation)',             20, 'exploration',  'Tous les champs profil remplis',                       8),
  ('Testeur social',        'Partagez une annonce via WhatsApp ou Facebook depuis l''app',                      15, 'social',       'Clic sur bouton partage enregistré',                   9),
  ('Boost test',            'Testez le boost d''annonce (500 FCFA / 7 jours)',                                  35, 'transaction',  'Demande de boost soumise',                            10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE BUCKET for bug report screenshots
-- ============================================================
-- Run separately in Storage settings or via dashboard:
-- Bucket name: bug-screenshots
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
