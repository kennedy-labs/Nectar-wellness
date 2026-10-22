import React, { useState } from 'react';
import { X, MessageCircle, ShieldCheck, MapPin, Truck, Store, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { formatKES } from '../../../lib/utils';
import { CartItem, DeliveryMethod, Order, PaymentMethod } from '../../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSubmitOrder: (formData: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    deliveryMethod?: DeliveryMethod;
    deliveryLocation?: string;
    orderNotes?: string;
    paymentMethod?: PaymentMethod;
  }) => Promise<Order | null>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onSubmitOrder,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('NAIROBI_LOCAL');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MPESA_BUY_GOODS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      setIsSubmitting(true);
      const order = await onSubmitOrder({
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryMethod,
        deliveryLocation:
          deliveryMethod === 'PICKUP'
            ? 'Bazaar Plaza 3rd Floor, Moi Ave, Nairobi CBD'
            : deliveryLocation.trim() || undefined,
        orderNotes: orderNotes.trim() || undefined,
        paymentMethod,
      });

      if (!order) {
        setErrorMessage('Failed to create order. Please try again or message us on WhatsApp.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#E6E4DD] overflow-hidden my-4 sm:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE8E1] flex items-center justify-between bg-[#FAFAF8]">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#245C38] uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Trade · No Sign-Up Needed</span>
            </div>
            <h2 className="font-display font-medium text-lg sm:text-xl text-[#172A22]">
              Order Confirmation
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="w-8 h-8 rounded-full text-[#5B665E] hover:text-[#172A22] hover:bg-[#EFECE5] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Delivery & Fulfillment Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-[#1F372C] uppercase tracking-wide">
              1. Delivery Method
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all text-center min-h-[72px] ${
                  deliveryMethod === 'NAIROBI_LOCAL'
                    ? 'border-[#2D4C3D] bg-[#F1F6F3] text-[#1E3B2F] ring-1 ring-[#2D4C3D]'
                    : 'border-[#E2DFD8] bg-[#FAFAF8] text-[#556257] hover:border-[#CCD5CE]'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <Truck className="w-4 h-4 text-[#2D4C3D]" />
                </div>
                <div className="font-semibold text-xs text-[#1F372C]">Nairobi Rider</div>
                <div className="text-[10px] text-[#5D6B61]">Bolt / Boda</div>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="NAIROBI_LOCAL"
                  checked={deliveryMethod === 'NAIROBI_LOCAL'}
                  onChange={() => setDeliveryMethod('NAIROBI_LOCAL')}
                  className="hidden"
                />
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all text-center min-h-[72px] ${
                  deliveryMethod === 'PICKUP'
                    ? 'border-[#2D4C3D] bg-[#F1F6F3] text-[#1E3B2F] ring-1 ring-[#2D4C3D]'
                    : 'border-[#E2DFD8] bg-[#FAFAF8] text-[#556257] hover:border-[#CCD5CE]'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <Store className="w-4 h-4 text-[#2D4C3D]" />
                </div>
                <div className="font-semibold text-xs text-[#1F372C]">Shop Pickup</div>
                <div className="text-[10px] text-[#5D6B61]">CBD (Free)</div>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="PICKUP"
                  checked={deliveryMethod === 'PICKUP'}
                  onChange={() => setDeliveryMethod('PICKUP')}
                  className="hidden"
                />
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all text-center min-h-[72px] ${
                  deliveryMethod === 'COUNTRYWIDE'
                    ? 'border-[#2D4C3D] bg-[#F1F6F3] text-[#1E3B2F] ring-1 ring-[#2D4C3D]'
                    : 'border-[#E2DFD8] bg-[#FAFAF8] text-[#556257] hover:border-[#CCD5CE]'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <MapPin className="w-4 h-4 text-[#2D4C3D]" />
                </div>
                <div className="font-semibold text-xs text-[#1F372C]">Countrywide</div>
                <div className="text-[10px] text-[#5D6B61]">Courier Parcel</div>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="COUNTRYWIDE"
                  checked={deliveryMethod === 'COUNTRYWIDE'}
                  onChange={() => setDeliveryMethod('COUNTRYWIDE')}
                  className="hidden"
                />
              </label>
            </div>

            {deliveryMethod !== 'PICKUP' ? (
              <div className="space-y-1 pt-1">
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder={
                    deliveryMethod === 'NAIROBI_LOCAL'
                      ? 'Estate, building, or road (or share Pin on WhatsApp)'
                      : 'Destination town & preferred courier / matatu stage'
                  }
                  className="w-full text-xs p-3 rounded-xl border border-[#D5D3CA] bg-white focus:border-[#2D4C3D] outline-none text-[#242A24]"
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#F3F6F4] text-xs text-[#2A4739] border border-[#DEE7E2]">
                📍 <strong>Shop Pickup:</strong> {BUSINESS_CONFIG.location}. Mon–Sat, 8:30 AM to 6:30 PM.
              </div>
            )}
          </div>

          {/* 2. Optional Contact Details (No Credentials Required) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1F372C] uppercase tracking-wide">
                2. Contact Info <span className="text-[11px] font-normal text-[#64746A] lowercase">(optional)</span>
              </label>
              <span className="text-[11px] text-[#245C38]">
                WhatsApp connects us automatically
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your Name (Optional)"
                className="w-full text-xs p-3 rounded-xl border border-[#D5D3CA] bg-white focus:border-[#2D4C3D] outline-none text-[#242A24]"
              />

              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone Number (Optional)"
                className="w-full text-xs p-3 rounded-xl border border-[#D5D3CA] bg-white focus:border-[#2D4C3D] outline-none text-[#242A24]"
              />
            </div>
          </div>

          {/* 3. Optional Notes */}
          <div className="space-y-1">
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Notes / instructions / questions (Optional)"
              className="w-full text-xs p-3 rounded-xl border border-[#D5D3CA] bg-white focus:border-[#2D4C3D] outline-none text-[#242A24]"
            />
          </div>

          {/* 4. Order Summary & Single-Tap Action */}
          <div className="pt-2 border-t border-[#EAE8E1] space-y-3">
            <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#E8ECE9] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4D5A50]">
                <span>Items Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span className="font-bold font-mono text-[#172A22]">
                  {formatKES(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#5D6B62] text-[11px]">
                <span>Delivery Transport:</span>
                <span className="font-medium text-[#245C38]">
                  {deliveryMethod === 'PICKUP'
                    ? 'Free (Shop Pickup)'
                    : 'Awaiting confirmation'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7D9185] text-white py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer touch-manipulation active:scale-98"
            >
              {isSubmitting ? (
                <span>Generating Order...</span>
              ) : (
                <>
                  <span>Submit Order & Continue on WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-[#64746A]">
              🔒 Instant order generation · Verified M-Pesa Buy Goods Till #{BUSINESS_CONFIG.mpesaTill}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
