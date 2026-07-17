import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';

export function useTesterStatus() {
  const { user } = useAuth();
  const [tester, setTester]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setTester(null); setLoading(false); return; }
    supabase
      .from('testers')
      .select('id, full_name, status, points, score, device_model, android_version')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error) setTester(data);
        setLoading(false);
      });
  }, [user?.id]);

  return {
    tester,
    isActiveTester: tester?.status === 'active',
    loading,
    refresh: () => {
      if (!user) return;
      supabase.from('testers').select('id, full_name, status, points, score, device_model, android_version')
        .eq('user_id', user.id).maybeSingle()
        .then(({ data, error }) => { if (!error) setTester(data); });
    },
  };
}
