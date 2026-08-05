import React, { useState } from 'react';
import { Search, Edit, Inbox } from 'lucide-react';
import ConversationItem from './ConversationItem';

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
      {/* Header vert WhatsApp */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ background: '#075E54' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[20px] font-black text-white">Messages</h2>
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Edit className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search pill */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-full text-[13px] focus:outline-none bg-white text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-gray-100 bg-white flex-shrink-0">
        {['Toutes', 'Non lus'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 h-7 rounded-full text-[12px] font-semibold transition-colors ${
              tab === t
                ? 'text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            style={tab === t ? { background: '#075E54' } : {}}
          >
            {t}
            {t === 'Non lus' && unreadCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                tab === t ? 'bg-white text-[#075E54]' : 'bg-custom-green-500 text-white'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto bg-white">
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
