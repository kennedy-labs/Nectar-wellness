import React from 'react';
import { Product } from '../../../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  addedProductIds: Set<string>;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  addedProductIds,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-[#F5F6F3] rounded-2xl border border-[#E5E6DF]">
        <h3 className="font-display text-lg text-[#20392D]">No remedies found</h3>
        <p className="text-xs text-[#5C685E] mt-1 max-w-sm mx-auto">
          We could not find any herbal products matching your filter. Try adjusting your search term or exploring All Remedies.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelectProduct}
          onAddToCart={onAddToCart}
          isAdded={addedProductIds.has(product.id)}
        />
      ))}
    </div>
  );
};
