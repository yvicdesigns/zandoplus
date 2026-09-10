import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Gère l'état « Suivre la boutique » pour un vendeur donné.
//   isFollowing   : le user connecté suit-il cette boutique
//   followerCount : nombre total d'abonnés (visible même déconnecté)
//   toggle()      : suit / ne suit plus (optimiste)
//   loading       : chargement initial
export const useShopFollow = (sellerId) => {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [{ data: count }, followRes] = await Promise.all([
        supabase.rpc('get_shop_follower_count', { p_seller: sellerId }),
        user
          ? supabase.from('shop_follows').select('id').eq('follower_id', user.id).eq('seller_id', sellerId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setFollowerCount(typeof count === 'number' ? count : 0);
      setIsFollowing(!!followRes?.data);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [sellerId, user]);

  const toggle = useCallback(async () => {
    if (!user) { openAuthModal(); return; }
    if (busy || !sellerId || user.id === sellerId) return;

    const next = !isFollowing;
    setIsFollowing(next);
    setFollowerCount(c => Math.max(0, c + (next ? 1 : -1)));
    setBusy(true);

    try {
      if (next) {
        const { error } = await supabase
          .from('shop_follows')
          .insert({ follower_id: user.id, seller_id: sellerId });
        if (error && error.code !== '23505') throw error; // 23505 = déjà suivi
      } else {
        const { error } = await supabase
          .from('shop_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('seller_id', sellerId);
        if (error) throw error;
      }
    } catch (e) {
      // rollback
      setIsFollowing(!next);
      setFollowerCount(c => Math.max(0, c + (next ? -1 : 1)));
      toast({ title: 'Action impossible', description: 'Réessayez dans un instant.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }, [user, sellerId, isFollowing, busy, openAuthModal, toast]);

  return { isFollowing, followerCount, loading, busy, toggle };
};
