import React from 'react';
import { MessageCircle, Truck, Sparkles, ShieldCheck } from 'lucide-react';

export const TrustFeatures: React.FC = () => {
  return (
    <section className="py-10 border-b border-[#E8E6DF] bg-[#F7F9F7]" id="delivery-flow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="font-display text-xl sm:text-2xl text-[#1E3B2F] tracking-tight">
            How Nature’s Nectar Operates
          </h2>
          <p className="text-xs sm:text-sm text-[#546056] mt-1.5">
            Designed around transparent Kenya logistics and authentic human communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl bg-white border border-[#E6E8E3] shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF1ED] text-[#2C4C3D] flex items-center justify-center">
              <span className="font-display font-bold text-sm">1</span>
            </div>
            <h3 className="font-semibold text-sm text-[#1A2E24]">Discover & Add to Bag</h3>
            <p className="text-xs text-[#525E55] leading-relaxed">
              Browse our small-batch herbal tinctures, pure shilajit, and wild powders with full ingredient transparency.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#E6E8E3] shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF1ED] text-[#2C4C3D] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#2E7D32]" />
            </div>
            <h3 className="font-semibold text-sm text-[#1A2E24]">Dynamic WhatsApp Flow</h3>
            <p className="text-xs text-[#525E55] leading-relaxed">
              Submit your order request and continue on WhatsApp. We inspect your destination to give you the cheapest real delivery rate.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#E6E8E3] shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF1ED] text-[#2C4C3D] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#2C4C3D]" />
            </div>
            <h3 className="font-semibold text-sm text-[#1A2E24]">M-Pesa Buy Goods Till</h3>
            <p className="text-xs text-[#525E55] leading-relaxed">
              Pay securely via verified M-Pesa Buy Goods (Till 9823412). Our owner verifies your payment and starts preparation immediately.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#E6E8E3] shadow-2xs space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF1ED] text-[#2C4C3D] flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#2C4C3D]" />
            </div>
            <h3 className="font-semibold text-sm text-[#1A2E24]">Dispatch & Pickup</h3>
            <p className="text-xs text-[#525E55] leading-relaxed">
              Dispatched swiftly via Bolt rider (Nairobi) or trusted Matatu parcel stages countrywide, or pick up free at Bazaar Plaza CBD.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
