import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Son court deux tons — style messagerie (A5 puis C#6)
const playMessageSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    [[880, 0], [1108, 0.14]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.45);
    });
  } catch (_) {}
};

// Notification browser (quand l'onglet est en arrière-plan)
const notifyNewMessage = () => {
  if (
    'Notification' in window &&
    Notification.permission === 'granted' &&
    !window.location.pathname.startsWith('/messages')
  ) {
    try {
      const n = new Notification('Nouveau message — Zando+', {
        body: 'Vous avez reçu un nouveau message',
        icon: '/android-chrome-192x192.png',
        badge: '/android-chrome-192x192.png',
        tag: 'zando-message',
        renotify: true,
      });
      n.onclick = () => { window.focus(); window.location.href = '/messages'; };
    } catch (_) {}
  }
};

const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) { setUnreadCount(0); return; }
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
    if (!error) setUnreadCount(count || 0);
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('unread-messages-count')
      // Nouveau message reçu → son + notification browser + update badge
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        fetchUnreadCount();
        playMessageSound();
        notifyNewMessage();
      })
      // Message lu → update badge uniquement, sans son
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, fetchUnreadCount)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  return unreadCount;
};

export default useUnreadMessages;
