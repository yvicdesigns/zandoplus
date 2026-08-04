import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Z_DARK, Z_DARKER, Z_BRIGHT, Z_BG, Z_BORDER, emailHeader, emailFooter } from '../_shared/emailTemplates.ts';

function welcomeHtml(name: string, email: string): string {
  const firstName = name ? name.split(' ')[0] : '';
  const greeting  = firstName ? `Bienvenue, ${firstName} !` : 'Bienvenue sur Zando+ !';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
        ${emailHeader(greeting, 'Votre compte est prêt — achetez et vendez au Congo')}
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
              Votre compte Zando+ Congo est activé. Vous pouvez dès maintenant parcourir les annonces, contacter des vendeurs et publier vos propres articles.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:${Z_BG};border:1px solid ${Z_BORDER};border-radius:12px;margin-bottom:28px;">
              <tr><td style="padding:22px 24px;">
                <p style="color:${Z_DARK};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Ce que vous pouvez faire</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="28" valign="top" style="padding:5px 0;color:${Z_BRIGHT};font-size:18px;font-weight:900;">&#10003;</td>
                    <td style="padding:5px 0 5px 10px;color:${Z_DARKER};font-size:14px;font-weight:600;line-height:1.5;">Parcourir des milliers d'annonces gratuitement</td>
                  </tr>
                  <tr>
                    <td width="28" valign="top" style="padding:5px 0;color:${Z_BRIGHT};font-size:18px;font-weight:900;">&#10003;</td>
                    <td style="padding:5px 0 5px 10px;color:${Z_DARKER};font-size:14px;font-weight:600;line-height:1.5;">Publier une annonce — aucun frais, aucun abonnement</td>
                  </tr>
                  <tr>
                    <td width="28" valign="top" style="padding:5px 0;color:${Z_BRIGHT};font-size:18px;font-weight:900;">&#10003;</td>
                    <td style="padding:5px 0 5px 10px;color:${Z_DARKER};font-size:14px;font-weight:600;line-height:1.5;">Payer en toute sécurité via MoMo ou Achat Sécurisé</td>
                  </tr>
                  <tr>
                    <td width="28" valign="top" style="padding:5px 0;color:${Z_BRIGHT};font-size:18px;font-weight:900;">&#10003;</td>
                    <td style="padding:5px 0 5px 10px;color:${Z_DARKER};font-size:14px;font-weight:600;line-height:1.5;">Livraison disponible à Brazzaville</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td align="center">
              <a href="https://www.zandopluscg.com" style="display:inline-block;background:linear-gradient(135deg,${Z_DARK},${Z_DARKER});color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 44px;border-radius:12px;">
                Voir les annonces
              </a>
            </td></tr></table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center">
              <a href="https://www.zandopluscg.com/post-ad" style="display:inline-block;background:#ffffff;color:${Z_DARK};font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:12px;border:2px solid ${Z_DARK};">
                Publier une annonce
              </a>
            </td></tr></table>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
            <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">L'équipe Zando+ Congo</p>
          </td>
        </tr>
        ${emailFooter(encodeURIComponent(email))}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req) => {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'email requis' }), { status: 400 });
    }

    const RESEND_API_KEY         = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL           = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY manquant');

    const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    // Check unsubscribes
    if (supabase) {
      const { data: unsub } = await supabase
        .from('email_unsubscribes')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      if (unsub) {
        await supabase.from('email_send_log').insert({ email, type: 'welcome', status: 'skipped', error: 'unsubscribed' });
        return new Response(JSON.stringify({ success: true, skipped: 'unsubscribed' }), { status: 200 });
      }
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Zando+ <noreply@zandopluscg.com>',
        to: [email],
        subject: 'Bienvenue sur Zando+ Congo !',
        html: welcomeHtml(name || '', email),
        tags: [{ name: 'type', value: 'welcome' }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (supabase) await supabase.from('email_send_log').insert({ email, type: 'welcome', status: 'error', error: `Resend: ${errText}` });
      throw new Error(`Resend: ${errText}`);
    }

    if (supabase) await supabase.from('email_send_log').insert({ email, type: 'welcome', status: 'sent' });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('send-welcome-email error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
});
