import React from 'react';
import { CheckCircle2, MessageCircle, Eye, X } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { buildWhatsAppOrderUrl } from '../../../lib/whatsapp';
import { Order } from '../../../types';
import { MpesaPayBox } from './MpesaPayBox';

interface OrderSuccessModalProps {
  order: Order | null;
  mpesaTill?: string;
  mpesaStoreName?: string;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
  onOrderUpdated?: (order: Order) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  mpesaTill,
  mpesaStoreName,
  onClose,
  onTrackOrder,
  onOrderUpdated,
}) => {
  if (!order) return null;

  const whatsappUrl = buildWhatsAppOrderUrl(order);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E6E4DD] p-6 sm:p-8 space-y-6 text-center my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full text-[#5B665E] hover:text-[#172A22] hover:bg-[#F2F1EC] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-full bg-[#EAF5EE] text-[#2E7D32] mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-[#3A624F] uppercase tracking-wide">
            Order Submitted Successfully
          </span>
          <h2 className="font-display text-2xl text-[#172A22]">
            Order #{order.id}
          </h2>
          <p className="text-xs sm:text-sm text-[#525E55] max-w-sm mx-auto leading-relaxed">
            {order.deliveryMethod === 'PICKUP'
              ? `Thank you, ${order.customerName}. Your order is logged for free pickup at ${BUSINESS_CONFIG.location}. Complete M-Pesa payment below and message us on WhatsApp when ready to collect.`
              : `Thank you, ${order.customerName}. Your order request has been logged. Now connect with our apothecary team on WhatsApp to confirm your delivery fee and dispatch.`}
          </p>
        </div>

        {/* WhatsApp Continuation CTA (CORE WORKFLOW) */}
        <div className="p-4 rounded-xl bg-[#F0F7F2] border border-[#CFE4D6] text-left space-y-3">
          <div className="flex items-start gap-2.5">
            <MessageCircle className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#1B3627]">
                Finalize on WhatsApp
              </h4>
              <p className="text-[11px] text-[#455A4C] leading-snug mt-0.5">
                {order.deliveryMethod === 'PICKUP'
                  ? 'Send your order summary on WhatsApp to coordinate pickup at Odeon, Nairobi CBD.'
                  : 'Click below to send your order summary to our WhatsApp. We will confirm your delivery cost immediately and dispatch your herbal package.'}
              </p>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
            <span>Continue Order on WhatsApp Now</span>
          </a>

          <div className="pt-1 border-t border-[#D7E8DD] text-[11px] text-[#455A4C] flex flex-wrap items-center justify-between gap-2">
            <span>No WhatsApp on this phone?</span>
            <span className="font-semibold text-[#1B3627]">
              Call / SMS{' '}
              <a href={`tel:${BUSINESS_CONFIG.adminDefaultPhone}`} className="underline hover:text-[#245C38]">
                {BUSINESS_CONFIG.phoneDisplay}
              </a>{' '}
              with #{order.id}
            </span>
          </div>
        </div>

        {/* Direct M-Pesa STK Push + Buy Goods Till Box */}
        <MpesaPayBox
          order={order}
          mpesaTill={mpesaTill}
          mpesaStoreName={mpesaStoreName}
          onOrderUpdated={onOrderUpdated}
        />

        {/* Action to track */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onTrackOrder(order.id)}
            className="text-xs font-medium text-[#2D4C3D] hover:text-[#1B3627] flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-[#F2F5F3] transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Track Order Status</span>
          </button>
        </div>
      </div>
    </div>
  );
};
