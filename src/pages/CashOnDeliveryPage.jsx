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

const COMMISSION_RATE = 0.07;

const ZONES = [
  {
    id: 'zone1',
    label: 'Zone 1 — Proche',
    quartiers: 'Poto-Poto, Moungali, Centre-ville, Plateau des 15 ans',
    fee: 1000,
  },
  {
    id: 'zone2',
    label: 'Zone 2 — Moyen',
    quartiers: 'Bacongo, Makélékélé, Ouenzé, Mikalou',
    fee: 2000,
  },
  {
    id: 'zone3',
    label: 'Zone 3 — Éloigné',
    quartiers: 'Talangaï, Mfilou, Madibou, Djiri, Kingasani',
    fee: 3500,
  },
];

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
  const [selectedZone, setSelectedZone] = useState(ZONES[1]); // zone2 par défaut

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
        p_zone: selectedZone.id,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  );

  if (done) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Commande confirmée !</h1>
      <p className="text-gray-600 mb-2">Votre commande a été transmise au vendeur.</p>
      <p className="text-gray-600 mb-6">
        Un livreur Zando vous contactera pour organiser la livraison.<br />
        Vous paierez <strong>{(listing.price + selectedZone.fee).toLocaleString()} FCFA</strong> en cash à la réception.
      </p>
      <Button onClick={() => navigate('/transactions')} className="bg-green-600 hover:bg-green-700 text-white">
        Voir mes commandes
      </Button>
    </div>
  );

  const total = listing.price + selectedZone.fee;

  return (
    <>
      <Helmet><title>Payer à la livraison — {listing.title}</title></Helmet>
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </button>

        <h1 className="text-2xl font-bold mb-1">Payer à la livraison</h1>
        <p className="text-gray-500 text-sm mb-6">Zando livre et collecte le paiement sur place.</p>

        {/* Zone de livraison */}
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> Votre zone de livraison</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ZONES.map(zone => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-colors ${
                  selectedZone.id === zone.id
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/40'
                }`}
              >
                <div>
                  <p className={`font-semibold text-sm ${selectedZone.id === zone.id ? 'text-orange-800' : 'text-gray-700'}`}>
                    {zone.label}
                  </p>
                  <p className="text-xs text-gray-500">{zone.quartiers}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ml-3 ${selectedZone.id === zone.id ? 'text-orange-600' : 'text-gray-600'}`}>
                  {zone.fee.toLocaleString()} FCFA
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Résumé commande */}
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">Résumé de la commande</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{listing.title}</span>
              <span className="font-semibold">{listing.price.toLocaleString()} {listing.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Frais livraison ({selectedZone.label})
              </span>
              <span className="font-semibold">{selectedZone.fee.toLocaleString()} FCFA</span>
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
                placeholder={`Ex: ${selectedZone.quartiers.split(',')[0]}, face à...`}
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
