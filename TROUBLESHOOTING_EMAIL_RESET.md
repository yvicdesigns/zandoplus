# Troubleshooting Guide: Password Reset & Email Configuration

This guide helps administrators diagnose and resolve issues related to password reset emails and Supabase Auth SMTP configuration.

## 1. Common Issues & Solutions

### A. Users are not receiving the password reset email
- **Cause:** Rate limiting (Too Many Requests).
- **Solution:** Supabase has strict rate limits for built-in email sending (default ~3 emails/hour). Add a custom SMTP provider (Resend, SendGrid) in your Supabase Dashboard under **Authentication -> Providers -> Email**.

### B. Link invalid or expired error ("Token is expired")
- **Cause:** The user clicked an old link, or the redirect URL isn't properly configured to pass the hash to the React app.
- **Solution:** Verify the `Site URL` and `Redirect URLs` in Supabase Auth settings match your domain exactly (`https://yourdomain.com`). Ensure the email template uses `{{ .ConfirmationURL }}`.

### C. "Email service temporarily unavailable"
- **Cause:** Supabase's default email service was throttled, or your custom SMTP credentials are invalid.
- **Solution:** Use the `/admin/email-diagnostics` panel to verify your configuration. Update your SMTP credentials in Supabase.

## 2. Using the Email Diagnostics Dashboard

Navigate to **Admin Dashboard -> Diagnostics -> Email Diagnostics** (`/admin/email-diagnostics`).

1. **Failure Rate Statistics:** Check if the failure rate is spiking. High failure rates indicate systemic SMTP issues.
2. **Error Logs:** View specific errors (e.g., timeouts, auth failures) tied to anonymized users.
3. **Run Diagnostic:** Click the "Lancer le Diagnostic SMTP" button to run the `diagnose-email-config` Edge Function, which verifies your environment variables (like `RESEND_API_KEY`) and URLs.

## 3. Configuration Checklist

### Step 1: Redirect URLs
Go to Supabase Dashboard -> **Authentication -> URL Configuration**
- Set `Site URL` to your base domain (e.g., `https://zandoplus.com`).
- Add exact redirect URIs: `https://zandoplus.com/reset-password`, `https://zandoplus.com/*`.

### Step 2: Email Templates
Go to Supabase Dashboard -> **Authentication -> Email Templates -> Reset Password**
- Ensure the template body contains a link that maps to your app's route: