import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  Check,
  Package,
  CreditCard,
  User,
  ExternalLink,
} from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { formatDate, formatKES } from '../../../lib/utils';
import { buildAdminCustomerWhatsAppUrl } from '../../../lib/whatsapp';
import { Order, OrderStatus } from '../../../types';

interface AdminOrderWorkflowProps {
  order: Order;
  allOrders: Order[];
  onBack: () => void;
  onSelectOrder: (order: Order) => void;
  onUpdateDeliveryFee: (orderId: string, fee: number, notes?: string) => Promise<void>;
  onUpdateStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  onConfirmPayment: (orderId: string, reference: string) => Promise<void>;
}

const ORDER_STAGES: { status: OrderStatus; label: string }[] = [
  { status: 'REVIEWING_DELIVERY', label: '1. Review Route' },
  { status: 'AWAITING_PAYMENT', label: '2. Payment' },
  { status: 'PROCESSING', label: '3. Packaging' },
  { status: 'OUT_FOR_DELIVERY', label: '4. Dispatched' },
  { status: 'DELIVERED', label: '5. Delivered' },
];

export const AdminOrderWorkflow: React.FC<AdminOrderWorkflowProps> = ({
  order,
  allOrders,
  onBack,
  onSelectOrder,
  onUpdateDeliveryFee,
  onUpdateStatus,
  onConfirmPayment,
}) => {
  // Local edit states
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>(
    order.deliveryFee !== null ? String(order.deliveryFee) : ''
  );
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [paymentRefInput, setPaymentRefInput] = useState<string>(
    order.paymentReference || ''
  );
  const [adminNotesInput, setAdminNotesInput] = useState<string>(
    order.adminNotes || ''
  );

  const [savingFee, setSavingFee] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state whenever selected order changes
  useEffect(() => {
    setDeliveryFeeInput(order.deliveryFee !== null ? String(order.deliveryFee) : '');
    setSelectedStatus(order.status);
    setPaymentRefInput(order.paymentReference || '');
    setAdminNotesInput(order.adminNotes || '');
    setFeedback(null);
  }, [order.id]);

  // Order prev / next navigation
  const currentIndex = allOrders.findIndex((o) => o.id === order.id);
  const prevOrder = currentIndex > 0 ? allOrders[currentIndex - 1] : null;
  const nextOrder = currentIndex < allOrders.length - 1 ? allOrders[currentIndex + 1] : null;

  // Clean customer phone number for dialing/chatting
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1) : cleanPhone;

  // Handlers
  const handleSaveDeliveryFee = async () => {
    setSavingFee(true);
    setFeedback(null);
    try {
      const fee = Number(deliveryFeeInput) || 0;
      await onUpdateDeliveryFee(order.id, fee, adminNotesInput.trim() || undefined);
      setFeedback({ type: 'success', text: `Delivery fee updated to ${formatKES(fee)}.` });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update delivery fee.' });
    } finally {
      setSavingFee(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    setSavingStatus(true);
    setFeedback(null);
    try {
      await onUpdateStatus(order.id, newStatus, adminNotesInput.trim() || undefined);
      setSelectedStatus(newStatus);
      setFeedback({ type: 'success', text: `Order status changed to ${newStatus.replace(/_/g, ' ')}.` });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update order status.' });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentRefInput.trim()) {
      setFeedback({ type: 'error', text: 'Please enter the M-Pesa transaction reference code.' });
      return;
    }
    setSavingPayment(true);
    setFeedback(null);
    try {
      await onConfirmPayment(order.id, paymentRefInput.trim());
      setFeedback({ type: 'success', text: 'Payment confirmed & stock updated!' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to confirm payment.' });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setFeedback(null);
    try {
      await onUpdateStatus(order.id, order.status, adminNotesInput.trim() || undefined);
      setFeedback({ type: 'success', text: 'Admin notes saved successfully.' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to save admin notes.' });
    } finally {
      setSavingNotes(false);
    }
  };

  // Determine stage progress step index (0 to 4)
  const getStageIndex = (st: OrderStatus): number => {
    switch (st) {
      case 'PENDING':
      case 'REVIEWING_DELIVERY':
        return 0;
      case 'AWAITING_PAYMENT':
        return 1;
      case 'PAID':
      case 'PROCESSING':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(order.status);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0F4F1] hover:bg-[#E2ECE5] text-xs font-semibold text-[#1E3B2F] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono font-bold text-lg sm:text-xl text-[#1A2E23]">
                #{order.id}
              </h2>
              <span className="text-[#8B988F]">·</span>
              <span className="font-semibold text-sm sm:text-base text-[#26382E]">
                {order.customerName}
              </span>
            </div>
            <p className="text-xs text-[#5D6B62]">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons: Prev/Next & Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl border border-[#D5D3CA] text-xs font-medium text-[#29362D] hover:bg-[#F8FAF8] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print packing slip"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Slip</span>
          </button>

          <div className="flex items-center border border-[#D5D3CA] rounded-xl overflow-hidden bg-white">
            <button
              disabled={!prevOrder}
              onClick={() => prevOrder && onSelectOrder(prevOrder)}
              className="p-2 text-[#4E5C52] hover:bg-[#F2F4F2] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous order"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-[#E2E6E3]" />
            <button
              disabled={!nextOrder}
              onClick={() => nextOrder && onSelectOrder(nextOrder)}
              className="p-2 text-[#4E5C52] hover:bg-[#F2F4F2] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next order"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. ORDER PROGRESS TIMELINE (Clear 5-Step Bar) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs text-[#5C6E62]">
          <span className="font-semibold uppercase tracking-wider text-[#3D4C42] text-[11px]">
            Order Lifecycle Progress
          </span>
          <span className="font-medium text-[#1A2E23]">
            Current: <strong className="text-[#245C38]">{order.status.replace(/_/g, ' ')}</strong>
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-4 pt-1">
          {ORDER_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <button
                key={stage.status}
                type="button"
                onClick={() => handleUpdateStatus(stage.status)}
                className={`text-left p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-[#245C38] bg-[#EBF5EF] shadow-2xs'
                    : isCompleted
                    ? 'border-[#C5E1CF] bg-[#F4F9F6]'
                    : 'border-[#E6E4DD] bg-[#FAFAF8] opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isCurrent
                        ? 'bg-[#20392D] text-white'
                        : isCompleted
                        ? 'bg-[#15803D] text-white'
                        : 'bg-[#DCDCD5] text-[#4F5B53]'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? 'text-[#1E3B2F]' : isCompleted ? 'text-[#15803D]' : 'text-[#5C6E62]'
                    }`}
                  >
                    {stage.label.split('. ')[1]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Action Feedback Message */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]'
              : 'bg-[#FDF2F2] text-[#9B1C1C] border border-[#F8D7D7]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245C38]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#9B1C1C]" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN WORKSPACE (Two-Column Layout) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Main Column (Items, Pricing, Payment, Status) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card 1: Items Ordered & Financials */}
          <div className="bg-white rounded-2xl border border-[#E2E6E3] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EFEB] pb-3">
              <h3 className="font-display font-medium text-base text-[#182C22]">
                Items Ordered ({order.items.length})
              </h3>
              <span className="text-xs text-[#5D6B62]">
                Subtotal: <strong className="text-[#182C22]">{formatKES(order.subtotal)}</strong>
              </span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-[#F2F0EA]">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-12 h-12 rounded-xl object-cover border border-[#E8ECE9]"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-[#182C22] text-sm">{item.productName}</p>
                      <p className="text-[#64746A]">
                        {item.quantity} × {formatKES(item.priceAtPurchase)}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-sm text-[#1A2E23] tabular-nums">
                    {formatKES(item.priceAtPurchase * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Fee & Total Calculation */}
            <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#E8ECE9] space-y-3 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#29362D] mb-1">
                    Delivery Transport Fee (KSh)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#7A877E]">
                        KES
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={deliveryFeeInput}
                        onChange={(e) => setDeliveryFeeInput(e.target.value)}
                        placeholder="0"
                        className="w-full pl-11 pr-2.5 py-1.5 text-xs bg-white border border-[#D5D3CA] rounded-lg outline-none font-mono font-medium focus:border-[#20392D]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={savingFee}
                      onClick={handleSaveDeliveryFee}
                      className="px-3 py-1.5 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      {savingFee ? 'Saving...' : 'Save Fee'}
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#64746A]">Presets:</span>
                  {[
                    { label: 'Free (0)', fee: 0 },
                    { label: 'Rider (200)', fee: 200 },
                    { label: 'Outskirts (350)', fee: 350 },
                    { label: 'Countrywide (450)', fee: 450 },
                  ].map((p) => (
                    <button
                      key={p.fee}
                      type="button"
                      onClick={() => setDeliveryFeeInput(String(p.fee))}
                      className="px-2 py-1 text-[11px] rounded-md bg-white border border-[#DCDAD2] hover:border-[#20392D] text-[#3D4C42] cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="border-t border-[#E2E8E4] pt-2 flex items-center justify-between text-xs">
                <span className="text-[#556358]">Products ({formatKES(order.subtotal)}) + Delivery ({order.deliveryFee !== null ? formatKES(order.deliveryFee) : 'KSh 0'})</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#182C22]">Total Due:</span>
                  <span className="font-mono font-bold text-lg text-[#1E3B2F] tabular-nums">
                    {formatKES(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Status & Payment Control */}
          <div className="bg-white rounded-2xl border border-[#E2E6E3] p-5 shadow-2xs space-y-4">
            <h3 className="font-display font-medium text-base text-[#182C22] border-b border-[#F0EFEB] pb-3">
              Payment & Status Control
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Change Status Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#29362D]">
                  Current Order Status
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#D5D3CA] rounded-xl outline-none focus:border-[#20392D] font-medium text-[#182C22]"
                  >
                    <option value="REVIEWING_DELIVERY">1. Reviewing Route & Delivery</option>
                    <option value="AWAITING_PAYMENT">2. Awaiting Payment</option>
                    <option value="PAID">3. Payment Confirmed (Paid)</option>
                    <option value="PROCESSING">4. Packaging Order</option>
                    <option value="OUT_FOR_DELIVERY">5. Out for Delivery</option>
                    <option value="DELIVERED">6. Delivered</option>
                    <option value="CANCELLED">7. Cancelled</option>
                  </select>

                  <button
                    type="button"
                    disabled={savingStatus || selectedStatus === order.status}
                    onClick={() => handleUpdateStatus(selectedStatus)}
                    className="px-3.5 py-2 bg-[#20392D] hover:bg-[#162920] disabled:bg-[#8F9E94] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    {savingStatus ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>

              {/* M-Pesa Payment Verification */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#29362D] flex items-center justify-between">
                  <span>M-Pesa Buy Goods Till ({BUSINESS_CONFIG.mpesaTill})</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      order.paymentStatus === 'CONFIRMED'
                        ? 'bg-[#EBF5EF] text-[#15803D]'
                        : 'bg-[#FEF3C7] text-[#92400E]'
                    }`}
                  >
                    {order.paymentStatus === 'CONFIRMED' ? '✓ CONFIRMED' : '⏳ UNPAID'}
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value.toUpperCase())}
                    placeholder="Enter M-Pesa Code (e.g. QJK8912P4)"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#D5D3CA] rounded-xl outline-none font-mono uppercase tracking-wider text-[#182C22]"
                  />
                  <button
                    type="button"
                    disabled={savingPayment || !paymentRefInput.trim()}
                    onClick={handleConfirmPayment}
                    className="px-3 py-2 bg-[#15803D] hover:bg-[#126631] disabled:bg-[#8F9E94] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    {savingPayment ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>

            {/* Internal Staff Notes */}
            <div className="space-y-1.5 pt-2 border-t border-[#F0EFEB]">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#29362D]">
                  Internal Fulfillment & Courier Notes
                </label>
                <button
                  type="button"
                  disabled={savingNotes}
                  onClick={handleSaveNotes}
                  className="text-xs font-medium text-[#245C38] hover:underline cursor-pointer"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
              <textarea
                rows={2}
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                placeholder="e.g. Bolt Rider John (0712345678) assigned. Pack with extra dosing spoon."
                className="w-full p-2.5 text-xs bg-[#F8FAF8] border border-[#D5D3CA] rounded-xl outline-none focus:border-[#20392D]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details & 1-Click WhatsApp Messages */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 3: Customer Details */}
          <div className="bg-white rounded-2xl border border-[#E2E6E3] p-5 shadow-2xs space-y-4">
            <h3 className="font-display font-medium text-base text-[#182C22] border-b border-[#F0EFEB] pb-3">
              Customer Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#64746A] block mb-0.5">Customer Name:</span>
                <span className="font-semibold text-sm text-[#182C22]">{order.customerName}</span>
              </div>

              <div>
                <span className="text-[#64746A] block mb-0.5">Phone Number:</span>
                <span className="font-mono text-sm text-[#182C22]">{order.customerPhone}</span>
                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#F0F4F1] hover:bg-[#E2ECE5] text-[#1E3B2F] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Phone</span>
                  </a>
                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#EBF5EF] hover:bg-[#D5ECD7] text-[#1B5E20] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="border-t border-[#F2F0EA] pt-2">
                <span className="text-[#64746A] block mb-0.5">Delivery Destination:</span>
                <p className="font-medium text-[#182C22] flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#245C38] shrink-0 mt-0.5" />
                  <span>{order.deliveryLocation}</span>
                </p>
                <p className="text-[11px] text-[#64746A] pl-5 mt-0.5">
                  Method: <strong>{order.deliveryMethod.replace(/_/g, ' ')}</strong>
                </p>
              </div>

              {order.orderNotes && (
                <div className="p-3 rounded-xl bg-[#FEF9E7] border border-[#F9E79F] text-[#7D6608] text-xs">
                  <strong>Customer Instructions:</strong>
                  <p className="mt-0.5">{order.orderNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: 1-Click WhatsApp Customer Messages */}
          <div className="bg-[#EBF5EF] rounded-2xl border border-[#C5E1CF] p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#245C38]">
              <MessageCircle className="w-4 h-4 text-[#245C38]" />
              <h4 className="font-semibold text-xs uppercase tracking-wide">
                1-Click WhatsApp Notifications
              </h4>
            </div>

            <p className="text-[11px] text-[#3B664B] leading-relaxed">
              Click any button below to launch WhatsApp with a pre-filled message for this order:
            </p>

            <div className="space-y-2 pt-1">
              <a
                href={buildAdminCustomerWhatsAppUrl(order, 'DELIVERY_QUOTE')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F2F7F4] border border-[#C5E1CF] text-[#1B5E20] font-medium text-xs flex items-center justify-between transition-colors shadow-2xs"
              >
                <span>1. Send Payment Request & Till Info</span>
                <Send className="w-3 h-3 opacity-70" />
              </a>

              <a
                href={buildAdminCustomerWhatsAppUrl(order, 'PAYMENT_CONFIRMED')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F2F7F4] border border-[#C5E1CF] text-[#1B5E20] font-medium text-xs flex items-center justify-between transition-colors shadow-2xs"
              >
                <span>2. Send Payment Receipt</span>
                <Send className="w-3 h-3 opacity-70" />
              </a>

              <a
                href={buildAdminCustomerWhatsAppUrl(order, 'DISPATCHED')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F2F7F4] border border-[#C5E1CF] text-[#1B5E20] font-medium text-xs flex items-center justify-between transition-colors shadow-2xs"
              >
                <span>3. Send Rider / Dispatch Alert</span>
                <Send className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
