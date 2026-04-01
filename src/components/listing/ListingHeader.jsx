import React from 'react';
import { MapPin } from 'lucide-react';
import ListingBadges from '@/components/common/ListingBadges';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const ListingHeader = ({ listing, seller }) => {
  if (!listing) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-0 space-y-4">
      <div>
        <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-gray-800 break-words pr-4">
                {listing.title}
            </h1>
            <div className="flex-shrink-0">
                <ListingBadges listing={listing} seller={seller} />
            </div>
        </div>
        <div className="flex items-center text-sm text-gray-500 mt-2">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{listing.location}</span>
          <span className="mx-2">•</span>
          <span>
            Publié {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: fr })}
          </span>
        </div>
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-4xl font-extrabold text-custom-green-600">
          {(listing.price || 0).toLocaleString()} {listing.currency || 'FCFA'}
        </span>
        {listing.negotiable && (
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Négociable</span>
        )}
      </div>
    </div>
  );
};

export default ListingHeader;