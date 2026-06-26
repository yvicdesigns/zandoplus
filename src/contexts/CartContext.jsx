import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

const CartContext = createContext(null);

const CART_KEY = 'zando_cart';
const ZANDO_DELIVERY_FEE = 1500;

export const CartProvider = ({ children }) => {
  const { toast } = useToast();
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((listing) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === listing.id);
      if (exists) {
        toast({ title: 'Déjà dans le panier', description: `"${listing.title}" est déjà dans votre panier.` });
        return prev;
      }
      toast({ title: 'Ajouté au panier ✅', description: listing.title, className: 'bg-green-100 text-green-800' });
      return [...prev, {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        currency: listing.currency || 'FCFA',
        image: listing.images?.[0] || null,
        seller_id: listing.user_id || listing.seller_id,
        seller_name: listing.seller?.full_name || listing.seller_name || 'Vendeur',
        delivery_method: listing.delivery_method || 'zando_delivery',
        delivery_fee: listing.delivery_fee || 0,
        quantity: 1,
      }];
    });
  }, [toast]);

  const removeItem = useCallback((listingId) => {
    setItems(prev => prev.filter(i => i.id !== listingId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.length;

  // Grouper par vendeur
  const itemsBySeller = items.reduce((acc, item) => {
    const key = item.seller_id;
    if (!acc[key]) acc[key] = { seller_id: key, seller_name: item.seller_name, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  const subtotal = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, clearCart,
      totalItems, itemsBySeller, subtotal,
      ZANDO_DELIVERY_FEE,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
