import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { formatKES } from '../../lib/utils';

interface TopBarProps {
  cartCount: number;
  cartSubtotal: number;
  onOpenCart: () => void;
  onOpenTrack: () => void;
  onScrollToProducts: () => void;
  onScrollToDelivery: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  cartCount,
  cartSubtotal,
  onOpenCart,
  onOpenTrack,
  onScrollToProducts,
  onScrollToDelivery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-b border-[#E8E6DF] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-8">
        {/* Zone 1: Brand emblem and wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 font-display text-lg sm:text-2xl text-[#1E3B2F] tracking-tight hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <img
            src="/favicon.svg"
            alt="Nature's Nectar Wellness"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-2xs shrink-0"
          />
          <span>Nature’s Nectar</span>
        </a>

        {/* Zone 2: Clean single-line text links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4E564F]">
          <button
            onClick={onScrollToProducts}
            className="hover:text-[#1E3B2F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Apothecary Collection
          </button>
          <button
            onClick={onScrollToDelivery}
            className="hover:text-[#1E3B2F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Delivery & M-Pesa Flow
          </button>
          <button
            onClick={onOpenTrack}
            className="hover:text-[#1E3B2F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Track Order
          </button>
        </nav>

        {/* Zone 3: Mobile Track shortcut + Primary Bag action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenTrack}
            className="md:hidden text-xs font-medium text-[#3D4B41] hover:text-[#1E3B2F] px-2.5 min-h-[40px] rounded-lg border border-[#E0DED7] bg-white/70 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Track
          </button>

          <button
            onClick={onOpenCart}
            aria-label="View shopping bag"
            className="relative flex items-center gap-1.5 sm:gap-2 bg-[#233C30] hover:bg-[#192C23] text-[#F4F7F4] px-3 sm:px-3.5 min-h-[40px] rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Bag</span>
            {cartCount > 0 ? (
              <span className="bg-[#E4ECE6] text-[#20392D] text-xs font-semibold px-1.5 py-0.5 rounded-md tabular-nums">
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
