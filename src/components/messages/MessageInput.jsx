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
      p_listing_id: conversation.listing.id
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