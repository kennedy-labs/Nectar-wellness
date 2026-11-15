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
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[60] flex flex-col items-end gap-1.5"
    >
      {selectedProduct && (
        <span className="bg-[#172A22]/95 text-[#E8F2EC] text-[11px] font-medium px-2.5 py-1 rounded-md shadow-sm border border-[#2D4C3D] max-w-[230px] truncate pointer-events-none">
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
        className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20BA5A] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 group focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
        <span className="font-semibold text-xs sm:text-sm tracking-tight pr-1">
          {selectedProduct ? 'Ask About This Product' : 'Chat on WhatsApp'}
        </span>
      </a>
    </aside>
  );
};
