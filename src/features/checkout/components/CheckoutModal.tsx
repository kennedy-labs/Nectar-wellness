import React, { useState } from 'react';
import { X, MessageCircle, ShieldCheck, MapPin, Truck, Store, ArrowRight, AlertCircle } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { formatKES } from '../../../lib/utils';
import { CartItem, DeliveryMethod, Order, PaymentMethod } from '../../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSubmitOrder: (formData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryMethod: DeliveryMethod;
    deliveryLocation: string;
    orderNotes?: string;
    paymentMethod: PaymentMethod;
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
  const [customerEmail, setCustomerEmail] = useState('');
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

    if (!customerName.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      setErrorMessage('Please provide a valid Kenya phone number (e.g. 0712 345 678).');
      return;
    }
    if (deliveryMethod !== 'PICKUP' && !deliveryLocation.trim()) {
      setErrorMessage('Please enter your delivery address, estate, or destination town.');
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await onSubmitOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deliveryMethod,
        deliveryLocation:
          deliveryMethod === 'PICKUP'
            ? 'Bazaar Plaza 3rd Floor, Moi Ave, Nairobi CBD'
            : deliveryLocation.trim(),
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
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E6E4DD] overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE8E1] flex items-center justify-between bg-[#FAFAF8]">
          <div>
            <h2 className="font-display font-medium text-lg sm:text-xl text-[#172A22]">
              Submit Order Request
            </h2>
            <p className="text-xs text-[#5E6B62] mt-0.5">
              Review details & continue directly on WhatsApp for swift dispatch.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="w-8 h-8 rounded-full text-[#5B665E] hover:text-[#172A22] hover:bg-[#EFECE5] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#1F372C] uppercase tracking-wide">
              1. Your Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#3E4A41] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Wangari Maathai"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] outline-none text-[#242A24]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3E4A41] mb-1">
                  M-Pesa / WhatsApp Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] outline-none text-[#242A24]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#3E4A41] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com (for receipt copy)"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] outline-none text-[#242A24]"
                />
              </div>
            </div>
          </div>

          {/* Delivery Method Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#1F372C] uppercase tracking-wide">
              2. Delivery & Fulfillment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  deliveryMethod === 'PICKUP'
                    ? 'border-[#2D4C3D] bg-[#F1F6F3] text-[#1E3B2F]'
                    : 'border-[#E2DFD8] bg-[#FAFAF8] text-[#556257] hover:border-[#CCD5CE]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Store className="w-4 h-4 text-[#2D4C3D]" />
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="PICKUP"
                    checked={deliveryMethod === 'PICKUP'}
                    onChange={() => setDeliveryMethod('PICKUP')}
                    className="accent-[#2D4C3D]"
                  />
                </div>
                <div className="font-semibold text-xs text-[#1F372C]">Shop Pickup</div>
                <div className="text-[11px] text-[#5D6B61] mt-0.5">Bazaar Plaza, CBD (Free)</div>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  deliveryMethod === 'NAIROBI_LOCAL'
                    ? 'border-[#2D4C3D] bg-[#F1F6F3] text-[#1E3B2F]'
                    : 'border-[#E2DFD8] bg-[#FAFAF8] text-[#556257] hover:border-[#CCD5CE]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Truck className="w-4 h-4 text-[#2D4C3D]" />
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="NAIROBI_LOCAL"
                    checked={deliveryMethod === 'NAIROBI_LOCAL'}
                    onChange={() => setDeliveryMethod('NAIROBI_LOCAL')}
                    className="accent-[#2D4C3D]"
                  />
                </div>
                <div className="font-semibold text-xs text-[#1F372C]">Nairobi Local</div>
                <div className="text-[11px] text-[#5D6B61] mt-0.5">Bolt / Rider dispatch</div>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  deliveryMethod === 'COUNTRYWIDE'
                    ? 'border-[#2D4C3D] bg-[#F1F6F3] text-[#1E3B2F]'
                    : 'border-[#E2DFD8] bg-[#FAFAF8] text-[#556257] hover:border-[#CCD5CE]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <MapPin className="w-4 h-4 text-[#2D4C3D]" />
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="COUNTRYWIDE"
                    checked={deliveryMethod === 'COUNTRYWIDE'}
                    onChange={() => setDeliveryMethod('COUNTRYWIDE')}
                    className="accent-[#2D4C3D]"
                  />
                </div>
                <div className="font-semibold text-xs text-[#1F372C]">Countrywide</div>
                <div className="text-[11px] text-[#5D6B61] mt-0.5">Matatu / Courier parcel</div>
              </label>
            </div>

            {deliveryMethod !== 'PICKUP' ? (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#3E4A41]">
                  {deliveryMethod === 'NAIROBI_LOCAL'
                    ? 'Exact Delivery Location / Estate / Building *'
                    : 'Destination Town & Preferred Matatu Stage / Courier *'}
                </label>
                <input
                  type="text"
                  required
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder={
                    deliveryMethod === 'NAIROBI_LOCAL'
                      ? 'e.g. Kilimani, Wood Avenue, Parkview Apt 2C'
                      : 'e.g. Nakuru Town, 2NK Matatu stage OR Eldoret Easy Coach'
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] outline-none text-[#242A24]"
                />
                <p className="text-[11px] text-[#637166]">
                  Transport cost is calculated manually based on your exact location so you get the lowest actual rider or parcel rate.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#F3F6F4] text-xs text-[#2A4739] border border-[#DEE7E2]">
                📍 <strong>Pickup Spot:</strong> {BUSINESS_CONFIG.location}. Available Monday to Saturday, 8:30 AM to 6:30 PM.
              </div>
            )}
          </div>

          {/* Preferred Payment Method */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#1F372C] uppercase tracking-wide">
              3. Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'MPESA_BUY_GOODS'
                    ? 'border-[#2D4C3D] bg-[#F1F6F3] text-[#1E3B2F]'
                    : 'border-[#E2DFD8] bg-[#FAFAF8] text-[#556257] hover:border-[#CCD5CE]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="MPESA_BUY_GOODS"
                  checked={paymentMethod === 'MPESA_BUY_GOODS'}
                  onChange={() => setPaymentMethod('MPESA_BUY_GOODS')}
                  className="accent-[#2D4C3D]"
                />
                <div>
                  <div className="font-semibold text-xs text-[#1F372C]">M-Pesa Buy Goods Till</div>
                  <div className="text-[11px] text-[#5D6B61]">Till No: {BUSINESS_CONFIG.mpesaTill}</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'CASH_ON_PICKUP'
                    ? 'border-[#2D4C3D] bg-[#F1F6F3] text-[#1E3B2F]'
                    : 'border-[#E2DFD8] bg-[#FAFAF8] text-[#556257] hover:border-[#CCD5CE]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH_ON_PICKUP"
                  checked={paymentMethod === 'CASH_ON_PICKUP'}
                  onChange={() => setPaymentMethod('CASH_ON_PICKUP')}
                  className="accent-[#2D4C3D]"
                />
                <div>
                  <div className="font-semibold text-xs text-[#1F372C]">Cash on Pickup / Delivery</div>
                  <div className="text-[11px] text-[#5D6B61]">Pay upon physical handover</div>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#3E4A41]">
              Order Notes / Herbal Advice Questions (Optional)
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Call before dispatch, or need usage advice for shilajit with moringa..."
              className="w-full text-xs p-2.5 rounded-lg border border-[#D5D3CA] bg-white focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] outline-none text-[#242A24]"
            />
          </div>

          {/* Order Summary & Submit */}
          <div className="pt-3 border-t border-[#EAE8E1] space-y-3">
            <div className="p-3 rounded-xl bg-[#F7F6F2] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4D5A50]">
                <span>Items Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-semibold font-mono tabular-nums text-[#172A22]">
                  {formatKES(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#5D6B62] text-[11px]">
                <span>Delivery Transport</span>
                <span>
                  {deliveryMethod === 'PICKUP'
                    ? 'Free (Shop Pickup)'
                    : 'Awaiting manual confirmation'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7D9185] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Generating Order Request...</span>
              ) : (
                <>
                  <span>Submit Order & Continue on WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
