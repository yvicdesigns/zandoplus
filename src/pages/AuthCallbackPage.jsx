import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let mounted = true;

    const handleOAuthReturn = async () => {
      const code = new URLSearchParams(window.location.search).get('code');

      if (!code) {
        // No code in URL — Supabase may have already processed the session
        // (e.g. hash-based implicit flow, or _initialize() already ran).
        const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (mounted) navigate(session ? '/' : '/', { replace: true });
        return;
      }

      // getSession() waits for _initialize() to complete (which may have already exchanged the code).
      const { data: { session: existingSession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (existingSession && mounted) {
        navigate('/', { replace: true });
        return;
      }

      // _initialize() didn't establish a session — try explicit exchange with retries.
      // This handles the case where the code_verifier was found via sessionStorage backup
      // but _initialize()'s auto-detection failed.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (!error && data?.session && mounted) {
            navigate('/', { replace: true });
            return;
          }
        } catch {}
        if (attempt < 2) await new Promise(r => setTimeout(r, 600));
      }

      // All attempts failed — navigate home anyway (user can retry)
      if (mounted) {
        setStatus('failed');
        setTimeout(() => { if (mounted) navigate('/', { replace: true }); }, 1500);
      }
    };

    handleOAuthReturn();
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 gap-4">
      {status === 'loading' ? (
        <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
      ) : (
        <p className="text-sm text-gray-500">Connexion échouée, redirection...</p>
      )}
    </div>
  );
};

export default AuthCallbackPage;
