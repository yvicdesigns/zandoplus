import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Zando Social — plusieurs produits tagués sur la même publication : ouvre un
// panneau listant chacun, qui renvoie vers sa propre fiche produit (même
// principe que PostProductCTA — jamais de logique d'achat dupliquée ici).

const PostProductsSheet = ({ listings, postId }) => {
  if (!listings || listings.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 w-full bg-custom-green-600 text-white text-sm font-bold px-3 py-2.5 rounded-xl hover:bg-custom-green-700 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Voir les {listings.length} produits
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[75vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{listings.length} produits dans cette publication</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/listings/${listing.id}?source=social_feed&post_id=${postId}`}
              className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors"
            >
              {listing.images?.[0] && (
                <img src={listing.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{listing.title}</p>
                <p className="text-xs text-gray-500">{listing.price?.toLocaleString('fr-FR')} {listing.currency}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PostProductsSheet;
