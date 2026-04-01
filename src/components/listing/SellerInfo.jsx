import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

const SellerInfo = ({ seller }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (!seller) return null;
  
  const fallbackInitial = seller.full_name ? seller.full_name.charAt(0).toUpperCase() : 'S';
  const registrationDate = seller.created_at ? formatDistanceToNow(new Date(seller.created_at), { addSuffix: true, locale: fr }) : 'N/A';
  const lastSeen = seller.last_seen ? `Vu ${formatDistanceToNow(new Date(seller.last_seen), { addSuffix: true, locale: fr })}` : null;

  const navigateToShop = () => {
    navigate(`/seller/${seller.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations sur le vendeur</h3>
      <div className="flex items-center space-x-4 mb-4">
        <Avatar className="w-16 h-16 border-2 border-custom-green-200">
          <AvatarImage src={seller.avatar_url} alt={seller.full_name} />
          <AvatarFallback className="bg-custom-green-100 text-custom-green-600 font-bold text-2xl">{fallbackInitial}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{seller.full_name}</h2>
          <div className="mt-1 space-y-1">
            {seller.verified && <Badge className="bg-green-100 text-green-800">Vendeur Vérifié</Badge>}
            {lastSeen && <p className="text-xs text-gray-500">{lastSeen}</p>}
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 space-y-2 mb-6">
         <p>Inscrit {registrationDate}</p>
      </div>

      {user?.id !== seller.id && (
        <Button onClick={navigateToShop} className="w-full" variant="outline">
          <Store className="w-4 h-4 mr-2" />
          Visiter la boutique du vendeur
        </Button>
      )}
    </div>
  );
};

export default SellerInfo;