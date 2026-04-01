import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Truck, Search, User, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const deliveryStatusOptions = [
    { value: 'pending', label: 'En attente', color: 'bg-gray-200 text-gray-800' },
    { value: 'processing', label: 'En traitement', color: 'bg-blue-200 text-blue-800' },
    { value: 'shipped', label: 'Expédiée', color: 'bg-yellow-200 text-yellow-800' },
    { value: 'delivered', label: 'Livrée', color: 'bg-green-200 text-green-800' },
    { value: 'cancelled', label: 'Annulée', color: 'bg-red-200 text-red-800' },
    { value: 'problem', label: 'Problème', color: 'bg-orange-200 text-orange-800' },
];

const AdminDeliveriesTab = memo(() => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const { toast } = useToast();

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_deliveries_admin');
      if (error) throw error;
      
      // Transform nested JSON objects to flat structure for easier rendering if needed, 
      // but keeping it structured is fine too.
      const transformedData = (data || []).map(item => ({
        ...item,
        listing_title: item.listing?.title,
        listing_images: item.listing?.images,
        buyer_full_name: item.buyer?.full_name,
        seller_full_name: item.seller?.full_name,
        listing_id: item.listing?.id
      }));

      setDeliveries(transformedData);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les livraisons.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleStatusChange = async (deliveryId, newStatus) => {
    setLoadingAction(deliveryId);
    try {
      const { error } = await supabase.rpc('admin_update_delivery_status', {
        p_delivery_id: deliveryId,
        p_status: newStatus
      });
      if (error) throw error;
      toast({ title: 'Succès', description: 'Statut de la livraison mis à jour.', className: 'bg-green-100 text-green-800' });
      fetchDeliveries(); // Refresh
    } catch (error) {
      toast({ title: 'Erreur', description: error.message || "Impossible de mettre à jour le statut.", variant: 'destructive' });
    } finally {
      setLoadingAction(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  
  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return [];
    return deliveries.filter(d => 
      d.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.listing_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.buyer_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.seller_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [deliveries, searchQuery]);

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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Rechercher par code, annonce, acheteur, vendeur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full md:w-1/2"
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredDeliveries.map((delivery, index) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 items-start gap-4">
                  <div className="md:col-span-2 flex items-start space-x-4">
                    <img src={delivery.listing_images?.[0] || 'https://via.placeholder.com/80'} alt={delivery.listing_title} className="w-20 h-20 object-cover rounded-lg" />
                    <div>
                      <Link to={`/listings/${delivery.listing_id}`} className="font-semibold text-gray-800 hover:text-custom-green-600 transition-colors line-clamp-2">{delivery.listing_title}</Link>
                      <Badge variant="secondary" className="mt-1">
                        {delivery.tracking_code}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">Créée le: {formatDate(delivery.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className='flex items-center gap-2'>
                      <User className='w-4 h-4 text-blue-500' />
                      <div>
                        <p className='font-medium'>Acheteur:</p>
                        <p>{delivery.buyer_full_name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                     <div className='flex items-center gap-2'>
                      <Package className='w-4 h-4 text-green-500' />
                      <div>
                        <p className='font-medium'>Vendeur:</p>
                        <p>{delivery.seller_full_name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end space-y-2">
                    <Select 
                      defaultValue={delivery.status} 
                      onValueChange={(newStatus) => handleStatusChange(delivery.id, newStatus)}
                      disabled={loadingAction === delivery.id}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryStatusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${option.color.split(' ')[0]}`}></span>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 text-right">Dernière MàJ: {formatDate(delivery.updated_at)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDeliveries.length === 0 && !loading && (
        <div className="text-center py-16">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune livraison trouvée</h3>
          <p className="text-gray-500">Aucune commande n'a encore été passée via Zando Delivery.</p>
        </div>
      )}
    </div>
  );
});

export default AdminDeliveriesTab;