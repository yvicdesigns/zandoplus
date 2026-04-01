import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag as LoadingIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ListingItem from '@/components/listings/ListingItem';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useListings } from '@/contexts/ListingsContext';
import { Link } from 'react-router-dom';
import PaginationControls from '@/components/common/PaginationControls';

const ListingsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { listings: allListings, loading: listingsLoading, favorites, toggleFavorite } = useListings();
  
  const [paginatedListings, setPaginatedListings] = useState([]);
  const [loadingPaginated, setLoadingPaginated] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 14;
  
  const sectionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPaginatedListings = async () => {
      setLoadingPaginated(true);
      try {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, error, count } = await supabase
          .from('listings')
          .select('*, seller:profiles(id, full_name, avatar_url)', { count: 'exact' })
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        
        if (isMounted && data) {
            const formattedData = data.map(item => ({
                ...item,
                createdAt: item.created_at,
                seller: item.seller ? {
                    ...item.seller,
                    name: item.seller.full_name || 'Vendeur Anonyme',
                    avatar: item.seller.avatar_url,
                } : null,
            }));
            setPaginatedListings(formattedData);
            setTotalPages(Math.ceil((count || 0) / itemsPerPage));
        }

      } catch (error) {
        console.error("Error fetching paginated listings:", error);
      } finally {
        if (isMounted) setLoadingPaginated(false);
      }
    };
    
    fetchPaginatedListings();
    return () => { isMounted = false; };
  }, [currentPage]);

  const boostedListings = useMemo(() => 
    allListings.filter(l => l.featured).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4),
    [allListings]
  );
  
  const isLoading = listingsLoading || (loadingPaginated && paginatedListings.length === 0);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (sectionRef.current) {
        // Scroll smoothly to the top of the recent listings section
        const yOffset = sectionRef.current.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: yOffset, behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingIcon className="w-12 h-12 animate-spin text-custom-green-500" />
          </div>
        ) : (
          <>
            {boostedListings.length > 0 && (
              <div className="mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center mb-8"
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="gradient-text">Top Articles</span>
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Nos meilleures annonces, vérifiées et mises en avant pour vous.
                  </p>
                </motion.div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {boostedListings.map((listing) => (
                    <ListingItem
                      key={listing.id}
                      listing={listing}
                      viewMode="grid"
                      isFavorite={favorites.has(listing.id)}
                      toggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div ref={sectionRef}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Annonces <span className="gradient-text">Récentes</span>
                </h2>
                 <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Découvrez une sélection de nouveautés de notre communauté.
                </p>
              </motion.div>

              {loadingPaginated && paginatedListings.length > 0 ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingIcon className="w-10 h-10 animate-spin text-custom-green-500" />
                </div>
              ) : (paginatedListings.length > 0 && (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentPage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  >
                    {paginatedListings.map((listing) => (
                      <ListingItem
                        key={listing.id}
                        listing={listing}
                        viewMode="grid"
                        isFavorite={favorites.has(listing.id)}
                        toggleFavorite={toggleFavorite}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              ))}

              {paginatedListings.length > 0 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {!isLoading && allListings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Aucune annonce pour le moment.</p>
                <Button asChild variant="outline">
                    <Link to="/post-ad">Publier la première annonce</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ListingsSection;