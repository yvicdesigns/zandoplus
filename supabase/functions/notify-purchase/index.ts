import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizePhone(raw: string, countryCode = '242'): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s\-\.\(\)]/g, '');
  if (cleaned.length < 6) return null;
  if (cleaned.startsWith('+')) return cleaned.slice(1);
  if (cleaned.startsWith('00')) return cleaned.slice(2);
  if (cleaned.startsWith('0') && cleaned.length <= 10) return countryCode + cleaned.slice(1);
  if (cleaned.startsWith(countryCode)) return cleaned;
  if (cleaned.length >= 8 && cleaned.length <= 9) return countryCode + cleaned;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      buyer_id,
      seller_id,
      listing_title,
      listing_price,
      currency,
      transaction_id,
    } = await req.json();

    if (!buyer_id || !seller_id || !listing_title) {
      throw new Error('Paramètres requis manquants');
    }

    const RESEND_API_KEY             = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL               = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const WHATSAPP_TOKEN             = Deno.env.get('WHATSAPP_TOKEN');
    const WHATSAPP_PHONE_ID          = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY non configuré');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase non configuré');

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch emails + seller profile (phone) in parallel
    const [buyerRes, sellerRes, sellerProfileRes] = await Promise.all([
      admin.auth.admin.getUserById(buyer_id),
      admin.auth.admin.getUserById(seller_id),
      admin.from('profiles').select('full_name, phone').eq('id', seller_id).single(),
    ]);

    const buyerEmail   = buyerRes.data?.user?.email;
    const sellerEmail  = sellerRes.data?.user?.email;
    const sellerName   = sellerProfileRes.data?.full_name?.split(' ')[0] || 'Vendeur';
    const sellerPhone  = normalizePhone(sellerProfileRes.data?.phone || '');

    const formatPrice = (n: number, cur: string) =>
      `${(n || 0).toLocaleString('fr-FR')} ${cur || 'FCFA'}`;

    const priceStr = formatPrice(listing_price, currency);
    const transactionsUrl = 'https://www.zandopluscg.com/transactions';
    const adminUrl = 'https://www.zandopluscg.com/admin';

    const sends: Promise<Response>[] = [];

    // --- Email to SELLER ---
    if (sellerEmail) {
      const sellerHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouvelle commande — Zando+</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#2EB565,#16a34a);padding:32px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">🛒</div>
              <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;">Vous avez une nouvelle commande !</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:6px 0 0;">Un acheteur a payé via Zando+ Escrow</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Un client a soumis un paiement escrow pour votre annonce. Le paiement est en cours de vérification par Zando+.
              </p>

              <!-- Détails commande -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:28px;">
                <tr><td>
                  <p style="color:#166534;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Détails de la commande</p>
                  <table width="100%" cellpadding="0" cellspacing="4">
                    <tr>
                      <td style="color:#6b7280;font-size:14px;padding:5px 0;">Annonce</td>
                      <td style="color:#111827;font-size:14px;font-weight:600;text-align:right;">${listing_title}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:14px;padding:5px 0;">Montant</td>
                      <td style="color:#16a34a;font-size:16px;font-weight:700;text-align:right;">${priceStr}</td>
                    </tr>
                    ${transaction_id ? `<tr>
                      <td style="color:#6b7280;font-size:12px;padding:5px 0;">Réf.</td>
                      <td style="color:#9ca3af;font-size:12px;font-family:monospace;text-align:right;">${transaction_id}</td>
                    </tr>` : ''}
                  </table>
                </td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:28px;">
                <tr><td>
                  <p style="color:#92400e;font-size:13px;line-height:1.6;margin:0;">
                    ⏳ <strong>Prochaine étape :</strong> Zando+ va vérifier le paiement et vous contacter. Une fois confirmé, préparez l'article pour la livraison ou le retrait.
                  </p>
                </td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${transactionsUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#2EB565,#16a34a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      Voir mes transactions
                    </a>
                  </td>
                </tr>
              </table>
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

      sends.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Zando+ <noreply@zandopluscg.com>',
            to: [sellerEmail],
            subject: `🛒 Nouvelle commande — ${listing_title}`,
            html: sellerHtml,
          }),
        })
      );
    }

    // --- Email to BUYER ---
    if (buyerEmail) {
      const buyerHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Paiement reçu — Zando+</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#2EB565,#16a34a);padding:32px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">✅</div>
              <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;">Paiement reçu !</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:6px 0 0;">Votre achat est sécurisé par Zando+ Escrow</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Votre paiement a bien été reçu. Il est maintenant <strong>sécurisé</strong> par Zando+ et ne sera versé au vendeur qu'après votre confirmation de réception.
              </p>

              <!-- Récapitulatif -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:20px;">
                <tr><td>
                  <p style="color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Récapitulatif</p>
                  <table width="100%" cellpadding="0" cellspacing="4">
                    <tr>
                      <td style="color:#6b7280;font-size:14px;padding:5px 0;">Article</td>
                      <td style="color:#111827;font-size:14px;font-weight:600;text-align:right;">${listing_title}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:14px;padding:5px 0;">Montant payé</td>
                      <td style="color:#16a34a;font-size:16px;font-weight:700;text-align:right;">${priceStr}</td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              <!-- Étapes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:28px;">
                <tr><td>
                  <p style="color:#1e40af;font-size:13px;font-weight:700;margin:0 0 10px;">🔒 Comment ça fonctionne ?</p>
                  <ol style="color:#1e40af;font-size:13px;margin:0;padding-left:18px;line-height:1.9;">
                    <li>Zando+ vérifie votre paiement</li>
                    <li>Le vendeur prépare et expédie votre article</li>
                    <li>Vous confirmez la réception sur Zando+</li>
                    <li>Le vendeur est payé — votre argent est protégé jusqu'à là</li>
                  </ol>
                </td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${transactionsUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#2EB565,#16a34a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      Suivre ma transaction
                    </a>
                  </td>
                </tr>
              </table>
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

      sends.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Zando+ <noreply@zandopluscg.com>',
            to: [buyerEmail],
            subject: `✅ Commande confirmée — ${listing_title} · Zando+`,
            html: buyerHtml,
          }),
        })
      );
    }

    await Promise.all(sends);

    // --- WhatsApp au VENDEUR (non-bloquant si pas configuré) ---
    if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID && sellerPhone) {
      try {
        await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: sellerPhone,
            type: 'template',
            template: {
              name: 'zandoplus_nouvelle_vente',
              language: { code: 'fr' },
              components: [{
                type: 'body',
                parameters: [
                  { type: 'text', text: sellerName },
                  { type: 'text', text: listing_title },
                  { type: 'text', text: String(listing_price || 0) },
                ],
              }],
            },
          }),
        });
      } catch (waErr) {
        console.error('WhatsApp seller notify error (non-fatal):', waErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notify-purchase error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
