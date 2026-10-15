import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('active', true)
        .order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ]);

    if (productsRes.error) {
      setError(productsRes.error.message);
    } else if (categoriesRes.error) {
      setError(categoriesRes.error.message);
    } else {
      setProducts((productsRes.data as Product[]) || []);
      setCategories((categoriesRes.data as Category[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { products, categories, loading, error, reload: loadData };
}
