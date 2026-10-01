import React from 'react';
import { ShoppingBag, Search, ShieldCheck } from 'lucide-react';
import { formatKES } from '../../lib/utils';

interface TopBarProps {
  cartCount: number;
  cartSubtotal: number;
  onOpenCart: () => void;
  onOpenTrack: () => void;
  onOpenAdmin: () => void;
  onScrollToProducts: () => void;
  onScrollToDelivery: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  cartCount,
  cartSubtotal,
  onOpenCart,
  onOpenTrack,
  onOpenAdmin,
  onScrollToProducts,
  onScrollToDelivery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-b border-[#E8E6DF] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark in display face */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-xl sm:text-2xl text-[#1E3B2F] tracking-tight hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Nature’s Nectar
        </a>

        {/* Zone 2: 4 clean text links with subtle hover states */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4E564F]">
          <button
            onClick={onScrollToProducts}
            className="hover:text-[#1E3B2F] transition-colors cursor-pointer"
          >
            Apothecary Collection
          </button>
          <button
            onClick={onScrollToDelivery}
            className="hover:text-[#1E3B2F] transition-colors cursor-pointer"
          >
            Delivery & M-Pesa Flow
          </button>
          <button
            onClick={onOpenTrack}
            className="hover:text-[#1E3B2F] transition-colors cursor-pointer"
          >
            Track Order
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenTrack}
            className="md:hidden text-xs font-medium text-[#4E564F] hover:text-[#1E3B2F] px-2.5 py-1.5 rounded-lg border border-[#E0DED7] transition-colors"
          >
            Track
          </button>

          <button
            onClick={onOpenAdmin}
            title="Owner Portal"
            className="text-xs font-medium text-[#647067] hover:text-[#1E3B2F] px-2.5 py-1.5 rounded-lg border border-[#E0DED7] hover:border-[#1E3B2F]/30 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#3A624F]" />
            <span className="hidden sm:inline">Owner</span>
          </button>

          <button
            onClick={onOpenCart}
            aria-label="View shopping bag"
            className="relative flex items-center gap-2 bg-[#233C30] hover:bg-[#192C23] text-[#F4F7F4] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Bag</span>
            {cartCount > 0 ? (
              <span className="bg-[#E4ECE6] text-[#20392D] text-xs font-semibold px-1.5 py-0.2 rounded-md tabular-nums">
                {cartCount}
              </span>
            ) : null}
            {cartCount > 0 && (
              <span className="hidden lg:inline text-xs opacity-90 border-l border-[#405A4D] pl-2 tabular-nums">
                {formatKES(cartSubtotal)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
