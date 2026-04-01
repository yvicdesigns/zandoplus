import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const RelatedListings = ({ listings, loading }) => {
  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Annonces Similaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-24 w-24 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!listings || listings.length === 0) {
    return null; // Don't render the component if there are no related listings
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Annonces Similaires</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map(listing => (
            <Link key={listing.id} to={`/listings/${listing.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow duration-200">
                <div className="flex">
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-l-lg">
                    <img className="w-full h-full object-contain" alt={listing.title} src={listing.images?.[0] || 'https://via.placeholder.com/100x100?text=N/A'} />
                  </div>
                  <div className="flex-1 p-3">
                    <h4 className="font-semibold line-clamp-2 mb-1">{listing.title}</h4>
                    <p className="text-lg font-bold text-custom-green-600">
                      {(listing.price || 0).toLocaleString()} {listing.currency || 'FCFA'}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RelatedListings;