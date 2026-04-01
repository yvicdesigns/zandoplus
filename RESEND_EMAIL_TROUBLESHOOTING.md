# Guide de Configuration et Diagnostics SMTP (Resend & Supabase)

Ce document décrit les étapes précises pour migrer de Hostinger SMTP vers Resend, valider la configuration, et résoudre les erreurs courantes liées à l'envoi d'e-mails (ex: réinitialisation de mot de passe).

---

## 1. Migration vers Resend SMTP dans Supabase

### Étape A : Obtenir les identifiants Resend
1. Connectez-vous à votre compte sur [Resend.com](https://resend.com).
2. Allez dans la section **API Keys**.
3. Créez une nouvelle clé API et copiez-la. **Gargdez-la précieusement**.

### Étape B : Vérifier le domaine expéditeur (Crucial)
1. Dans Resend, allez dans **Domains**.
2. Ajoutez votre domaine : `zandopluscg.com`.
3. Resend vous fournira des enregistrements DNS (TXT, MX). Ajoutez ces enregistrements dans le gestionnaire DNS de votre domaine (ex: Hostinger).
4. Cliquez sur "Verify" dans Resend. Le statut doit devenir **Verified**.
5. L'adresse expéditeur sera désormais valide, par exemple : `noreply@zandopluscg.com`.

### Étape C : Configurer Supabase Auth
1. Allez dans le **Dashboard Supabase** > **Authentication** > **Providers** > **Email**.
2. Activez **Enable Custom SMTP**.
3. Remplissez les champs comme suit :
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (ou `587`)
   - **Username:** `resend` (C'est littéralement le mot "resend")
   - **Password:** `Votre clé API Resend` (Commence souvent par re_...)
   - **Sender Email:** `noreply@zandopluscg.com` (Doit correspondre au domaine vérifié)
4. Cliquez sur **Save**.

---

## 2. Configuration des URLs de Redirection (Password Reset)

Pour que le lien de réinitialisation fonctionne dans votre application React :

1. Allez dans **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2. **Site URL:** Doit être l'URL de base de votre site en production (ex: `https://zandopluscg.com`).
3. **Redirect URLs:** Ajoutez explicitement les chemins suivants :
   - `https://zandopluscg.com/**`
   - `https://zandopluscg.com/reset-password`
4. Allez dans **Authentication** > **Email Templates** > **Reset Password**.
5. Assurez-vous que le lien dans le code HTML/texte ressemble exactement à ceci :