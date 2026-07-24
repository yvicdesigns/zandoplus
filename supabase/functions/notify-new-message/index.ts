import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { receiver_id, sender_name, conversation_id, message_preview } = await req.json();

    if (!receiver_id || !sender_name || !conversation_id) {
      throw new Error('Paramètres requis manquants');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY non configuré');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase non configuré');

    // Look up receiver email using service role (access to auth.users)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(receiver_id);
    if (userError || !userData?.user?.email) {
      // Silently skip if no email (e.g. phone-only accounts)
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const receiverEmail = userData.user.email;
    const preview = (message_preview || '').slice(0, 100);
    const conversationUrl = `https://www.zandopluscg.com/messages/${conversation_id}`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouveau message — Zando+</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header vert -->
          <tr>
            <td style="background:linear-gradient(135deg,#2EB565,#16a34a);padding:32px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">💬</div>
              <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0;">Nouveau message reçu</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:6px 0 0;">sur Zando+</p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
                <strong>${sender_name}</strong> vous a envoyé un message sur Zando+.
              </p>

              ${preview ? `
              <!-- Aperçu du message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-left:4px solid #2EB565;border-radius:0 8px 8px 0;padding:16px;margin-bottom:28px;">
                <tr>
                  <td>
                    <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Message</p>
                    <p style="color:#374151;font-size:15px;font-style:italic;margin:0;">"${preview}${preview.length >= 100 ? '…' : ''}"</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${conversationUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#2EB565,#16a34a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      Répondre au message
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:24px 0 0;">
                Vous recevez cet email car quelqu'un vous a écrit sur <a href="https://www.zandopluscg.com" style="color:#2EB565;">zandopluscg.com</a>
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
        to: [receiverEmail],
        subject: `💬 Nouveau message de ${sender_name} — Zando+`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Erreur Resend');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notify-new-message error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
