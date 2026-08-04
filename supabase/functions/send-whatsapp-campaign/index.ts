import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normalize a phone number to WhatsApp format (no +, with country code).
 * Handles Congo-Brazzaville (+242) numbers in various input formats.
 * Examples:
 *   "06 123 45 67"   → "242612345 67" → "242612345 67"
 *   "0612345678"     → "242612345678"
 *   "+242612345678"  → "242612345678"
 *   "242612345678"   → "242612345678"
 */
function normalizePhone(raw: string, countryCode = '242'): string | null {
  if (!raw) return null;
  // Remove spaces, dashes, dots, parentheses
  const cleaned = raw.replace(/[\s\-\.\(\)]/g, '');
  if (cleaned.length < 6) return null;

  if (cleaned.startsWith('+')) return cleaned.slice(1);           // +242... → 242...
  if (cleaned.startsWith('00')) return cleaned.slice(2);          // 00242... → 242...
  if (cleaned.startsWith('0') && cleaned.length <= 10)            // 0612... → 242612...
    return countryCode + cleaned.slice(1);
  if (cleaned.startsWith(countryCode)) return cleaned;            // 242... → 242...
  if (cleaned.length >= 8 && cleaned.length <= 9)                 // 612... → 242612...
    return countryCode + cleaned;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { template_name, template_params_fn, segment, mode, preview } = await req.json();
    // mode: 'immediate' (default) | 'drip'

    const WHATSAPP_TOKEN        = Deno.env.get('WHATSAPP_TOKEN');
    const WHATSAPP_PHONE_ID     = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const SUPABASE_URL          = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!WHATSAPP_TOKEN)   throw new Error('WHATSAPP_TOKEN non configuré dans Supabase secrets');
    if (!WHATSAPP_PHONE_ID) throw new Error('WHATSAPP_PHONE_NUMBER_ID non configuré');
    if (!template_name)    throw new Error('template_name requis');

    // Preview: just return what a message would look like
    if (preview) {
      return new Response(
        JSON.stringify({
          success: true,
          preview: {
            template_name,
            example_to: '242612345678',
            api_url: `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase non configuré');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get profiles with phone numbers
    let profileQuery = supabase
      .from('profiles')
      .select('id, full_name, phone')
      .not('phone', 'is', null)
      .neq('phone', '');

    if (segment === 'inactive_30d') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      profileQuery = profileQuery.or(`last_seen.lt.${thirtyDaysAgo},last_seen.is.null`);
    } else if (segment === 'no_listing') {
      const { data: withListings } = await supabase.from('listings').select('user_id');
      const withIds = (withListings || []).map((l: { user_id: string }) => l.user_id);
      if (withIds.length > 0) profileQuery = profileQuery.not('id', 'in', `(${withIds.join(',')})`);
    }

    const { data: profiles, error: profErr } = await profileQuery;
    if (profErr) throw profErr;

    // Normalize phone numbers
    const recipients = (profiles || [])
      .map(p => ({
        id: p.id,
        name: (p.full_name || '').split(' ')[0] || 'vous',
        phone: normalizePhone(p.phone),
      }))
      .filter(r => r.phone !== null) as { id: string; name: string; phone: string }[];

    // ── DRIP MODE ────────────────────────────────────────────────
    if (mode === 'drip') {
      const rows = recipients.map(r => ({
        campaign_id: `wa_${template_name}`,
        segment: segment || 'all',
        email: r.phone, // repurpose email field for phone in WA jobs
        name: r.name,
        status: 'pending',
        channel: 'whatsapp',
      }));

      const { error: insertErr } = await supabase
        .from('campaign_jobs')
        .upsert(rows, { onConflict: 'campaign_id,email', ignoreDuplicates: true });

      if (insertErr) throw insertErr;

      const { count: queued } = await supabase
        .from('campaign_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', `wa_${template_name}`)
        .eq('status', 'pending');

      const daysNeeded = Math.ceil((queued ?? 0) / 50);

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'drip',
          queued: queued ?? 0,
          days_needed: daysNeeded,
          invalid_phones: (profiles?.length ?? 0) - recipients.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── IMMEDIATE MODE ───────────────────────────────────────────
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    const WA_URL = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`;

    for (const r of recipients) {
      const body = {
        messaging_product: 'whatsapp',
        to: r.phone,
        type: 'template',
        template: {
          name: template_name,
          language: { code: 'fr' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: r.name },
              ],
            },
          ],
        },
      };

      const res = await fetch(WA_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        sent++;
      } else {
        failed++;
        const err = await res.json();
        errors.push(`${r.phone}: ${err?.error?.message || 'erreur'}`);
      }

      // 100ms between messages to stay within rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'immediate',
        sent,
        failed,
        total: recipients.length,
        invalid_phones: (profiles?.length ?? 0) - recipients.length,
        errors: errors.slice(0, 5), // first 5 errors only
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('send-whatsapp-campaign error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
