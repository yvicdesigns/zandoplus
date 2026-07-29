import React from 'react';
import { Send, Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ConversationItem = ({ chat, isSelected, onSelect }) => {
  const { user } = useAuth();

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays < 1) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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

  const initials = name?.charAt(0).toUpperCase();
  const avatarUrl = !isSystem ? chat.participant?.avatar_url : null;

  return (
    <button
      onClick={() => onSelect(chat)}
      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 transition-colors ${
        isSelected ? 'bg-green-50 border-l-[3px] border-l-custom-green-500' : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-[15px] font-black text-gray-600">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : isSentItems ? (
            <Send className="w-5 h-5 text-gray-500" />
          ) : isAnnouncement ? (
            <Megaphone className="w-5 h-5 text-purple-500" />
          ) : (
            initials
          )}
        </div>
        {isOnline && !isSystem && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-custom-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-[13px] truncate ${unread > 0 ? 'font-black text-gray-900' : 'font-semibold text-gray-800'}`}>
            {name}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <span className="text-[10px] text-gray-400">{time}</span>
            {unread > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-custom-green-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
        </div>
        <p className={`text-[12px] truncate ${unread > 0 ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
          {preview}
        </p>
      </div>
    </button>
  );
};

export default ConversationItem;
