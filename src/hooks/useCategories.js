import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

let cache = null;

export const useCategories = () => {
  const [categories, setCategories] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*, subcategories(id, name, display_order)')
      .order('display_order', { ascending: true })
      .order('display_order', { referencedTable: 'subcategories', ascending: true });

    if (error) {
      setError(error.message);
    } else {
      cache = data;
      setCategories(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!cache) fetch();
  }, []);

  const refetch = () => {
    cache = null;
    fetch();
  };

  // Format compatible avec postAdConstants: { slug: { name, type, subcategories: [] } }
  const categoriesMap = categories.reduce((acc, cat) => {
    acc[cat.slug] = {
      name: cat.name,
      type: cat.type,
      subcategories: (cat.subcategories || []).map(s => s.name),
    };
    return acc;
  }, {});

  return { categories, categoriesMap, loading, error, refetch };
};
