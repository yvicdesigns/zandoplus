import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, ArrowLeft, Copy, UploadCloud, CheckCircle, Loader2, Store } from 'lucide-react';

const COMMISSION_RATE = 0.07;
const formatAmount = (n) => (n ?? 0).toLocaleString('fr-FR');

const CartCheckoutPage = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const { items, itemsBySeller, subtotal, clearCart, ZANDO_DELIVERY_FEE } = useCart();
  const fileInputRef = useRef(null);

  const [paymentNumber, setPaymentNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sellerGroups = Object.values(itemsBySeller);
  const deliveryTotal = sellerGroups.length * ZANDO_DELIVERY_FEE;
  const total = subtotal + deliveryTotal;

  useEffect(() => {
    if (!user) { openAuthModal(); navigate('/'); return; }
    if (items.length === 0) { navigate('/cart'); return; }
    supabase.from('site_settings').select('whatsapp_number').eq('id', 1).single()
      .then(({ data }) => { if (data?.whatsapp_number) setPaymentNumber(data.whatsapp_number); });
  }, [user, items, navigate, openAuthModal]);

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) setProofFile(file);
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(paymentNumber);
    toast({ title: 'Numéro copié !' });
  };

  const handleSubmit = async () => {
    if (!proofFile) { toast({ title: 'Capture requise', variant: 'destructive' }); return; }
    setIsSubmitting(true);
    try {
      // 1. Créer l'enregistrement cart_payment
      const { data: payment, error: payError } = await supabase
        .from('cart_payments')
        .insert({
          user_id: user.id,
          total_amount: total,
          items_count: items.length,
          statut: 'pending',
        })
        .select('id').single();
      if (payError) throw payError;

      // 2. Upload screenshot
      const ext = proofFile.name.split('.').pop();
      const path = `cart/${payment.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs').upload(path, proofFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('payment_proofs').getPublicUrl(path);

      // 3. Mettre à jour cart_payment avec la preuve
      await supabase.from('cart_payments').update({ proof_url: publicUrl, statut: 'proof_submitted' }).eq('id', payment.id);

      // 4. Créer une transaction escrow par vendeur
      const dateLimit = new Date();
      dateLimit.setHours(dateLimit.getHours() + 72);

      for (const group of sellerGroups) {
        const sellerTotal = group.items.reduce((s, i) => s + i.price, 0) + ZANDO_DELIVERY_FEE;
        await supabase.from('transactions_escrow').insert({
          annonce_id: group.items[0].id,
          acheteur_id: user.id,
          vendeur_id: group.seller_id,
          montant: sellerTotal,
          commission_amount: Math.round(group.items.reduce((s, i) => s + i.price, 0) * COMMISSION_RATE),
          delivery_choice: 'zando',
          delivery_fee_paid: ZANDO_DELIVERY_FEE,
          statut: 'fonds_bloques',
          preuve_paiement_url: publicUrl,
          date_limite_confirmation: dateLimit.toISOString(),
          cart_payment_id: payment.id,
        });
      }

      clearCart();
      setSubmitted(true);
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-custom-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Commande confirmée !</h2>
        <p className="text-gray-600 mb-2">Votre paiement de <strong>{formatAmount(total)} FCFA</strong> est sécurisé chez Zando+.</p>
        <p className="text-gray-500 text-sm mb-6">Chaque vendeur sera notifié pour préparer sa livraison.</p>
        <Button onClick={() => navigate('/transactions')} className="gradient-bg w-full mb-3">Suivre mes transactions</Button>
        <Button variant="outline" onClick={() => navigate('/listings')} className="w-full">Continuer les achats</Button>
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>Paiement Panier — Zando+</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-4">
          <Button variant="ghost" onClick={() => navigate('/cart')} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour au panier
          </Button>

          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <ShieldCheck className="w-8 h-8 text-custom-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Paiement Unique Sécurisé ✅</p>
              <p className="text-xs text-green-700">Vous payez une seule fois. Zando distribue automatiquement à chaque vendeur.</p>
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader><CardTitle className="text-lg">Récapitulatif par vendeur</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              {sellerGroups.map(group => {
                const sellerSubtotal = group.items.reduce((s, i) => s + i.price, 0);
                return (
                  <div key={group.seller_id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-sm">{group.seller_name}</span>
                    </div>
                    {group.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 pl-2">
                        <img src={item.image || 'https://via.placeholder.com/40'} alt={item.title} className="w-10 h-10 rounded-lg object-cover border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 truncate">{item.title}</p>
                          <p className="text-xs font-semibold text-custom-green-600">{formatAmount(item.price)} {item.currency}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs text-gray-500 border-t pt-1">
                      <span>Livraison Zando</span><span>+{formatAmount(ZANDO_DELIVERY_FEE)} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Sous-total</span><span>{formatAmount(sellerSubtotal + ZANDO_DELIVERY_FEE)} FCFA</span>
                    </div>
                  </div>
                );
              })}

              <div className="border rounded-xl overflow-hidden">
                <div className="flex justify-between px-4 py-3 bg-gray-50">
                  <span className="text-gray-600">Articles ({items.length})</span>
                  <span className="font-semibold">{formatAmount(subtotal)} FCFA</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm text-gray-600 border-t">
                  <span>Livraison ({sellerGroups.length} vendeurs)</span>
                  <span>+{formatAmount(deliveryTotal)} FCFA</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-custom-green-50 border-t border-custom-green-100">
                  <span className="font-bold text-gray-800">Total à payer</span>
                  <span className="font-bold text-custom-green-600 text-lg">{formatAmount(total)} FCFA</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-blue-800">Étapes du paiement</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                  <li>Ouvrez <strong>Airtel Money</strong> ou <strong>MTN Money</strong></li>
                  <li>Envoyez <strong>{formatAmount(total)} FCFA</strong> au numéro Zando+ :</li>
                  <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg px-3 py-2">
                    <span className="font-mono font-bold text-blue-900 flex-1">{paymentNumber || 'Chargement...'}</span>
                    <Button size="sm" variant="ghost" onClick={copyNumber}><Copy className="w-4 h-4" /></Button>
                  </div>
                  <li>Uploadez la capture d'écran ci-dessous</li>
                </ol>
              </div>

              {/* Upload */}
              <div>
                <p className="font-semibold text-gray-700 mb-2">Preuve de paiement</p>
                <div onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-custom-green-400 hover:bg-green-50 transition-colors">
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
                Confirmer la commande — {formatAmount(total)} FCFA
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CartCheckoutPage;
