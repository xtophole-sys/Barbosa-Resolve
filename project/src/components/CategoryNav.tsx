import * as Icons from 'lucide-react';
import type { Category } from '@/types';
import type { ComponentType, SVGProps } from 'react';

interface CategoryNavProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export default function CategoryNav({ categories, selected, onSelect }: CategoryNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
          selected === null
            ? 'bg-emerald-600 text-white shadow-md'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
        }`}
      >
        <Icons.LayoutGrid className="w-4 h-4" />
        Todos
      </button>
      {categories.map((cat) => {
        const Icon = (Icons as unknown as Record<string, IconComponent>)[cat.icon] || Icons.ShoppingBasket;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.slug)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selected === cat.slug
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
