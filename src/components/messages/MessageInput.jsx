import React, { useState, useRef } from 'react';
import { Paperclip, Smile, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const MessageInput = ({ conversation, onMessageSent }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user || !conversation || sending) return;
    setSending(true);

    const { error } = await supabase.rpc('create_conversation_and_message', {
      p_content: text.trim(),
      p_conversation_id: conversation.id,
      p_listing_id: conversation.listing?.id ?? null,
    });

    setSending(false);
    if (error) {
      toast({ title: 'Erreur', description: "Impossible d'envoyer le message.", variant: 'destructive' });
    } else {
      setText('');
      onMessageSent?.();
      inputRef.current?.focus();

      const receiverId = conversation.participant?.id;
      const senderName = user.full_name || user.email?.split('@')[0] || 'Un utilisateur';
      if (receiverId && receiverId !== user.id) {
        supabase.functions.invoke('notify-new-message', {
          body: { receiver_id: receiverId, sender_name: senderName, conversation_id: conversation.id, message_preview: text.slice(0, 100) },
        }).catch(() => {});
        supabase.functions.invoke('send-push-notification', {
          body: { user_id: receiverId, title: `💬 ${senderName}`, message: text.slice(0, 80), url: `/messages/${conversation.id}` },
        }).catch(() => {});
      }
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <form onSubmit={handleSend} className="px-4 py-3.5 border-t border-gray-100 bg-white">
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-custom-green-400 transition-colors">
        <button type="button" className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          onClick={() => toast({ title: 'Bientôt disponible', description: "L'envoi de fichiers arrive prochainement." })}>
          <Paperclip className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder="Écrivez votre message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          disabled={sending}
          className="flex-1 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
        />

        <button type="button" className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          onClick={() => toast({ title: 'Bientôt disponible' })}>
          <Smile className="w-[18px] h-[18px]" />
        </button>

        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-8 h-8 bg-custom-green-500 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-custom-green-600 transition-colors disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
