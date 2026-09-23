import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

// OAuth PKCE callback page.
// CRITICAL: We do NOT call getSession() here anymore.
// Previously, AuthCallbackPage.useEffect ran BEFORE AuthProvider.useEffect (child effects
// run before parent effects in React). This caused navigate('/') to fire BEFORE
// AuthProvider's updateUserSession could set the user — home rendered with user=null.
//
// Fix: watch isLoading + isOAuthPending from AuthProvider. Navigate only when AuthProvider
// has finished processing the session (both flags cleared = user is already set in context).
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { isLoading, isOAuthPending, user } = useAuth();
  const [stage, setStage] = useState('waiting'); // 'waiting' | 'slow' | 'failed'

  // iOS natif : cette page tourne dans la feuille Safari intégrée (SFSafariViewController),
  // un contexte séparé de la WKWebView de l'app — pas de pont Capacitor, pas d'accès au
  // code_verifier PKCE stocké côté app. On ne tente donc PAS d'échanger le code ici.
  //
  // Bascule vers le schéma personnalisé : testé le 23/09/2026, une navigation JS
  // automatique (window.location.href dans un useEffect, sans geste utilisateur) est
  // silencieusement bloquée par WebKit — la session se crée bien cote serveur (le
  // code est valide) mais la feuille ne se ferme jamais et l'app ne recoit rien. iOS
  // n'autorise la navigation vers un schema personnalise que suite a une vraie
  // interaction utilisateur. On tente quand meme l'auto-redirect (inoffensif si
  // bloque), et on affiche IMMEDIATEMENT un bouton comme filet de secours fiable.
  const params = new URLSearchParams(window.location.search);
  const isNativeHandoff = params.get('native') === 'ios' && params.get('code');
  const nativeAppUrl = `com.zando.app://login${window.location.search}`;

  useEffect(() => {
    if (isNativeHandoff) {
      window.location.href = nativeAppUrl;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate once AuthProvider signals it's done AND user is set.
  // Waiting for user prevents navigating to home with user=null when the
  // safety timer fires before fetchUserProfile completes.
  // Fallback: navigate anyway after 12s (slow network / profile creation failure).
  // Skipped entirely for the native handoff screen — that one waits for a tap instead.
  useEffect(() => {
    if (isNativeHandoff) return;
    if (!isLoading && !isOAuthPending) {
      if (user) {
        navigate('/', { replace: true });
      } else {
        // Safety net: if user is still null 2s after loading cleared, navigate anyway
        const t = setTimeout(() => navigate('/', { replace: true }), 2000);
        return () => clearTimeout(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isOAuthPending, user, navigate, isNativeHandoff]);

  // Show "slow" message after 12s, "failed" UI after 45s (network truly unreachable)
  useEffect(() => {
    if (isNativeHandoff) return;
    const slowTimer = setTimeout(() => setStage('slow'), 12000);
    const failTimer = setTimeout(() => setStage('failed'), 45000);
    return () => {
      clearTimeout(slowTimer);
      clearTimeout(failTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isNativeHandoff) {
    return (
      <>
        <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-6 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
          <div>
            <p className="font-semibold text-gray-700">Connexion réussie</p>
            <p className="text-sm text-gray-500 mt-1">Retournez à l'application Zando+ pour continuer.</p>
          </div>
          <Button
            className="gradient-bg hover:opacity-90 rounded-full px-6"
            onClick={() => { window.location.href = nativeAppUrl; }}
          >
            Ouvrir l'app Zando+
          </Button>
        </div>
      </>
    );
  }

  if (stage === 'failed') {
    return (
      <>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-6 text-center">
        <WifiOff className="w-12 h-12 text-gray-400" />
        <div>
          <p className="font-semibold text-gray-700">Connexion impossible</p>
          <p className="text-sm text-gray-500 mt-1">La connexion prend trop de temps. Vérifiez votre réseau.</p>
        </div>
        <Button
          className="gradient-bg hover:opacity-90 rounded-full px-6"
          onClick={() => navigate('/', { replace: true })}
        >
          Retour à l'accueil
        </Button>
      </div>
      </>
    );
  }

  return (
    <>
    <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
      <p className="text-sm text-gray-500">
        {stage === 'slow' ? 'Connexion lente, patience...' : 'Connexion en cours...'}
      </p>
    </div>
    </>
  );
};

export default AuthCallbackPage;
