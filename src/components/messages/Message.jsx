import React from 'react';
import { CheckCheck, Tag, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const OfferCard = ({ offerData, isOwnMessage }) => {
  const href = `/listings/${offerData.listing_slug || offerData.listing_id}?offered_price=${offerData.price}`;
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 min-w-[220px] max-w-[260px]">
      <div className="flex items-center gap-2 px-3 py-2 bg-custom-green-500">
        <Tag className="w-3.5 h-3.5 text-white flex-shrink-0" />
        <span className="text-[11px] font-bold text-white uppercase tracking-wide">Offre de prix</span>
      </div>
      <div className="px-3 py-2.5 bg-white">
        <p className="text-[12px] font-semibold text-gray-700 leading-tight mb-1 line-clamp-2">{offerData.title}</p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-[20px] font-black text-custom-green-500 tabular-nums leading-none">
            {Number(offerData.price).toLocaleString('fr-FR')} FCFA
          </span>
          {offerData.original_price && Number(offerData.original_price) > Number(offerData.price) && (
            <span className="text-[12px] text-gray-400 line-through tabular-nums">
              {Number(offerData.original_price).toLocaleString('fr-FR')}
            </span>
          )}
        </div>
        {isOwnMessage ? (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <ShoppingBag className="w-3.5 h-3.5" />
            En attente de paiement
          </div>
        ) : (
          <Link
            to={href}
            className="flex items-center justify-center gap-1.5 w-full h-9 rounded-lg bg-custom-green-500 text-white text-[12px] font-bold hover:bg-custom-green-600 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Payer {Number(offerData.price).toLocaleString('fr-FR')} FCFA
          </Link>
        )}
      </div>
    </div>
  );
};

const Message = ({ message, isOwnMessage }) => {
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const isOffer = message.content?.startsWith('__OFFER__:');
  let offerData = null;
  if (isOffer) {
    try { offerData = JSON.parse(message.content.slice(9)); } catch { /* malformed */ }
  }

  if (isOffer && offerData) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} px-3 mb-0.5`}>
        <div>
          <OfferCard offerData={offerData} isOwnMessage={isOwnMessage} />
          <div className={`flex items-center gap-1 mt-0.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-gray-400">{formatTime(message.created_at)}</span>
            {isOwnMessage && (
              message.is_read
                ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />
                : <CheckCheck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} px-3 mb-0.5`}>
      <div
        className="relative max-w-[78%] shadow-sm"
        style={{
          backgroundColor: isOwnMessage ? '#d9fdd3' : '#ffffff',
          borderRadius: isOwnMessage
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
          padding: '7px 12px 5px 12px',
        }}
      >
        {/* Queue de la bulle */}
        {isOwnMessage ? (
          <div style={{
            position: 'absolute', bottom: 0, right: -7,
            width: 0, height: 0,
            borderLeft: '8px solid #d9fdd3',
            borderBottom: '8px solid transparent',
          }} />
        ) : (
          <div style={{
            position: 'absolute', bottom: 0, left: -7,
            width: 0, height: 0,
            borderRight: '8px solid #ffffff',
            borderBottom: '8px solid transparent',
          }} />
        )}

        <p className="text-[13.5px] text-gray-900 leading-[1.45] whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Heure + statut */}
        <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
          <span className="text-[10px] text-gray-400 leading-none">
            {formatTime(message.created_at)}
          </span>
          {isOwnMessage && (
            message.is_read
              ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />
              : <CheckCheck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
