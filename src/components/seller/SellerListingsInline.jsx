import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Package, Plus, Pencil, Eye, Trash2, Zap, Key, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import HousingVerificationCard from './HousingVerificationCard';

const STATUS_CFG = {
  active:   { label: 'En ligne',  cls: 'bg-emerald-100 text-emerald-700' },
  pending:  { label: 'En attente',cls: 'bg-orange-100 text-orange-700'  },
  archived: { label: 'Archivée',  cls: 'bg-gray-100 text-gray-500'      },
  rejected: { label: 'Rejetée',   cls: 'bg-red-100 text-red-700'        },
  rented:   { label: 'Louée',     cls: 'bg-gray-100 text-gray-500'      },
};

const SellerListingsInline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('listings')
      .select('id, title, price, images, status, views_count, created_at, listing_slug, is_boosted, category')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setListings(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    setDeleting(id);
    const { error } = await supabase.from('listings').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setListings(prev => prev.filter(l => l.id !== id));
      toast({ title: 'Annonce supprimée', className: 'bg-custom-green-500 text-white' });
    }
    setDeleting(null);
  };

  // "Maison à louer" : le propriétaire marque lui-même son annonce comme louée
  // (statut dédié 'rented', exclu de la recherche publique comme 'inactive') pour
  // qu'elle disparaisse immédiatement de la liste — pas besoin de repasser par un admin.
  const [togglingRented, setTogglingRented] = useState(null);
  const handleToggleRented = async (id, currentStatus) => {
    setTogglingRented(id);
    const nextStatus = currentStatus === 'rented' ? 'active' : 'rented';
    const { error } = await supabase.from('listings').update({ status: nextStatus }).eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: nextStatus } : l));
      toast({ title: nextStatus === 'rented' ? 'Marquée comme louée' : 'Remise en ligne', className: 'bg-custom-green-500 text-white' });
    }
    setTogglingRented(null);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[17px] font-black text-gray-900">Mes produits</h2>
        <button
          onClick={() => navigate('/post-ad')}
          className="flex items-center gap-1.5 h-9 px-4 bg-custom-green-500 text-white text-[12px] font-bold rounded-xl hover:bg-custom-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter un produit
        </button>
      </div>

      {listings.some(l => l.category === 'maison-a-louer') && <HousingVerificationCard />}

      {listings.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-[14px] text-gray-400 mb-4">Aucun produit publié pour l'instant</p>
          <button
            onClick={() => navigate('/post-ad')}
            className="h-9 px-5 bg-custom-green-500 text-white text-[12px] font-bold rounded-xl hover:bg-custom-green-600 transition-colors"
          >
            Publier ma première annonce
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => {
            const cfg = STATUS_CFG[l.status] || { label: l.status, cls: 'bg-gray-100 text-gray-500' };
            return (
              <div key={l.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {l.images?.[0]
                    ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                    : <Package className="w-8 h-8 m-4 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 truncate">{l.title}</p>
                  <p className="text-[14px] font-black text-custom-green-500">{(l.price || 0).toLocaleString('fr-FR')} FCFA</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Eye className="w-3 h-3" /> {l.views_count || 0} vues
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/listings/${l.listing_slug || l.id}`}
                    title="Voir l'annonce"
                    className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:border-custom-green-400 hover:text-custom-green-500 transition-colors text-gray-400"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => navigate(`/edit-ad/${l.id}`)}
                    title="Modifier"
                    className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-400 hover:text-blue-500 transition-colors text-gray-400"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {l.category === 'maison-a-louer' && (l.status === 'active' || l.status === 'rented') && (
                    <button
                      onClick={() => handleToggleRented(l.id, l.status)}
                      disabled={togglingRented === l.id}
                      title={l.status === 'rented' ? 'Remettre en ligne' : 'Marquer comme louée'}
                      className={`flex items-center gap-1 px-2.5 h-8 rounded-lg text-[11px] font-bold transition-colors border disabled:opacity-50 ${
                        l.status === 'rented'
                          ? 'bg-white border-gray-200 text-gray-400 hover:border-custom-green-400 hover:text-custom-green-500'
                          : 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100'
                      }`}
                    >
                      {togglingRented === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : l.status === 'rented' ? <RotateCcw className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                      {l.status === 'rented' ? 'Remettre en ligne' : 'Marquer louée'}
                    </button>
                  )}
                  {l.status === 'active' && (
                    <button
                      onClick={() => navigate(`/boost/${l.id}`)}
                      title="Booster cette annonce"
                      className={`flex items-center gap-1 px-2.5 h-8 rounded-lg text-[11px] font-bold transition-colors border ${
                        l.is_boosted
                          ? 'bg-amber-50 border-amber-300 text-amber-600'
                          : 'bg-white border-gray-200 text-gray-400 hover:border-accent-yellow hover:text-amber-500'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {l.is_boosted ? 'Boosté' : 'Booster'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(l.id)}
                    disabled={deleting === l.id}
                    title="Supprimer"
                    className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors text-gray-400 disabled:opacity-50"
                  >
                    {deleting === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerListingsInline;
