import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Truck, Search, User, Package, Banknote } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DELIVERY_STATUS_OPTIONS = [
  { value: 'paiement_valide', label: 'Prêt à livrer',          color: 'bg-indigo-100 text-indigo-800' },
  { value: 'livre',           label: 'Livré',                   color: 'bg-purple-100 text-purple-800' },
  { value: 'confirme',        label: 'Réception confirmée',     color: 'bg-green-100 text-green-800'   },
  { value: 'litige',          label: 'Litige',                  color: 'bg-red-100 text-red-800'       },
  { value: 'cod_en_attente',  label: '💵 COD — À livrer',       color: 'bg-orange-100 text-orange-800' },
  { value: 'cod_livre',       label: '✅ COD — Cash collecté',   color: 'bg-green-100 text-green-800'   },
  { value: 'cod_annule',      label: 'COD Annulé',              color: 'bg-gray-100 text-gray-700'    },
];

const getStatusCfg = (statut) =>
  DELIVERY_STATUS_OPTIONS.find(o => o.value === statut) ||
  { label: statut || '—', color: 'bg-gray-100 text-gray-600' };

const formatDate = (d) => d
  ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const AdminDeliveriesTab = memo(() => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const { toast } = useToast();

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions_escrow')
        .select(`
          id, statut, montant, created_at, delivery_choice,
          annonce:annonce_id(id, title, images),
          acheteur:acheteur_id(full_name),
          vendeur:vendeur_id(full_name)
        `)
        .or('delivery_choice.eq.zando,statut.like.cod%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({ title: "Erreur", description: "Impossible de charger les livraisons.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const handleStatusChange = async (deliveryId, newStatus) => {
    setLoadingAction(deliveryId);
    try {
      const { error } = await supabase
        .from('transactions_escrow')
        .update({ statut: newStatus })
        .eq('id', deliveryId);
      if (error) throw error;
      toast({ title: 'Succès', description: 'Statut mis à jour.', className: 'bg-green-100 text-green-800' });
      fetchDeliveries();
    } catch (error) {
      toast({ title: 'Erreur', description: error.message || "Impossible de mettre à jour.", variant: 'destructive' });
    } finally {
      setLoadingAction(null);
    }
  };

  const filteredDeliveries = useMemo(() => deliveries.filter(d =>
    d.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.annonce?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.acheteur?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.vendeur?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [deliveries, searchQuery]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Rechercher par ID, annonce, acheteur, vendeur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full md:w-1/2"
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredDeliveries.map((delivery, index) => {
            const isCod = delivery.statut?.startsWith('cod_');
            const statusCfg = getStatusCfg(delivery.statut);
            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 items-start gap-4">
                    {/* Annonce */}
                    <div className="md:col-span-2 flex items-start gap-4">
                      <img
                        src={delivery.annonce?.images?.[0] || 'https://via.placeholder.com/80'}
                        alt={delivery.annonce?.title}
                        className="w-20 h-20 object-cover rounded-lg shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/listings/${delivery.annonce?.id}`}
                          className="font-semibold text-gray-800 hover:text-custom-green-600 transition-colors line-clamp-2 text-sm"
                        >
                          {delivery.annonce?.title || '—'}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {isCod
                            ? <Banknote className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            : <Truck className="w-3.5 h-3.5 text-custom-green-500 shrink-0" />
                          }
                          <Badge variant="secondary" className="text-xs">
                            {isCod ? 'Payer à la livraison' : 'Zando Delivery'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(delivery.created_at)}</p>
                      </div>
                    </div>

                    {/* Acheteur */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Acheteur</p>
                          <p>{delivery.acheteur?.full_name || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vendeur + montant */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-green-500 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Vendeur</p>
                          <p>{delivery.vendeur?.full_name || '—'}</p>
                        </div>
                      </div>
                      {delivery.montant > 0 && (
                        <p className="text-xs font-semibold text-custom-green-600 mt-1.5 ml-5">
                          {delivery.montant.toLocaleString()} FCFA
                        </p>
                      )}
                    </div>

                    {/* Statut + sélecteur */}
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <Select
                        defaultValue={delivery.statut}
                        onValueChange={(v) => handleStatusChange(delivery.id, v)}
                        disabled={loadingAction === delivery.id}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="text-center py-16">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune livraison trouvée</h3>
          <p className="text-gray-500">Aucune commande n'a encore été passée via Zando Delivery ou paiement à la livraison.</p>
        </div>
      )}
    </div>
  );
});

export default AdminDeliveriesTab;
