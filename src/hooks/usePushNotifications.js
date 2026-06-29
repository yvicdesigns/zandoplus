import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function saveToken(userId, tokenType, token) {
  await supabase.from('push_tokens').upsert(
    { user_id: userId, token_type: tokenType, token, user_agent: navigator.userAgent.substring(0, 200) },
    { onConflict: 'user_id,token' }
  );
}

// ── Capacitor Native (Android / iOS) ─────────────────────────────────────────
async function registerNativePush(userId) {
  const { PushNotifications } = await import(/* @vite-ignore */ '@capacitor/push-notifications');

  const status = await PushNotifications.checkPermissions();
  let permission = status.receive;

  if (permission === 'prompt') {
    const result = await PushNotifications.requestPermissions();
    permission = result.receive;
  }

  if (permission !== 'granted') return;

  await PushNotifications.register();

  // Token FCM reçu → sauvegarder dans Supabase
  PushNotifications.addListener('registration', async ({ value: token }) => {
    await saveToken(userId, 'fcm', token);
  });

  // Notification reçue en foreground → afficher un toast natif
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Reçu en foreground:', notification.title);
  });

  // Clic sur notification → naviguer vers le bon lien
  PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    const url = notification.data?.url;
    if (url) window.location.href = url;
  });
}

// ── Web Push (PWA installée ou navigateur) ────────────────────────────────────
async function registerWebPush(userId) {
  if (!VAPID_PUBLIC_KEY) return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await saveToken(userId, 'web', JSON.stringify(subscription));
  } catch (err) {
    console.debug('[Push] Web push:', err.message);
  }
}

// ── Hook principal ────────────────────────────────────────────────────────────
export function usePushNotifications() {
  const { user } = useAuth();

  const register = useCallback(async () => {
    if (!user?.id) return;

    if (Capacitor.isNativePlatform()) {
      // Android ou iOS natif
      await registerNativePush(user.id).catch(console.debug);
    } else {
      // PWA / navigateur
      await registerWebPush(user.id).catch(console.debug);
    }
  }, [user?.id]);

  // Navigation depuis message SW (app déjà ouverte)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event) => {
      if (event.data?.type === 'NAVIGATE' && event.data.url) {
        window.location.href = event.data.url;
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (user) register();
  }, [user, register]);
}
