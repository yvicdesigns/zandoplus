import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useListings } from '@/contexts/ListingsContext';
import ListingItem from '@/components/listings/ListingItem';
import ListingsFilters from '@/components/listings/ListingsFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';

const ListingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { listings, loading, favorites, toggleFavorite, setFilters: setListingsContextFilters } = useListings();
  const [viewMode, setViewMode] = useState('grid');
  
  // Controls Mobile Sidebar Visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Extract params to primitives to ensure stability of getFiltersFromURL dependency array
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const location = searchParams.get('location');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const condition = searchParams.get('condition');
  const sortBy = searchParams.get('sortBy');

  const getFiltersFromURL = useCallback(() => ({
    search: search || '',
    category: category || '',
    location: location || '',
    priceRange: [
      parseInt(minPrice) || 0,
      parseInt(maxPrice) || 10000000
    ],
    condition: condition || '',
    sortBy: sortBy || 'newest',
  }), [search, category, location, minPrice, maxPrice, condition, sortBy]);

  const [localFilters, setLocalFilters] = useState(getFiltersFromURL());

  useEffect(() => {
    const newFilters = getFiltersFromURL();
    // This will now only trigger if the actual filter values change, preventing loops
    setListingsContextFilters(newFilters);
    setLocalFilters(newFilters);
    setVisibleCount(12);
    window.scrollTo(0, 0);
  }, [getFiltersFromURL, setListingsContextFilters]); 

  const handleFilterUpdate = (updaterOrValue) => {
    const newFilters = typeof updaterOrValue === 'function' 
      ? updaterOrValue(localFilters)
      : updaterOrValue;

    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.priceRange[0] > 0) params.set('minPrice', newFilters.priceRange[0]);
    if (newFilters.priceRange[1] < 10000000) params.set('maxPrice', newFilters.priceRange[1]);
    if (newFilters.condition) params.set('condition', newFilters.condition);
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);

    setSearchParams(params, { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterUpdate(localFilters); 
    // Close mobile sidebar on search
    setIsSidebarOpen(false);
  };
  
  const pageTitle = localFilters.category 
    ? `Annonces ${localFilters.category === 'electronics' ? 'Électronique' : 
        localFilters.category === 'vehicles' ? 'Véhicules' : 
        localFilters.category === 'real-estate' ? 'Immobilier' : 
        localFilters.category === 'fashion' ? 'Mode' : 
        localFilters.category === 'jobs' ? 'Emplois' : 
        localFilters.category === 'services' ? 'Services' :
        localFilters.category === 'agro-alimentaire' ? 'Agroalimentaire' :
        localFilters.category === 'traditional-medicine' ? 'Médecine traditionnelle' :
        localFilters.category.charAt(0).toUpperCase() + localFilters.category.slice(1)}`
    : 'Explorer les annonces';
  
  const pageDescription = `Parcourez ${listings.length} annonces sur Zando+ Congo. Trouvez les meilleures offres près de chez vous.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle} - Zando+ Congo</title>
        <meta name="description" content={pageDescription} />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{pageTitle}</h1>
              {!loading && <p className="text-gray-600 mt-1">{listings.length} résultats</p>}
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Mobile Filter Toggle */}
              <Button 
                variant="outline" 
                onClick={() => setIsSidebarOpen(true)} 
                className="flex-1 md:hidden bg-white border-custom-green-200 text-custom-green-700 hover:bg-custom-green-50"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtres & Tri
              </Button>
              
              {/* Desktop View Toggles */}
              <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-lg border shadow-sm">
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-custom-green-100 text-custom-green-700' : 'text-gray-500'}
                >
                  <LayoutGrid className="w-5 h-5" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-custom-green-100 text-custom-green-700' : 'text-gray-500'}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar / Filters */}
            <aside className={`
              fixed inset-0 z-50 bg-white p-4 overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 lg:bg-transparent lg:p-0 lg:overflow-visible lg:block lg:col-span-1
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
              <ListingsFilters
                searchQuery={localFilters.search}
                setSearchQuery={(value) => setLocalFilters(prev => ({...prev, search: value}))}
                handleSearch={handleSearchSubmit}
                filters={localFilters}
                setFilters={handleFilterUpdate}
                sortBy={localFilters.sortBy}
                setSortBy={(value) => handleFilterUpdate(prev => ({...prev, sortBy: value}))}
                showFilters={isSidebarOpen}
                setShowFilters={setIsSidebarOpen}
              />
            </aside>

            {/* Backdrop for Mobile Sidebar */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Main Content */}
            <main className="lg:col-span-3">
              {loading ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {[...Array(9)].map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full rounded-lg" />
                  ))}
                </div>
              ) : listings.length > 0 ? (
                <>
                    <div 
                      className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
                    >
                      {listings.slice(0, visibleCount).map(listing => (
                          <ListingItem
                            key={listing.id} 
                            listing={listing}
                            viewMode={viewMode}
                            isFavorite={favorites.has(listing.id)}
                            toggleFavorite={toggleFavorite}
                          />
                      ))}
                    </div>
                  
                  {visibleCount < listings.length && (
                    <div className="text-center mt-12 pb-8">
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="rounded-full px-8 py-6 text-lg border-2 hover:bg-custom-green-50 hover:text-custom-green-700 hover:border-custom-green-200 transition-all" 
                        onClick={() => setVisibleCount(prev => prev + 12)}
                      >
                        Charger plus d'annonces
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune annonce trouvée</h2>
                  <p className="text-gray-500 max-w-md mx-auto px-4">
                    Nous n'avons pas trouvé de résultats correspondant à vos critères. Essayez d'élargir votre recherche ou de modifier les filtres.
                  </p>
                  <Button 
                    variant="link" 
                    className="mt-4 text-custom-green-600 font-semibold"
                    onClick={() => {
                        handleFilterUpdate({
                            category: '',
                            location: '',
                            condition: '',
                            priceRange: [0, 10000000],
                            search: '',
                            sortBy: 'newest'
                        });
                        setLocalFilters({
                            category: '',
                            location: '',
                            condition: '',
                            priceRange: [0, 10000000],
                            search: '',
                            sortBy: 'newest'
                        });
                    }}
                  >
                    Effacer tous les filtres
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListingsPage;