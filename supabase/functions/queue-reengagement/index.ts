import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../cors.ts';
import { normalizePhone } from '../_shared/normalizePhone.ts';

// Lancé par le cron "weekly-reengagement" (lundi 10:00 UTC).
// Met en file (campaign_jobs, channel=whatsapp) une relance "on vous a
// manqué" pour les utilisateurs inactifs qui ont un numéro, en respectant
// un plafond (pas plus d'une relance / 30 jours par personne) et le
// désabonnement marketing. La file est ensuite écoulée par
// process-campaign-queue (50 messages / passage, plusieurs fois par jour).
// verify_jwt = false (appel depuis pg_net).
const TEMPLATE = 'zandoplus_rappel';
const INACTIVE_DAYS = 21;
const COOLDOWN_DAYS  = 30;
const MAX_PER_RUN    = 200;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Interrupteur : rien tant que site_settings.reengagement_enabled = false
    // (on l'active une fois le template 'zandoplus_rappel' approuvé par Meta).
    const { data: settings } = await admin
      .from('site_settings').select('reengagement_enabled').eq('id', 1).single();
    if (!settings?.reengagement_enabled) {
      return new Response(JSON.stringify({ queued: 0, message: 'relance désactivée (reengagement_enabled=false)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inactiveBefore = new Date(Date.now() - INACTIVE_DAYS * 864e5).toISOString();
    const cooldownBefore = new Date(Date.now() - COOLDOWN_DAYS * 864e5).toISOString();

    // Inactifs (last_seen ancien, ou jamais vus) avec un numéro, non désabonnés,
    // pas déjà relancés récemment.
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, full_name, phone, last_seen, created_at, reengaged_at')
      .not('phone', 'is', null)
      .eq('marketing_opted_out', false)
      .or(`reengaged_at.is.null,reengaged_at.lt.${cooldownBefore}`)
      .order('last_seen', { ascending: true, nullsFirst: true })
      .limit(MAX_PER_RUN * 2); // marge : on filtre l'inactivité ci-dessous

    if (error) throw error;

    const eligible = (profiles || []).filter(p => {
      const ref = p.last_seen || p.created_at;
      return ref && ref < inactiveBefore;
    }).slice(0, MAX_PER_RUN);

    if (eligible.length === 0) {
      return new Response(JSON.stringify({ queued: 0, message: 'aucun inactif éligible' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rows = eligible
      .map(p => {
        const to = normalizePhone(String(p.phone));
        return to ? {
          campaign_id: `wa_${TEMPLATE}`,
          segment: 'reengagement',
          email: to,                       // le n° est stocké dans "email" pour les jobs WA
          name: p.full_name || 'cher client',
          status: 'pending',
          channel: 'whatsapp',
        } : null;
      })
      .filter(Boolean);

    if (rows.length > 0) {
      await admin.from('campaign_jobs').upsert(rows, {
        onConflict: 'campaign_id,email',
        ignoreDuplicates: true,
      });
    }

    // Marque les profils comme relancés (cooldown de 30 j), même si le
    // numéro n'a pas pu être normalisé — on ne veut pas les re-scanner.
    await admin.from('profiles')
      .update({ reengaged_at: new Date().toISOString() })
      .in('id', eligible.map(p => p.id));

    return new Response(JSON.stringify({ queued: rows.length, scanned: eligible.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('queue-reengagement error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
