import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import PostProductCTA from './PostProductCTA';
import PostProductsSheet from './PostProductsSheet';

// Zando Social — une publication dans le feed (ou la page de test Phase 1).
// Règle du bouton d'achat (voir SOCIAL_COMMERCE_PHASE0_PLAN.md) : 0 produit
// tagué = rien de commercial affiché ; 1 produit = CTA direct ; plusieurs =
// panneau "Voir les N produits". Jamais de logique d'achat ici, seulement le
// choix du bon composant à afficher.

const PostCard = ({ post, onLikeToggle }) => {
  const listings = (post.post_products || [])
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((pp) => pp.listing)
    .filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      {post.author?.full_name && (
        <p className="text-xs font-semibold text-gray-500">{post.author.full_name}</p>
      )}
      {post.caption && <p className="text-sm text-gray-800">{post.caption}</p>}
      <div className="flex gap-2 flex-wrap">
        {post.media_urls?.map((url, i) => (
          <img key={i} src={url} alt="" className="w-full max-w-xs rounded-lg object-cover" />
        ))}
      </div>

      {listings.length === 1 && <PostProductCTA listing={listings[0]} postId={post.id} />}
      {listings.length > 1 && <PostProductsSheet listings={listings} postId={post.id} />}

      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
        <button
          type="button"
          onClick={() => onLikeToggle?.(post)}
          className="flex items-center gap-1 hover:text-red-500 transition-colors"
        >
          <Heart className="w-3.5 h-3.5" /> {post.likes_count}
        </button>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5" /> {post.comments_count}
        </span>
      </div>
    </div>
  );
};

export default PostCard;
