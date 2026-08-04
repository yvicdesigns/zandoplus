import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CAMPAIGN_TEMPLATES } from '../_shared/emailTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 50;

async function processWhatsAppJob(
  job: { id: string; campaign_id: string; email: string; name: string },
  token: string,
  phoneId: string
): Promise<boolean> {
  // campaign_id for WhatsApp is "wa_{template_name}"
  const templateName = job.campaign_id.replace(/^wa_/, '');
  const phone = job.email; // phone stored in email field for WA jobs

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'fr' },
        components: [{ type: 'body', parameters: [{ type: 'text', text: job.name }] }],
      },
    }),
  });
  return res.ok;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY        = Deno.env.get('RESEND_API_KEY');
    const WHATSAPP_TOKEN        = Deno.env.get('WHATSAPP_TOKEN');
    const WHATSAPP_PHONE_ID     = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const SUPABASE_URL          = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables Supabase manquantes');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get next 50 pending jobs, ordered by oldest first
    const { data: jobs, error: fetchErr } = await supabase
      .from('campaign_jobs')
      .select('id, campaign_id, email, name, channel')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchErr) throw fetchErr;
    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Aucun email en attente', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Split jobs by channel
    const emailJobs = jobs.filter(j => !j.channel || j.channel === 'email');
    const waJobs    = jobs.filter(j => j.channel === 'whatsapp');

    let sent = 0;
    let failed = 0;

    // ── EMAIL batch ──────────────────────────────────────────────
    const emailPayloads = emailJobs.map(job => {
      const template = CAMPAIGN_TEMPLATES[job.campaign_id];
      if (!template) return null;
      return {
        _jobId: job.id,
        from: 'Zando+ <noreply@zandopluscg.com>',
        to: [job.email],
        subject: template.subject,
        html: template.html(job.name, job.email),
        tags: [{ name: 'campaign', value: job.campaign_id }],
      };
    });

    const validEmailJobs = emailPayloads.filter(Boolean).map(e => ({ id: e!._jobId, payload: e }));
    const invalidEmailIds = emailJobs.filter(j => !CAMPAIGN_TEMPLATES[j.campaign_id]).map(j => j.id);

    if (invalidEmailIds.length > 0) {
      await supabase.from('campaign_jobs')
        .update({ status: 'failed', sent_at: new Date().toISOString() })
        .in('id', invalidEmailIds);
    }

    if (validEmailJobs.length > 0 && RESEND_API_KEY) {
      const resendPayloads = validEmailJobs.map(e => {
        const { _jobId, ...rest } = e.payload!;
        return rest;
      });
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(resendPayloads),
      });
      const validIds = validEmailJobs.map(e => e.id);
      if (res.ok) {
        await supabase.from('campaign_jobs')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .in('id', validIds);
        sent += validEmailJobs.length;
      } else {
        console.error('Resend batch error:', await res.text());
        await supabase.from('campaign_jobs')
          .update({ status: 'failed', sent_at: new Date().toISOString() })
          .in('id', validIds);
        failed += validEmailJobs.length;
      }
    }

    // ── WHATSAPP batch ───────────────────────────────────────────
    if (waJobs.length > 0 && WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
      for (const job of waJobs) {
        const ok = await processWhatsAppJob(job, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID);
        if (ok) {
          await supabase.from('campaign_jobs')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', job.id);
          sent++;
        } else {
          await supabase.from('campaign_jobs')
            .update({ status: 'failed', sent_at: new Date().toISOString() })
            .eq('id', job.id);
          failed++;
        }
        // 150ms between WA messages
        await new Promise(r => setTimeout(r, 150));
      }
    }

    // Count remaining
    const { count: remaining } = await supabase
      .from('campaign_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return new Response(
      JSON.stringify({ success: true, sent, failed, remaining: remaining ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('process-campaign-queue error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
