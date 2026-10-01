import React from 'react';
import { MessageCircle } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/constants';

export const WhatsAppFloatingButton: React.FC = () => {
  const whatsappUrl = `https://wa.me/${BUSINESS_CONFIG.whatsappPhoneDigits}?text=${encodeURIComponent(
    "Habari Nature's Nectar Wellness! 🌿 I am visiting your website and have a question regarding your herbal remedies."
  )}`;

  return (
    <aside aria-label="WhatsApp quick consultation" className="fixed bottom-5 right-5 z-40">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Direct WhatsApp Consultation with Nature's Nectar owner"
        className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20BA5A] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 group focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
        <span className="font-semibold text-xs sm:text-sm tracking-tight pr-1">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
};
