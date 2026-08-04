-- Table pour stocker les désinscriptions marketing
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text NOT NULL UNIQUE,
  unsubscribed_at timestamptz DEFAULT now()
);

-- Index pour lookup rapide lors de l'envoi de campagnes
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email);

-- RLS : n'importe qui peut s'inscrire/vérifier (pas d'auth requise pour désabonnement)
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Lecture publique (pour vérifier si déjà désabonné)
CREATE POLICY "public_read_unsubscribes"
  ON email_unsubscribes FOR SELECT
  USING (true);

-- Insertion publique (lien de désabonnement sans login)
CREATE POLICY "public_insert_unsubscribes"
  ON email_unsubscribes FOR INSERT
  WITH CHECK (true);
