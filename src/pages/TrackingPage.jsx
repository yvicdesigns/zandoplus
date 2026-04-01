import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Truck, Package, CheckCircle, XCircle, ArrowRight, ShoppingCart, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const TrackingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'En attente', color: 'bg-yellow-500', icon: <Package className="w-4 h-4" /> };
      case 'in_transit':
        return { text: 'En transit', color: 'bg-blue-500', icon: <Truck className="w-4 h-4" /> };
      case 'delivered':
        return { text: 'Livré', color: 'bg-green-500', icon: <CheckCircle className="w-4 h-4" /> };
      case 'cancelled':
        return { text: 'Annulé', color: 'bg-red-500', icon: <XCircle className="w-4 h-4" /> };
      default:
        return { text: status, color: 'bg-gray-500', icon: <Package className="w-4 h-4" /> };
    }
  };

  const fetchDeliveries = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_deliveries');
      if (error) throw error;
      setDeliveries(data);
    } catch (err) {
      console.error("Error fetching deliveries:", err);
      setError("Impossible de charger les informations de suivi.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else {
      fetchDeliveries();
    }
  }, [user, navigate, fetchDeliveries]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-custom-green-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <>
      <Helmet>
        <title>Suivi de Commandes - Zando+</title>
        <meta name="description" content="Suivez l'état de vos achats et ventes effectués avec Zando Delivery." />
      </Helmet>
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Suivi de <span className="gradient-text">Commandes</span></h1>
          <p className="text-gray-600 text-lg">Gardez un œil sur vos achats et ventes avec Zando Delivery.</p>
        </div>

        {deliveries.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Truck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune commande en cours</h3>
              <p className="text-gray-500 mb-6">Les articles que vous achetez ou vendez avec Zando Delivery apparaîtront ici.</p>
              <Button asChild>
                <Link to="/listings">Commencer les achats <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {deliveries.map((delivery) => {
              const isSeller = delivery.seller.id === user.id;
              const statusInfo = getStatusInfo(delivery.status);
              return (
                <Card key={delivery.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-slate-50 border-b p-4 flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-base md:text-lg">
                        {isSeller ? 'Vente' : 'Achat'} : {delivery.listing.title}
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm">
                        Code de suivi : <span className="font-mono font-semibold text-custom-green-700">{delivery.tracking_code}</span>
                      </CardDescription>
                    </div>
                    <Badge className={`text-white ${statusInfo.color} flex items-center gap-1.5`}>
                      {statusInfo.icon}
                      {statusInfo.text}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="flex items-center space-x-4">
                      <img
                        src={delivery.listing.images?.[0] || 'https://via.placeholder.com/100'}
                        alt={delivery.listing.title}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <div>
                        <p className="font-semibold text-lg text-custom-green-600">
                          {delivery.listing.price.toLocaleString()} {delivery.listing.currency}
                        </p>
                        <p className="text-sm text-gray-500">
                          Commandé le {new Date(delivery.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="w-4 h-4 text-gray-500"/>
                        <strong>Acheteur:</strong> {delivery.buyer.full_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-500"/>
                        <strong>Vendeur:</strong> {delivery.seller.full_name}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button asChild variant="outline">
                        <Link to={`/listings/${delivery.listing.id}`}>Voir l'annonce</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default TrackingPage;