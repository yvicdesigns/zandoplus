import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Shield, Store, MapPin } from 'lucide-react';
import { deliveryMethods } from '@/components/post-ad/postAdConstants';

const DeliveryInfo = ({ listing }) => {
  const method = deliveryMethods.find(m => m.value === listing.delivery_method);

  if (!method || listing.delivery_method === 'none') {
    return null; // Don't show anything if no delivery method is specified
  }
  
  const getIcon = () => {
    switch (listing.delivery_method) {
      case 'zando_delivery':
        return <Truck className="w-6 h-6 mr-3 text-custom-green-600" />;
      case 'seller_delivery':
        return <Truck className="w-6 h-6 mr-3 text-blue-600" />;
      case 'pickup':
        return <Store className="w-6 h-6 mr-3 text-orange-600" />;
      default:
        return <Truck className="w-6 h-6 mr-3 text-gray-500" />;
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          {getIcon()}
          Informations de Livraison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="font-semibold text-lg">{method.label}</p>
          <p className="text-sm text-gray-600">{method.description}</p>
          
          {listing.delivery_method === 'zando_delivery' && (
            <div className="flex items-center text-sm p-3 bg-custom-green-50 rounded-lg border border-custom-green-200">
              <Shield className="w-5 h-5 mr-2 text-custom-green-700 shrink-0" />
              <p>Achat sécurisé. Nous gérons le paiement et la livraison pour vous.</p>
            </div>
          )}

          {listing.delivery_method === 'seller_delivery' && listing.delivery_fee > 0 && (
            <div className="text-sm">
              <span className="font-semibold">Frais de livraison : </span>
              <span className="text-custom-green-600 font-bold">{listing.delivery_fee.toLocaleString()} {listing.currency}</span>
            </div>
          )}

          {listing.delivery_method === 'pickup' && (
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              <p>À récupérer à : <span className="font-semibold">{listing.location}</span></p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryInfo;