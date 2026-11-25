import React from 'react';
import { MessageCircle } from 'lucide-react';
import { buildWhatsAppGeneralUrl, buildWhatsAppProductInquiryUrl } from '../../lib/whatsapp';
import { Product } from '../../types';

interface WhatsAppFloatingButtonProps {
  selectedProduct?: Product | null;
  hidden?: boolean;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  selectedProduct = null,
  hidden = false,
}) => {
  if (hidden) return null;

  const whatsappUrl = selectedProduct
    ? buildWhatsAppProductInquiryUrl(selectedProduct)
    : buildWhatsAppGeneralUrl();

  const shortProductName = selectedProduct
    ? selectedProduct.name.split('(')[0].trim()
    : '';

  return (
    <aside
      aria-label="WhatsApp quick consultation"
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[60] flex flex-col items-end gap-1.5 max-w-[calc(100vw-2rem)] pb-[env(safe-area-inset-bottom)]"
    >
      {selectedProduct && (
        <span className="bg-[#172A22]/95 text-[#E8F2EC] text-[11px] font-medium px-2.5 py-1 rounded-md shadow-sm border border-[#2D4C3D] max-w-[210px] sm:max-w-[240px] truncate pointer-events-none">
          Selected: {shortProductName}
        </span>
      )}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={
          selectedProduct
            ? `Chat on WhatsApp about ${selectedProduct.name}`
            : "Chat on WhatsApp with Nature's Nectar Wellness"
        }
        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white px-3.5 sm:px-4 min-h-[44px] rounded-full shadow-lg hover:shadow-xl transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 whitespace-nowrap"
      >
        <MessageCircle className="w-5 h-5 fill-white text-[#25D366] shrink-0" />
        <span className="font-semibold text-xs sm:text-sm tracking-tight">
          {selectedProduct ? (
            <>
              <span className="sm:hidden">Ask on WhatsApp</span>
              <span className="hidden sm:inline">Ask About This Product</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">WhatsApp</span>
              <span className="hidden sm:inline">Chat on WhatsApp</span>
            </>
          )}
        </span>
      </a>
    </aside>
  );
};
