import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const MessageInput = ({ conversation, onMessageSent }) => {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !conversation || isSending) return;

    setIsSending(true);

    const { error } = await supabase.rpc('create_conversation_and_message', {
      p_content: messageText,
      p_conversation_id: conversation.id,
      p_listing_id: conversation.listing?.id ?? null
    });

    setIsSending(false);

    if (error) {
      console.error('Error sending message:', error);
      toast({ title: "Erreur", description: "Impossible d'envoyer le message.", variant: "destructive" });
    } else {
      setMessageText('');
      if(onMessageSent) {
          onMessageSent();
      }
      // Notify receiver by email + push (fire-and-forget, non-blocking)
      const receiverId = conversation.participant?.id;
      const senderName = user.full_name || user.email?.split('@')[0] || 'Un utilisateur';
      if (receiverId && receiverId !== user.id) {
        supabase.functions.invoke('notify-new-message', {
          body: {
            receiver_id: receiverId,
            sender_name: senderName,
            conversation_id: conversation.id,
            message_preview: messageText.slice(0, 100),
          },
        }).catch(() => {});

        supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: receiverId,
            title: `💬 ${senderName}`,
            message: messageText.slice(0, 80),
            url: `/messages/${conversation.id}`,
          },
        }).catch(() => {});
      }
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-lg">
      <div className="flex space-x-3">
        <Input
          type="text"
          placeholder="Tapez votre message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1"
          autoComplete="off"
          disabled={isSending}
        />
        <Button type="submit" className="gradient-bg hover:opacity-90" disabled={isSending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;