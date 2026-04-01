import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import SendMessageDialog from '@/components/listing/SendMessageDialog';

const ActionButtons = ({ listing }) => {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isMessageDialogOpen, setMessageDialogOpen] = useState(false);
  const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);

  if (!listing || !listing.seller) {
    return null;
  }

  const isOwner = user && user.id === listing.seller.id;

  if (isOwner) {
    return (
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
            <p className="text-sm text-gray-600">C'est votre annonce. Les options d'achat ne sont pas disponibles pour vous.</p>
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
  
  const handleCreateDelivery = async () => {
    if (!user) {
      openAuthModal();
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour utiliser Zando Delivery.", variant: "destructive" });
      return;
    }
    
    setIsCreatingDelivery(true);
    try {
      const { data, error } = await supabase.rpc('create_delivery', { p_listing_id: listing.id });
      if (error) throw error;
      
      toast({
        title: "Commande initiée !",
        description: "La livraison a été créée. Vous pouvez la suivre dans votre espace 'Suivi'.",
        className: "bg-custom-green-500 text-white"
      });
      navigate('/suivi');

    } catch (error) {
      console.error("Error creating delivery:", error);
      toast({ title: "Erreur", description: error.message || "Impossible de créer la livraison.", variant: "destructive" });
    } finally {
      setIsCreatingDelivery(false);
    }
  };

  const canUseZandoDelivery = listing.delivery_method === 'zando_delivery';

  return (
    <>
      <div className="p-4 border-2 border-gray-200 rounded-lg bg-white shadow-lg space-y-3">
        <h3 className="text-lg font-semibold text-center">Contacter le vendeur</h3>
        
        {canUseZandoDelivery && (
            <Button 
              className="w-full gradient-bg hover:opacity-90" 
              size="lg" 
              onClick={handleCreateDelivery}
              disabled={isCreatingDelivery}
            >
              {isCreatingDelivery ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-5 w-5" />
              )}
              {isCreatingDelivery ? 'Création en cours...' : 'Acheter avec Zando Delivery'}
            </Button>
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