import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Star, Heart } from 'lucide-react';
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

const ProfileTabs = ({ activeListings, soldListings, favoriteListings, loading }) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Mes Annonces</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Actives ({activeListings.length})</TabsTrigger>
            <TabsTrigger value="sold">Vendues ({soldListings.length})</TabsTrigger>
            <TabsTrigger value="favorites">Favoris ({favoriteListings.length})</TabsTrigger>
          </TabsList>

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