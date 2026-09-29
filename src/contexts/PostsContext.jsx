import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from './AuthContext';
import { logError } from '@/lib/errorLogger';

// Zando Social — contexte des publications (posts), sur le modèle exact de
// ListingsContext.jsx (même structure de pagination, même pattern d'écriture).
// Phase 1 : pas de vidéo (media_type reste 'image'), pas de feed algorithmique
// (tri chronologique simple pour l'instant, voir SOCIAL_COMMERCE_PHASE0_PLAN.md §8).
//
// ⚠️ Ce contexte n'est PAS encore monté dans App.jsx — il n'a aucun effet sur
// Zando+ en production tant qu'il n'est pas ajouté aux providers ET que
// site_settings.social_commerce_enabled reste à false.

const PostsContext = createContext();

export const usePosts = () => useContext(PostsContext);

const PAGE_SIZE = 20;

const POST_SELECT = `
  *,
  author:profiles(id, full_name, avatar_url, verified, is_business, is_boutique, shop_slug),
  post_products(
    id, is_primary, display_order,
    listing:listings(id, title, price, currency, images, status)
  )
`;

export const PostsProvider = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    pageRef.current = 0;
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;
      setPosts(data || []);
      setHasMore((data || []).length === PAGE_SIZE);
    } catch (error) {
      logError(error, { context: 'PostsContext.fetchPosts' });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const from = nextPage * PAGE_SIZE;
      const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      pageRef.current = nextPage;
      setPosts(prev => [...prev, ...(data || [])]);
      setHasMore((data || []).length === PAGE_SIZE);
    } catch (error) {
      logError(error, { context: 'PostsContext.loadMorePosts' });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  // listingIds : annonces à associer (0, 1 ou plusieurs, voir post_products).
  // Le post part en 'pending_review' — même logique que les annonces, modération
  // avant mise en ligne publique (à brancher sur ai-moderation en Phase 1 avancée).
  const createPost = useCallback(async ({ caption, mediaUrls, listingIds = [] }) => {
    if (!user) throw new Error('Vous devez être connecté pour publier.');
    try {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          caption: caption?.trim() || null,
          media_type: 'image',
          media_urls: mediaUrls,
          status: 'pending_review',
        })
        .select(POST_SELECT)
        .single();

      if (postError) throw postError;

      if (listingIds.length > 0) {
        const rows = listingIds.map((listing_id, index) => ({
          post_id: post.id,
          listing_id,
          is_primary: index === 0,
          display_order: index,
        }));
        const { error: linkError } = await supabase.from('post_products').insert(rows);
        if (linkError) throw linkError;
      }

      return post;
    } catch (error) {
      logError(error, { context: 'PostsContext.createPost' });
      throw error;
    }
  }, [user]);

  const toggleLike = useCallback(async (postId, currentlyLiked) => {
    if (!user) throw new Error('Vous devez être connecté.');
    // Optimiste : on ne réconcilie pas le compteur ici, le trigger SQL
    // (trg_post_likes_count) tient posts.likes_count à jour côté serveur ;
    // un refetch ponctuel du post suffit pour l'afficher a posteriori.
    try {
      if (currentlyLiked) {
        const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    } catch (error) {
      logError(error, { context: 'PostsContext.toggleLike' });
      throw error;
    }
  }, [user]);

  const addComment = useCallback(async (postId, content) => {
    if (!user) throw new Error('Vous devez être connecté.');
    if (!content?.trim()) throw new Error('Le commentaire est vide.');
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, author_id: user.id, content: content.trim() })
        .select('*, author:profiles(id, full_name, avatar_url)')
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      logError(error, { context: 'PostsContext.addComment' });
      throw error;
    }
  }, [user]);

  const value = {
    posts,
    loading,
    loadingMore,
    hasMore,
    fetchPosts,
    loadMorePosts,
    createPost,
    toggleLike,
    addComment,
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
};
