import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationsInline = () => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifs(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[17px] font-black text-gray-900">
          Notifications
          {unreadCount > 0 && <span className="ml-2 text-[11px] font-bold bg-custom-green-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h2>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-[12px] text-custom-green-500 hover:text-custom-green-700 font-semibold transition-colors">
            <Check className="w-3.5 h-3.5" /> Tout marquer lu
          </button>
        )}
      </div>
      {notifs.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-[14px] text-gray-400">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifs.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors ${n.read ? 'bg-transparent hover:bg-gray-50' : 'bg-emerald-50 hover:bg-emerald-50/70'}`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${n.read ? 'bg-gray-200' : 'bg-custom-green-500'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>{n.message || n.title || 'Notification'}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsInline;
