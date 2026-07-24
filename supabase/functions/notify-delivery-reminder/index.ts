import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY non configuré');

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find transactions marked as delivered 24h+ ago, not yet confirmed, still within auto_confirm window
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: txs, error } = await admin
      .from('transactions_escrow')
      .select('id, acheteur_id, auto_confirm_at, annonce:annonce_id(title)')
      .eq('statut', 'livre')
      .lte('date_livraison_declaree', cutoff24h)
      .gt('auto_confirm_at', now.toISOString());

    if (error) throw error;
    if (!txs?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'Aucune transaction à rappeler' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;

    for (const tx of txs) {
      const buyerId = tx.acheteur_id;
      const listingTitle = (tx.annonce as any)?.title || 'votre article';
      const autoConfirmDate = new Date(tx.auto_confirm_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
      });
      const txUrl = 'https://www.zandopluscg.com/transactions';

      // Get buyer email
      const { data: userData } = await admin.auth.admin.getUserById(buyerId);
      const buyerEmail = userData?.user?.email;

      // Push notification (fire-and-forget)
      admin.functions.invoke('send-push-notification', {
        body: {
          user_id: buyerId,
          title: '⏰ Confirmez votre réception !',
          message: `Confirmez la réception de "${listingTitle}" avant ${autoConfirmDate}.`,
          url: '/transactions',
        },
      }).catch(() => {});

      // Email notification
      if (buyerEmail) {
        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rappel de confirmation — Zando+</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">⏰</div>
              <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;">Confirmez votre réception</h1>
              <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:6px 0 0;">Action requise sur Zando+</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Le vendeur a déclaré votre article livré. Confirmez la réception de <strong>${listingTitle}</strong> pour libérer le paiement.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:28px;">
                <tr><td>
                  <p style="color:#92400e;font-size:13px;line-height:1.6;margin:0;">
                    ⚠️ Si vous ne confirmez pas avant le <strong>${autoConfirmDate}</strong>, la réception sera validée automatiquement et le paiement libéré au vendeur.
                  </p>
                </td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${txUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      Confirmer la réception
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:24px 0 0;">
                Si vous n'avez pas reçu l'article, <strong>ne confirmez pas</strong> et ouvrez un litige depuis vos transactions.
              </p>
            </td>
          </tr>

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
            to: [buyerEmail],
            subject: `⏰ Confirmez votre réception — ${listingTitle}`,
            html,
          }),
        });

        if (res.ok) sent++;
      }
    }

    return new Response(JSON.stringify({ sent, total: txs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notify-delivery-reminder error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
