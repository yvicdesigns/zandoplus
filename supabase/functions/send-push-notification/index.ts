import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user_id, title, message, url } = await req.json();
    if (!user_id) return new Response('Missing user_id', { status: 400, headers: corsHeaders });

    const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    const fcmEmail     = Deno.env.get('FCM_SERVICE_ACCOUNT_EMAIL') || '';
    const fcmKey       = Deno.env.get('FCM_PRIVATE_KEY') || '';
    const fcmProject   = 'zandopluscg-c9bec';

    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails('mailto:zandopluscg@gmail.com', vapidPublic, vapidPrivate);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('id, token_type, token')
      .eq('user_id', user_id);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({
      title: title || 'Zando+',
      body: message || 'Vous avez une nouvelle notification.',
      message,
      url: url || '/',
      tag: 'zandoplus-notif',
    });

    const staleTokenIds: string[] = [];

    const results = await Promise.allSettled(
      tokens.map(async (t) => {
        if (t.token_type === 'web' && vapidPublic && vapidPrivate) {
          try {
            const sub = JSON.parse(t.token);
            await webpush.sendNotification(sub, payload);
          } catch (e: any) {
            // 410 Gone = subscription expired, remove it
            if (e.statusCode === 410 || e.statusCode === 404) {
              staleTokenIds.push(t.id);
            }
            throw e;
          }
        }

        if (t.token_type === 'fcm' && fcmEmail && fcmKey) {
          await sendFcmV1(t.token, JSON.parse(payload), fcmEmail, fcmKey, fcmProject);
        }
      })
    );

    // Clean up expired subscriptions
    if (staleTokenIds.length) {
      await supabase.from('push_tokens').delete().in('id', staleTokenIds);
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return new Response(JSON.stringify({ sent, total: tokens.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ── FCM v1 (Android/iOS natif) ────────────────────────────────────────────────

function b64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function sendFcmV1(fcmToken: string, payload: any, serviceAccountEmail: string, privateKeyPem: string, projectId: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(new TextEncoder().encode(JSON.stringify({
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  })));
  const pemContent = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\n/g, '');
  const keyDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey('pkcs8', keyDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sigBytes = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${claims}`));
  const jwt = `${header}.${claims}.${b64url(new Uint8Array(sigBytes))}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const { access_token } = await tokenRes.json();
  await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: { title: payload.title || 'Zando+', body: payload.body || payload.message || '' },
        android: { notification: { sound: 'default', channel_id: 'zandoplus_default' } },
        apns: { payload: { aps: { sound: 'default' } } },
        data: { url: payload.url || '/' },
      },
    }),
  });
}
