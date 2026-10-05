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
  ArrowRight,
  RefreshCw,
  X,
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

const STATUS_DEFINITIONS: {
  status: OrderStatus;
  label: string;
  description: string;
  badgeClass: string;
}[] = [
  {
    status: 'REVIEWING_DELIVERY',
    label: 'Needs Route Review',
    description: 'Calculate and set the transport cost based on delivery destination.',
    badgeClass: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  },
  {
    status: 'AWAITING_PAYMENT',
    label: 'Awaiting Payment',
    description: 'Quote has been shared; waiting for customer to pay via M-Pesa Buy Goods.',
    badgeClass: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
  },
  {
    status: 'PAID',
    label: 'Payment Confirmed',
    description: 'M-Pesa transaction code verified; remedies ready for apothecary packaging.',
    badgeClass: 'bg-[#EBF5EF] text-[#15803D] border-[#C5E1CF]',
  },
  {
    status: 'PROCESSING',
    label: 'Packaging Remedies',
    description: 'Botanical products, dosage spoons, and seals are being packaged.',
    badgeClass: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
  },
  {
    status: 'OUT_FOR_DELIVERY',
    label: 'Dispatched / With Rider',
    description: 'Package handed over to Bolt rider or countrywide courier.',
    badgeClass: 'bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]',
  },
  {
    status: 'DELIVERED',
    label: 'Delivered & Complete',
    description: 'Customer has received their order safely. Fulfillment finished.',
    badgeClass: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
  },
  {
    status: 'CANCELLED',
    label: 'Cancelled',
    description: 'Order voided or cancelled upon customer request.',
    badgeClass: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
  },
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
  // Workflow View Mode: 'MANAGE' -> 'UPDATE_STATUS'
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<'MANAGE' | 'UPDATE_STATUS'>('MANAGE');

  // Form states in MANAGE view
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>(
    order.deliveryFee !== null ? String(order.deliveryFee) : ''
  );
  const [paymentRefInput, setPaymentRefInput] = useState<string>(
    order.paymentReference || ''
  );
  const [adminNotesInput, setAdminNotesInput] = useState<string>(
    order.adminNotes || ''
  );

  // Form states in UPDATE_STATUS view
  const [targetStatus, setTargetStatus] = useState<OrderStatus>(order.status);
  const [statusChangeNotes, setStatusChangeNotes] = useState<string>('');

  // Loading states
  const [savingFee, setSavingFee] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when selected order changes
  useEffect(() => {
    setDeliveryFeeInput(order.deliveryFee !== null ? String(order.deliveryFee) : '');
    setPaymentRefInput(order.paymentReference || '');
    setAdminNotesInput(order.adminNotes || '');
    setTargetStatus(order.status);
    setStatusChangeNotes('');
    setFeedback(null);
  }, [order.id]);

  // Order prev / next navigation
  const currentIndex = allOrders.findIndex((o) => o.id === order.id);
  const prevOrder = currentIndex > 0 ? allOrders[currentIndex - 1] : null;
  const nextOrder = currentIndex < allOrders.length - 1 ? allOrders[currentIndex + 1] : null;

  // Clean customer phone number
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1) : cleanPhone;

  // Handlers for MANAGE step
  const handleSaveDeliveryFee = async () => {
    setSavingFee(true);
    setFeedback(null);
    try {
      const fee = Number(deliveryFeeInput) || 0;
      await onUpdateDeliveryFee(order.id, fee, adminNotesInput.trim() || undefined);
      setFeedback({ type: 'success', text: `Delivery fee saved as ${formatKES(fee)}.` });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update delivery fee.' });
    } finally {
      setSavingFee(false);
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
      setFeedback({ type: 'success', text: 'Payment confirmed & inventory stock updated!' });
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
      setFeedback({ type: 'success', text: 'Fulfillment notes saved successfully.' });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to save notes.' });
    } finally {
      setSavingNotes(false);
    }
  };

  // Handler for UPDATE_STATUS step
  const handleApplyStatusUpdate = async () => {
    if (targetStatus === order.status && !statusChangeNotes.trim()) {
      setActiveWorkflowStep('MANAGE');
      return;
    }
    setSavingStatus(true);
    setFeedback(null);
    try {
      const updatedNotes = statusChangeNotes.trim()
        ? `${order.adminNotes ? order.adminNotes + ' | ' : ''}${statusChangeNotes.trim()}`
        : adminNotesInput.trim() || undefined;

      await onUpdateStatus(order.id, targetStatus, updatedNotes);
      setFeedback({
        type: 'success',
        text: `Order #${order.id} status successfully updated to ${targetStatus.replace(/_/g, ' ')}.`,
      });
      setActiveWorkflowStep('MANAGE');
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update order status.' });
    } finally {
      setSavingStatus(false);
    }
  };

  const currentStatusDef =
    STATUS_DEFINITIONS.find((s) => s.status === order.status) || STATUS_DEFINITIONS[0];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* ------------------------------------------------------------- */}
      {/* WORKFLOW MASTER BAR (Back button, Order ID, & Step Switcher) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                Placed {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Current Status Pill & Order Cycling */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-xl text-xs font-semibold border ${currentStatusDef.badgeClass}`}
            >
              <span>Status: {currentStatusDef.label}</span>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl border border-[#D5D3CA] text-xs font-medium text-[#29362D] hover:bg-[#F8FAF8] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print packing slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Slip</span>
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
        {/* WORKFLOW NAVIGATION: 1. MANAGE ORDER -> 2. UPDATE STATUS */}
        {/* ------------------------------------------------------------- */}
        <div className="pt-2 border-t border-[#F0EFEB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveWorkflowStep('MANAGE')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                activeWorkflowStep === 'MANAGE'
                  ? 'bg-[#1E3B2F] text-white font-semibold shadow-2xs'
                  : 'bg-[#F2F5F3] text-[#4A5D51] hover:text-[#182C22]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-bold">
                1
              </span>
              <span>Manage Order</span>
            </button>

            <ArrowRight className="w-3.5 h-3.5 text-[#A1B0A6]" />

            <button
              onClick={() => setActiveWorkflowStep('UPDATE_STATUS')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                activeWorkflowStep === 'UPDATE_STATUS'
                  ? 'bg-[#1E3B2F] text-white font-semibold shadow-2xs'
                  : 'bg-[#F2F5F3] text-[#4A5D51] hover:text-[#182C22]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-center text-[10px] leading-4 font-bold">
                2
              </span>
              <span>Update Status</span>
            </button>
          </div>

          <span className="text-xs text-[#5D6B62] hidden sm:block">
            {activeWorkflowStep === 'MANAGE'
              ? 'Review details, set fee & verify payment'
              : 'Advance or change order status'}
          </span>
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

      {/* ============================================================= */}
      {/* STEP 1: MANAGE ORDER PANEL */}
      {/* (Review items, calculate fee, verify payment, internal notes)  */}
      {/* ============================================================= */}
      {activeWorkflowStep === 'MANAGE' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left / Main Column: Items, Fee, Payment & Notes */}
            <div className="lg:col-span-8 space-y-5">
              {/* Card 1: Items & Order Totals */}
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

                {/* Delivery Transport Fee Calculation */}
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
                    <span className="text-[#556358]">
                      Products ({formatKES(order.subtotal)}) + Delivery (
                      {order.deliveryFee !== null ? formatKES(order.deliveryFee) : 'KSh 0'})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#182C22]">Total Due:</span>
                      <span className="font-mono font-bold text-lg text-[#1E3B2F] tabular-nums">
                        {formatKES(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Payment Verification */}
              <div className="bg-white rounded-2xl border border-[#E2E6E3] p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0EFEB] pb-3">
                  <h3 className="font-display font-medium text-base text-[#182C22]">
                    M-Pesa Payment Verification
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      order.paymentStatus === 'CONFIRMED'
                        ? 'bg-[#EBF5EF] text-[#15803D]'
                        : 'bg-[#FEF3C7] text-[#92400E]'
                    }`}
                  >
                    {order.paymentStatus === 'CONFIRMED' ? '✓ CONFIRMED' : '⏳ UNPAID'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#F8FAF8] border border-[#E8ECE9]">
                    <span className="text-[#64746A] block mb-0.5">M-Pesa Buy Goods Till:</span>
                    <strong className="font-mono text-sm text-[#1A2E23]">{BUSINESS_CONFIG.mpesaTill}</strong>
                    <span className="block text-[#64746A] text-[11px] mt-0.5">
                      Store Name: {BUSINESS_CONFIG.mpesaStoreName}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#3A463D] mb-1">
                      M-Pesa Transaction Code
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={paymentRefInput}
                        onChange={(e) => setPaymentRefInput(e.target.value.toUpperCase())}
                        placeholder="e.g. QJK8912P4"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-[#D5D3CA] rounded-xl outline-none font-mono uppercase tracking-wider text-[#182C22]"
                      />
                      <button
                        type="button"
                        disabled={savingPayment || !paymentRefInput.trim()}
                        onClick={handleConfirmPayment}
                        className="px-3.5 py-2 bg-[#15803D] hover:bg-[#126631] disabled:bg-[#8F9E94] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                      >
                        {savingPayment ? 'Saving...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Internal Fulfillment Notes */}
              <div className="bg-white rounded-2xl border border-[#E2E6E3] p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-medium text-base text-[#182C22]">
                    Internal Fulfillment & Logistics Notes
                  </h3>
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
                  placeholder="e.g. Bolt Rider John (0712345678) assigned. Package packed with fragile seal."
                  className="w-full p-2.5 text-xs bg-[#F8FAF8] border border-[#D5D3CA] rounded-xl outline-none focus:border-[#20392D]"
                />
              </div>
            </div>

            {/* Right Column: Customer Info & WhatsApp */}
            <div className="lg:col-span-4 space-y-5">
              {/* Card 4: Customer Details */}
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

              {/* Card 5: 1-Click WhatsApp Notifications */}
              <div className="bg-[#EBF5EF] rounded-2xl border border-[#C5E1CF] p-5 space-y-3">
                <div className="flex items-center gap-2 text-[#245C38]">
                  <MessageCircle className="w-4 h-4 text-[#245C38]" />
                  <h4 className="font-semibold text-xs uppercase tracking-wide">
                    1-Click WhatsApp Messages
                  </h4>
                </div>

                <div className="space-y-2 pt-1">
                  <a
                    href={buildAdminCustomerWhatsAppUrl(order, 'DELIVERY_QUOTE')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F2F7F4] border border-[#C5E1CF] text-[#1B5E20] font-medium text-xs flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <span>1. Send Quote & Payment Till</span>
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
                    <span>3. Send Rider Dispatch Alert</span>
                    <Send className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Advancement Callout Bar to Step 2 */}
          <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div>
              <p className="font-semibold text-sm text-[#182C22]">
                Done reviewing and managing this order?
              </p>
              <p className="text-xs text-[#5D6B62]">
                Proceed to Update Status to advance this order to its next fulfillment stage.
              </p>
            </div>

            <button
              onClick={() => setActiveWorkflowStep('UPDATE_STATUS')}
              className="px-5 py-2.5 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Proceed to Update Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* STEP 2: UPDATE STATUS PANEL (Separated from Manage Order)     */}
      {/* ============================================================= */}
      {activeWorkflowStep === 'UPDATE_STATUS' && (
        <div className="bg-white rounded-2xl border border-[#E2E6E3] p-6 shadow-2xs space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F0EFEB] pb-4">
            <div>
              <span className="text-xs font-semibold text-[#245C38] uppercase tracking-wider block mb-1">
                Workflow Step 2 of 2
              </span>
              <h3 className="font-display font-medium text-xl text-[#182C22]">
                Update Order Status
              </h3>
              <p className="text-xs text-[#5D6B62]">
                Select the new stage for Order #{order.id} ({order.customerName}).
              </p>
            </div>

            <button
              onClick={() => setActiveWorkflowStep('MANAGE')}
              className="text-xs font-medium text-[#4E5C52] hover:text-[#182C22] px-3 py-1.5 rounded-xl border border-[#D5D3CA] hover:bg-[#F8FAF8] transition-colors cursor-pointer"
            >
              ← Back to Manage Order
            </button>
          </div>

          {/* Current Status Info Box */}
          <div className="p-4 rounded-xl bg-[#F6F8F6] border border-[#E2E8E4] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#64746A] block">Current Stage:</span>
              <strong className="text-sm font-semibold text-[#182C22]">
                {currentStatusDef.label}
              </strong>
            </div>
            <div>
              <span className="text-[#64746A] block">Payment State:</span>
              <span
                className={`font-semibold ${
                  order.paymentStatus === 'CONFIRMED' ? 'text-[#15803D]' : 'text-[#B45309]'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
            <div>
              <span className="text-[#64746A] block">Total Amount:</span>
              <span className="font-mono font-bold text-[#1E3B2F]">{formatKES(order.totalAmount)}</span>
            </div>
          </div>

          {/* Select New Stage Cards */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#29362D] uppercase tracking-wider">
              Choose New Status:
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STATUS_DEFINITIONS.map((def) => {
                const isSelected = targetStatus === def.status;
                const isCurrent = order.status === def.status;
                return (
                  <div
                    key={def.status}
                    onClick={() => setTargetStatus(def.status)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#20392D] bg-[#F4F9F6] ring-1 ring-[#20392D]'
                        : 'border-[#E6E4DD] hover:border-[#CCD5CE] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-xs text-[#182C22] flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#20392D] bg-[#20392D] text-white'
                              : 'border-[#C2C9C4] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span>{def.label}</span>
                      </span>

                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold text-[#556358] bg-[#EAE8E1] px-1.5 py-0.2 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5D6B62] pl-5.5 leading-relaxed">
                      {def.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Status Change Note */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-medium text-[#3A463D]">
              Status Update Note (Optional):
            </label>
            <input
              type="text"
              value={statusChangeNotes}
              onChange={(e) => setStatusChangeNotes(e.target.value)}
              placeholder="e.g. Verified M-Pesa till payment, moving to packaging"
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#D5D3CA] rounded-xl outline-none focus:border-[#20392D] text-[#182C22]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#F0EFEB]">
            <button
              type="button"
              onClick={() => setActiveWorkflowStep('MANAGE')}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#4E5C52] hover:bg-[#F2F4F2] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={savingStatus}
              onClick={handleApplyStatusUpdate}
              className="px-6 py-2.5 bg-[#20392D] hover:bg-[#162920] disabled:bg-[#8F9E94] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{savingStatus ? 'Applying Update...' : 'Confirm & Apply Status Update'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
