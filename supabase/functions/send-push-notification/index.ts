import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── VAPID Web Push ────────────────────────────────────────────────────────────

function b64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(s: string): Uint8Array {
  const p = '='.repeat((4 - (s.length % 4)) % 4);
  const b = (s + p).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
}

async function sendWebPush(token: string, payload: object, vapidPublic: string, vapidPrivate: string) {
  const sub = JSON.parse(token);
  const endpoint: string = sub.endpoint;
  const audience = new URL(endpoint).origin;

  const privateKey = await crypto.subtle.importKey(
    'raw', b64urlDecode(vapidPrivate),
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'ES256', typ: 'JWT' })));
  const claims = b64url(new TextEncoder().encode(JSON.stringify({
    aud: audience, exp: now + 3600, sub: 'mailto:zandopluscg@gmail.com'
  })));
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(`${header}.${claims}`)
  );
  const jwt = `${header}.${claims}.${b64url(new Uint8Array(sig))}`;

  const body = new TextEncoder().encode(JSON.stringify(payload));
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `vapid t=${jwt},k=${vapidPublic}`,
      TTL: '86400',
    },
    body,
  });
  return res.status;
}

// ── FCM v1 API (Android/iOS) ─────────────────────────────────────────────────

async function getFcmAccessToken(serviceAccountEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(new TextEncoder().encode(JSON.stringify({
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })));

  // Import RSA private key from PEM
  const pemContent = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const keyDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    'pkcs8', keyDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );

  const sigBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', privateKey,
    new TextEncoder().encode(`${header}.${claims}`)
  );
  const jwt = `${header}.${claims}.${b64url(new Uint8Array(sigBytes))}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function sendFcmV1(fcmToken: string, payload: object, serviceAccountEmail: string, privateKeyPem: string, projectId: string) {
  const accessToken = await getFcmAccessToken(serviceAccountEmail, privateKeyPem);
  const msg = payload as any;

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: {
          title: msg.title || 'Zando+',
          body: msg.body || msg.message || '',
        },
        android: {
          notification: { sound: 'default', channel_id: 'zandoplus_default' },
        },
        apns: {
          payload: { aps: { sound: 'default' } },
        },
        data: { url: msg.url || '/' },
      },
    }),
  });
  return res.status;
}

// ── Main ──────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user_id, title, message, url } = await req.json();
    if (!user_id) return new Response('Missing user_id', { status: 400, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    const fcmEmail     = Deno.env.get('FCM_SERVICE_ACCOUNT_EMAIL') || '';
    const fcmKey       = Deno.env.get('FCM_PRIVATE_KEY') || '';
    const fcmProject   = 'zandopluscg-c9bec';

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token_type, token')
      .eq('user_id', user_id);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = { title: title || 'Zando+', body: message, message, url: url || '/' };

    const results = await Promise.allSettled(
      tokens.map((t) => {
        if (t.token_type === 'web' && vapidPublic && vapidPrivate) {
          return sendWebPush(t.token, payload, vapidPublic, vapidPrivate);
        }
        if (t.token_type === 'fcm' && fcmEmail && fcmKey) {
          return sendFcmV1(t.token, payload, fcmEmail, fcmKey, fcmProject);
        }
        return Promise.resolve(0);
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return new Response(JSON.stringify({ sent, total: tokens.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
