import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';
import ConversationDetails from '@/components/messages/ConversationDetails';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MessageSquare } from 'lucide-react';

const MessagesPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations]       = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) throw error;
      const sorted = (data || []).sort((a, b) => {
        const da = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
        const db = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
        return db - da;
      });
      setConversations(sorted);
      setSelectedConversation(
        conversationId ? (sorted.find(c => c.id === conversationId) || null) : null
      );
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger vos conversations.', variant: 'destructive' });
    } finally {
      setLoadingConversations(false);
    }
  }, [user, toast, conversationId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('messages-page-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, fetchConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `buyer_id=eq.${user.id}` }, fetchConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `seller_id=eq.${user.id}` }, fetchConversations)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, fetchConversations]);

  const handleSelect = (conv) => {
    setSelectedConversation(conv);
    navigate(`/messages/${conv.id}`);
  };

  const ConvList = loadingConversations ? (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
    </div>
  ) : (
    <ConversationList
      conversations={conversations}
      selectedConversation={selectedConversation}
      onSelect={handleSelect}
    />
  );

  return (
    <>
      <Helmet>
        <title>Messages — Zando+</title>
      </Helmet>

      {/* ══════════════════════════════════════════
          MOBILE : flow normal, hauteur exacte
          marginBottom: -96px annule le pb-24 du <main>
          ══════════════════════════════════════════ */}
      <div
        className="md:hidden bg-white flex flex-col overflow-hidden"
        style={{
          height: 'calc(100dvh - 102px - 64px - env(safe-area-inset-bottom))',
          marginBottom: '-96px',
        }}
      >
        {!conversationId ? (
          ConvList
        ) : (
          selectedConversation ? (
            <ChatWindow
              key={selectedConversation.id}
              conversation={selectedConversation}
              onMessageSent={fetchConversations}
              onBack={() => navigate('/messages')}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
            </div>
          )
        )}
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP : flex côte à côte
          ══════════════════════════════════════════ */}
      <div className="hidden md:flex h-[calc(100dvh-130px)] overflow-hidden bg-page-bg">

        {/* Liste */}
        <div className="w-[320px] flex-shrink-0 border-r border-gray-100 flex flex-col overflow-hidden bg-white">
          {ConvList}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {selectedConversation ? (
            <ChatWindow
              key={selectedConversation.id}
              conversation={selectedConversation}
              onMessageSent={fetchConversations}
              onBack={() => navigate('/messages')}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-[15px] font-bold text-gray-700">Sélectionnez une conversation</p>
              <p className="text-[13px] text-gray-400">Vos échanges avec les vendeurs et acheteurs apparaissent ici.</p>
            </div>
          )}
        </div>

        {/* Détails (xl) */}
        {selectedConversation && (
          <div className="hidden xl:block w-[280px] flex-shrink-0 border-l border-gray-100 bg-white overflow-y-auto">
            <ConversationDetails conversation={selectedConversation} />
          </div>
        )}
      </div>
    </>
  );
};

export default MessagesPage;
