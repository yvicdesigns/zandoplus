import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const Message = ({ message, isOwnMessage }) => {
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl ${
        isOwnMessage
          ? 'bg-custom-green-500 text-white rounded-tr-sm'
          : 'bg-gray-100 text-gray-900 rounded-tl-sm'
      }`}>
        <p className="text-[13px] leading-relaxed">{message.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwnMessage ? 'text-green-200' : 'text-gray-400'}`}>
          <span className="text-[10px]">{formatTime(message.created_at)}</span>
          {isOwnMessage && (
            message.is_read
              ? <CheckCheck className="w-3 h-3" />
              : <Check className="w-3 h-3" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
