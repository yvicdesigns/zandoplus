import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Loader2, ShoppingBag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS = {
  fonds_liberes:  { label: 'Livrée',     cls: 'bg-emerald-100 text-emerald-700' },
  fonds_bloques:  { label: 'En cours',   cls: 'bg-orange-100 text-orange-700'  },
  confirme:       { label: 'Confirmée',  cls: 'bg-blue-100 text-blue-700'      },
  cod_en_attente: { label: 'En attente', cls: 'bg-sky-100 text-sky-700'        },
  litige:         { label: 'Litige',     cls: 'bg-red-100 text-red-700'        },
  rembourse:      { label: 'Remboursé',  cls: 'bg-gray-100 text-gray-500'      },
  cod_annule:     { label: 'Annulée',    cls: 'bg-gray-100 text-gray-500'      },
};

const TABS = [
  { id: 'all',     label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'done',    label: 'Livrées' },
];

const SellerOrdersInline = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('transactions_escrow')
        .select('id, statut, montant, created_at, annonce:annonce_id(id, title, images, listing_slug), acheteur:acheteur_id(full_name, avatar_url)')
        .eq('vendeur_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = orders.filter(o => {
    if (tab === 'pending') return ['fonds_bloques', 'confirme', 'cod_en_attente'].includes(o.statut);
    if (tab === 'done')    return o.statut === 'fonds_liberes';
    return true;
  });

  const pendingCount = orders.filter(o => ['fonds_bloques', 'confirme', 'cod_en_attente'].includes(o.statut)).length;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;

  return (
    <div>
      <h2 className="text-[17px] font-black text-gray-900 mb-4">Commandes reçues</h2>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`h-8 px-4 rounded-lg text-[12px] font-bold transition-all relative ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
            {t.id === 'pending' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-[14px] text-gray-400">Aucune commande{tab !== 'all' ? ' dans cette catégorie' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const cfg = STATUS[o.statut] || { label: o.statut, cls: 'bg-gray-100 text-gray-500' };
            const shortId = o.id?.slice(-6).toUpperCase();
            const buyer = o.acheteur;
            return (
              <div key={o.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {o.annonce?.images?.[0]
                    ? <img src={o.annonce.images[0]} alt="" className="w-full h-full object-cover" />
                    : <ShoppingBag className="w-7 h-7 m-3.5 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 truncate">{o.annonce?.title || 'Produit'}</p>
                  <p className="text-[11px] text-gray-400">Commande #ZND-{shortId}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {buyer?.avatar_url
                      ? <img src={buyer.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                      : <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">{buyer?.full_name?.[0]}</div>}
                    <p className="text-[11px] text-gray-500">{buyer?.full_name || 'Client'}</p>
                    <span className="text-gray-200">·</span>
                    <p className="text-[11px] text-gray-400">{format(new Date(o.created_at), 'd MMM yyyy', { locale: fr })}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                  <p className="text-[13px] font-black text-gray-900 mt-1">{(o.montant || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                {o.annonce?.id && (
                  <Link to={`/listings/${o.annonce.listing_slug || o.annonce.id}`} className="flex-shrink-0 w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:border-custom-green-400 transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerOrdersInline;
