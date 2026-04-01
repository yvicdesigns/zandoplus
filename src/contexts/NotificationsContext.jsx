import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { robustQuery } from '@/lib/supabaseHelpers';
import { logError } from '@/lib/errorLogger';

const NotificationsContext = createContext();

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await robustQuery(() =>
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
    );

    if (error) {
      console.error('Error fetching notifications:', error);
      logError(error, { context: 'fetchNotifications' });
    } else {
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        toast({
          title: (
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-3 text-custom-green-500" />
              <span className="font-bold">Nouvelle notification</span>
            </div>
          ),
          description: newNotification.content?.message || 'Vous avez une nouvelle alerte.',
          action: newNotification.link ? (
            <Link to={newNotification.link}>
                <button className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium">Voir</button>
            </Link>
          ) : null,
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected
        }
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn("Notification channel closed/error, reconnecting...");
          // Supabase client should handle auto-reconnect, but monitoring here helps debugging
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const markAsRead = async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.is_read) return;

    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch (e) {
      logError(e, { context: 'markAsRead' });
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch (e) {
      logError(e, { context: 'markAllAsRead' });
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};