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
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const RESEND_AUDIENCE_ID = Deno.env.get('RESEND_AUDIENCE_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY non configuré');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase non configuré');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Create audience if no ID provided
    let audienceId = RESEND_AUDIENCE_ID;
    if (!audienceId) {
      const createRes = await fetch('https://api.resend.com/audiences', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Utilisateurs Zando+ Congo' }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(`Création audience: ${JSON.stringify(createData)}`);
      audienceId = createData.data?.id || createData.id;
      console.log('Audience créée:', audienceId);
    }

    // 2. Get all users from auth.users
    let allUsers: { id: string; email: string }[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(`listUsers: ${error.message}`);
      allUsers = allUsers.concat((data.users || []).map(u => ({ id: u.id, email: u.email || '' })));
      if (data.users.length < perPage) break;
      page++;
    }

    // 3. Get profiles for metadata
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, location, role');

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // 4. Sync contacts to Resend
    let synced = 0;
    let failed = 0;

    for (const user of allUsers) {
      if (!user.email) { failed++; continue; }
      const profile = profileMap.get(user.id);
      const firstName = (profile?.full_name || '').split(' ')[0] || '';
      const lastName = (profile?.full_name || '').split(' ').slice(1).join(' ') || '';

      const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          unsubscribed: false,
          data: {
            city: profile?.location || '',
            role: profile?.role || 'user',
          },
        }),
      });

      if (res.ok) { synced++; } else { failed++; }
    }

    return new Response(
      JSON.stringify({ success: true, synced, failed, audience_id: audienceId, total: allUsers.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('sync-contacts-resend error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
