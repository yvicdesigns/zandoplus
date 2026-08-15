import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { Banknote, Truck, ArrowLeft, Loader2, CheckCircle, MapPin, Phone } from 'lucide-react';
import { extractCity, fetchCityDeliveryConfig } from '@/lib/deliveryUtils';

const COD_FEE = 1500; // FCFA — frais Zando livraison + collecte cash

const CashOnDeliveryPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');

  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }
    const fetchData = async () => {
      const { data } = await supabase
        .from('listings')
        .select('id, title, price, currency, images, user_id, accepts_cash_on_delivery, location, seller:profiles(full_name, phone)')
        .eq('id', listingId)
        .single();

      if (!data || !data.accepts_cash_on_delivery) {
        toast({ title: 'Option indisponible', description: "Ce vendeur n'accepte pas le paiement à la livraison.", variant: 'destructive' });
        navigate(`/listings/${listingId}`);
        return;
      }
      if (data.user_id === user.id) {
        toast({ title: 'Action impossible', description: 'Vous ne pouvez pas acheter votre propre annonce.', variant: 'destructive' });
        navigate(`/listings/${listingId}`);
        return;
      }

      const city = extractCity(data.location);
      const cityConf = await fetchCityDeliveryConfig(supabase, city);
      if (cityConf && !cityConf.cod_enabled) {
        toast({
          title: 'COD indisponible',
          description: `Le paiement à la livraison n'est pas encore disponible à ${city}. Choisissez un autre mode de paiement.`,
          variant: 'destructive',
        });
        navigate(`/escrow/${listingId}`);
        return;
      }

      setListing(data);
      setTelephone(user.phone || '');
      setLoading(false);
    };
    fetchData();
  }, [listingId, user, navigate, openAuthModal, toast]);

  const handleSubmit = async () => {
    if (!adresse.trim()) {
      toast({ title: 'Adresse requise', description: 'Indiquez votre adresse de livraison.', variant: 'destructive' });
      return;
    }
    if (!telephone.trim()) {
      toast({ title: 'Téléphone requis', description: 'Indiquez un numéro pour le livreur.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('create_cod_transaction', {
        p_annonce_id: listingId,
        p_adresse_livraison: adresse.trim(),
        p_telephone_contact: telephone.trim(),
        p_zone: 'standard',
      });
      if (error) throw error;
      setDone(true);
      window.scrollTo(0, 0);
      toast({ title: 'Commande confirmée !', description: 'Votre commande a été transmise au vendeur.', className: 'toast-success' });
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-custom-green-600" />
    </div>
  );

  const total = listing.price + COD_FEE;

  if (done) return (
    <div className="min-h-screen flex items-center justify-center max-w-lg mx-auto px-4 text-center">
      <div>
      <CheckCircle className="w-16 h-16 text-custom-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Commande confirmée !</h1>
      <p className="text-gray-600 mb-2">Votre commande a été transmise au vendeur.</p>
      <p className="text-gray-600 mb-6">
        Un livreur Zando vous contactera pour organiser la livraison.<br />
        Vous paierez <strong>{total.toLocaleString()} FCFA</strong> en cash à la réception.
      </p>
      <Button onClick={() => navigate('/transactions')} className="gradient-bg text-white">
        Voir mes commandes
      </Button>
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>Payer à la livraison — {listing.title}</title></Helmet>
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </button>

        <h1 className="text-2xl font-bold mb-1">Payer à la livraison</h1>
        <p className="text-gray-500 text-sm mb-6">Zando livre et collecte le paiement sur place.</p>

        {/* Résumé commande */}
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">Résumé de la commande</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{listing.title}</span>
              <span className="font-semibold">{listing.price.toLocaleString()} {listing.currency || 'FCFA'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Frais de livraison Zando
              </span>
              <span className="font-semibold">{COD_FEE.toLocaleString()} FCFA</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-bold">
              <span>Total à payer en cash</span>
              <span className="text-orange-600">{total.toLocaleString()} FCFA</span>
            </div>
          </CardContent>
        </Card>

        {/* Infos livraison */}
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">Informations de livraison</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adresse" className="flex items-center gap-1 mb-1">
                <MapPin className="w-4 h-4" /> Adresse précise *
              </Label>
              <Input
                id="adresse"
                placeholder="Ex: Poto-Poto, face à l'église..."
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="telephone" className="flex items-center gap-1 mb-1">
                <Phone className="w-4 h-4" /> Téléphone pour le livreur *
              </Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="Ex: 06 123 45 67"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm mb-6">
          <Banknote className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-orange-800">
            Vous paierez <strong>{total.toLocaleString()} FCFA en cash</strong> au livreur Zando à la réception. Vérifiez le produit avant de payer.
          </p>
        </div>

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Banknote className="mr-2 h-5 w-5" />}
          Confirmer ma commande — {total.toLocaleString()} FCFA
        </Button>
      </div>
    </>
  );
};

export default CashOnDeliveryPage;
