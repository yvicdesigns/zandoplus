import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'zando_cart';
export const ZANDO_DELIVERY_FEE = 1500;

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      // Filtrer les entrées invalides (format ancien ou corrompu)
      return Array.isArray(parsed) ? parsed.filter(i => i && i.id && typeof i.price === 'number') : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((listing, onAdded, customPrice) => {
    setItems(prev => {
      if (prev.find(i => i.id === listing.id)) return prev;
      const basePrice = Number(listing.price) || 0;
      const bestPrice = listing.negotiated_price ? Number(listing.negotiated_price) : basePrice;
      const newItem = {
        id: listing.id,
        listing_slug: listing.listing_slug || null,
        title: listing.title,
        price: customPrice != null ? Number(customPrice) : bestPrice,
        original_price: basePrice,
        currency: listing.currency || 'FCFA',
        image: listing.images?.[0] || null,
        seller_id: listing.user_id || listing.seller_id,
        seller_name: listing.seller?.full_name || listing.seller_name || 'Vendeur',
        delivery_method: listing.delivery_method || 'zando_delivery',
        delivery_fee: listing.delivery_fee || 0,
        location: listing.location || null,
        national_delivery_enabled: listing.national_delivery_enabled || false,
        national_delivery_fee: listing.national_delivery_fee || 0,
        offers_seller_delivery: listing.offers_seller_delivery || false,
        offers_pickup: listing.offers_pickup || false,
      };
      if (onAdded) onAdded(newItem.title);
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((listingId) => {
    setItems(prev => prev.filter(i => i.id !== listingId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((listingId) => items.some(i => i.id === listingId), [items]);

  const totalItems = items.length;
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);

  const itemsBySeller = items.reduce((acc, item) => {
    const key = item.seller_id;
    if (!acc[key]) acc[key] = { seller_id: key, seller_name: item.seller_name, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, clearCart, isInCart,
      totalItems, itemsBySeller, subtotal, ZANDO_DELIVERY_FEE,
    }}>
      {children}
    </CartContext.Provider>
  );
};
