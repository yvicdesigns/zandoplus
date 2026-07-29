-- Ajout du numéro WhatsApp dans les profils vendeurs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Ajout du type de boost (simple ou urgent)
ALTER TABLE ad_boosts ADD COLUMN IF NOT EXISTS boost_type TEXT DEFAULT 'simple';
