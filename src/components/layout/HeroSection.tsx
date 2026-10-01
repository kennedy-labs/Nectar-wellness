import React from 'react';
import { ArrowDown, MessageCircle, Sparkles, MapPin } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../config/constants';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-14 md:pt-14 md:pb-20 border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Editorial Brand & Core Philosophy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#3A624F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3A624F]" />
              <span>Artisanal Apothecary & Herbals · Nairobi CBD & Countrywide</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-[#172A22] leading-[1.15] tracking-tight text-balance">
              Pure botanical remedies crafted to support daily vitality and calm.
            </h1>

            <p className="text-base sm:text-lg text-[#4E564F] leading-relaxed max-w-2xl">
              Authentic Himalayan Shilajit resin, Kilifi organic moringa, adaptogenic ashwagandha,
              and native Kenyan forest teas. Prepared with strict botanical integrity, zero artificial additives,
              and direct operational care.
            </p>

            {/* Operational transparency callout */}
            <div className="p-4 rounded-xl bg-[#F3F6F4] border border-[#DEE7E1] text-xs text-[#304B3E] space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-semibold text-[#1F372C]">
                <MapPin className="w-4 h-4 text-[#3A624F] shrink-0" />
                <span>Real-World Delivery & Verification Workflow</span>
              </div>
              <p>
                To provide you the lowest actual transport cost, delivery rates are confirmed dynamically via WhatsApp based on your exact location in Nairobi (Bolt / Rider) or countrywide stage (Matatu parcel / Courier). Free pickup available at our Bazaar Plaza shop.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onExploreClick}
                className="bg-[#20392D] hover:bg-[#162920] text-[#FAFAF7] px-5 py-3 rounded-lg text-sm font-medium transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Browse Remedies</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/${BUSINESS_CONFIG.whatsappPhoneDigits}?text=${encodeURIComponent(
                  "Habari Nature's Nectar Wellness! 🌿 I would like to consult on the best herbal remedy for my wellness routine."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent hover:bg-[#EAEFEA] text-[#20392D] border border-[#CAD9CF] px-5 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#2E7D32]" />
                <span>Consult on WhatsApp</span>
              </a>
            </div>

            {/* Unboxed proof markers */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#5C665E] pt-2">
              <span>Third-Party Lab Screened</span>
              <span aria-hidden="true">·</span>
              <span>Unadulterated Raw Botanicals</span>
              <span aria-hidden="true">·</span>
              <span>M-Pesa Buy Goods Verified</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Anchor */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-[#E0DED7] bg-[#EAE6DF] aspect-4/3 lg:aspect-4/3">
              <img
                src="/src/assets/images/hero_wellness_botanicals_1790820582973.jpg"
                alt="Nature's Nectar herbal apothecary ingredients and amber glass tinctures"
                className="w-full h-full object-cover"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-xs">
                <p className="font-display font-medium text-sm text-[#F7FAF8]">
                  Hand-Curated Botanical Formulations
                </p>
                <p className="text-[#D8E4DC] text-xs mt-0.5">
                  Bazaar Plaza, Moi Avenue, Nairobi CBD
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
