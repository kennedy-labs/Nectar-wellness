import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';
import { formatKES } from '../../../lib/utils';
import { CartItem } from '../../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  onDirectWhatsApp: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onDirectWhatsApp,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E6E4DD] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#EAE8E1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#2D4C3D]" />
              <h2 className="font-display font-medium text-lg text-[#172A22]">
                Your Herbal Bag
              </h2>
              {totalCount > 0 && (
                <span className="text-xs text-[#5D6B61] tabular-nums">
                  ({totalCount} {totalCount === 1 ? 'item' : 'items'})
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close bag drawer"
              className="w-8 h-8 rounded-full text-[#5B665E] hover:text-[#172A22] hover:bg-[#F2F1EC] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F2F5F3] text-[#3A624F] mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-display text-base text-[#1E3B2F]">Your bag is empty</h3>
                <p className="text-xs text-[#637066] max-w-xs mx-auto">
                  Browse our natural teas, Himalayan Shilajit resin, and coastal organic moringa.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 text-xs font-medium bg-[#20392D] text-white px-4 py-2 rounded-lg hover:bg-[#162A21] transition-colors cursor-pointer"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 rounded-xl border border-[#ECEAE3] bg-[#FCFBF9] flex gap-3 items-center"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover bg-[#F0EFEB] shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[#1B2922] truncate">
                      {item.product.name}
                    </h4>
                    <div className="text-xs font-mono font-medium text-[#2C4C3D] tabular-nums mt-0.5">
                      {formatKES(item.product.price)}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#DAD8CF] rounded-md bg-white">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="px-2 py-0.5 text-xs text-[#4B564E] hover:bg-[#EAE8E1] transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 text-xs font-mono font-medium min-w-5 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="px-2 py-0.5 text-xs text-[#4B564E] hover:bg-[#EAE8E1] transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        title="Remove item"
                        className="text-[#88948B] hover:text-[#C53030] p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#EAE8E1] bg-[#FAFAF7] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#4D5A50]">
                  <span>Products Subtotal</span>
                  <span className="font-semibold font-mono tabular-nums text-[#172A22]">
                    {formatKES(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#68756B] text-[11px]">
                  <span>Delivery Estimate</span>
                  <span>Calculated at checkout / WhatsApp</span>
                </div>
              </div>

              {/* Informative logistics note */}
              <div className="p-2.5 rounded-lg bg-[#EBF2EE] border border-[#D5E4DB] text-[11px] text-[#2F4E3E] leading-tight">
                💡 <strong>Dynamic Delivery:</strong> Free shop pickup in Nairobi CBD. Local Bolt rider or Countrywide matatu parcel fees confirmed manually to give you the lowest fee.
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={onProceedToCheckout}
                  className="w-full bg-[#20392D] hover:bg-[#162920] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <span>Submit Order for Confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onDirectWhatsApp}
                  className="w-full bg-white hover:bg-[#F2F6F3] text-[#1E3B2F] border border-[#CCD8CF] py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#2E7D32]" />
                  <span>Send Cart Directly to WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
