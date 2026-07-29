import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, Trash2, ArrowLeft, ShieldCheck, Store, ChevronRight } from 'lucide-react';

const formatAmount = (n) => (n ?? 0).toLocaleString('fr-FR');

const CartPage = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { items, removeItem, clearCart, itemsBySeller, subtotal, totalItems, ZANDO_DELIVERY_FEE } = useCart();

  const sellerGroups = Object.values(itemsBySeller);
  const deliveryTotal = sellerGroups.length * ZANDO_DELIVERY_FEE;
  const total = subtotal + deliveryTotal;

  const handleCheckout = () => {
    if (!user) { openAuthModal(); return; }
    navigate('/cart/checkout');
  };

  if (totalItems === 0) return (
    <>
      <Helmet><title>Mon Panier — Zando+</title></Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <ShoppingCart className="w-20 h-20 text-gray-200 mb-6" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Votre panier est vide</h2>
        <p className="text-gray-500 mb-6">Ajoutez des articles pour commencer vos achats</p>
        <Button onClick={() => navigate('/listings')} className="gradient-bg">Parcourir les annonces</Button>
      </div>
    </>
  );

  return (
    <>
      <Helmet><title>{`Mon Panier (${totalItems}) — Zando+`}</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon Panier</h1>
              <p className="text-sm text-gray-500">{`${totalItems} article${totalItems > 1 ? 's' : ''} de ${sellerGroups.length} vendeur${sellerGroups.length > 1 ? 's' : ''}`}</p>
            </div>
          </div>

          {/* Articles par vendeur */}
          {sellerGroups.map(group => (
            <Card key={group.seller_id} className="border-0 shadow-md">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-t-xl border-b">
                  <Store className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-sm text-gray-700">{group.seller_name}</span>
                </div>
                <div className="divide-y">
                  {group.items.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 items-center">
                      <img
                        src={item.image || 'https://via.placeholder.com/64'}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Link to={`/listings/${item.listing_slug || item.id}`} className="font-semibold text-gray-800 text-sm hover:text-custom-green-600 line-clamp-2">{item.title}</Link>
                        <p className="text-custom-green-600 font-bold mt-1">{formatAmount(item.price)} {item.currency}</p>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-gray-50 rounded-b-xl border-t flex justify-between text-sm text-gray-500">
                  <span>Sous-total vendeur</span>
                  <span className="font-semibold">{formatAmount(group.items.reduce((s, i) => s + i.price, 0))} FCFA</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Résumé total */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800">Résumé de la commande</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total articles</span>
                  <span>{formatAmount(subtotal)} FCFA</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Livraison Zando ({sellerGroups.length} vendeur{sellerGroups.length > 1 ? 's' : ''} × {formatAmount(ZANDO_DELIVERY_FEE)} FCFA)</span>
                  <span>+{formatAmount(deliveryTotal)} FCFA</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
                  <span>Total à payer</span>
                  <span className="text-custom-green-600">{formatAmount(total)} FCFA</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-500 bg-green-50 rounded-lg p-3">
                <ShieldCheck className="w-4 h-4 text-custom-green-600 flex-shrink-0 mt-0.5" />
                <span>Paiement unique et sécurisé. Zando distribue automatiquement les montants à chaque vendeur.</span>
              </div>

              <Button onClick={handleCheckout} size="lg" className="w-full gradient-bg">
                Passer la commande — {formatAmount(total)} FCFA
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>

              <button onClick={clearCart} className="w-full text-sm text-red-400 hover:text-red-600 transition-colors py-1">
                Vider le panier
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CartPage;
