import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Category } from '../../../types';

interface ProductFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ProductFilter: React.FC<ProductFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Segmented Tab Control */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EBECE7] rounded-xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white text-[#192C23] shadow-xs'
                : 'text-[#59645C] hover:text-[#192C23]'
            }`}
          >
            All Remedies
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white text-[#192C23] shadow-xs'
                  : 'text-[#59645C] hover:text-[#192C23]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px] md:max-w-xs w-full">
          <Search className="w-4 h-4 text-[#7C887F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search herbs, benefits, resins..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-[#DEDCD5] focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] rounded-lg outline-none text-[#242A24] placeholder:text-[#8E9991] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#7A867E] hover:text-[#242A24]"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
