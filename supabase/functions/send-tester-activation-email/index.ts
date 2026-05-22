import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, name, play_store_link } = await req.json();

    const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY');
    const PLAY_STORE_LINK = Deno.env.get('PLAY_STORE_BETA_LINK') || play_store_link;

    if (!RESEND_API_KEY)   throw new Error('RESEND_API_KEY non configuré');
    if (!to || !name)      throw new Error('Paramètres to et name requis');
    if (!PLAY_STORE_LINK)  throw new Error('Lien Play Store non configuré');

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vous êtes sélectionné — Testeur Officiel Zando+</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header vert -->
          <tr>
            <td style="background:linear-gradient(135deg,#2EB565,#16a34a);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🎉</div>
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Félicitations, ${name} !</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:8px 0 0;">Vous avez été sélectionné comme<br><strong>Testeur Officiel Zando+</strong></p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Votre candidature a été examinée et votre profil correspond exactement à ce que nous recherchons. Vous faites maintenant partie des <strong>20 premiers testeurs officiels</strong> de la marketplace congolaise Zando+.
              </p>

              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                En tant que testeur officiel, vous pouvez désormais accéder à votre <strong>Dashboard Testeur</strong> sur le site et télécharger l'application Android sur le Play Store.
              </p>

              <!-- Étapes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:28px;">
                <tr><td>
                  <p style="color:#166534;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Prochaines étapes</p>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    ${['Cliquez sur le bouton ci-dessous pour accéder à l\'app sur Google Play','Acceptez de rejoindre le programme de test','Installez l\'application Zando+ depuis le Play Store','Connectez-vous à votre Dashboard Testeur sur zandopluscg.com/dashboard/tester','Explorez, testez et signalez vos découvertes !'].map((step, i) => `
                    <tr>
                      <td width="28" valign="top" style="padding:4px 0;">
                        <div style="width:22px;height:22px;background:#2EB565;border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;">${i + 1}</div>
                      </td>
                      <td style="padding:4px 0 4px 10px;color:#166534;font-size:14px;">${step}</td>
                    </tr>`).join('')}
                  </table>
                </td></tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${PLAY_STORE_LINK}" style="display:inline-block;background:linear-gradient(135deg,#2EB565,#16a34a);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.01em;">
                      📲 Télécharger Zando+ sur Play Store
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:16px 0 0;">
                Lien valide uniquement pour votre adresse email Google associée à ce compte.
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">

              <!-- Points rappel -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td width="33%" style="text-align:center;padding:0 8px;">
                    <div style="font-size:22px;">🐛</div>
                    <p style="color:#374151;font-size:12px;margin:4px 0 0;font-weight:600;">Bug critique</p>
                    <p style="color:#2EB565;font-size:13px;font-weight:700;margin:2px 0 0;">+40 pts</p>
                  </td>
                  <td width="33%" style="text-align:center;padding:0 8px;">
                    <div style="font-size:22px;">✅</div>
                    <p style="color:#374151;font-size:12px;margin:4px 0 0;font-weight:600;">Mission complète</p>
                    <p style="color:#2EB565;font-size:13px;font-weight:700;margin:2px 0 0;">+50 pts</p>
                  </td>
                  <td width="33%" style="text-align:center;padding:0 8px;">
                    <div style="font-size:22px;">🏆</div>
                    <p style="color:#374151;font-size:12px;margin:4px 0 0;font-weight:600;">Niveau Elite</p>
                    <p style="color:#2EB565;font-size:13px;font-weight:700;margin:2px 0 0;">30 000 FCFA</p>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:13px;line-height:1.6;text-align:center;margin:0;">
                Des questions ? Répondez directement à cet email.<br>
                L'équipe Zando+ Congo — <strong>zandopluscg.com</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Zando+ Congo · zandopluscg.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Zando+ <noreply@zandopluscg.com>',
        to: [to],
        subject: '🎉 Vous êtes sélectionné — Testeur Officiel Zando+ !',
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Erreur Resend');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
