import { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import Hero from '@/components/Hero';
import SearchBar from '@/components/SearchBar';
import CategoryNav from '@/components/CategoryNav';
import ProductCard from '@/components/ProductCard';
import { ShoppingBag, PackageX } from 'lucide-react';

interface StoreViewProps {
  onCartClick: () => void;
}

export default function StoreView({ onCartClick }: StoreViewProps) {
  const { products, categories, loading, error } = useProducts();
  const { totalItems, subtotal } = useCart();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) result = result.filter((p) => p.category_id === cat.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [products, categories, selectedCategory, search]);

  if (loading) {
    return (
      <div>
        <Hero />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-6 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-red-600 font-medium">Não foi possível carregar os produtos.</p>
        <p className="text-sm text-gray-500 mt-1">Tente novamente em instantes.</p>
      </div>
    );
  }

  return (
    <div>
      <Hero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="produtos">
        {/* Search */}
        <div className="mb-6 max-w-xl">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Categories */}
        <div className="mb-8">
          <CategoryNav
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <PackageX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
            <p className="text-sm text-gray-400 mt-1">Tente buscar por outro termo ou categoria</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedCategory
                  ? categories.find((c) => c.slug === selectedCategory)?.name
                  : 'Todos os produtos'}
                <span className="text-gray-400 font-normal ml-2">({filtered.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating cart bar (mobile) */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:hidden z-40">
          <button
            onClick={onCartClick}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold shadow-lg active:scale-[0.98] transition-transform"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </span>
            <span>Ver carrinho</span>
          </button>
        </div>
      )}
    </div>
  );
}
