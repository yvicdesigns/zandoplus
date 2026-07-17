import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

// Dedicated OAuth callback page for PKCE flow.
// Supabase redirects here after Google auth with ?code=xxx.
// _initialize() in the Supabase client automatically exchanges the code.
// We navigate home as soon as getSession() resolves (or after 5s max).
// AuthContext's onAuthStateChange then picks up the SIGNED_IN event.
const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const go = () => { if (mounted) navigate('/', { replace: true }); };

    // 5-second max: on mobile with slow network, the PKCE exchange can take a while.
    // Navigate home regardless — AuthContext will show logged-in state once the exchange
    // completes (via onAuthStateChange SIGNED_IN → updateUserSession).
    const timeout = setTimeout(go, 5000);

    // getSession() waits for _initialize() (which runs the PKCE exchange) then resolves.
    // On success: session is in storage, we go home, AuthContext shows user as logged in.
    // On failure: we still go home (user can try again).
    supabase.auth.getSession().then(go).catch(go);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <Loader2 className="w-10 h-10 animate-spin text-custom-green-500" />
    </div>
  );
};

export default AuthCallbackPage;
