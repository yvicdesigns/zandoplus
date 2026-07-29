-- Ajout du numéro WhatsApp dans les profils vendeurs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
