import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { robustQuery } from '@/lib/supabaseHelpers';
import { logError } from '@/lib/errorLogger';

const ListingsContext = createContext();

export const useListings = () => useContext(ListingsContext);

export const ListingsProvider = ({ children }) => {
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    priceRange: [0, 10000000],
    condition: '',
    sortBy: 'newest',
  });

  const filtersRef = useRef(filters);

  const setFiltersWithLoading = useCallback((newFilters) => {
    if (JSON.stringify(filtersRef.current) === JSON.stringify(newFilters)) {
        return;
    }
    filtersRef.current = newFilters;
    setLoading(true);
    setFilters(newFilters);
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const queryFn = () => {
        let query = supabase
          .from('listings')
          .select('*, seller:profiles(id, full_name, avatar_url, verified, phone, created_at, last_seen)')
          .eq('status', 'active');

        if (filters.category) query = query.eq('category', filters.category);
        if (filters.location) query = query.ilike('location', `%${filters.location}%`);
        if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000)) {
          query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
        }
        if (filters.condition) query = query.eq('condition', filters.condition);
        if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

        switch (filters.sortBy) {
          case 'price-low': query = query.order('price', { ascending: true }); break;
          case 'price-high': query = query.order('price', { ascending: false }); break;
          case 'oldest': query = query.order('created_at', { ascending: true }); break;
          case 'popularity': query = query.order('views_count', { ascending: false, nullsFirst: false }); break;
          case 'newest': default: query = query.order('created_at', { ascending: false }); break;
        }

        return query.limit(100);
      };

      const { data, error } = await robustQuery(queryFn);

      if (error) throw error;
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error.message);
      logError(error, { context: 'fetchListings' });
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les annonces. Veuillez vérifier votre connexion.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await robustQuery(() => 
        supabase
          .from('favorites')
          .select('listing_id')
          .eq('user_id', user.id)
      );
      if (error) throw error;
      setFavorites(new Set(data.map(f => f.listing_id)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      logError(error, { context: 'fetchFavorites' });
    }
  }, [user]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites(new Set());
    }
  }, [user, fetchFavorites]);

  const toggleFavorite = async (listingId) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter une annonce à vos favoris.",
        variant: "destructive",
      });
      openAuthModal();
      return;
    }

    const isCurrentlyFavorite = favorites.has(listingId);
    const newFavorites = new Set(favorites);

    if (isCurrentlyFavorite) {
      newFavorites.delete(listingId);
      setFavorites(newFavorites);
      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: user.id, listing_id: listingId });
      if (error) {
        newFavorites.add(listingId);
        setFavorites(newFavorites);
        toast({ title: "Erreur", description: "Impossible de retirer des favoris.", variant: "destructive" });
      } else {
        toast({ title: "Retiré des favoris", description: "L'annonce a été retirée de vos favoris." });
      }
    } else {
      newFavorites.add(listingId);
      setFavorites(newFavorites);
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, listing_id: listingId });
      if (error) {
        newFavorites.delete(listingId);
        setFavorites(newFavorites);
        toast({ title: "Erreur", description: "Impossible d'ajouter aux favoris.", variant: "destructive" });
      } else {
        toast({ title: "Ajouté aux favoris!", description: "L'annonce a été ajoutée à vos favoris.", className: "bg-green-100 text-green-800" });
      }
    }
  };

  const addListing = async (listingData) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .insert({ ...listingData, user_id: user.id, status: 'active' })
        .select('*, seller:profiles(id, full_name, avatar_url, verified, phone, created_at, last_seen)')
        .single();
      
      if (error) throw error;
      setListings(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding listing:', error);
      logError(error, { context: 'addListing' });
      throw error;
    }
  };

  const updateListing = async (id, updatedData) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .update(updatedData)
        .eq('id', id)
        .select('*, seller:profiles(id, full_name, avatar_url, verified, phone, created_at, last_seen)')
        .single();
      
      if (error) throw error;
      setListings(prev => prev.map(l => l.id === id ? data : l));
      return data;
    } catch (error) {
      console.error('Error updating listing:', error);
      logError(error, { context: 'updateListing' });
      throw error;
    }
  };

  const deleteListing = async (listingId) => {
    setLoading(true);
    try {
      const { data: listingData, error: fetchError } = await supabase
        .from('listings')
        .select('images')
        .eq('id', listingId)
        .single();

      if (fetchError) throw new Error("Annonce non trouvée.");

      if (listingData.images && listingData.images.length > 0) {
        const filePaths = listingData.images.map(url => {
          try {
            const urlObject = new URL(url);
            const pathParts = urlObject.pathname.split('/');
            const bucketIndex = pathParts.indexOf('listing_images');
            if (bucketIndex !== -1) {
              return pathParts.slice(bucketIndex + 1).join('/');
            }
            return null;
          } catch (e) { return null; }
        }).filter(Boolean);
        
        if (filePaths.length > 0) {
          await supabase.storage.from('listing_images').remove(filePaths);
        }
      }

      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (deleteError) throw deleteError;

      setListings(prev => prev.filter(l => l.id !== listingId));
    } catch (error) {
      console.error('Error deleting listing:', error);
      logError(error, { context: 'deleteListing' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getFeaturedListings = useCallback(() => {
    return listings.filter(l => l.featured && l.status === 'active');
  }, [listings]);

  const value = {
    listings,
    loading,
    filters,
    setFilters: setFiltersWithLoading,
    favorites,
    toggleFavorite,
    addListing,
    updateListing,
    deleteListing,
    getFeaturedListings,
    refreshListings: fetchListings
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};