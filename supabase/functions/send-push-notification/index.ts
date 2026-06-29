import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── VAPID Helpers (Web Push) ────────────────────────────────────────────────

function base64urlToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function buildVapidAuthHeader(
  audience: string,
  vapidPublicKey: string,
  vapidPrivateKeyB64: string,
): Promise<string> {
  const privateKeyBytes = base64urlToUint8Array(vapidPrivateKeyB64);

  const privateKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const header = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify({ alg: 'ES256', typ: 'JWT' })));
  const now = Math.floor(Date.now() / 1000);
  const payload = uint8ArrayToBase64url(
    new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + 3600, sub: 'mailto:zandopluscg@gmail.com' })),
  );
  const sigInput = new TextEncoder().encode(`${header}.${payload}`);
  const sigBytes = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, sigInput);

  const jwt = `${header}.${payload}.${uint8ArrayToBase64url(new Uint8Array(sigBytes))}`;
  return `vapid t=${jwt},k=${vapidPublicKey}`;
}

// ─── Send Web Push ────────────────────────────────────────────────────────────

async function sendWebPush(token: string, payload: object, vapidPublic: string, vapidPrivate: string) {
  const sub = JSON.parse(token);
  const endpoint: string = sub.endpoint;
  const audience = new URL(endpoint).origin;

  const authHeader = await buildVapidAuthHeader(audience, vapidPublic, vapidPrivate);
  const body = new TextEncoder().encode(JSON.stringify(payload));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length.toString(),
      Authorization: authHeader,
      TTL: '86400',
    },
    body,
  });

  return response.status;
}

// ─── Send FCM (Android/iOS via Firebase) ─────────────────────────────────────

async function sendFcm(token: string, payload: object, fcmServerKey: string) {
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${fcmServerKey}`,
    },
    body: JSON.stringify({
      to: token,
      notification: {
        title: (payload as any).title || 'Zando+',
        body: (payload as any).body || (payload as any).message,
        icon: 'ic_notification',
        sound: 'default',
      },
      data: { url: (payload as any).url || '/' },
    }),
  });
  return response.status;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user_id, title, message, url } = await req.json();
    if (!user_id) return new Response('Missing user_id', { status: 400, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    const fcmKey = Deno.env.get('FCM_SERVER_KEY') || '';

    // Récupérer tous les tokens du destinataire
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token_type, token')
      .eq('user_id', user_id);

    if (error || !tokens?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = { title: title || 'Zando+', body: message, message, url };
    const results = await Promise.allSettled(
      tokens.map((t) =>
        t.token_type === 'web' && vapidPublic && vapidPrivate
          ? sendWebPush(t.token, payload, vapidPublic, vapidPrivate)
          : t.token_type === 'fcm' && fcmKey
          ? sendFcm(t.token, payload, fcmKey)
          : Promise.resolve(0),
      ),
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
