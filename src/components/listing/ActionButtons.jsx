import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Lock, ShoppingCart, CheckCircle, Banknote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import SendMessageDialog from '@/components/listing/SendMessageDialog';
import { categories as CATEGORY_DEFS } from '@/components/post-ad/postAdConstants';
import { useCart } from '@/hooks/useCart';

const ActionButtons = ({ listing }) => {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isMessageDialogOpen, setMessageDialogOpen] = useState(false);
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(listing?.id);

  if (!listing || !listing.seller) {
    return null;
  }

  const isOwner = user && user.id === listing.seller.id;

  if (isOwner) {
    return (
        <div className="space-y-2">
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
            <p className="text-sm text-gray-600">C'est votre annonce. Les options d'achat ne sont pas disponibles pour vous.</p>
          </div>
          {listing.accepts_cash_on_delivery && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
              <Banknote className="w-4 h-4 shrink-0" />
              <span>Paiement à la livraison activé — les acheteurs voient le bouton orange.</span>
            </div>
          )}
        </div>
    );
  }

  const handleOpenMessageDialog = () => {
    if (!user) {
      openAuthModal();
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour envoyer un message.", variant: "destructive" });
      return;
    }
    setMessageDialogOpen(true);
  };
  
  const categoryType = CATEGORY_DEFS[listing.category]?.type ?? 'product';
  const isProduct = !['job', 'service'].includes(categoryType);

  const handleEscrowPayment = () => {
    if (!user) {
      openAuthModal();
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour utiliser l'achat sécurisé.", variant: "destructive" });
      return;
    }
    navigate(`/escrow/${listing.id}`);
  };

  const handleCodPayment = () => {
    if (!user) {
      openAuthModal();
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour commander.", variant: "destructive" });
      return;
    }
    navigate(`/cod/${listing.id}`);
  };

  return (
    <>
      <div className="p-4 border-2 border-gray-200 rounded-lg bg-white shadow-lg space-y-3">
        <h3 className="text-lg font-semibold text-center">Contacter le vendeur</h3>

        {isProduct && (
          <>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg" onClick={handleEscrowPayment}>
              <Lock className="mr-2 h-5 w-5" />
              Achat Sécurisé Zando ✅
            </Button>
            {listing.accepts_cash_on_delivery && (
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg" onClick={handleCodPayment}>
                <Banknote className="mr-2 h-5 w-5" />
                Payer à la livraison 💵
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className={`w-full ${inCart ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-300 hover:border-green-400'}`}
              onClick={() => addItem(listing, (title) => toast({ title: inCart ? 'Déjà dans le panier' : 'Ajouté au panier ✅', description: title, className: 'bg-green-100 text-green-800' }))}
            >
              {inCart ? <CheckCircle className="mr-2 h-5 w-5 text-green-600" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
              {inCart ? 'Dans le panier' : 'Ajouter au panier'}
            </Button>
          </>
        )}


        <Button className="w-full" size="lg" variant="outline" onClick={handleOpenMessageDialog}>
            <MessageSquare className="mr-2 h-5 w-5" /> Envoyer un message
        </Button>

        {listing.seller.phone && (
            <a href={`tel:${listing.seller.phone}`} className="w-full inline-block">
                <Button variant="outline" className="w-full" size="lg">
                    <Phone className="mr-2 h-5 w-5" /> Appeler le vendeur
                </Button>
            </a>
        )}
      </div>
      <SendMessageDialog
        isOpen={isMessageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        listing={listing}
      />
    </>
  );
};

export default ActionButtons;