import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ConversationItem from './ConversationItem';

const ConversationList = ({ conversations, loading, selectedConversation, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(chat =>
    chat.participant?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.listing?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Rechercher des conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Chargement des conversations...</div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((chat) => (
            <ConversationItem
              key={chat.id}
              chat={chat}
              isSelected={selectedConversation?.id === chat.id}
              onSelect={onSelect}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">Aucune conversation trouvée.</div>
        )}
      </div>
    </>
  );
};

export default ConversationList;