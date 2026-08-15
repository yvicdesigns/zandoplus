import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import ConversationDetails from './ConversationDetails';
import { Loader2, MessageSquare } from 'lucide-react';

const MessagesInline = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) throw error;
      const sorted = (data || []).sort((a, b) => {
        const da = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
        const db = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
        return db - da;
      });
      setConversations(sorted);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger vos conversations.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel('messages-inline-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, fetchConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `buyer_id=eq.${user.id}` }, fetchConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `seller_id=eq.${user.id}` }, fetchConversations)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user, fetchConversations]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
    </div>
  );

  const ListPanel = (
    <ConversationList
      conversations={conversations}
      selectedConversation={selected}
      onSelect={setSelected}
    />
  );

  const ChatPanel = selected ? (
    <ChatWindow
      key={selected.id}
      conversation={selected}
      onMessageSent={fetchConversations}
      onBack={() => setSelected(null)}
    />
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 text-gray-300">
      <MessageSquare className="w-12 h-12" />
      <p className="text-[13px] font-semibold text-gray-400">Sélectionnez une conversation</p>
    </div>
  );

  return (
    <div className="flex h-full min-h-[500px] overflow-hidden">

      {/* ── MOBILE : soit liste soit chat, jamais les deux ── */}
      <div className="flex flex-col w-full overflow-hidden md:hidden">
        {!selected ? ListPanel : (
          <div className="flex flex-col flex-1 overflow-hidden">{ChatPanel}</div>
        )}
      </div>

      {/* ── DESKTOP : liste + chat côte à côte ── */}
      <div className="hidden md:flex w-[260px] flex-shrink-0 border-r border-gray-100 flex-col">
        {ListPanel}
      </div>
      <div className="hidden md:flex flex-1 flex-col min-w-0 overflow-hidden">
        {ChatPanel}
      </div>
      {selected && (
        <div className="hidden xl:flex w-[240px] flex-shrink-0 border-l border-gray-100 flex-col overflow-y-auto">
          <ConversationDetails conversation={selected} />
        </div>
      )}
    </div>
  );
};

export default MessagesInline;
