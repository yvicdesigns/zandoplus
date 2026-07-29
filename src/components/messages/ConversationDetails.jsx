import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, MessageCircle, ShoppingBag, BadgeCheck, Package, Eye, Flag, Ban } from 'lucide-react';

const ConversationDetails = ({ conversation }) => {
  const { participant, listing } = conversation;
  const { toast } = useToast();
  const [sellerStats, setSellerStats] = useState(null);

  useEffect(() => {
    if (!participant?.id) return;
    const load = async () => {
      const [{ count: orders }, { count: products }, { data: prof }] = await Promise.all([
        supabase.from('transactions_escrow').select('id', { count: 'exact', head: true }).eq('vendeur_id', participant.id).eq('statut', 'fonds_liberes'),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', participant.id).eq('status', 'active'),
        supabase.from('profiles').select('created_at, verified').eq('id', participant.id).single(),
      ]);
      setSellerStats({ orders: orders || 0, products: products || 0, memberSince: prof?.created_at, verified: prof?.verified });
    };
    load();
  }, [participant?.id]);

  const isSystem = listing?.id === null;
  if (isSystem) return null;

  const memberSince = sellerStats?.memberSince ? format(new Date(sellerStats.memberSince), 'MMM yyyy', { locale: fr }) : '—';
  const sellerPath = `/seller/${participant?.shop_slug || participant?.id}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest">Détails de la conversation</p>
      </div>

      {/* Profil vendeur */}
      <div className="px-5 py-5 border-b border-gray-100 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 mb-3 flex items-center justify-center text-[20px] font-black text-gray-600">
          {participant?.avatar_url ? (
            <img src={participant.avatar_url} alt={participant.full_name} className="w-full h-full object-cover" />
          ) : (
            participant?.full_name?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[14px] font-black text-gray-900">{participant?.full_name}</p>
          {sellerStats?.verified && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
        </div>
        <p className="text-[11px] text-gray-400 mb-4">{sellerStats?.verified ? 'Boutique officielle' : 'Vendeur particulier'}</p>
        <Link
          to={sellerPath}
          className="w-full h-8 border border-gray-200 rounded-xl text-[12px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors"
        >
          Voir la boutique
        </Link>
      </div>

      {/* Infos */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">Informations</p>
        <div className="space-y-3">
          {[
            { icon: Calendar,   label: 'Membre depuis',    value: memberSince },
            { icon: Clock,      label: 'Réponse moyenne',  value: 'N/A' },
            { icon: MessageCircle, label: 'Taux de réponse', value: 'N/A' },
            { icon: ShoppingBag, label: 'Commandes',       value: sellerStats ? `${sellerStats.orders} commandes` : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2 text-gray-500">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{label}</span>
              </div>
              <span className="font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Produit lié */}
      {listing?.id && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">Produit concerné</p>
          <Link to={`/listings/${listing.listing_slug || listing.id}`}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-gray-900 truncate">{listing.title}</p>
              <p className="text-[12px] font-black text-custom-green-500">{(listing.price || 0).toLocaleString('fr-FR')} FCFA</p>
            </div>
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4">
        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">Actions</p>
        <div className="space-y-1">
          <Link to={sellerPath}
            className="flex items-center gap-2.5 py-2 text-[12px] text-gray-700 hover:text-custom-green-600 transition-colors">
            <Package className="w-4 h-4" /> Afficher les produits
          </Link>
          {listing?.id && (
            <Link to={`/listings/${listing.listing_slug || listing.id}`}
              className="flex items-center gap-2.5 py-2 text-[12px] text-gray-700 hover:text-custom-green-600 transition-colors">
              <Eye className="w-4 h-4" /> Voir le produit
            </Link>
          )}
          <button onClick={() => toast({ title: 'Signalement envoyé.' })}
            className="flex items-center gap-2.5 py-2 text-[12px] text-gray-700 hover:text-orange-500 transition-colors w-full text-left">
            <Flag className="w-4 h-4" /> Signaler un problème
          </button>
          <button onClick={() => toast({ title: 'Boutique bloquée.' })}
            className="flex items-center gap-2.5 py-2 text-[12px] text-red-500 hover:text-red-600 transition-colors w-full text-left">
            <Ban className="w-4 h-4" /> Bloquer cette boutique
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetails;
