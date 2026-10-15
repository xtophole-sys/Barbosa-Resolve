import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const outOfStock = product.stock <= 0;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-300 flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            🛒
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white px-4 py-1.5 rounded-full text-sm font-semibold text-gray-700">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{product.description}</p>
        )}

        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-lg font-bold text-emerald-600">{formatPrice(product.price)}</p>
            <p className="text-xs text-gray-400">/ {product.unit}</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              outOfStock
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : added
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white active:scale-90'
            }`}
            aria-label="Adicionar ao carrinho"
          >
            {added ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
