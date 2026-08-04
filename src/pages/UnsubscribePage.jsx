import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, ArrowLeft, Loader2 } from 'lucide-react';

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [status, setStatus] = useState('idle'); // idle | loading | done | already | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!email) return;
    // Check if already unsubscribed
    const check = async () => {
      const { data } = await supabase
        .from('email_unsubscribes')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      if (data) setStatus('already');
    };
    check();
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) return;
    setStatus('loading');
    try {
      const { error } = await supabase
        .from('email_unsubscribes')
        .insert({ email: email.toLowerCase().trim() });
      if (error && error.code !== '23505') throw error; // 23505 = unique violation (already exists)
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-gray-500">
          <p>Lien invalide. Aucune adresse email trouvee.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-custom-green-600 hover:underline text-sm">
            Retour a l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Se desabonner — Zando+ Congo</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div style={{ background: 'linear-gradient(160deg, #005023, #003D1A)' }} className="px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-white text-xl font-bold">Se desabonner</h1>
            <p className="text-white/70 text-sm mt-1">Emails marketing Zando+</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {(status === 'idle' || status === 'loading') && (
              <>
                <p className="text-gray-600 text-sm text-center mb-2">
                  Vous souhaitez ne plus recevoir nos emails marketing pour :
                </p>
                <p className="text-center font-semibold text-gray-900 mb-6 bg-gray-50 rounded-lg px-4 py-3 text-sm break-all">
                  {email}
                </p>
                <p className="text-gray-400 text-xs text-center mb-6">
                  Vous continuerez a recevoir les emails transactionnels (confirmations de commande, messages, notifications de paiement).
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={handleUnsubscribe}
                    disabled={status === 'loading'}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                  >
                    {status === 'loading'
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
                      : 'Confirmer le desabonnement'
                    }
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full border-custom-green-200 text-custom-green-700 hover:bg-custom-green-50"
                    disabled={status === 'loading'}
                  >
                    Garder mon abonnement
                  </Button>
                </div>
              </>
            )}

            {(status === 'done' || status === 'already') && (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-custom-green-500 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {status === 'already' ? 'Deja desabonne' : 'Desabonnement confirme'}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {status === 'already'
                    ? `L'adresse ${email} etait deja desabonnee de nos emails marketing.`
                    : `L'adresse ${email} ne recevra plus nos emails marketing. Vous pouvez toujours utiliser Zando+ normalement.`
                  }
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-custom-green-600 hover:underline text-sm mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour a l'accueil
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <p className="text-red-600 text-sm mb-4">Une erreur est survenue : {errorMsg}</p>
                <Button onClick={() => setStatus('idle')} variant="outline" className="w-full">
                  Reessayer
                </Button>
              </div>
            )}
          </div>

          <div className="px-8 pb-6 text-center">
            <p className="text-gray-300 text-xs">© 2026 Zando+ Congo · zandopluscg.com</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnsubscribePage;
