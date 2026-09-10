import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../cors.ts';
import { normalizePhone } from '../_shared/normalizePhone.ts';

// Déclenché par le trigger trg_welcome_whatsapp (profiles) quand un
// numéro de téléphone est ajouté à un compte. Envoie une seule fois le
// template WhatsApp Marketing "zandoplus_bienvenue" (1 variable = prénom).
// Doit être déployé avec verify_jwt = false (appel depuis pg_net, sans JWT).
const TEMPLATE_NAME = 'zandoplus_bienvenue';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const WA_TOKEN     = Deno.env.get('WHATSAPP_TOKEN') || '';
  const WA_PHONE_ID  = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { user_id, phone, name } = await req.json();
    if (!user_id || !phone) throw new Error('user_id et phone requis');

    const to = normalizePhone(String(phone));
    if (!to) {
      // Numéro inexploitable — on marque quand même pour ne pas boucler.
      await admin.from('profiles').update({ welcome_whatsapp_sent_at: new Date().toISOString() }).eq('id', user_id);
      return new Response(JSON.stringify({ ok: false, reason: 'phone invalide' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!WA_TOKEN || !WA_PHONE_ID) {
      return new Response(JSON.stringify({ ok: false, reason: 'WhatsApp non configuré' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstName = (name && String(name).trim().split(' ')[0]) || 'cher client';

    const res = await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: TEMPLATE_NAME,
          language: { code: 'fr' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: firstName }] }],
        },
      }),
    });

    const okSend = res.ok;
    const detail = okSend ? '' : (await res.text()).slice(0, 300);

    // Journalisation (réutilise email_send_log comme journal d'envois).
    await admin.from('email_send_log').insert({
      email: to,
      type: 'welcome_whatsapp',
      status: okSend ? 'sent' : 'failed',
      error: okSend ? null : detail,
    });

    // On ne marque "envoyé" que si l'envoi a réussi : sinon on retentera
    // au prochain changement de numéro (ex: template pas encore approuvé).
    if (okSend) {
      await admin.from('profiles').update({ welcome_whatsapp_sent_at: new Date().toISOString() }).eq('id', user_id);
    }

    return new Response(JSON.stringify({ ok: okSend }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-welcome-whatsapp error:', err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
