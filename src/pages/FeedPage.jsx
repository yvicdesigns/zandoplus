import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import PostComposer from '@/components/social/PostComposer';
import PostCard from '@/components/social/PostCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Zando Social — le vrai feed public (contrairement à /admin/social-test qui
// reste un banc de test admin-only). Gardé derrière le feature flag
// site_settings.social_commerce_enabled, avec le même mécanisme
// d'avant-première admin que HeroSection.jsx (hero_v2_enabled + ?heroPreview) :
// ici social_commerce_enabled + ?feedPreview=1. Route publique dans App.jsx,
// mais tant que le flag est à false et qu'on n'est pas admin en préview,
// personne d'autre ne voit rien — cohérent avec SOCIAL_COMMERCE_PHASE0_PLAN.md §3.

const FeedPage = () => {
  const { user, isAdmin, openAuthModal } = useAuth();
  const { posts, loading, loadingMore, hasMore, fetchPosts, loadMorePosts, toggleLike } = usePosts();
  const [searchParams] = useSearchParams();
  const [enabled, setEnabled] = useState(false);
  const [checkingFlag, setCheckingFlag] = useState(true);

  useEffect(() => {
    supabase.from('site_settings').select('social_commerce_enabled').eq('id', 1).single()
      .then(({ data, error }) => { if (!error && data) setEnabled(!!data.social_commerce_enabled); })
      .finally(() => setCheckingFlag(false));
  }, []);

  const canSeeFeed = enabled || (isAdmin && searchParams.get('feedPreview') === '1');

  useEffect(() => {
    if (canSeeFeed) fetchPosts();
  }, [canSeeFeed, fetchPosts]);

  const handleLikeToggle = (post) => {
    if (!user) { openAuthModal(); return; }
    toggleLike(post.id, false).then(fetchPosts);
  };

  if (checkingFlag) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;
  }

  if (!canSeeFeed) {
    // Pas d'explication détaillée ici volontairement : tant que le flag est
    // désactivé, ce feed ne doit pas laisser deviner qu'il existe.
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-400 text-sm">Cette page n'est pas encore disponible.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Découvrir — Zando+</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-xl space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Découvrir</h1>

          {user ? (
            <PostComposer onPosted={fetchPosts} />
          ) : (
            <button
              onClick={openAuthModal}
              className="w-full text-sm text-gray-500 bg-white border border-dashed border-gray-200 rounded-xl py-4 hover:border-custom-green-400 hover:text-custom-green-600 transition-colors"
            >
              Connectez-vous pour publier
            </button>
          )}

          <div className="space-y-4">
            {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-custom-green-500" /></div>}
            {!loading && posts.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">Aucune publication pour l'instant. Soyez le premier !</p>
            )}
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
            ))}
          </div>

          {hasMore && !loading && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={loadMorePosts} disabled={loadingMore}>
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Voir plus
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FeedPage;
