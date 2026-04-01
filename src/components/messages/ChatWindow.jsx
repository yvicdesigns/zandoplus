import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ConversationHeader from './ConversationHeader';
import Message from './Message';
import MessageInput from './MessageInput';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ChatWindow = ({ conversation, onMessageSent }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = React.useRef(null);

  const isSystemConversation = conversation?.listing?.id === null;

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase.rpc('get_conversation_messages', {
        p_conversation_id: convId,
      });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      if (data.some(m => !m.is_read && m.sender_id !== user.id)) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', convId)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        // We can trigger a re-fetch of conversations list to update unread count
        if(onMessageSent) onMessageSent();
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages de cette conversation.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [toast, user, onMessageSent]);

  useEffect(() => {
    if (conversation?.id) {
      fetchMessages(conversation.id);
    } else {
      setMessages([]);
      setLoadingMessages(false);
    }
  }, [conversation?.id, fetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !conversation?.id) return;

    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, (payload) => {
        // Refetch all to correctly handle read status and order
        fetchMessages(conversation.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversation?.id, fetchMessages]);


  return (
    <Card className="border-0 shadow-lg h-full">
      <CardContent className="p-0 h-full flex flex-col">
        <ConversationHeader conversation={conversation} />
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-custom-green-500" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => (
              <Message key={message.id} message={message} isOwnMessage={message.sender_id === user.id} />
            ))
          ) : (
            <div className="text-center text-gray-500 mt-10">Aucun message dans cette conversation.</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {!isSystemConversation && (
            <MessageInput 
              conversation={conversation} 
              onMessageSent={() => {
                  fetchMessages(conversation.id);
              }}
            />
        )}
      </CardContent>
    </Card>
  );
};

export default ChatWindow;