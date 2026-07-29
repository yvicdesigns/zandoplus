import React, { useState } from 'react';
import { Search, SlidersHorizontal, Inbox } from 'lucide-react';
import ConversationItem from './ConversationItem';

const TABS = ['Toutes', 'Non lus', 'Favoris'];

const ConversationList = ({ conversations, selectedConversation, onSelect }) => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('Toutes');

  const unreadCount = conversations.filter(c => c.unread_count > 0).length;

  const filtered = conversations.filter(c => {
    const matchSearch =
      (c.participant?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.listing?.title || '').toLowerCase().includes(search.toLowerCase());
    if (tab === 'Non lus') return matchSearch && c.unread_count > 0;
    return matchSearch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* En-tête */}
      <div className="px-4 pt-5 pb-3 border-b border-gray-100">
        <h2 className="text-[18px] font-black text-gray-900 mb-3">Messages</h2>
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-custom-green-500 bg-gray-50"
            />
          </div>
          <button className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 h-7 rounded-full text-[12px] font-semibold transition-colors ${
                tab === t
                  ? 'bg-custom-green-500 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t}
              {t === 'Non lus' && unreadCount > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${tab === t ? 'bg-white text-custom-green-600' : 'bg-custom-green-500 text-white'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map(c => (
            <ConversationItem
              key={c.id}
              chat={c}
              isSelected={selectedConversation?.id === c.id}
              onSelect={onSelect}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-16 text-gray-300">
            <Inbox className="w-12 h-12 mb-3" />
            <p className="text-[13px]">Aucune conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
