import React, { useState, useEffect, useCallback, useRef } from 'react';
import ConversationHeader from './ConversationHeader';
import Message from './Message';
import MessageInput from './MessageInput';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Tag, X } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

const DateSeparator = ({ date }) => {
  const label = isToday(date) ? "Aujourd'hui"
    : isYesterday(date) ? 'Hier'
    : format(date, 'd MMMM yyyy', { locale: fr });
  return (
    <div className="flex justify-center my-3">
      <span className="px-3 py-1 rounded-full text-[11px] text-gray-600 font-semibold shadow-sm" style={{ background: '#d1f4cc' }}>
        {label}
      </span>
    </div>
  );
};

const ChatWindow = ({ conversation, onMessageSent, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offerModal, setOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);
  const bottomRef = useRef(null);

  const isSystem = conversation?.listing?.id === null;
  const isNegotiable = !!conversation?.listing?.negotiable;

  const sendOffer = async () => {
    const price = parseInt(offerPrice.replace(/\s/g, ''), 10);
    if (!price || price <= 0) { toast({ title: 'Prix invalide', variant: 'destructive' }); return; }
    setSendingOffer(true);
    const payload = JSON.stringify({
      price,
      listing_id: conversation.listing?.id,
      listing_slug: conversation.listing?.listing_slug || conversation.listing?.id,
      title: conversation.listing?.title || 'Produit',
      original_price: conversation.listing?.price,
    });
    await supabase.rpc('create_conversation_and_message', {
      p_content: `__OFFER__:${payload}`,
      p_conversation_id: conversation.id,
      p_listing_id: conversation.listing?.id ?? null,
    });
    setSendingOffer(false);
    setOfferModal(false);
    setOfferPrice('');
  };

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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages]);

  useEffect(() => {
    if (!user?.id || !conversation?.id) return;
    const convId = conversation.id;
    const userId = user.id;
    const ch = supabase.channel(`conv:${convId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        const msg = payload.new;
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (msg.receiver_id === userId) {
          supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {});
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user?.id, conversation?.id]);

  /* Grouper les messages par jour */
  const grouped = messages.reduce((acc, msg) => {
    const day = msg.created_at.split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      <ConversationHeader conversation={conversation} onBack={onBack} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-0.5" style={{ background: '#efeae2' }}>
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

      {!isSystem && isNegotiable && (
        <div className="px-3 pt-2 flex-shrink-0" style={{ background: '#f0f2f5' }}>
          <button
            onClick={() => setOfferModal(true)}
            className="flex items-center gap-2 text-[12px] font-semibold text-custom-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            Proposer un prix négocié
          </button>
        </div>
      )}

      {!isSystem && (
        <MessageInput
          conversation={conversation}
          onMessageSent={() => fetchMessages(conversation.id)}
        />
      )}

      {/* Modal offre de prix */}
      {offerModal && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setOfferModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-black text-gray-900">Proposer un prix</h3>
              <button onClick={() => setOfferModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {conversation.listing?.price && (
              <p className="text-[13px] text-gray-400 mb-3">
                Prix affiché : <span className="font-bold text-gray-700">{Number(conversation.listing.price).toLocaleString('fr-FR')} FCFA</span>
              </p>
            )}
            <div className="relative mb-4">
              <input
                type="number"
                placeholder="Ex : 12 000"
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                autoFocus
                className="w-full h-12 border-2 border-gray-200 rounded-xl px-4 pr-20 text-[16px] font-bold text-gray-900 focus:outline-none focus:border-custom-green-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400">FCFA</span>
            </div>
            <button
              onClick={sendOffer}
              disabled={sendingOffer || !offerPrice}
              className="w-full h-12 bg-custom-green-500 text-white font-bold text-[14px] rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
              Envoyer l'offre de prix
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
