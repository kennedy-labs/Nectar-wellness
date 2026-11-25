import React from 'react';
import { ArrowDown, MessageCircle, MapPin } from 'lucide-react';
import { buildWhatsAppGeneralUrl } from '../../lib/whatsapp';

interface HeroSectionProps {
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  return (
    <section className="relative overflow-hidden pt-5 pb-9 sm:pt-10 sm:pb-14 lg:pt-14 lg:pb-20 border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Column: Editorial Brand & Core Philosophy */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="text-xs font-medium tracking-wide text-[#3A624F]">
              Artisanal Apothecary &amp; Herbals · Nairobi CBD &amp; Countrywide
            </div>

            <h1 className="font-display text-[1.75rem] sm:text-4xl lg:text-5xl text-[#172A22] leading-[1.16] tracking-tight text-balance">
              Pure botanical remedies crafted to support daily vitality and calm.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#4E564F] leading-relaxed max-w-2xl">
              Authentic Himalayan Shilajit resin, Kilifi organic moringa, adaptogenic ashwagandha,
              and native Kenyan forest teas. Prepared with strict botanical integrity, zero artificial additives,
              and direct operational care.
            </p>

            {/* Operational transparency callout */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F3F6F4] border border-[#DEE7E1] text-xs text-[#304B3E] space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-semibold text-[#1F372C]">
                <MapPin className="w-4 h-4 text-[#3A624F] shrink-0" />
                <span>Real-World Delivery &amp; Verification Workflow</span>
              </div>
              <p>
                To provide you the lowest actual transport cost, delivery rates are confirmed dynamically via WhatsApp based on your exact location in Nairobi (Bolt / Rider) or countrywide stage (Matatu parcel / Courier). Free pickup available at our Odeon, Nairobi CBD shop.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              <button
                onClick={onExploreClick}
                className="bg-[#20392D] hover:bg-[#162920] text-[#FAFAF7] px-5 min-h-[46px] rounded-lg text-sm font-medium transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Browse Remedies</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <a
                href={buildWhatsAppGeneralUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent hover:bg-[#EAEFEA] text-[#20392D] border border-[#CAD9CF] px-5 min-h-[46px] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 text-[#2E7D32]" />
                <span>Consult on WhatsApp</span>
              </a>
            </div>

            {/* Unboxed proof markers */}
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 sm:gap-x-4 text-xs text-[#5C665E] pt-1">
              <span>Third-Party Lab Screened</span>
              <span aria-hidden="true">·</span>
              <span>Unadulterated Raw Botanicals</span>
              <span aria-hidden="true">·</span>
              <span>M-Pesa Verified</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Anchor */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-[#E0DED7] bg-[#EAE6DF] aspect-16/10 sm:aspect-4/3">
              <img
                src="/src/assets/images/hero_wellness_botanicals_1790820582973.jpg"
                alt="Nature's Nectar herbal apothecary ingredients and amber glass tinctures"
                width={1200}
                height={670}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
              <div className="absolute bottom-3.5 left-4 right-4 text-white text-xs">
                <p className="font-display font-medium text-sm text-[#F7FAF8]">
                  Hand-Curated Botanical Formulations
                </p>
                <p className="text-[#D8E4DC] text-xs mt-0.5">
                  Odeon, Nairobi CBD, Kenya
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
