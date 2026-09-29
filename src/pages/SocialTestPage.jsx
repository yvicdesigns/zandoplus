import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePosts } from '@/contexts/PostsContext';
import PostComposer from '@/components/social/PostComposer';
import { Heart, MessageCircle, Tag } from 'lucide-react';

// Zando Social — page de test admin-only pour la Phase 1, sur le modèle exact
// de /admin/hero-builder-beta (AdminHeroBuilderBetaPage.jsx) : un endroit
// isolé pour vérifier que PostsContext + PostComposer marchent vraiment,
// avant de construire le feed public autour. Jamais liée depuis la nav.

const SocialTestPage = () => {
  const { posts, loading, fetchPosts, toggleLike } = usePosts();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
              <div key={post.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                <p className="text-sm text-gray-800">{post.caption}</p>
                <div className="flex gap-2 flex-wrap">
                  {post.media_urls?.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-16 h-16 rounded object-cover" />
                  ))}
                </div>
                {post.post_products?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-custom-green-700">
                    <Tag className="w-3.5 h-3.5" />
                    {post.post_products.map((pp) => pp.listing?.title).join(', ')}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleLike(post.id, false).then(fetchPosts)}
                    className="flex items-center gap-1 hover:text-red-500"
                  >
                    <Heart className="w-3.5 h-3.5" /> {post.likes_count}
                  </button>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> {post.comments_count}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span>{post.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SocialTestPage;
