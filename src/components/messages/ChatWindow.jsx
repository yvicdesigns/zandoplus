import React, { useState, useEffect, useCallback, useRef } from 'react';
import ConversationHeader from './ConversationHeader';
import Message from './Message';
import MessageInput from './MessageInput';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

const DateSeparator = ({ date }) => {
  const label = isToday(date) ? "Aujourd'hui"
    : isYesterday(date) ? 'Hier'
    : format(date, 'd MMMM yyyy', { locale: fr });
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] text-gray-400 font-semibold">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
};

const ChatWindow = ({ conversation, onMessageSent, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const isSystem = conversation?.listing?.id === null;

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_conversation_messages', { p_conversation_id: convId });
      if (error) throw error;
      setMessages(data || []);
      if ((data || []).some(m => !m.is_read && m.sender_id !== user.id)) {
        await supabase.from('messages').update({ is_read: true })
          .eq('conversation_id', convId).eq('receiver_id', user.id).eq('is_read', false);
        onMessageSent?.();
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les messages.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast, onMessageSent]);

  useEffect(() => {
    if (conversation?.id) fetchMessages(conversation.id);
    else { setMessages([]); setLoading(false); }
  }, [conversation?.id, fetchMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!user || !conversation?.id) return;
    const ch = supabase.channel(`conv:${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        () => fetchMessages(conversation.id))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user, conversation?.id, fetchMessages]);

  /* Grouper les messages par jour */
  const grouped = messages.reduce((acc, msg) => {
    const day = msg.created_at.split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-white">
      <ConversationHeader conversation={conversation} onBack={onBack} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-gray-50/40">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-[13px]">Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, msgs]) => (
            <div key={day}>
              <DateSeparator date={new Date(day)} />
              <div className="space-y-1.5">
                {msgs.map(m => (
                  <Message key={m.id} message={m} isOwnMessage={m.sender_id === user.id} />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {!isSystem && (
        <MessageInput
          conversation={conversation}
          onMessageSent={() => fetchMessages(conversation.id)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
