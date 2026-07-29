import React, { useState, useEffect, useCallback } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useMessagesDrawer } from '@/contexts/MessagesDrawerContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import ConversationDetails from './ConversationDetails';
import { Loader2 } from 'lucide-react';

const MessagesDrawer = () => {
  const { isOpen, closeMessages, initialConvId } = useMessagesDrawer();
  const { user } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations]   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [selected, setSelected]             = useState(null);

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

      if (initialConvId) {
        const found = sorted.find(c => c.id === initialConvId);
        if (found) setSelected(found);
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger vos conversations.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast, initialConvId]);

  useEffect(() => {
    if (isOpen && user) fetchConversations();
  }, [isOpen, user]);

  /* Fermer avec Échap */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeMessages(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeMessages]);

  /* Bloquer le scroll body quand ouvert */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* Realtime */
  useEffect(() => {
    if (!user || !isOpen) return;
    const ch = supabase.channel('drawer-msgs-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, fetchConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `buyer_id=eq.${user.id}` }, fetchConversations)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `seller_id=eq.${user.id}` }, fetchConversations)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user, isOpen, fetchConversations]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        onClick={closeMessages}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-[999] flex flex-col bg-white shadow-2xl"
        style={{ width: 'min(980px, 100vw)', animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header du drawer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-custom-green-500" />
            <h2 className="text-[16px] font-black text-gray-900">Messages</h2>
          </div>
          <button
            onClick={closeMessages}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Corps — 3 colonnes */}
        <div className="flex flex-1 min-h-0">
          {/* Colonne 1 : Liste conversations */}
          <div className={`w-[280px] flex-shrink-0 border-r border-gray-100 flex flex-col bg-white ${selected ? 'hidden sm:flex' : 'flex'}`}>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-custom-green-500" />
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                selectedConversation={selected}
                onSelect={(c) => setSelected(c)}
              />
            )}
          </div>

          {/* Colonne 2 : Chat */}
          <div className={`flex-1 flex flex-col min-w-0 ${selected ? 'flex' : 'hidden sm:flex'}`}>
            {selected ? (
              <ChatWindow
                key={selected.id}
                conversation={selected}
                onMessageSent={fetchConversations}
                onBack={() => setSelected(null)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-[14px] font-bold text-gray-700">Sélectionnez une conversation</p>
                <p className="text-[12px] text-gray-400">Vos échanges apparaissent ici.</p>
              </div>
            )}
          </div>

          {/* Colonne 3 : Détails */}
          {selected && (
            <div className="hidden lg:block w-[260px] flex-shrink-0 border-l border-gray-100 overflow-y-auto bg-white">
              <ConversationDetails conversation={selected} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default MessagesDrawer;
