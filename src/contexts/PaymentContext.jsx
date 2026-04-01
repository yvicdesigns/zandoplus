import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { logError } from '@/lib/errorLogger';

const PaymentContext = createContext();

export const usePayment = () => useContext(PaymentContext);

export const PaymentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const initiateMobilePayment = useCallback(async (amount, description, plan, listingId = null) => {
    if (!user) {
      openAuthModal();
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour continuer.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      localStorage.setItem('paymentInfo', JSON.stringify({ amount, description, plan, listingId }));
      navigate('/mobile-payment');
    } catch (error) {
      logError(error, { context: 'initiateMobilePayment', amount, plan, listingId });
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser le paiement.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, openAuthModal, toast, navigate]);

  const submitPaymentProof = async (listingId, plan, proofFile) => {
    if (!user || !listingId || !plan || !proofFile) {
      toast({ title: 'Erreur', description: 'Informations manquantes pour la soumission.', variant: 'destructive' });
      return null;
    }
    setLoading(true);

    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}-${listingId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, proofFile);
      
      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase
        .from('boost_requests')
        .insert({
          listing_id: listingId,
          user_id: user.id,
          duration_days: plan.duration,
          total_amount: plan.price,
          payment_proof_url: filePath, 
          status: 'pending_approval'
        })
        .select()
        .single();
      
      if (dbError) throw dbError;

      toast({
        title: 'Preuve envoyée !',
        description: 'Votre preuve de paiement a été soumise pour vérification.',
        className: 'bg-green-500 text-white',
      });

      return data;
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      logError(error, { context: 'submitPaymentProof', listingId, plan });
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    initiateMobilePayment,
    submitPaymentProof,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};