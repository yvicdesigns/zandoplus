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

const CommandesInline = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('transactions_escrow')
        .select('id, statut, montant, created_at, annonce:annonce_id(id, title, images, listing_slug)')
        .eq('acheteur_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;

  return (
    <div>
      <h2 className="text-[17px] font-black text-gray-900 mb-5">Mes commandes</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3" />
          <p className="text-[14px] text-gray-400">Aucune commande pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const cfg = STATUS[o.statut] || { label: o.statut, cls: 'bg-gray-100 text-gray-500' };
            const shortId = o.id?.slice(-6).toUpperCase();
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
                  <p className="text-[11px] text-gray-400">{format(new Date(o.created_at), 'd MMM yyyy', { locale: fr })}</p>
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

export default CommandesInline;
