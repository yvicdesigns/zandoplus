import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Store, BadgeCheck, Send, Megaphone, ChevronLeft, Flag, Ban } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const ConversationHeader = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const { participant, listing } = conversation;

  const isSystem = listing?.id === null;
  const isSentItems = isSystem && participant?.full_name === 'Messages Envoyés';
  const isAnnouncement = isSystem && participant?.full_name === 'Annonces de Zando+';
  const isOnline = participant?.last_seen && Date.now() - new Date(participant.last_seen) < 300000;
  const sellerPath = `/seller/${participant?.shop_slug || participant?.id}`;

  if (isSentItems || isAnnouncement) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          {isSentItems ? <Send className="w-5 h-5 text-gray-500" /> : <Megaphone className="w-5 h-5 text-purple-500" />}
        </div>
        <div>
          <p className="text-[14px] font-black text-gray-900">{isSentItems ? 'Messages Envoyés' : 'Annonces Zando+'}</p>
          <p className="text-[11px] text-gray-400">{isSentItems ? 'Historique de vos messages envoyés' : 'Communications importantes'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 bg-white">
      {/* Header principal */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-3">
          {/* Bouton retour mobile */}
          <button onClick={onBack} className="md:hidden p-1 -ml-1 text-gray-400 hover:text-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-[14px] font-black text-gray-600">
              {participant?.avatar_url ? (
                <img src={participant.avatar_url} alt={participant.full_name} className="w-full h-full object-cover" />
              ) : (
                participant?.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-custom-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          {/* Nom + statut */}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-black text-gray-900">{participant?.full_name}</p>
              {participant?.verified && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            </div>
            <p className={`text-[11px] font-semibold ${isOnline ? 'text-custom-green-500' : 'text-gray-400'}`}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={sellerPath}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            Voir la boutique
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1.5">
                <Link to={sellerPath} className="flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 sm:hidden">
                  <Store className="w-4 h-4" /> Voir la boutique
                </Link>
                <button onClick={() => { toast({ title: 'Signalement envoyé.' }); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50">
                  <Flag className="w-4 h-4" /> Signaler un problème
                </button>
                <button onClick={() => { toast({ title: 'Boutique bloquée.' }); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-red-500 hover:bg-red-50">
                  <Ban className="w-4 h-4" /> Bloquer cette boutique
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carte annonce */}
      {listing?.id && (
        <div className="mx-5 mb-3 border border-gray-100 rounded-xl p-3 flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-colors group">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
            {listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-gray-900 truncate">{listing.title}</p>
            <p className="text-[13px] font-black text-custom-green-500">{(listing.price || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
          <Link
            to={`/listings/${listing.listing_slug || listing.id}`}
            className="flex-shrink-0 w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-custom-green-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ConversationHeader;
