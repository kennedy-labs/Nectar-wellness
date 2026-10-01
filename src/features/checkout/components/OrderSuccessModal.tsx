import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, Clock, Eye, X } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { formatKES } from '../../../lib/utils';
import { buildWhatsAppOrderUrl } from '../../../lib/whatsapp';
import { Order } from '../../../types';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onTrackOrder,
}) => {
  const [copiedTill, setCopiedTill] = useState(false);

  if (!order) return null;

  const whatsappUrl = buildWhatsAppOrderUrl(order);

  const handleCopyTill = () => {
    navigator.clipboard.writeText(BUSINESS_CONFIG.mpesaTill);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

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
            Thank you, {order.customerName}. Your order request has been logged. Now connect with our apothecary team on WhatsApp to finalize delivery details.
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
                Click below to send your order summary to our WhatsApp. We will confirm your delivery cost immediately and dispatch your herbal package.
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
        </div>

        {/* Payment Details Box */}
        <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E6DF] text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#1F372C]">M-Pesa Buy Goods Till</span>
            <button
              onClick={handleCopyTill}
              className="text-[#2D4C3D] hover:text-[#183023] flex items-center gap-1 font-medium cursor-pointer"
            >
              {copiedTill ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Till</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-[#E0DED7]">
            <span className="text-[#5B665E]">Till Number:</span>
            <span className="font-mono font-bold text-sm text-[#1B3527]">
              {BUSINESS_CONFIG.mpesaTill}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#637066]">
            <span>Store Name:</span>
            <span className="font-semibold text-[#20392D]">{BUSINESS_CONFIG.mpesaStoreName}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#637066] border-t border-[#EAE8E1] pt-2">
            <span>Products Subtotal:</span>
            <span className="font-mono font-semibold text-[#172A22] tabular-nums">
              {formatKES(order.subtotal)}
            </span>
          </div>
        </div>

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
