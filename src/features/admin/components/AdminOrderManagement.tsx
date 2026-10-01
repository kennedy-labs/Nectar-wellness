import React, { useState } from 'react';
import { Search, MessageCircle, Check, Phone, MapPin, Truck, Store, ExternalLink } from 'lucide-react';
import { formatDate, formatKES } from '../../../lib/utils';
import { buildAdminCustomerWhatsAppUrl } from '../../../lib/whatsapp';
import { Order, OrderStatus } from '../../../types';

interface AdminOrderManagementProps {
  orders: Order[];
  onUpdateDeliveryFee: (orderId: string, fee: number, notes?: string) => Promise<void>;
  onUpdateStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  onConfirmPayment: (orderId: string, reference: string) => Promise<void>;
}

const ALL_STATUSES: { key: OrderStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'REVIEWING_DELIVERY', label: 'Review Route' },
  { key: 'AWAITING_PAYMENT', label: 'Awaiting Payment' },
  { key: 'PAID', label: 'Paid' },
  { key: 'PROCESSING', label: 'Packaging' },
  { key: 'OUT_FOR_DELIVERY', label: 'Dispatched' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export const AdminOrderManagement: React.FC<AdminOrderManagementProps> = ({
  orders,
  onUpdateDeliveryFee,
  onUpdateStatus,
  onConfirmPayment,
}) => {
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Edit form state for selected order
  const [manualDeliveryFee, setManualDeliveryFee] = useState<string>('');
  const [paymentRefInput, setPaymentRefInput] = useState<string>('');
  const [adminNotesInput, setAdminNotesInput] = useState<string>('');
  const [savingAction, setSavingAction] = useState(false);

  const filteredOrders = orders.filter((o) => {
    if (filter !== 'ALL' && o.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.deliveryLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setManualDeliveryFee(order.deliveryFee !== null ? String(order.deliveryFee) : '');
    setPaymentRefInput(order.paymentReference || '');
    setAdminNotesInput(order.adminNotes || '');
  };

  const handleSaveDeliveryFee = async () => {
    if (!selectedOrder) return;
    setSavingAction(true);
    try {
      const fee = Number(manualDeliveryFee) || 0;
      await onUpdateDeliveryFee(selectedOrder.id, fee, adminNotesInput.trim() || undefined);
    } finally {
      setSavingAction(false);
    }
  };

  const handleStatusChange = async (status: OrderStatus) => {
    if (!selectedOrder) return;
    setSavingAction(true);
    try {
      await onUpdateStatus(selectedOrder.id, status, adminNotesInput.trim() || undefined);
    } finally {
      setSavingAction(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder || !paymentRefInput.trim()) return;
    setSavingAction(true);
    try {
      await onConfirmPayment(selectedOrder.id, paymentRefInput.trim());
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Filter segmented buttons & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#ECEBE6] rounded-xl overflow-x-auto scrollbar-none">
          {ALL_STATUSES.map((st) => (
            <button
              key={st.key}
              onClick={() => setFilter(st.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                filter === st.key
                  ? 'bg-white text-[#192C23] shadow-xs'
                  : 'text-[#5B675E] hover:text-[#192C23]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#7C887F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer name, phone..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-[#DEDCD5] focus:border-[#2D4C3D] rounded-lg outline-none text-[#242A24]"
          />
        </div>
      </div>

      {/* Orders Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Orders Table/List Column */}
        <div className={`space-y-3 ${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-[#E8E6DF] text-xs text-[#637066]">
              No orders found in this category.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = order.id === selectedOrderId;
              return (
                <div
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-[#2D4C3D] ring-1 ring-[#2D4C3D] shadow-xs'
                      : 'border-[#E6E4DD] hover:border-[#CCD5CE]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#1B3627]">
                          #{order.id}
                        </span>
                        <span className="text-xs text-[#4F5952]">·</span>
                        <span className="text-xs font-semibold text-[#242E27]">
                          {order.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#5D6B61] mt-1">
                        <span>{order.customerPhone}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-semibold text-sm tabular-nums text-[#1F372C]">
                        {formatKES(order.totalAmount)}
                      </div>
                      <span className="inline-block text-[11px] font-medium text-[#2C4C3D] mt-0.5">
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-[#F2F0EA] flex items-center justify-between text-xs text-[#566359]">
                    <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                      <MapPin className="w-3.5 h-3.5 text-[#3A624F] shrink-0" />
                      <span className="truncate">{order.deliveryLocation}</span>
                    </div>

                    <div className="text-[11px] font-medium">
                      {order.deliveryFee === null ? (
                        <span className="text-[#B45309]">Review route fee</span>
                      ) : (
                        <span className="text-[#2C4C3D]">Fee: {formatKES(order.deliveryFee)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Order Detail & Action Panel */}
        {selectedOrder && (
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#DCE4DE] shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-[#EAE8E1] pb-3">
              <div>
                <span className="text-xs text-[#637267]">Managing Order</span>
                <h3 className="font-mono font-bold text-lg text-[#1A3326]">
                  #{selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-xs text-[#637267] hover:text-[#1A3326] underline cursor-pointer"
              >
                Close Panel
              </button>
            </div>

            {/* Customer & Location */}
            <div className="space-y-1.5 text-xs text-[#4E5C52]">
              <div className="font-semibold text-sm text-[#1E2E25]">
                {selectedOrder.customerName}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#2E7D32]" />
                <a
                  href={`tel:${selectedOrder.customerPhone}`}
                  className="hover:underline text-[#242E27]"
                >
                  {selectedOrder.customerPhone}
                </a>
              </div>
              <div className="flex items-start gap-2 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#3A624F] shrink-0 mt-0.5" />
                <span>{selectedOrder.deliveryLocation} ({selectedOrder.deliveryMethod.replace(/_/g, ' ')})</span>
              </div>
              {selectedOrder.orderNotes && (
                <div className="p-2 rounded-lg bg-[#F5F6F3] text-[11px] text-[#34463A]">
                  <strong>Customer Note:</strong> {selectedOrder.orderNotes}
                </div>
              )}
            </div>

            {/* Items Ordered */}
            <div className="space-y-2 border-t border-[#EAE8E1] pt-3">
              <span className="text-xs font-semibold text-[#1F372C] uppercase tracking-wide">
                Items ({selectedOrder.items.length})
              </span>
              <div className="space-y-1 text-xs">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-[#38463D]">
                    <span>
                      {it.quantity}x {it.productName}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatKES(it.priceAtPurchase * it.quantity)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-1 border-t border-[#F0EFEB] text-[#1E2E25]">
                  <span>Subtotal:</span>
                  <span className="font-mono tabular-nums">
                    {formatKES(selectedOrder.subtotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Delivery Fee Input (CORE BUSINESS LOGIC) */}
            <div className="p-3.5 rounded-xl bg-[#F7F9F7] border border-[#D5E3DA] space-y-2.5">
              <label className="block text-xs font-semibold text-[#1E3B2F]">
                Delivery Transport Fee (KSh)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={manualDeliveryFee}
                  onChange={(e) => setManualDeliveryFee(e.target.value)}
                  placeholder="e.g. 250 (Bolt) or 300 (Matatu)"
                  className="w-full text-xs p-2 rounded-lg border border-[#CCD8CF] bg-white font-mono tabular-nums text-[#1F372C]"
                />
                <button
                  onClick={handleSaveDeliveryFee}
                  disabled={savingAction}
                  className="bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7D9185] text-white px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer"
                >
                  Save Fee
                </button>
              </div>
              <div className="text-[11px] text-[#55695C]">
                Total with delivery:{' '}
                <strong className="font-mono tabular-nums text-[#1F372C]">
                  {formatKES(
                    selectedOrder.subtotal + (Number(manualDeliveryFee) || 0)
                  )}
                </strong>
              </div>
            </div>

            {/* Quick 1-Click WhatsApp Customer Contact */}
            <div className="space-y-2 border-t border-[#EAE8E1] pt-3">
              <span className="text-xs font-semibold text-[#1F372C] uppercase tracking-wide">
                1-Click Customer WhatsApp Actions
              </span>
              <div className="grid grid-cols-1 gap-2">
                <a
                  href={buildAdminCustomerWhatsAppUrl(selectedOrder, 'DELIVERY_QUOTE')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#EBF5EF] hover:bg-[#DDF0E3] text-[#1E3B2F] border border-[#BFDEC9] py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#2E7D32]" />
                    <span>Send Delivery Quote & M-Pesa Till Details</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#2E7D32]" />
                </a>

                <a
                  href={buildAdminCustomerWhatsAppUrl(selectedOrder, 'PAYMENT_CONFIRMED')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#EBF5EF] hover:bg-[#DDF0E3] text-[#1E3B2F] border border-[#BFDEC9] py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#2E7D32]" />
                    <span>Send "Payment Received" Update</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#2E7D32]" />
                </a>

                <a
                  href={buildAdminCustomerWhatsAppUrl(selectedOrder, 'DISPATCHED')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#EBF5EF] hover:bg-[#DDF0E3] text-[#1E3B2F] border border-[#BFDEC9] py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#2E7D32]" />
                    <span>Send "Rider Dispatched" Update</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#2E7D32]" />
                </a>
              </div>
            </div>

            {/* M-Pesa Payment Confirmation */}
            <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#E6E4DC] space-y-2">
              <span className="text-xs font-semibold text-[#1F372C]">
                Confirm M-Pesa Payment
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value.toUpperCase())}
                  placeholder="e.g. QJK8912P4"
                  className="w-full text-xs p-2 rounded-lg border border-[#D5D3CA] bg-white font-mono uppercase text-[#1F372C]"
                />
                <button
                  onClick={handleConfirmPayment}
                  disabled={savingAction || !paymentRefInput.trim()}
                  className="bg-[#2E7D32] hover:bg-[#256829] disabled:bg-[#8ABF8E] text-white px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Paid</span>
                </button>
              </div>
              {selectedOrder.paymentStatus === 'CONFIRMED' && (
                <div className="text-[11px] text-[#2E7D32] font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Payment Confirmed (Ref: {selectedOrder.paymentReference})</span>
                </div>
              )}
            </div>

            {/* Status Change Selector */}
            <div className="space-y-1.5 border-t border-[#EAE8E1] pt-3">
              <label className="block text-xs font-medium text-[#38463D]">
                Update Order Status
              </label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="w-full text-xs p-2 rounded-lg border border-[#D5D3CA] bg-white text-[#1E3B2F] font-medium"
              >
                <option value="PENDING">PENDING</option>
                <option value="REVIEWING_DELIVERY">REVIEWING_DELIVERY</option>
                <option value="AWAITING_PAYMENT">AWAITING_PAYMENT</option>
                <option value="PAID">PAID</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
