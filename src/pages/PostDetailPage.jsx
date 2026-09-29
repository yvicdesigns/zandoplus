import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import PostCard from '@/components/social/PostCard';

// Zando Social — un post seul, pour le partage/deep link (voir
// SOCIAL_COMMERCE_PHASE0_PLAN.md §6). Route publique /posts/:id ; si le post
// n'est pas actif (et que le visiteur n'est pas l'auteur/admin), RLS renvoie
// simplement aucune ligne — on affiche alors un message neutre, jamais une
// erreur technique. Même garde-fou de feature flag que FeedPage.jsx : un lien
// partagé ne doit rien laisser voir tant que social_commerce_enabled est à
// false (sauf préview admin via ?feedPreview=1).

const PostDetailPage = () => {
  const { id } = useParams();
  const { fetchPostById, toggleLike } = usePosts();
  const { user, isAdmin, openAuthModal } = useAuth();
  const [searchParams] = useSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [checkingFlag, setCheckingFlag] = useState(true);

  useEffect(() => {
    supabase.from('site_settings').select('social_commerce_enabled').eq('id', 1).single()
      .then(({ data, error }) => { if (!error && data) setEnabled(!!data.social_commerce_enabled); })
      .finally(() => setCheckingFlag(false));
  }, []);

  const canSeePost = enabled || (isAdmin && searchParams.get('feedPreview') === '1');

  const load = () => {
    setLoading(true);
    fetchPostById(id).then((data) => { setPost(data); setLoading(false); });
  };

  useEffect(() => { if (canSeePost) load(); }, [id, canSeePost]);

  const handleLikeToggle = (p) => {
    if (!user) { openAuthModal(); return; }
    toggleLike(p.id, false).then(load);
  };

  if (checkingFlag) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;
  }

  if (!canSeePost) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-400 text-sm">Cette page n'est pas encore disponible.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-custom-green-500" /></div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-gray-400 text-sm">Cette publication n'est plus disponible.</p>
        <Link to="/social" className="text-custom-green-600 text-sm font-semibold">Retour au fil</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.author?.full_name ? `${post.author.full_name} sur Zando+` : 'Publication — Zando+'}</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-xl space-y-4">
          <Link to="/social" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Retour au fil
          </Link>
          <PostCard post={post} onLikeToggle={handleLikeToggle} />
        </div>
      </div>
    </>
  );
};

export default PostDetailPage;
