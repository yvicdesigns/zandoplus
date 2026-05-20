import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const BOOST_AMOUNT = 500;
const BOOST_DAYS = 7;

const BoostListingPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeBoost, setActiveBoost] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: listingData, error } = await supabase
        .from('listings')
        .select('id, title, images, user_id')
        .eq('id', listingId)
        .single();

      if (error || !listingData) {
        toast({ title: 'Erreur', description: "Annonce introuvable.", variant: 'destructive' });
        navigate('/profile');
        return;
      }
      if (listingData.user_id !== user.id) {
        toast({ title: 'Accès refusé', variant: 'destructive' });
        navigate('/');
        return;
      }
      setListing(listingData);

      // Vérifie si un boost actif existe déjà
      const { data: boostData } = await supabase
        .from('ad_boosts')
        .select('id, date_fin, statut')
        .eq('annonce_id', listingId)
        .eq('statut', 'active')
        .maybeSingle();
      setActiveBoost(boostData);
      setLoading(false);
    };
    fetchData();
  }, [listingId, user, navigate, toast]);

  const handleBoost = async () => {
    setIsProcessing(true);
    try {
      const { data: boost, error } = await supabase
        .from('ad_boosts')
        .insert({
          annonce_id: listing.id,
          user_id: user.id,
          montant: BOOST_AMOUNT,
          statut: 'pending',
        })
        .select('id')
        .single();

      if (error) throw error;

      navigate('/boost-payment', {
        state: {
          boostId: boost.id,
          listingId: listing.id,
          listingTitle: listing.title,
          amount: BOOST_AMOUNT,
          days: BOOST_DAYS,
        }
      });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  return (
    <>
      <Helmet><title>Booster l'annonce - Zando+</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/profile')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au profil
          </Button>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center">
              <div className="mx-auto bg-amber-100 p-3 rounded-full w-fit mb-4">
                <Zap className="w-8 h-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl font-bold">Booster cette annonce</CardTitle>
              <CardDescription className="text-gray-600 pt-1">
                Votre annonce apparaît en tête des résultats pendant 7 jours.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Aperçu annonce */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <img
                  src={listing.images?.[0] || 'https://via.placeholder.com/80'}
                  alt={listing.title}
                  className="w-16 h-16 object-cover rounded-lg border"
                />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Annonce à booster</p>
                  <p className="font-semibold text-gray-800 line-clamp-2">{listing.title}</p>
                </div>
              </div>

              {/* Boost actif ? */}
              {activeBoost && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">Boost déjà actif</p>
                    <p className="text-xs text-amber-700">
                      Expire le {new Date(activeBoost.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}

              {/* Détail de l'offre */}
              <div className="space-y-3">
                {[
                  'Affiché en premier dans les résultats de recherche',
                  'Badge "Boosté" visible sur votre annonce',
                  'Mis en avant dans sa catégorie',
                  'Durée : 7 jours',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-custom-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              {/* Prix */}
              <div className="text-center bg-green-50 border border-custom-green-200 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">Prix unique</p>
                <p className="text-4xl font-bold text-custom-green-600">{BOOST_AMOUNT.toLocaleString()} FCFA</p>
                <p className="text-xs text-gray-400 mt-1">pour {BOOST_DAYS} jours</p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                onClick={handleBoost}
                disabled={isProcessing || !!activeBoost}
                size="lg"
                className="w-full gradient-bg hover:opacity-90 text-base"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                {activeBoost ? 'Boost déjà actif' : 'Booster pour 500 FCFA'}
              </Button>
              <div className="flex items-center justify-center text-xs text-gray-400 gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Paiement via Airtel Money ou MTN Money
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BoostListingPage;
