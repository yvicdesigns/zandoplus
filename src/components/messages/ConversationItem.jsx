import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Send, User, Annoyed, Megaphone } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';


const ConversationItem = ({ chat, isSelected, onSelect }) => {
  const { user } = useAuth();

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = (now.setHours(0,0,0,0) - date.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24);

    if (diffInDays < 1) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const lastMessageContent = chat.last_message?.content || 'Début de la conversation...';
  const lastMessageTime = chat.last_message?.created_at;
  const isOnline = chat.participant?.last_seen && new Date() - new Date(chat.participant.last_seen) < 300000;
  
  const isSystemConversation = chat.listing?.id === null;
  const isAdminSentItems = isSystemConversation && chat.participant?.full_name === "Messages Envoyés";
  const isSellerAnnouncement = isSystemConversation && chat.participant?.full_name === "Annonces de Zando+";

  let participantName = chat.participant?.full_name;
  let listingTitle = chat.listing?.title;
  let avatarFallbackContent;
  let avatarImageSrc = chat.participant?.avatar_url;

  if (isAdminSentItems) {
    participantName = "Messages Envoyés";
    listingTitle = "Historique des messages en masse";
    avatarFallbackContent = <Send className="w-6 h-6 text-gray-600" />;
    avatarImageSrc = null;
  } else if (isSellerAnnouncement) {
    participantName = "Annonces de Zando+";
    listingTitle = "Communications importantes";
    avatarFallbackContent = <Megaphone className="w-6 h-6 text-purple-600" />;
    avatarImageSrc = null; // Maybe use a logo here in the future
  } else {
    avatarFallbackContent = chat.participant?.full_name?.charAt(0).toUpperCase() || <User />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-purple-50 border-r-4 border-r-purple-500' : ''
      } ${isSellerAnnouncement ? 'bg-purple-50/50' : ''}`}
      onClick={() => onSelect(chat)}
    >
      <div className="flex items-start space-x-3">
        <div className="relative">
          <Avatar className={`w-12 h-12 flex items-center justify-center ${isSystemConversation ? 'bg-gray-100' : ''}`}>
            {avatarImageSrc ? (
              <AvatarImage src={avatarImageSrc} alt={participantName} />
            ) : (
              <AvatarFallback className={`${isSystemConversation ? 'bg-transparent' : ''}`}>{avatarFallbackContent}</AvatarFallback>
            )}
          </Avatar>
          {isOnline && !isSystemConversation && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm truncate">{participantName}</h3>
              {chat.participant?.verified && !isSystemConversation && (
                <Shield className="w-4 h-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {formatTime(lastMessageTime)}
              </span>
              {chat.unread_count > 0 && (
                <Badge className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  {chat.unread_count}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-2">
            {!isSystemConversation && chat.listing?.images?.[0] && (
                <img
                    src={chat.listing.images[0]}
                    alt={listingTitle}
                    className="w-8 h-8 rounded object-cover"
                />
            )}
            <span className="text-xs text-gray-600 truncate">
              {listingTitle}
            </span>
          </div>

          <p className={`text-sm truncate ${
            chat.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
          }`}>
            {lastMessageContent}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ConversationItem;