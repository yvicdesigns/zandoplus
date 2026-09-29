import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

// Zando Social — 1 seul produit tagué sur la publication : bouton d'achat
// direct. Ne fait AUCUN appel d'achat lui-même — c'est un simple lien vers la
// fiche produit existante (ListingDetailPage.jsx), qui gère déjà Ajouter au
// panier / Acheter maintenant / Payer à la livraison / Message. Zando Social
// ne doit jamais dupliquer cette logique, seulement y amener l'acheteur.
//
// `source=social_feed&post_id=...` : attribution des ventes (voir
// SOCIAL_COMMERCE_PHASE0_PLAN.md §9) — pas encore lu ni enregistré nulle part
// côté panier/escrow, cette étape-là reste à faire, mais le lien est déjà
// prêt pour ça.

const PostProductCTA = ({ listing, postId }) => {
  if (!listing) return null;

  return (
    <Link
      to={`/listings/${listing.id}?source=social_feed&post_id=${postId}`}
      className="flex items-center justify-between gap-3 bg-custom-green-50 border border-custom-green-200 rounded-xl px-3 py-2.5 hover:bg-custom-green-100 transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {listing.images?.[0] && (
          <img src={listing.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{listing.title}</p>
          <p className="text-xs text-gray-500">{listing.price?.toLocaleString('fr-FR')} {listing.currency}</p>
        </div>
      </div>
      <span className="flex items-center gap-1.5 bg-custom-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex-shrink-0">
        <ShoppingCart className="w-3.5 h-3.5" />
        Acheter
      </span>
    </Link>
  );
};

export default PostProductCTA;
