import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';
import EmptyChat from '@/components/messages/EmptyChat';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Inbox } from 'lucide-react';

const MessagesPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) throw error;
      const sortedConversations = data.sort((a, b) => {
        const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
        const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
        return dateB - dateA;
      });
      setConversations(sortedConversations || []);
      
      if (conversationId && sortedConversations) {
          const found = sortedConversations.find(c => c.id === conversationId);
          setSelectedConversation(found || null);
      } else if (!conversationId) {
          setSelectedConversation(null);
      }
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos conversations.',
        variant: 'destructive',
      });
    } finally {
      setLoadingConversations(false);
    }
  }, [user, toast, conversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-page-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        fetchConversations();
        // Browser push notification for new message
        if ('Notification' in window && Notification.permission === 'granted') {
          const senderName = payload.new?.sender_name || 'Nouveau message';
          const preview = payload.new?.content?.substring(0, 60) || '';
          const notif = new Notification(`Zando+ — ${senderName}`, {
            body: preview,
            icon: '/android-chrome-192x192.png',
          });
          notif.onclick = () => {
            window.focus();
            window.location.href = `/messages/${payload.new.conversation_id}`;
          };
        }
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations',
        filter: `buyer_id=eq.${user.id}`
      }, (payload) => {
        fetchConversations();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations',
        filter: `seller_id=eq.${user.id}`
      }, (payload) => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/messages/${conversation.id}`);
  };
  
  const handleConversationUpdate = () => {
    fetchConversations();
  };

  return (
    <>
      <Helmet>
        <title>Mes Messages - Zando+ Congo</title>
        <meta name="description" content="Gérez vos conversations et messages sur Zando+ Congo." />
      </Helmet>
      <div className="h-[calc(100vh-140px)] flex bg-white border-t">
        <div className={`w-full md:w-1/3 lg:w-1/4 border-r overflow-y-auto custom-scrollbar ${conversationId ? 'hidden md:block' : 'block'}`}>
          {loadingConversations ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-custom-green-500" />
            </div>
          ) : conversations.length > 0 ? (
            <ConversationList
              conversations={conversations}
              loading={loadingConversations}
              selectedConversation={selectedConversation}
              onSelect={handleSelectConversation}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Inbox className="h-16 w-16 text-gray-300 mb-4"/>
              <h3 className="text-lg font-semibold">Boîte de réception vide</h3>
              <p className="text-gray-500 text-sm">Les messages de vos acheteurs et vendeurs apparaîtront ici.</p>
            </div>
          )}
        </div>
        <div className={`w-full md:w-2/3 lg:w-3/4 ${conversationId ? 'block' : 'hidden md:block'}`}>
          {selectedConversation ? (
            <ChatWindow
              key={selectedConversation.id}
              conversation={selectedConversation}
              onMessageSent={handleConversationUpdate}
            />
          ) : (
            <EmptyChat />
          )}
        </div>
      </div>
    </>
  );
};

export default MessagesPage;