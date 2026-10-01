import React, { useState } from 'react';
import { X, Search, CheckCircle, Clock, Truck, Package, MessageCircle, AlertCircle } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { formatDate, formatKES } from '../../../lib/utils';
import { buildWhatsAppOrderUrl } from '../../../lib/whatsapp';
import { Order, OrderStatus } from '../../../types';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  onSearchOrder: (orderId: string) => Promise<Order | null>;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; description: string; step: number }
> = {
  PENDING: {
    label: 'Order Submitted',
    description: 'We have received your order details.',
    step: 1,
  },
  REVIEWING_DELIVERY: {
    label: 'Reviewing Delivery Route',
    description: 'Our team is reviewing the most cost-effective transport to your location.',
    step: 2,
  },
  AWAITING_PAYMENT: {
    label: 'Awaiting M-Pesa Payment',
    description: 'Delivery cost confirmed. Please complete payment via Till 9823412.',
    step: 3,
  },
  PAID: {
    label: 'Payment Verified',
    description: 'Your payment has been verified by the owner.',
    step: 4,
  },
  PROCESSING: {
    label: 'Preparing Herbal Package',
    description: 'Our herbalist is packing and sealing your botanical remedies.',
    step: 5,
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Dispatch',
    description: 'Your package is in transit via Bolt rider or Matatu parcel.',
    step: 6,
  },
  DELIVERED: {
    label: 'Delivered / Picked Up',
    description: 'Order successfully delivered. Wishing you vibrant health!',
    step: 7,
  },
  CANCELLED: {
    label: 'Order Cancelled',
    description: 'This order request was cancelled.',
    step: 0,
  },
};

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = '',
  onSearchOrder,
}) => {
  const [query, setQuery] = useState(initialOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-search if initialOrderId provided
  React.useEffect(() => {
    if (initialOrderId) {
      setQuery(initialOrderId);
      handleSearch(initialOrderId);
    }
  }, [initialOrderId]);

  if (!isOpen) return null;

  const handleSearch = async (idToSearch?: string) => {
    const term = (idToSearch || query).trim();
    if (!term) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await onSearchOrder(term);
      if (res) {
        setOrder(res);
      } else {
        setOrder(null);
        setError(`No order found matching "${term}". Please verify your reference number.`);
      }
    } catch {
      setError('Error retrieving order details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#E6E4DD] overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE8E1] flex items-center justify-between bg-[#FAFAF8]">
          <div>
            <h2 className="font-display font-medium text-lg sm:text-xl text-[#172A22]">
              Track Your Order
            </h2>
            <p className="text-xs text-[#5D6A61] mt-0.5">
              Check delivery pricing review, dispatch status, and fulfillment.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close tracker"
            className="w-8 h-8 rounded-full text-[#5B665E] hover:text-[#172A22] hover:bg-[#EFECE5] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7B8880] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Order Reference (e.g. NNW-1042)"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-[#D5D3CA] focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7E9186] text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Details Display */}
          {order && (
            <div className="space-y-6">
              {/* Order Status Card */}
              <div className="p-4 rounded-xl bg-[#F6F8F6] border border-[#DCE6DF] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-[#1B3627]">
                    #{order.id}
                  </span>
                  <span className="text-xs font-semibold text-[#2D4C3D]">
                    {STATUS_CONFIG[order.status].label}
                  </span>
                </div>

                <p className="text-xs text-[#4F5E53] leading-relaxed">
                  {STATUS_CONFIG[order.status].description}
                </p>

                {order.adminNotes && (
                  <div className="p-2.5 rounded-lg bg-white border border-[#D6E2DA] text-xs text-[#2F4A3B]">
                    <strong>Apothecary Note:</strong> {order.adminNotes}
                  </div>
                )}

                <div className="text-[11px] text-[#69786E] pt-1 border-t border-[#E3EDE6]">
                  Submitted on {formatDate(order.createdAt)}
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#1F372C] uppercase tracking-wide">
                  Order Items
                </h4>
                <div className="divide-y divide-[#EAE8E1] border border-[#EAE8E1] rounded-xl overflow-hidden bg-white">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-10 h-10 rounded-md object-cover bg-[#F0EFEB] shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-[#1E2E24]">
                            {item.productName}
                          </div>
                          <div className="text-[#647167] text-[11px]">
                            Qty: {item.quantity} × {formatKES(item.priceAtPurchase)}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-medium text-[#1A2E24] tabular-nums">
                        {formatKES(item.priceAtPurchase * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & Delivery Breakdown */}
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E6DF] space-y-2 text-xs">
                <div className="flex justify-between text-[#4E5A51]">
                  <span>Items Subtotal:</span>
                  <span className="font-mono tabular-nums text-[#172A22]">
                    {formatKES(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#4E5A51]">
                  <span>Delivery Transport:</span>
                  <span className="font-mono tabular-nums text-[#172A22]">
                    {order.deliveryFee !== null ? formatKES(order.deliveryFee) : 'Reviewing route'}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-[#172A22] text-sm pt-2 border-t border-[#EAE8E1]">
                  <span>Total Amount:</span>
                  <span className="font-mono tabular-nums text-[#1F372C]">
                    {formatKES(order.totalAmount)}
                  </span>
                </div>
                <div className="text-[11px] text-[#69776E] pt-1">
                  Destination: {order.deliveryLocation} ({order.deliveryMethod.replace(/_/g, ' ')})
                </div>
              </div>

              {/* WhatsApp direct continuation */}
              <a
                href={buildWhatsAppOrderUrl(order)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                <span>Message Apothecary on WhatsApp About Order #{order.id}</span>
              </a>
            </div>
          )}

          {!order && searched && !loading && !error && (
            <div className="text-center py-8 text-xs text-[#637066]">
              Enter your Order Reference number from your confirmation message to check status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
