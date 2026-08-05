import React from 'react';
import { Send, Megaphone, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ConversationItem = ({ chat, isSelected, onSelect }) => {
  const { user } = useAuth();

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays < 1) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 2) return 'Hier';
    if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const isSystem = chat.listing?.id === null;
  const isSentItems = isSystem && chat.participant?.full_name === 'Messages Envoyés';
  const isAnnouncement = isSystem && chat.participant?.full_name === 'Annonces de Zando+';
  const isOnline = chat.participant?.last_seen && Date.now() - new Date(chat.participant.last_seen) < 300000;

  const name = isSentItems ? 'Messages Envoyés' : isAnnouncement ? 'Annonces Zando+' : chat.participant?.full_name;
  const preview = chat.last_message?.content || 'Début de la conversation...';
  const time = formatTime(chat.last_message?.created_at);
  const unread = chat.unread_count || 0;
  const isOwnLastMsg = chat.last_message?.sender_id === user?.id;

  const initials = name?.charAt(0).toUpperCase();
  const avatarUrl = !isSystem ? chat.participant?.avatar_url : null;

  return (
    <button
      onClick={() => onSelect(chat)}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
        isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Avatar 56px */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-[20px] font-black text-gray-600">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : isSentItems ? (
            <Send className="w-6 h-6 text-gray-500" />
          ) : isAnnouncement ? (
            <Megaphone className="w-6 h-6 text-purple-500" />
          ) : (
            initials
          )}
        </div>
        {isOnline && !isSystem && (
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 border-b border-gray-100 pb-3 pt-0.5">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-[15px] truncate pr-2 ${unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
            {name}
          </p>
          <span className={`text-[11px] flex-shrink-0 ${unread > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {isOwnLastMsg && (
              <CheckCheck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            )}
            <p className={`text-[13px] truncate ${unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {preview}
            </p>
          </div>
          {unread > 0 && (
            <span className="ml-2 min-w-[20px] h-5 px-1 text-white text-[11px] font-bold rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#25D366' }}>
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
