import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart as CartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductsList from '@/components/ProductsList';
import ShoppingCart from '@/components/ShoppingCart';
import { useCart } from '@/hooks/useCart';

const StorePage = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Helmet>
        <title>Boutique - Zando+</title>
        <meta name="description" content="Découvrez nos produits disponibles sur Zando+" />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Boutique</h1>
          <Button onClick={() => setIsCartOpen(true)} variant="outline" className="relative flex items-center gap-2">
            <CartIcon className="h-5 w-5" />
            Panier
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-custom-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
        <ProductsList />
        <ShoppingCart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
      </div>
    </>
  );
};

export default StorePage;
