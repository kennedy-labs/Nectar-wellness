import React from 'react';
import { MessageCircle, Plus, Eye, Check } from 'lucide-react';
import { formatKES } from '../../../lib/utils';
import { buildWhatsAppProductInquiryUrl } from '../../../lib/whatsapp';
import { Product } from '../../../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isAdded?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  isAdded = false,
}) => {
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const whatsappUrl = buildWhatsAppProductInquiryUrl(product);

  return (
    <article className="group bg-white rounded-xl border border-[#E6E4DD] hover:border-[#CCD4CE] hover:shadow-xs transition-all flex flex-col overflow-hidden">
      {/* Visual Slot with Fallback Container */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-4/3 bg-[#F4F3EE] overflow-hidden cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          onError={(e) => {
            // Elegant CSS/SVG fallback if image fails
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.classList.add(
                'bg-gradient-to-br',
                'from-[#E8EDE9]',
                'to-[#D3DED6]',
                'flex',
                'items-center',
                'justify-center'
              );
            }
          }}
        />

        {/* Quiet stock state indicator */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isOutOfStock ? (
            <span className="text-[11px] font-semibold bg-[#262626]/85 backdrop-blur-xs text-white px-2 py-0.5 rounded-sm">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-[11px] font-semibold bg-[#8C5E28]/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-sm">
              Only {product.stockQuantity} left
            </span>
          ) : product.isFeatured ? (
            <span className="text-[11px] font-semibold bg-[#20392D]/85 backdrop-blur-xs text-white px-2 py-0.5 rounded-sm">
              Featured
            </span>
          ) : null}
        </div>

        {/* Quick view hover affordance */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/90 backdrop-blur-xs text-[#1E3B2F] text-xs font-medium px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </span>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Unboxed Metadata Header */}
          <div className="flex items-center gap-2 text-xs text-[#6B756E] mb-1">
            <span>{product.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Restocking soon'}</span>
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="font-display font-medium text-base text-[#1A2821] hover:text-[#2D4C3D] transition-colors cursor-pointer line-clamp-2 leading-snug"
          >
            {product.name}
          </h3>

          <p className="text-xs text-[#566057] line-clamp-2 mt-1.5 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Actions */}
        <div className="pt-2 border-t border-[#F0EFEB] space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-semibold font-mono tabular-nums text-[#172A22]">
              {formatKES(product.price)}
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Inquire on WhatsApp about this item"
              className="text-xs font-medium text-[#2E7D32] hover:text-[#1B5E20] flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ask Owner</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelect(product)}
              className="w-full text-xs font-medium text-[#304B3E] hover:text-[#172A22] bg-[#F2F6F3] hover:bg-[#E4ECE6] py-2 rounded-lg transition-colors cursor-pointer"
            >
              Ingredients & Use
            </button>

            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`w-full text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-[#EAEAEA] text-[#888888] cursor-not-allowed'
                  : isAdded
                  ? 'bg-[#2E7D32] text-white'
                  : 'bg-[#20392D] hover:bg-[#162A21] text-white shadow-2xs'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
