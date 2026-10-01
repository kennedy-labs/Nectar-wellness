import React from 'react';
import { ShieldAlert, MapPin, Phone, Clock, MessageCircle } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/constants';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenTrack: () => void;
  onScrollToProducts: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenTrack,
  onScrollToProducts,
}) => {
  return (
    <footer className="bg-[#1F372C] text-[#DCE7DF] pt-14 pb-12 border-t border-[#172B22]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main 4-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="md:col-span-4 space-y-3.5">
            <span className="font-display text-2xl text-[#F4F8F5] tracking-tight block">
              Nature’s Nectar Wellness
            </span>
            <p className="text-xs text-[#AFC1B4] leading-relaxed">
              Herbal apothecary delivering unadulterated botanical remedies, adaptogenic tinctures,
              pure Himalayan shilajit, and Kenyan forest superfoods.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${BUSINESS_CONFIG.whatsappPhoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#2D4E3F] hover:bg-[#3B6552] text-[#F3F7F4] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#85E39C]" />
                <span>WhatsApp Herbal Support</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-[#F4F8F5] tracking-wide uppercase">
              Apothecary
            </h4>
            <ul className="space-y-2 text-xs text-[#AFC1B4]">
              <li>
                <button
                  onClick={onScrollToProducts}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTrack}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Track Recent Order
                </button>
              </li>
              <li>
                <a
                  href="#delivery-flow"
                  className="hover:text-white transition-colors"
                >
                  Delivery & Logistics
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Owner Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Apothecary Location & Hours */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold text-[#F4F8F5] tracking-wide uppercase">
              Shop & Physical Pickup
            </h4>
            <div className="space-y-2 text-xs text-[#AFC1B4] leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#85E39C] mt-0.5 shrink-0" />
                <span>{BUSINESS_CONFIG.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#85E39C] shrink-0" />
                <span>{BUSINESS_CONFIG.hours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#85E39C] shrink-0" />
                <span>{BUSINESS_CONFIG.phoneDisplay}</span>
              </div>
            </div>
          </div>

          {/* Payment & Operational Details */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold text-[#F4F8F5] tracking-wide uppercase">
              Payment Verification
            </h4>
            <div className="p-3.5 rounded-lg bg-[#274436] border border-[#355B49] text-xs space-y-1.5 text-[#CFDDD3]">
              <div className="font-semibold text-white">M-Pesa Buy Goods Till</div>
              <div>Till Number: <span className="font-mono font-bold text-[#85E39C]">{BUSINESS_CONFIG.mpesaTill}</span></div>
              <div className="text-[11px] text-[#A6BCAD]">Store Name: {BUSINESS_CONFIG.mpesaStoreName}</div>
              <div className="text-[11px] text-[#A6BCAD] pt-1 border-t border-[#355B49]">
                Manual verification via WhatsApp or order note confirmation.
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Health Disclaimer (CRITICAL BUSINESS REQUIREMENT) */}
        <div className="p-4 rounded-xl bg-[#192C23] border border-[#2B4B3B] text-[11px] sm:text-xs text-[#9BB2A1] leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#D1E2D6] font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
            <span>Health & Regulatory Disclaimer</span>
          </div>
          <p>
            The herbal extracts, teas, powders, and nutritional products offered by Nature’s Nectar Wellness are intended strictly to support general physical vitality, balanced energy, and traditional wellness lifestyles. Statements made on this platform have not been evaluated by the Pharmacy and Poisons Board of Kenya. Our products are not intended to diagnose, treat, cure, or prevent any medical disease. If you are pregnant, nursing, taking prescription medications, or under medical supervision, please consult a certified healthcare professional before beginning any new herbal regimen.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Unboxed Links */}
        <div className="pt-6 border-t border-[#294838] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8BA491]">
          <div>
            © {new Date().getFullYear()} {BUSINESS_CONFIG.name}. All rights reserved. Nairobi, Kenya.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className="text-[#9BB2A1] hover:text-white transition-colors cursor-pointer"
            >
              Authorized Admin Access
            </button>
            <span aria-hidden="true">·</span>
            <span>Handcrafted Natural Health</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
