import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag as LoadingIcon, Zap, ShieldCheck, Minus, Plus } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BoostListingPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(7);

  const BOOST_PRICE_PER_DAY = 200;
  const currency = 'FCFA';
  const totalAmount = duration * BOOST_PRICE_PER_DAY;

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, images, user_id')
        .eq('id', listingId)
        .single();

      if (error || !data) {
        toast({ title: 'Erreur', description: "L'annonce n'a pas pu être trouvée.", variant: 'destructive' });
        navigate('/profile');
        return;
      }
      
      if (data.user_id !== user?.id) {
        toast({ title: 'Accès non autorisé', description: "Vous ne pouvez pas booster cette annonce.", variant: 'destructive' });
        navigate('/');
        return;
      }

      setListing(data);
      setLoading(false);
    };

    if (user) {
      fetchListing();
    }
  }, [listingId, user, navigate, toast]);

  const handleDurationChange = (amount) => {
    setDuration(prev => Math.max(1, prev + amount));
  };

  const handleProceedToPayment = async () => {
    if (duration < 1) {
      toast({ title: 'Durée invalide', description: 'La durée du boost doit être d\'au moins 1 jour.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      const { data: boostRequest, error } = await supabase
        .from('boost_requests')
        .insert({
          listing_id: listing.id,
          user_id: user.id,
          duration_days: duration,
          total_amount: totalAmount,
          status: 'pending_payment'
        })
        .select('id')
        .single();

      if (error) throw error;

      const paymentInfo = {
        amount: totalAmount, 
        listingId: listing.id,
        boostRequestId: boostRequest.id,
        description: `Boost de ${duration} jours pour: ${listing.title}`,
        type: 'boost'
      };
      localStorage.setItem('paymentInfo', JSON.stringify(paymentInfo));
      navigate('/mobile-payment');

    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de créer la demande de boost. Veuillez réessayer.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingIcon className="w-12 h-12 animate-spin text-custom-green-500" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Booster votre annonce - Zando</title>
        <meta name="description" content={`Mettez en avant votre annonce ${listing?.title} et touchez plus d'acheteurs.`} />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/profile')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au profil
          </Button>
          <Card className="w-full shadow-lg border-0">
            <CardHeader className="text-center">
              <div className="mx-auto bg-amber-100 p-3 rounded-full w-fit mb-4">
                  <Zap className="w-8 h-8 text-amber-500" />
              </div>
              <CardTitle className="text-3xl font-bold gradient-text">Mettez votre annonce en Vedette !</CardTitle>
              <CardDescription className="text-lg text-gray-600 pt-2">
                Atteignez plus d'acheteurs potentiels et vendez plus rapidement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-lg">
                <img
                  src={listing.images?.[0] || 'https://via.placeholder.com/150'}
                  alt={listing.title}
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <div className="text-center sm:text-left">
                  <p className="text-gray-500">Vous boostez l'annonce :</p>
                  <h3 className="text-xl font-bold text-gray-800">{listing.title}</h3>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="duration" className="text-lg font-semibold text-center block">Choisissez la durée du boost</Label>
                <div className="flex items-center justify-center gap-4">
                  <Button size="icon" variant="outline" onClick={() => handleDurationChange(-1)} disabled={duration <= 1}>
                    <Minus className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-2 font-bold text-2xl">
                    <Input 
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-20 text-center text-2xl font-bold border-2 border-gray-300 focus:border-custom-green-500"
                    />
                    <span>Jours</span>
                  </div>
                  <Button size="icon" variant="outline" onClick={() => handleDurationChange(1)}>
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-center text-sm text-gray-500">{BOOST_PRICE_PER_DAY} {currency} / jour</p>
              </div>

              <div className="text-center bg-green-50 border-l-4 border-custom-green-500 p-4 rounded-r-lg">
                <p className="text-lg">Prix Total :</p>
                <p className="text-4xl font-bold text-custom-green-600">
                  {totalAmount.toLocaleString()} {currency}
                </p>
              </div>

            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button onClick={handleProceedToPayment} disabled={isProcessing} size="lg" className="w-full gradient-bg hover:opacity-90 text-lg">
                 {isProcessing ? 'Traitement...' : `Procéder au paiement`}
              </Button>
               <div className="flex items-center text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4 mr-2 text-custom-green-500" />
                <span>Paiement sécurisé via Mobile Money</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BoostListingPage;