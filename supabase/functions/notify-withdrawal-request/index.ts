import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_ADMIN_EMAIL = 'yvicdesigns@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { vendeur_name, vendeur_momo, montant, commission, net, transaction_id, admin_email } = await req.json();
    const ADMIN_EMAIL = admin_email || DEFAULT_ADMIN_EMAIL;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY non configuré');

    const formatFCFA = (n: number) => n?.toLocaleString('fr-FR') + ' FCFA';

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Retrait demandé — Zando+</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:540px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header orange -->
          <tr>
            <td style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:32px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">💸</div>
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Retrait demandé</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:6px 0 0;">Action requise — Envoyer via MoMo</p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:32px 40px;">

              <p style="color:#374151;font-size:15px;margin:0 0 24px;">
                Le vendeur <strong>${vendeur_name}</strong> a demandé le retrait de ses fonds. Voici les informations pour effectuer le virement.
              </p>

              <!-- Box MoMo -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:2px solid #fb923c;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="color:#9a3412;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 16px;">
                      Informations de virement
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="4">
                      <tr>
                        <td style="color:#6b7280;font-size:14px;padding:6px 0;">Vendeur</td>
                        <td style="color:#111827;font-size:14px;font-weight:600;text-align:right;">${vendeur_name}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-size:14px;padding:6px 0;">Numéro MoMo</td>
                        <td style="color:#ea580c;font-size:20px;font-weight:700;text-align:right;font-family:monospace;">${vendeur_momo || 'Non renseigné'}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top:1px solid #fed7aa;padding-top:12px;margin-top:12px;"></td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-size:14px;padding:6px 0;">Montant brut</td>
                        <td style="color:#374151;font-size:14px;text-align:right;">${formatFCFA(montant)}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-size:14px;padding:6px 0;">Commission Zando (7%)</td>
                        <td style="color:#dc2626;font-size:14px;text-align:right;">— ${formatFCFA(commission)}</td>
                      </tr>
                      <tr>
                        <td style="color:#111827;font-size:16px;font-weight:700;padding:8px 0 0;">À envoyer</td>
                        <td style="color:#16a34a;font-size:22px;font-weight:700;text-align:right;padding:8px 0 0;">${formatFCFA(net)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="color:#166534;font-size:13px;font-weight:700;margin:0 0 8px;">Étapes :</p>
                    <ol style="color:#166534;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
                      <li>Ouvrez <strong>MTN Money</strong> ou <strong>Airtel Money</strong></li>
                      <li>Envoyez <strong>${formatFCFA(net)}</strong> au numéro <strong style="font-family:monospace;">${vendeur_momo || '—'}</strong></li>
                      <li>Allez dans <strong>Admin → Escrow</strong> sur Zando+</li>
                      <li>Cliquez <strong>"Marquer comme envoyé"</strong> sur cette transaction</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Lien admin -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://www.zandopluscg.com/admin"
                       style="display:inline-block;background:linear-gradient(135deg,#ea580c,#c2410c);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      Aller dans l'Admin Zando+
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:20px 0 0;">
                Transaction ID : <code style="font-family:monospace;">${transaction_id}</code>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:14px 40px;text-align:center;border-top:1px solid #e5e7eb;">
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
        to: [ADMIN_EMAIL],
        subject: `💸 Retrait demandé — ${vendeur_name} · ${formatFCFA(net)}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Erreur Resend');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notify-withdrawal-request error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
