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
      <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: '#075E54' }}>
        {onBack && (
          <button onClick={onBack} className="md:hidden p-1 -ml-1 text-white/80 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          {isSentItems ? <Send className="w-5 h-5 text-white" /> : <Megaphone className="w-5 h-5 text-white" />}
        </div>
        <div>
          <p className="text-[14px] font-bold text-white">{isSentItems ? 'Messages Envoyés' : 'Annonces Zando+'}</p>
          <p className="text-[11px] text-white/60">{isSentItems ? 'Historique de vos messages envoyés' : 'Communications importantes'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#075E54' }}>
      {/* Header principal */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Bouton retour */}
          <button onClick={onBack} className="p-1 text-white/80 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Avatar cliquable */}
          <Link to={sellerPath} className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 flex items-center justify-center text-[14px] font-bold text-white">
              {participant?.avatar_url ? (
                <img src={participant.avatar_url} alt={participant.full_name} className="w-full h-full object-cover" />
              ) : (
                participant?.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#075E54]" />
            )}
          </Link>

          {/* Nom + statut */}
          <Link to={sellerPath} className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-[14px] font-bold text-white truncate">{participant?.full_name}</p>
              {participant?.verified && <BadgeCheck className="w-4 h-4 text-blue-300 flex-shrink-0" />}
            </div>
            <p className="text-[11px] text-white/70">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1.5">
                <Link to={sellerPath} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                  <Store className="w-4 h-4" /> Voir la boutique
                </Link>
                <button onClick={() => { toast({ title: 'Signalement envoyé.' }); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
                  <Flag className="w-4 h-4" /> Signaler un problème
                </button>
                <button onClick={() => { toast({ title: 'Boutique bloquée.' }); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-500 hover:bg-red-50">
                  <Ban className="w-4 h-4" /> Bloquer cette boutique
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carte annonce */}
      {listing?.id && (
        <div className="mx-3 mb-2.5 rounded-xl p-2.5 flex items-center gap-3 bg-white/10">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/20 flex-shrink-0">
            {listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate">{listing.title}</p>
            <p className="text-[13px] font-black text-green-300">{(listing.price || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
          <Link
            to={`/listings/${listing.listing_slug || listing.id}`}
            className="flex-shrink-0 w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white rotate-180" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ConversationHeader;
