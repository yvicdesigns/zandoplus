import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Star, Heart, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import UserListingCard from '@/components/profile/UserListingCard';

const EmptyState = ({ icon: Icon, title, description, buttonText, buttonLink }) => (
  <div className="text-center py-12">
    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
      <Icon className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 mb-6">{description}</p>
    {buttonText && buttonLink && (
      <Link to={buttonLink}>
        <Button className="gradient-bg hover:opacity-90">{buttonText}</Button>
      </Link>
    )}
  </div>
);

const ProfileTabs = ({ activeListings, soldListings, favoriteListings, pendingListings = [], loading, defaultTab }) => {
  const resolvedDefault = defaultTab || (pendingListings.length > 0 ? 'pending' : 'active');

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Mes Annonces</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={resolvedDefault} className="w-full">
          <TabsList className={`grid w-full ${pendingListings.length > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {pendingListings.length > 0 && (
              <TabsTrigger value="pending" className="relative data-[state=active]:text-amber-600">
                En attente
                <span className="ml-1 bg-amber-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">{pendingListings.length}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="active">Actives ({activeListings.length})</TabsTrigger>
            <TabsTrigger value="sold">Vendues ({soldListings.length})</TabsTrigger>
            <TabsTrigger value="favorites">Favoris ({favoriteListings.length})</TabsTrigger>
          </TabsList>

          {pendingListings.length > 0 && (
            <TabsContent value="pending" className="mt-6">
              <div className="space-y-3">
                {pendingListings.map((listing) => (
                  <div key={listing.id} className={`flex items-start gap-4 p-4 rounded-xl border ${listing.status === 'needs_changes' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                    <img src={listing.images?.[0] || '/placeholder-image.png'} alt={listing.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{listing.title}</p>
                      {listing.status === 'pending_review' ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-sm text-blue-700 font-medium">En cours de vérification — visible sous 24h</span>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span className="text-sm text-amber-700 font-semibold">Modifications requises</span>
                          </div>
                          {listing.moderation_reason && (
                            <p className="text-sm text-amber-800 mt-1 bg-amber-100 rounded-lg p-2">{listing.moderation_reason}</p>
                          )}
                          <Link to={`/edit-ad/${listing.id}`} className="inline-block mt-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors">
                            Modifier l'annonce
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="active" className="mt-6">
            {loading ? <p>Chargement des annonces...</p> : activeListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeListings.map((listing) => (
                  <UserListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Plus}
                title="Aucune annonce active"
                description="Commencez à vendre en publiant votre première annonce"
                buttonText="Publier Votre Première Annonce"
                buttonLink="/post-ad"
              />
            )}
          </TabsContent>

          <TabsContent value="sold" className="mt-6">
            {loading ? <p>Chargement...</p> : soldListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {soldListings.map((listing) => (
                  <UserListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Star}
                title="Aucun article vendu pour l'instant"
                description="Vos annonces vendues apparaîtront ici"
              />
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            {loading ? <p>Chargement...</p> : favoriteListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteListings.map((listing) => (
                  <UserListingCard key={listing.id} listing={listing} isFavoriteView={true} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="Aucun favori pour l'instant"
                description="Enregistrez les annonces qui vous intéressent pour les voir ici"
                buttonText="Parcourir les Annonces"
                buttonLink="/listings"
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfileTabs;