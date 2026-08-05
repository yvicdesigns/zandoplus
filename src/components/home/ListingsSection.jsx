import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag as LoadingIcon, ChevronRight, ChevronLeft } from 'lucide-react';
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
  const itemsPerPage = 10;

  const sectionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPaginatedListings = async () => {
      setLoadingPaginated(true);
      try {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        const { data, error, count } = await supabase
          .from('listings')
          .select('*, seller:profiles(id, full_name, avatar_url, verified)', { count: 'exact' })
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
        console.error('Error fetching paginated listings:', error);
      } finally {
        if (isMounted) setLoadingPaginated(false);
      }
    };
    fetchPaginatedListings();
    return () => { isMounted = false; };
  }, [currentPage]);

  const boostedListings = useMemo(() =>
    allListings.filter(l => l.featured).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8),
    [allListings]
  );

  const isLoading = listingsLoading || (loadingPaginated && paginatedListings.length === 0);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (sectionRef.current) {
        const yOffset = sectionRef.current.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: yOffset, behavior: 'smooth' });
      }
    }
  };

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="py-10 bg-page-bg">
        <div className="max-w-[1280px] mx-auto px-6 flex justify-center items-center h-48">
          <LoadingIcon className="w-10 h-10 animate-spin text-custom-green-500" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-page-bg">

      {/* ── MEILLEURES VENTES (annonces boostées) ── */}
      {boostedListings.length > 0 && (
        <div className="py-6">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[19px] font-extrabold text-gray-900">Meilleures ventes</h2>
                <span className="bg-custom-green-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                  Populaire
                </span>
              </div>
              <Link
                to="/listings?featured=true"
                className="flex items-center gap-1 text-[13px] font-semibold text-custom-green-500 hover:underline"
              >
                Voir toutes les meilleures ventes <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              <button
                onClick={() => scroll(-1)}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full items-center justify-center hover:border-custom-green-500 shadow-sm transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 sm:px-10"
                style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              >
                {boostedListings.map((listing) => (
                  <div key={listing.id} className="flex-shrink-0 w-[170px] sm:w-[200px] snap-start">
                    <ListingItem
                      listing={listing}
                      viewMode="grid"
                      isFavorite={favorites.has(listing.id)}
                      toggleFavorite={toggleFavorite}
                    />
                  </div>
                ))}
                <div className="flex-shrink-0 w-2 sm:hidden" />
              </div>

              <button
                onClick={() => scroll(1)}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full items-center justify-center hover:border-custom-green-500 shadow-sm transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANNONCES RÉCENTES ── */}
      <div className="py-6" ref={sectionRef}>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[19px] font-extrabold text-gray-900">Annonces récentes</h2>
            <Link
              to="/listings"
              className="flex items-center gap-1 text-[13px] font-semibold text-custom-green-500 hover:underline"
            >
              Voir toutes les annonces <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingPaginated && paginatedListings.length > 0 ? (
            <div className="flex justify-center items-center h-48">
              <LoadingIcon className="w-10 h-10 animate-spin text-custom-green-500" />
            </div>
          ) : paginatedListings.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4"
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Aucune annonce pour le moment.</p>
              <Button asChild variant="outline">
                <Link to="/post-ad">Publier la première annonce</Link>
              </Button>
            </div>
          )}

        </div>
      </div>

    </section>
  );
};

export default ListingsSection;
