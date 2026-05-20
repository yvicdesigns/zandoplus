import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { ShieldCheck, UploadCloud, CheckCircle, ArrowLeft, Loader2, Copy, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const COMMISSION_RATE = 0.03;

const EscrowPaymentPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [listing, setListing] = useState(null);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }

    const fetchData = async () => {
      const [{ data: listingData }, { data: settings }] = await Promise.all([
        supabase.from('listings').select('id, title, price, currency, images, user_id, seller:profiles(full_name, phone)').eq('id', listingId).single(),
        supabase.from('site_settings').select('whatsapp_number').eq('id', 1).single(),
      ]);

      if (!listingData) { navigate('/listings'); return; }
      if (listingData.user_id === user.id) {
        toast({ title: 'Action impossible', description: 'Vous ne pouvez pas acheter votre propre annonce.', variant: 'destructive' });
        navigate(`/listings/${listingId}`);
        return;
      }
      setListing(listingData);
      if (settings) setPaymentNumber(settings.whatsapp_number);
      setLoading(false);
    };
    fetchData();
  }, [listingId, user, navigate, openAuthModal, toast]);

  const commission = listing ? Math.round(listing.price * COMMISSION_RATE) : 0;
  const netVendeur = listing ? listing.price - commission : 0;

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) setProofFile(file);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    toast({ title: 'Numéro copié !' });
  };

  const handleSubmit = async () => {
    if (!proofFile) {
      toast({ title: 'Capture requise', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Créer la transaction escrow
      const dateLimit = new Date();
      dateLimit.setHours(dateLimit.getHours() + 72);

      const { data: tx, error: txError } = await supabase
        .from('transactions_escrow')
        .insert({
          annonce_id: listing.id,
          acheteur_id: user.id,
          vendeur_id: listing.user_id,
          montant: listing.price,
          statut: 'en_attente_paiement',
          date_limite_confirmation: dateLimit.toISOString(),
        })
        .select('id')
        .single();
      if (txError) throw txError;

      // 2. Upload la preuve
      const ext = proofFile.name.split('.').pop();
      const path = `escrow/${tx.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(path, proofFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('payment_proofs').getPublicUrl(path);

      // 3. Mettre à jour la transaction avec la preuve et passer à fonds_bloques
      await supabase.from('transactions_escrow').update({
        preuve_paiement_url: publicUrl,
        statut: 'fonds_bloques',
      }).eq('id', tx.id);

      setSubmitted(true);
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-custom-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Paiement reçu !</h2>
        <p className="text-gray-600 mb-2">Votre paiement est <strong>sécurisé</strong> chez Zando+.</p>
        <p className="text-gray-500 text-sm mb-6">Le vendeur va être notifié pour préparer la livraison. Vous aurez 72h pour confirmer la réception.</p>
        <Button onClick={() => navigate('/transactions')} className="gradient-bg w-full mb-3">
          Suivre ma transaction
        </Button>
        <Button variant="outline" onClick={() => navigate('/listings')} className="w-full">
          Retour aux annonces
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>Achat Sécurisé - {listing?.title} - Zando+</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-12 px-4">
        <div className="max-w-xl mx-auto space-y-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>

          {/* Badge sécurité */}
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <ShieldCheck className="w-8 h-8 text-custom-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Achat Sécurisé Zando ✅</p>
              <p className="text-xs text-green-700">Votre argent est protégé. Zando ne libère le paiement qu'après votre confirmation de réception.</p>
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Annonce */}
              <div className="flex gap-4 p-3 bg-slate-50 rounded-xl">
                <img src={listing.images?.[0] || 'https://via.placeholder.com/60'} alt={listing.title} className="w-16 h-16 object-cover rounded-lg border flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{listing.title}</p>
                  <p className="text-sm text-gray-500">Vendeur : {listing.seller?.full_name}</p>
                </div>
              </div>

              {/* Détail financier */}
              <div className="border rounded-xl overflow-hidden">
                <div className="flex justify-between px-4 py-3 bg-gray-50">
                  <span className="text-gray-600">Montant de l'annonce</span>
                  <span className="font-semibold">{listing.price?.toLocaleString()} {listing.currency || 'FCFA'}</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm text-gray-500">
                  <span>Commission Zando (3%) — à charge du vendeur</span>
                  <span>{commission.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-green-50 border-t border-green-100">
                  <span className="font-bold text-gray-800">Vous payez</span>
                  <span className="font-bold text-custom-green-600 text-lg">{listing.price?.toLocaleString()} {listing.currency || 'FCFA'}</span>
                </div>
              </div>

              {/* Note commission */}
              <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>La commission de 3% est déduite du montant reversé au vendeur. Vous payez le prix affiché.</span>
              </div>

              {/* Instructions paiement */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-blue-800">Étapes du paiement</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                  <li>Ouvrez <strong>Airtel Money</strong> ou <strong>MTN Money</strong></li>
                  <li>Envoyez <strong>{listing.price?.toLocaleString()} {listing.currency || 'FCFA'}</strong> au numéro Zando+ :</li>
                  <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-2">
                    <span className="font-mono font-bold text-blue-900 flex-1">{paymentNumber || 'Chargement...'}</span>
                    <Button size="sm" variant="ghost" onClick={copyNumber}><Copy className="w-4 h-4" /></Button>
                  </div>
                  <li>Notez votre <strong>ID de transaction</strong> (dans le SMS)</li>
                  <li>Uploadez la capture d'écran ci-dessous</li>
                </ol>
              </div>

              {/* Upload */}
              <div>
                <p className="font-semibold text-gray-700 mb-2">Preuve de paiement</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-custom-green-400 hover:bg-green-50 transition-colors"
                >
                  {proofFile ? (
                    <div className="flex items-center justify-center gap-2 text-custom-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium text-sm">{proofFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Cliquez pour uploader votre capture d'écran</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting || !proofFile} size="lg" className="w-full gradient-bg">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <ShieldCheck className="w-4 h-4 mr-2" />
                Confirmer mon paiement sécurisé
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default EscrowPaymentPage;
