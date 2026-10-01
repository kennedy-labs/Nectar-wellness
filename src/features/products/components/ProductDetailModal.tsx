import React, { useState } from 'react';
import { X, MessageCircle, ShoppingBag, Check, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { formatKES } from '../../../lib/utils';
import { buildWhatsAppProductInquiryUrl } from '../../../lib/whatsapp';
import { Product } from '../../../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const whatsappUrl = buildWhatsAppProductInquiryUrl(product);

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-[#E6E4DD] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#4A554D] hover:text-[#172A22] border border-[#E0DED7] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
          {/* Image Column */}
          <div className="bg-[#F6F5F0] relative aspect-4/3 md:aspect-auto md:min-h-[380px]">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white/95 text-[#242A24] font-semibold text-xs px-3 py-1 rounded-sm shadow-xs">
                  Currently Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#5D6B61] mb-1">
                  <span>{product.categoryName}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {isOutOfStock
                      ? 'Out of Stock'
                      : isLowStock
                      ? `Only ${product.stockQuantity} remaining`
                      : 'In Stock at Bazaar Plaza'}
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl text-[#172A22] leading-snug">
                  {product.name}
                </h2>
              </div>

              {/* Price */}
              <div className="text-xl font-bold font-mono tabular-nums text-[#1F372C]">
                {formatKES(product.price)}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#4E564F] leading-relaxed">
                {product.description}
              </p>

              {/* Traditional Wellness Benefits */}
              {product.benefits && product.benefits.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#F0EFEB]">
                  <h4 className="text-xs font-semibold text-[#1A2E24] uppercase tracking-wide">
                    Traditional Wellness Support
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#4F5951]">
                    {product.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3A624F] mt-1.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ingredients */}
              {product.ingredients && product.ingredients.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#F0EFEB]">
                  <h4 className="text-xs font-semibold text-[#1A2E24] uppercase tracking-wide">
                    Botanical Ingredients
                  </h4>
                  <p className="text-xs text-[#4F5951]">
                    {product.ingredients.join(', ')}
                  </p>
                </div>
              )}

              {/* Usage Instructions */}
              {product.usageInstructions && (
                <div className="space-y-1.5 pt-2 border-t border-[#F0EFEB]">
                  <h4 className="text-xs font-semibold text-[#1A2E24] uppercase tracking-wide">
                    Suggested Daily Usage
                  </h4>
                  <p className="text-xs text-[#4F5951] leading-relaxed bg-[#F8FAF8] p-3 rounded-lg border border-[#E6EDE8]">
                    {product.usageInstructions}
                  </p>
                </div>
              )}
            </div>

            {/* Purchase & Inquiry Actions */}
            <div className="pt-4 border-t border-[#E8E6DF] space-y-3">
              <div className="flex items-center gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-[#DCDAD2] rounded-lg overflow-hidden bg-[#FAFAF8]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    aria-label="Decrease quantity"
                    className="px-3 py-2 text-sm text-[#38433C] hover:bg-[#EAE8E0] transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-semibold font-mono tabular-nums text-[#172A22] min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.stockQuantity || 10, q + 1)
                      )
                    }
                    disabled={isOutOfStock || quantity >= product.stockQuantity}
                    aria-label="Increase quantity"
                    className="px-3 py-2 text-sm text-[#38433C] hover:bg-[#EAE8E0] transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add to Bag Button */}
                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'bg-[#EAEAEA] text-[#888888] cursor-not-allowed'
                      : justAdded
                      ? 'bg-[#2E7D32] text-white'
                      : 'bg-[#20392D] hover:bg-[#162920] text-white shadow-2xs'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag ({formatKES(product.price * quantity)})</span>
                    </>
                  )}
                </button>
              </div>

              {/* WhatsApp direct consultation */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-lg text-xs font-medium text-[#1E3B2F] bg-[#EAF2ED] hover:bg-[#DDE9E1] border border-[#C5D9CC] flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#2E7D32]" />
                <span>Ask Herbalist About This Product on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
