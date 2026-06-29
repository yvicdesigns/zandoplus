import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { user } = useAuth();

  const registerWebPush = useCallback(async () => {
    if (!user || !VAPID_PUBLIC_KEY) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      // Enregistrer le service worker
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      // Demander permission si pas encore accordée
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // Vérifier si déjà abonné
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Sauvegarder le token dans Supabase (upsert pour éviter les doublons)
      const token = JSON.stringify(subscription);
      await supabase.from('push_tokens').upsert(
        {
          user_id: user.id,
          token_type: 'web',
          token,
          user_agent: navigator.userAgent.substring(0, 200),
        },
        { onConflict: 'user_id,token' }
      );
    } catch (err) {
      // Permission refusée ou SW non supporté — silencieux
      console.debug('[Push] Web push not available:', err.message);
    }
  }, [user]);

  // Naviguer vers le bon lien quand on clique sur une notif (app déjà ouverte)
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

  // Démarrage automatique à la connexion
  useEffect(() => {
    if (user) registerWebPush();
  }, [user, registerWebPush]);
}
