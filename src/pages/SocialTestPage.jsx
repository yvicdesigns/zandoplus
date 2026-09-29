import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePosts } from '@/contexts/PostsContext';
import PostComposer from '@/components/social/PostComposer';
import PostCard from '@/components/social/PostCard';

// Zando Social — page de test admin-only pour la Phase 1, sur le modèle exact
// de /admin/hero-builder-beta (AdminHeroBuilderBetaPage.jsx) : un endroit
// isolé pour vérifier que PostsContext + PostComposer + PostCard marchent
// vraiment, avant de construire le feed public autour. Jamais liée depuis la
// nav.

const SocialTestPage = () => {
  const { posts, loading, fetchPosts, toggleLike } = usePosts();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLikeToggle = (post) => {
    // Page de test : pas de suivi de "déjà liké par moi" pour l'instant,
    // on aime toujours (le like est idempotent côté base — contrainte unique
    // post_id+user_id — un second clic échouerait proprement, pas grave ici).
    toggleLike(post.id, false).then(fetchPosts);
  };

  return (
    <>
      <Helmet><title>Zando Social — Test (admin) - Zando+</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4 max-w-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Zando Social — page de test</h1>
            <p className="text-sm text-gray-500 mt-1">
              Réservé aux admins, pas de lien dans la navigation. Sert à vérifier Phase 1 avant de construire le feed.
            </p>
          </div>

          <PostComposer onPosted={fetchPosts} />

          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">Publications ({posts.length})</h2>
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}
            {!loading && posts.length === 0 && (
              <p className="text-sm text-gray-400">Aucune publication active pour l'instant (les nouvelles passent par une vérification avant d'apparaître ici).</p>
            )}
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SocialTestPage;
