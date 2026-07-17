import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

// OAuth PKCE callback page.
// Supabase auto-exchanges the ?code= here in _initialize() (via detectSessionInUrl).
// CRITICAL: We must NOT navigate home until getSession() resolves (initializePromise done).
// If we navigate early, ALL Supabase data queries on the home page block waiting for
// initializePromise, freezing the entire app (categories, listings, settings — everything).
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState('waiting'); // 'waiting' | 'slow' | 'failed'

  useEffect(() => {
    let mounted = true;
    const go = () => { if (mounted) navigate('/', { replace: true }); };

    // After 12s, reassure the user the connection is slow (not broken)
    const slowTimer = setTimeout(() => { if (mounted) setStage('slow'); }, 12000);
    // After 45s, give up and show error — network is truly unreachable
    const failTimer = setTimeout(() => { if (mounted) setStage('failed'); }, 45000);

    // Wait for Supabase _initialize() to complete (PKCE exchange + session store).
    // ONLY then navigate home. This ensures every subsequent Supabase call resolves
    // instantly from the cached initializePromise instead of waiting for a slow exchange.
    supabase.auth.getSession()
      .then(go)
      .catch(go);

    return () => {
      mounted = false;
      clearTimeout(slowTimer);
      clearTimeout(failTimer);
    };
  }, [navigate]);

  if (stage === 'failed') {
    return (
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
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
      <p className="text-sm text-gray-500">
        {stage === 'slow' ? 'Connexion lente, patience...' : 'Connexion en cours...'}
      </p>
    </div>
  );
};

export default AuthCallbackPage;
