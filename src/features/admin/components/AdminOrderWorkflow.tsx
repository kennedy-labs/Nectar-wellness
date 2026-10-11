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
  onConfirmPayment: (orderId: string, reference?: string) => Promise<void>;
  onRevertPayment?: (orderId: string) => Promise<void>;
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
    description: 'Calculate transport cost based on delivery destination.',
    badgeClass: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  },
  {
    status: 'AWAITING_PAYMENT',
    label: 'Awaiting Payment',
    description: 'Quote shared; waiting for customer to pay via M-Pesa Buy Goods.',
    badgeClass: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
  },
  {
    status: 'PAID',
    label: 'Payment Confirmed',
    description: 'M-Pesa payment received; remedies ready for packaging.',
    badgeClass: 'bg-[#EBF5EF] text-[#15803D] border-[#C5E1CF]',
  },
  {
    status: 'PROCESSING',
    label: 'Packaging Remedies',
    description: 'Botanical products, dosage spoons, and seals being packed.',
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
    description: 'Customer safely received their order. Fulfillment completed.',
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
  onRevertPayment,
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
  const [showManualRefInput, setShowManualRefInput] = useState(false);
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
    setShowManualRefInput(false);
    setFeedback(null);
  }, [order.id]);

  // Order prev / next navigation
  const currentIndex = allOrders.findIndex((o) => o.id === order.id);
  const prevOrder = currentIndex > 0 ? allOrders[currentIndex - 1] : null;
  const nextOrder = currentIndex < allOrders.length - 1 ? allOrders[currentIndex + 1] : null;

  // Clean customer phone number for direct dialing & WhatsApp
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
    setSavingPayment(true);
    setFeedback(null);
    try {
      await onConfirmPayment(order.id, paymentRefInput.trim() || undefined);
      setFeedback({ type: 'success', text: `Order #${order.id} marked as Paid! Stock updated.` });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to mark order as paid.' });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleRevertPayment = async () => {
    setSavingPayment(true);
    setFeedback(null);
    try {
      if (onRevertPayment) {
        await onRevertPayment(order.id);
      } else {
        await onUpdateStatus(order.id, 'AWAITING_PAYMENT');
      }
      setFeedback({ type: 'success', text: `Payment undone. Order #${order.id} marked as Unpaid.` });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to revert payment status.' });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setFeedback(null);
    try {
      await onUpdateStatus(order.id, order.status, adminNotesInput.trim() || undefined);
      setFeedback({ type: 'success', text: 'Fulfillment notes saved.' });
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
        text: `Order #${order.id} status updated to ${targetStatus.replace(/_/g, ' ')}.`,
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
    <div className="space-y-4 pb-20 sm:pb-6 animate-in fade-in duration-150">
      {/* ------------------------------------------------------------- */}
      {/* 1. MOBILE-OPTIMIZED TOP BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E2E6E3] p-3.5 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Back button */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0F4F1] hover:bg-[#E2ECE5] text-xs font-semibold text-[#1E3B2F] transition-colors cursor-pointer active:scale-95 touch-manipulation min-h-[38px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Orders</span>
          </button>

          {/* Current Status Pill */}
          <div
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border truncate max-w-[170px] sm:max-w-none ${currentStatusDef.badgeClass}`}
          >
            {currentStatusDef.label}
          </div>

          {/* Action buttons: Print & Order Stepper */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl border border-[#D5D3CA] text-[#29362D] hover:bg-[#F8FAF8] transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Print slip"
            >
              <Printer className="w-4 h-4" />
            </button>

            <div className="flex items-center border border-[#D5D3CA] rounded-xl overflow-hidden bg-white">
              <button
                disabled={!prevOrder}
                onClick={() => prevOrder && onSelectOrder(prevOrder)}
                className="p-2 text-[#4E5C52] hover:bg-[#F2F4F2] disabled:opacity-30 disabled:pointer-events-none cursor-pointer min-h-[38px] min-w-[34px] flex items-center justify-center"
                title="Previous order"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-[#E2E6E3]" />
              <button
                disabled={!nextOrder}
                onClick={() => nextOrder && onSelectOrder(nextOrder)}
                className="p-2 text-[#4E5C52] hover:bg-[#F2F4F2] disabled:opacity-30 disabled:pointer-events-none cursor-pointer min-h-[38px] min-w-[34px] flex items-center justify-center"
                title="Next order"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Order Identifier & Placed Time */}
        <div className="flex items-baseline justify-between pt-1 border-t border-[#F0EFEB]">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base sm:text-lg text-[#1A2E23]">
              #{order.id}
            </span>
            <span className="text-[#8B988F]">·</span>
            <span className="font-semibold text-sm sm:text-base text-[#26382E]">
              {order.customerName}
            </span>
          </div>
          <span className="font-mono font-bold text-base sm:text-lg text-[#1E3B2F] tabular-nums">
            {formatKES(order.totalAmount)}
          </span>
        </div>

        {/* Mobile Segmented Workflow Tabs: 1. Manage Order -> 2. Update Status */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F0F3F1] rounded-xl">
            <button
              onClick={() => setActiveWorkflowStep('MANAGE')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] touch-manipulation ${
                activeWorkflowStep === 'MANAGE'
                  ? 'bg-white text-[#182C22] shadow-xs'
                  : 'text-[#5A6D61] hover:text-[#182C22]'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-center text-[10px] leading-4 font-bold ${
                activeWorkflowStep === 'MANAGE' ? 'bg-[#182C22] text-white' : 'bg-[#D2DAD4] text-[#44554A]'
              }`}>
                1
              </span>
              <span>Manage Order</span>
            </button>

            <button
              onClick={() => setActiveWorkflowStep('UPDATE_STATUS')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] touch-manipulation ${
                activeWorkflowStep === 'UPDATE_STATUS'
                  ? 'bg-white text-[#182C22] shadow-xs'
                  : 'text-[#5A6D61] hover:text-[#182C22]'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-center text-[10px] leading-4 font-bold ${
                activeWorkflowStep === 'UPDATE_STATUS' ? 'bg-[#182C22] text-white' : 'bg-[#D2DAD4] text-[#44554A]'
              }`}>
                2
              </span>
              <span>Update Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Feedback Message */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
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
      {/* STEP 1: MANAGE ORDER (Mobile-First Stacked Layout)            */}
      {/* Customer & WhatsApp FIRST, then Payment, Fee, Items & Notes   */}
      {/* ============================================================= */}
      {activeWorkflowStep === 'MANAGE' && (
        <div className="space-y-4">
          {/* 1. CUSTOMER & DIRECT WHATSAPP ACTION (TOP PRIORITY ON PHONES) */}
          <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#F0EFEB] pb-2.5">
              <span className="font-display font-medium text-sm text-[#182C22]">
                Customer & Contact
              </span>
              <span className="text-[11px] text-[#5D6B62]">
                {order.deliveryMethod.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Customer Details & Big Tap Action Buttons */}
            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold text-base text-[#182C22]">{order.customerName}</p>
                <p className="font-mono text-xs text-[#5D6B62]">{order.customerPhone}</p>
              </div>

              {/* Direct Call & WhatsApp Buttons (Generous Touch Targets for Phones) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="py-3 px-3 rounded-xl bg-[#F0F4F1] hover:bg-[#E2ECE5] text-[#1E3B2F] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[46px] touch-manipulation active:scale-98"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Customer</span>
                </a>

                <a
                  href={`https://wa.me/${waPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[46px] touch-manipulation active:scale-98 shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Delivery Destination */}
              <div className="pt-2 border-t border-[#F2F0EA] flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#245C38] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-xs text-[#182C22]">{order.deliveryLocation}</p>
                  {order.orderNotes && (
                    <p className="text-[11px] text-[#8C6D1F] bg-[#FEF9E7] p-2 rounded-lg mt-1 border border-[#F9E79F]">
                      Note: {order.orderNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 1-Click Pre-filled WhatsApp Shortcuts */}
            <div className="pt-2 border-t border-[#F0EFEB] space-y-1.5">
              <span className="text-[11px] font-semibold text-[#3D4C42] uppercase tracking-wide block mb-1">
                1-Click WhatsApp Quick Messages:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <a
                  href={buildAdminCustomerWhatsAppUrl(order, 'DELIVERY_QUOTE')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-[#F4F9F6] border border-[#C5E1CF] hover:bg-[#EBF5EF] text-[#1B5E20] font-medium text-xs flex items-center justify-between min-h-[42px] touch-manipulation"
                >
                  <span>1. Payment Request & Till</span>
                  <Send className="w-3.5 h-3.5 opacity-70" />
                </a>

                <a
                  href={buildAdminCustomerWhatsAppUrl(order, 'PAYMENT_CONFIRMED')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-[#F4F9F6] border border-[#C5E1CF] hover:bg-[#EBF5EF] text-[#1B5E20] font-medium text-xs flex items-center justify-between min-h-[42px] touch-manipulation"
                >
                  <span>2. Payment Receipt</span>
                  <Send className="w-3.5 h-3.5 opacity-70" />
                </a>

                <a
                  href={buildAdminCustomerWhatsAppUrl(order, 'DISPATCHED')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-[#F4F9F6] border border-[#C5E1CF] hover:bg-[#EBF5EF] text-[#1B5E20] font-medium text-xs flex items-center justify-between min-h-[42px] touch-manipulation"
                >
                  <span>3. Dispatch & Rider Alert</span>
                  <Send className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. PAYMENT VERIFICATION (Check SMS & Mark Paid) */}
          <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#F0EFEB] pb-2.5">
              <div>
                <span className="font-display font-medium text-sm text-[#182C22] block">
                  M-Pesa Payment Verification
                </span>
                <span className="text-[11px] text-[#5D6B62]">
                  Till: <strong>{BUSINESS_CONFIG.mpesaTill}</strong>
                </span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                  order.paymentStatus === 'CONFIRMED'
                    ? 'bg-[#EBF5EF] text-[#15803D] border-[#C5E1CF]'
                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                }`}
              >
                {order.paymentStatus === 'CONFIRMED' ? '✓ PAID' : '⏳ UNPAID'}
              </span>
            </div>

            {/* Payment State & Single-Tap Action */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#F8FAF8] border border-[#E8ECE9] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#64746A] block text-[11px]">Amount Due:</span>
                  <span className="font-mono font-bold text-base text-[#1E3B2F] tabular-nums">
                    {formatKES(order.totalAmount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#64746A] block text-[11px]">Customer:</span>
                  <span className="font-medium text-[#182C22]">{order.customerPhone}</span>
                </div>
              </div>

              {order.paymentStatus === 'CONFIRMED' ? (
                <div className="p-3.5 rounded-xl border border-[#C5E1CF] bg-[#F4F9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />
                    <div>
                      <p className="font-bold text-xs text-[#15803D]">Payment Verified on Till</p>
                      <p className="text-[11px] text-[#556358]">
                        Remedies ready for packing.
                        {order.paymentReference && order.paymentReference !== 'VERIFIED_VIA_SMS' && (
                          <span className="font-mono ml-1 text-[#15803D]">({order.paymentReference})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Undo Button */}
                  <button
                    type="button"
                    disabled={savingPayment}
                    onClick={handleRevertPayment}
                    className="py-2.5 px-3.5 rounded-xl border border-[#F2D4D4] bg-white hover:bg-[#FDF2F2] text-[#9B1C1C] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[42px] touch-manipulation active:scale-98"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{savingPayment ? 'Reverting...' : 'Undo — Mark as Unpaid'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[#556358] leading-relaxed">
                    Check your phone for M-Pesa Till SMS of <strong className="text-[#1A2E23]">{formatKES(order.totalAmount)}</strong>. Once received:
                  </p>
                  {/* Big Generous Touch Target Button for Phone Screen */}
                  <button
                    type="button"
                    disabled={savingPayment}
                    onClick={handleConfirmPayment}
                    className="w-full py-3.5 px-4 bg-[#15803D] hover:bg-[#126631] disabled:bg-[#8F9E94] text-white text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs min-h-[48px] touch-manipulation active:scale-98"
                  >
                    <Check className="w-5 h-5" />
                    <span>{savingPayment ? 'Marking as Paid...' : '✓ Mark as Paid'}</span>
                  </button>
                </div>
              )}

              {/* Optional Code accordion */}
              <div className="pt-1">
                {!showManualRefInput && !order.paymentReference ? (
                  <button
                    type="button"
                    onClick={() => setShowManualRefInput(true)}
                    className="text-[11px] text-[#556358] hover:text-[#182C22] underline cursor-pointer"
                  >
                    + Optional: Record reference code
                  </button>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={paymentRefInput}
                      onChange={(e) => setPaymentRefInput(e.target.value.toUpperCase())}
                      placeholder="Optional code (e.g. QJK8912P4)"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-[#D5D3CA] rounded-xl outline-none font-mono uppercase text-[#182C22] min-h-[38px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleConfirmPayment();
                        setShowManualRefInput(false);
                      }}
                      className="px-3.5 py-2 bg-[#20392D] text-white text-xs font-semibold rounded-xl hover:bg-[#162920] cursor-pointer min-h-[38px]"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. DELIVERY TRANSPORT FEE */}
          <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F0EFEB] pb-2.5">
              <span className="font-display font-medium text-sm text-[#182C22]">
                Delivery Transport Fee
              </span>
              <span className="text-xs text-[#5D6B62]">
                {order.deliveryFee !== null ? formatKES(order.deliveryFee) : 'Not Set'}
              </span>
            </div>

            {/* Presets Grid for Mobile (Generous Tap Targets) */}
            <div>
              <label className="block text-[11px] text-[#556358] mb-1.5 font-medium">
                Quick Fee Presets:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { label: 'Free (0)', fee: 0 },
                  { label: 'Rider (200)', fee: 200 },
                  { label: 'Outskirts (350)', fee: 350 },
                  { label: 'Courier (450)', fee: 450 },
                ].map((p) => (
                  <button
                    key={p.fee}
                    type="button"
                    onClick={() => setDeliveryFeeInput(String(p.fee))}
                    className="py-2 px-2 text-xs rounded-xl bg-[#F8FAF8] border border-[#DCDAD2] hover:border-[#20392D] text-[#3D4C42] font-medium cursor-pointer min-h-[38px] touch-manipulation active:scale-95 text-center"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input + Save Button */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#7A877E]">
                  KES
                </span>
                <input
                  type="number"
                  min={0}
                  value={deliveryFeeInput}
                  onChange={(e) => setDeliveryFeeInput(e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-3 py-2.5 text-sm bg-white border border-[#D5D3CA] rounded-xl outline-none font-mono font-bold focus:border-[#20392D] min-h-[42px]"
                />
              </div>
              <button
                type="button"
                disabled={savingFee}
                onClick={handleSaveDeliveryFee}
                className="px-5 py-2.5 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer min-h-[42px] touch-manipulation active:scale-95"
              >
                {savingFee ? 'Saving...' : 'Save Fee'}
              </button>
            </div>
          </div>

          {/* 4. ITEMS ORDERED & TOTAL */}
          <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F0EFEB] pb-2.5">
              <span className="font-display font-medium text-sm text-[#182C22]">
                Items Ordered ({order.items.length})
              </span>
              <span className="text-xs text-[#5D6B62]">
                Subtotal: <strong>{formatKES(order.subtotal)}</strong>
              </span>
            </div>

            <div className="divide-y divide-[#F2F0EA]">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-11 h-11 rounded-xl object-cover border border-[#E8ECE9] shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-[#182C22] text-xs sm:text-sm">{item.productName}</p>
                      <p className="text-[#64746A] text-[11px]">
                        {item.quantity} × {formatKES(item.priceAtPurchase)}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-xs sm:text-sm text-[#1A2E23] tabular-nums shrink-0">
                    {formatKES(item.priceAtPurchase * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Recap */}
            <div className="pt-2 border-t border-[#F2F0EA] flex items-center justify-between text-xs">
              <span className="text-[#64746A]">
                Total ({formatKES(order.subtotal)} + {order.deliveryFee !== null ? formatKES(order.deliveryFee) : '0'}):
              </span>
              <span className="font-mono font-bold text-base text-[#1E3B2F] tabular-nums">
                {formatKES(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* 5. INTERNAL NOTES */}
          <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-display font-medium text-sm text-[#182C22]">
                Internal Notes & Courier Info
              </span>
              <button
                type="button"
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="text-xs font-semibold text-[#245C38] hover:underline cursor-pointer"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
            <textarea
              rows={2}
              value={adminNotesInput}
              onChange={(e) => setAdminNotesInput(e.target.value)}
              placeholder="e.g. Bolt Rider John (0712345678) assigned. Pack with dosing spoon."
              className="w-full p-2.5 text-xs bg-[#F8FAF8] border border-[#D5D3CA] rounded-xl outline-none focus:border-[#20392D]"
            />
          </div>

          {/* Advancement Button to Step 2 (Prominent) */}
          <div className="pt-2">
            <button
              onClick={() => setActiveWorkflowStep('UPDATE_STATUS')}
              className="w-full py-3.5 px-4 bg-[#20392D] hover:bg-[#162920] text-white text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs min-h-[48px] touch-manipulation active:scale-98"
            >
              <span>Proceed to Update Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* STEP 2: UPDATE STATUS (Large Touch Cards for Phones)          */}
      {/* ============================================================= */}
      {activeWorkflowStep === 'UPDATE_STATUS' && (
        <div className="bg-white rounded-2xl border border-[#E2E6E3] p-4 sm:p-6 shadow-2xs space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-[#F0EFEB] pb-3">
            <div>
              <span className="text-[10px] font-bold text-[#245C38] uppercase tracking-wider block">
                Workflow Step 2 of 2
              </span>
              <h3 className="font-display font-medium text-lg text-[#182C22]">
                Update Order Status
              </h3>
            </div>
            <button
              onClick={() => setActiveWorkflowStep('MANAGE')}
              className="text-xs font-semibold text-[#4E5C52] px-3 py-1.5 rounded-xl border border-[#D5D3CA] hover:bg-[#F8FAF8] cursor-pointer min-h-[36px]"
            >
              ← Manage
            </button>
          </div>

          {/* Current State Info */}
          <div className="p-3 rounded-xl bg-[#F6F8F6] border border-[#E2E8E4] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#64746A] block text-[10px]">Current:</span>
              <strong className="text-xs font-bold text-[#182C22]">{currentStatusDef.label}</strong>
            </div>
            <div className="text-right">
              <span className="text-[#64746A] block text-[10px]">Total:</span>
              <span className="font-mono font-bold text-xs text-[#1E3B2F]">{formatKES(order.totalAmount)}</span>
            </div>
          </div>

          {/* Status Selection Cards (Phone Ergonomics: High Tap Target) */}
          <div className="space-y-2">
            <span className="block text-[11px] font-bold text-[#3D4C42] uppercase tracking-wider">
              Select New Stage:
            </span>

            <div className="space-y-2">
              {STATUS_DEFINITIONS.map((def) => {
                const isSelected = targetStatus === def.status;
                const isCurrent = order.status === def.status;
                return (
                  <div
                    key={def.status}
                    onClick={() => setTargetStatus(def.status)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer min-h-[52px] touch-manipulation active:scale-98 ${
                      isSelected
                        ? 'border-[#20392D] bg-[#F4F9F6] ring-1 ring-[#20392D]'
                        : 'border-[#E6E4DD] hover:border-[#CCD5CE] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-[#20392D] bg-[#20392D] text-white'
                              : 'border-[#C2C9C4] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </span>
                        <span className="font-semibold text-xs text-[#182C22]">{def.label}</span>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold text-[#556358] bg-[#EAE8E1] px-1.5 py-0.2 rounded shrink-0">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5D6B62] pl-6.5 mt-0.5 leading-snug">
                      {def.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-medium text-[#3A463D]">
              Status Note (Optional):
            </label>
            <input
              type="text"
              value={statusChangeNotes}
              onChange={(e) => setStatusChangeNotes(e.target.value)}
              placeholder="e.g. Dispatched with Bolt rider"
              className="w-full px-3 py-2 text-xs bg-white border border-[#D5D3CA] rounded-xl outline-none text-[#182C22] min-h-[40px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F0EFEB] gap-2">
            <button
              type="button"
              onClick={() => setActiveWorkflowStep('MANAGE')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#4E5C52] hover:bg-[#F2F4F2] cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={savingStatus}
              onClick={handleApplyStatusUpdate}
              className="flex-1 sm:flex-initial px-5 py-3 bg-[#20392D] hover:bg-[#162920] disabled:bg-[#8F9E94] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[46px] shadow-xs touch-manipulation active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>{savingStatus ? 'Applying...' : 'Confirm Status Update'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 6. STICKY MOBILE BOTTOM BAR (Always In Thumb Zone)            */}
      {/* ============================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2E6E3] px-4 py-2.5 sm:hidden shadow-lg">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          {/* Quick WhatsApp button */}
          <a
            href={`https://wa.me/${waPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 min-w-[42px] min-h-[42px] shadow-2xs active:scale-95"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>

          {/* Middle: Order Status & Amount */}
          <div className="flex-1 truncate">
            <span className="font-mono font-bold text-sm text-[#182C22] tabular-nums block">
              {formatKES(order.totalAmount)}
            </span>
            <span className="text-[10px] text-[#556358] truncate block">
              #{order.id} · {currentStatusDef.label}
            </span>
          </div>

          {/* Primary Action Button */}
          {activeWorkflowStep === 'MANAGE' ? (
            <button
              onClick={() => setActiveWorkflowStep('UPDATE_STATUS')}
              className="py-2.5 px-4 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 min-h-[42px] shrink-0 active:scale-95"
            >
              <span>Update Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleApplyStatusUpdate}
              disabled={savingStatus}
              className="py-2.5 px-4 bg-[#20392D] hover:bg-[#162920] disabled:bg-[#8F9E94] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 min-h-[42px] shrink-0 active:scale-95"
            >
              <span>Confirm</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
