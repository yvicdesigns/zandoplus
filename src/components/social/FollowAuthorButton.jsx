import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopFollow } from '@/hooks/useShopFollow';

// Zando Social — suivre l'auteur d'une publication. Réutilise directement
// useShopFollow (déjà en place pour "Suivre la boutique" sur les fiches
// vendeur) : un auteur de post EST un profiles, donc suivre un auteur =
// suivre un vendeur = shop_follows, sans nouvelle table (voir
// SOCIAL_COMMERCE_PHASE0_PLAN.md §4, "post_follows : PAS créée").

const FollowAuthorButton = ({ authorId }) => {
  const { user } = useAuth();
  const { isFollowing, loading, busy, toggle } = useShopFollow(authorId);

  if (!authorId || loading || (user && user.id === authorId)) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
        isFollowing
          ? 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'
          : 'border-custom-green-500 text-custom-green-600 hover:bg-custom-green-50'
      }`}
    >
      {isFollowing ? 'Abonné' : 'Suivre'}
    </button>
  );
};

export default FollowAuthorButton;
