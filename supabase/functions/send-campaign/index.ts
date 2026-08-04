import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CAMPAIGN_TEMPLATES } from '../_shared/emailTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { template_id, subject_override, segment, preview, mode } = await req.json();
    // mode: 'immediate' (default) | 'drip'

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY non configuré');

    const template = CAMPAIGN_TEMPLATES[template_id];
    if (!template) throw new Error(`Template "${template_id}" inconnu`);

    // Preview mode: return HTML without sending
    if (preview) {
      return new Response(
        JSON.stringify({ success: true, html: template.html('Prénom', 'exemple@email.com'), subject: template.subject }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase non configuré');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get recipients based on segment
    let userIds: string[] = [];

    if (segment === 'inactive_30d') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .or(`last_seen.lt.${thirtyDaysAgo},last_seen.is.null`);
      userIds = (data || []).map(p => p.id);
    } else if (segment === 'no_listing') {
      const { data: withListings } = await supabase.from('listings').select('user_id');
      const withSet = new Set((withListings || []).map((l: { user_id: string }) => l.user_id));
      const { data: all } = await supabase.from('profiles').select('id');
      userIds = (all || []).filter(p => !withSet.has(p.id)).map(p => p.id);
    }

    // Get all users
    let recipients: { email: string; name: string }[] = [];

    if (userIds.length > 0) {
      const { data: allData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const idSet = new Set(userIds);
      recipients = (allData?.users || [])
        .filter(u => idSet.has(u.id) && u.email)
        .map(u => ({ email: u.email!, name: u.user_metadata?.full_name || u.email!.split('@')[0] }));
    } else {
      let page = 1;
      while (true) {
        const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        const batch = (data?.users || [])
          .filter(u => u.email)
          .map(u => ({ email: u.email!, name: u.user_metadata?.full_name || u.email!.split('@')[0] }));
        recipients.push(...batch);
        if ((data?.users || []).length < 1000) break;
        page++;
      }
    }

    // Exclude unsubscribed
    const { data: unsubs } = await supabase.from('email_unsubscribes').select('email');
    const unsubSet = new Set((unsubs || []).map(u => u.email.toLowerCase()));
    const before = recipients.length;
    recipients = recipients.filter(r => !unsubSet.has(r.email.toLowerCase()));
    const skipped = before - recipients.length;

    // ── DRIP MODE: populate campaign_jobs table ──────────────────
    if (mode === 'drip') {
      // Exclude emails already queued for this campaign
      const rows = recipients.map(r => ({
        campaign_id: template_id,
        segment: segment || 'all',
        email: r.email,
        name: r.name,
        status: 'pending',
      }));

      // upsert (on conflict do nothing) to avoid duplicates
      const { error: insertErr } = await supabase
        .from('campaign_jobs')
        .upsert(rows, { onConflict: 'campaign_id,email', ignoreDuplicates: true });

      if (insertErr) throw insertErr;

      // Count what's actually queued
      const { count: queued } = await supabase
        .from('campaign_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', template_id)
        .eq('status', 'pending');

      const daysNeeded = Math.ceil((queued ?? 0) / 50);

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'drip',
          queued: queued ?? 0,
          skipped,
          days_needed: daysNeeded,
          message: `${queued} emails en file d'attente. Envoi de 50 par jour. Terminé dans ${daysNeeded} jour(s).`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── IMMEDIATE MODE ───────────────────────────────────────────
    const subject = subject_override || template.subject;
    let sent = 0;
    let failed = 0;

    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const emails = batch.map(r => ({
        from: 'Zando+ <noreply@zandopluscg.com>',
        to: [r.email],
        subject,
        html: template.html(r.name, r.email),
        tags: [{ name: 'campaign', value: template_id }],
      }));

      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(emails),
      });

      if (res.ok) {
        sent += batch.length;
      } else {
        failed += batch.length;
        console.error('Batch error:', await res.text());
      }

      if (i + batchSize < recipients.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return new Response(
      JSON.stringify({ success: true, mode: 'immediate', sent, failed, skipped, total: before }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('send-campaign error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
