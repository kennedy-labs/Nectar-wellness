import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Truck,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Package,
  Clock,
  Printer,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  Send,
  FileText,
  Calendar,
  ShieldCheck,
  Check,
  Copy,
  Store,
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

type WorkflowTab = 'OVERVIEW' | 'FEE' | 'PAYMENT' | 'PACKAGING' | 'DISPATCH' | 'DELIVERY';

const STAGES: {
  id: WorkflowTab;
  stepNumber: number;
  label: string;
  description: string;
  associatedStatus: OrderStatus[];
}[] = [
  {
    id: 'OVERVIEW',
    stepNumber: 0,
    label: 'Overview & Slip',
    description: 'Order details and items breakdown',
    associatedStatus: [],
  },
  {
    id: 'FEE',
    stepNumber: 1,
    label: '1. Route & Fee',
    description: 'Verify location and set transport cost',
    associatedStatus: ['REVIEWING_DELIVERY', 'PENDING'],
  },
  {
    id: 'PAYMENT',
    stepNumber: 2,
    label: '2. Payment Verification',
    description: 'Verify M-Pesa Till transaction code',
    associatedStatus: ['AWAITING_PAYMENT', 'PAID'],
  },
  {
    id: 'PACKAGING',
    stepNumber: 3,
    label: '3. Apothecary Packaging',
    description: 'Fulfill herbal items and dosage guides',
    associatedStatus: ['PROCESSING'],
  },
  {
    id: 'DISPATCH',
    stepNumber: 4,
    label: '4. Dispatch & Logistics',
    description: 'Handover to rider or countrywide courier',
    associatedStatus: ['OUT_FOR_DELIVERY'],
  },
  {
    id: 'DELIVERY',
    stepNumber: 5,
    label: '5. Completed Delivery',
    description: 'Customer handover & final sign-off',
    associatedStatus: ['DELIVERED', 'CANCELLED'],
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
  // Determine initial active tab based on order status
  const getInitialTab = (): WorkflowTab => {
    if (order.status === 'REVIEWING_DELIVERY' || order.deliveryFee === null) return 'FEE';
    if (order.status === 'AWAITING_PAYMENT') return 'PAYMENT';
    if (order.status === 'PAID') return 'PACKAGING';
    if (order.status === 'PROCESSING') return 'DISPATCH';
    if (order.status === 'OUT_FOR_DELIVERY') return 'DELIVERY';
    if (order.status === 'DELIVERED') return 'OVERVIEW';
    return 'OVERVIEW';
  };

  const [activeTab, setActiveTab] = useState<WorkflowTab>(getInitialTab);

  // Form states
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>(
    order.deliveryFee !== null ? String(order.deliveryFee) : ''
  );
  const [paymentRefInput, setPaymentRefInput] = useState<string>(
    order.paymentReference || ''
  );
  const [adminNotesInput, setAdminNotesInput] = useState<string>(
    order.adminNotes || ''
  );
  const [packedItems, setPackedItems] = useState<Record<string, boolean>>({});
  const [riderInfo, setRiderInfo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when order prop changes
  useEffect(() => {
    setDeliveryFeeInput(order.deliveryFee !== null ? String(order.deliveryFee) : '');
    setPaymentRefInput(order.paymentReference || '');
    setAdminNotesInput(order.adminNotes || '');
    setFeedbackMsg(null);
  }, [order.id]);

  // Keyboard navigation: Escape key returns to list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Order cycling navigation
  const currentIndex = allOrders.findIndex((o) => o.id === order.id);
  const prevOrder = currentIndex > 0 ? allOrders[currentIndex - 1] : null;
  const nextOrder = currentIndex < allOrders.length - 1 ? allOrders[currentIndex + 1] : null;

  // Actions
  const handleSaveFee = async (advance: boolean = false) => {
    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const fee = Number(deliveryFeeInput) || 0;
      await onUpdateDeliveryFee(order.id, fee, adminNotesInput.trim() || undefined);
      setFeedbackMsg({ type: 'success', text: `Delivery fee set to ${formatKES(fee)}.` });
      if (advance) {
        setActiveTab('PAYMENT');
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to update delivery fee.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmMpesaPayment = async (advance: boolean = false) => {
    if (!paymentRefInput.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please enter the M-Pesa transaction reference.' });
      return;
    }
    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      await onConfirmPayment(order.id, paymentRefInput.trim());
      setFeedbackMsg({ type: 'success', text: 'Payment confirmed & inventory stock updated!' });
      if (advance) {
        setActiveTab('PACKAGING');
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to confirm payment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatusAndAdvance = async (newStatus: OrderStatus, nextTab?: WorkflowTab) => {
    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      await onUpdateStatus(order.id, newStatus, adminNotesInput.trim() || undefined);
      setFeedbackMsg({ type: 'success', text: `Order status updated to ${newStatus.replace(/_/g, ' ')}.` });
      if (nextTab) {
        setActiveTab(nextTab);
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to update order status.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleItemPacked = (itemId: string) => {
    setPackedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const allItemsPacked = order.items.every((it) => packedItems[it.id]);

  // Clean WhatsApp phone number for calling
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------- */}
      {/* TOP WORKFLOW MASTER NAVIGATION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E2E6E3] shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F4F1] hover:bg-[#E2ECE5] text-xs font-medium text-[#1E3B2F] transition-colors cursor-pointer"
              title="Return to order list (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Orders</span>
            </button>

            <div className="h-4 w-[1px] bg-[#E2E6E3] hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base sm:text-lg text-[#1A2E23]">
                  #{order.id}
                </span>
                <span aria-hidden="true" className="text-[#8B988F]">·</span>
                <span className="font-medium text-sm text-[#26382E]">
                  {order.customerName}
                </span>
              </div>
              <p className="text-xs text-[#637267] flex items-center gap-2">
                <span>Placed {formatDate(order.createdAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
              </p>
            </div>
          </div>

          {/* Quick Order Actions & Status Indicator */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F6F8F6] border border-[#E2E6E3] text-xs font-semibold text-[#1F372C]">
              <span
                className={`w-2 h-2 rounded-full ${
                  order.status === 'DELIVERED'
                    ? 'bg-[#15803D]'
                    : order.status === 'CANCELLED'
                    ? 'bg-[#B91C1C]'
                    : order.status === 'PAID' || order.status === 'PROCESSING'
                    ? 'bg-[#2563EB]'
                    : order.status === 'OUT_FOR_DELIVERY'
                    ? 'bg-[#7C3AED]'
                    : 'bg-[#D97706]'
                }`}
              />
              <span>{order.status.replace(/_/g, ' ')}</span>
            </div>

            {/* Quick Call */}
            <a
              href={`tel:${order.customerPhone}`}
              className="p-2 rounded-xl bg-[#F0F4F1] hover:bg-[#E2ECE5] text-[#245C38] transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
              title="Call customer directly"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Call</span>
            </a>

            {/* Quick WhatsApp */}
            <a
              href={`https://wa.me/${cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1) : cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[#E8F5E9] hover:bg-[#D5ECD7] text-[#1B5E20] transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Order Prev/Next Navigation */}
            <div className="flex items-center gap-1 border-l border-[#E2E6E3] pl-2.5">
              <button
                disabled={!prevOrder}
                onClick={() => prevOrder && onSelectOrder(prevOrder)}
                className="p-1.5 rounded-lg text-[#556358] hover:text-[#182C22] hover:bg-[#F2F4F2] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Previous order"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={!nextOrder}
                onClick={() => nextOrder && onSelectOrder(nextOrder)}
                className="p-1.5 rounded-lg text-[#556358] hover:text-[#182C22] hover:bg-[#F2F4F2] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Next order"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* WORKFLOW PIPELINE STAGE NAVIGATION BAR (Tabs / Stepper) */}
        {/* ------------------------------------------------------------- */}
        <div className="pt-2 border-t border-[#EEF2EF]">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
            {STAGES.map((stage) => {
              const isActive = activeTab === stage.id;
              const isCurrentOrderStatus = stage.associatedStatus.includes(order.status);
              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    setActiveTab(stage.id);
                    setFeedbackMsg(null);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#1E3B2F] text-white shadow-xs font-semibold'
                      : isCurrentOrderStatus
                      ? 'bg-[#EBF5EF] text-[#245C38] hover:bg-[#DCEEE3]'
                      : 'text-[#5C6E62] hover:text-[#182C22] hover:bg-[#F2F5F2]'
                  }`}
                >
                  {isCurrentOrderStatus && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                  )}
                  <span>{stage.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Global Action Feedback Message */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
            feedbackMsg.type === 'success'
              ? 'bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]'
              : 'bg-[#FDF2F2] text-[#9B1C1C] border border-[#F8D7D7]'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245C38]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#9B1C1C]" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ISOLATED STAGE WORKSPACES */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Focused Workflow Stage Controller */}
        <div className="lg:col-span-8 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW & AUDIT SLIP */}
          {/* ========================================================= */}
          {activeTab === 'OVERVIEW' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2E6E3] shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#F0EFEB] pb-4">
                <div>
                  <h3 className="font-display font-medium text-base text-[#182C22]">
                    Order Overview & Fulfillment Summary
                  </h3>
                  <p className="text-xs text-[#5D6B62]">
                    Complete record of customer, items, and logistics details.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-[#D5D3CA] text-xs font-medium text-[#29362D] hover:bg-[#F8FAF8] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>

              {/* Customer & Delivery Method Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#E8ECE9] space-y-2">
                  <span className="font-semibold uppercase tracking-wider text-[#526357] text-[11px] block">
                    Customer Information
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium text-[#1A2E23] text-sm">{order.customerName}</p>
                    <p className="text-[#4E5C52]">{order.customerPhone}</p>
                    {order.customerEmail && <p className="text-[#4E5C52]">{order.customerEmail}</p>}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#E8ECE9] space-y-2">
                  <span className="font-semibold uppercase tracking-wider text-[#526357] text-[11px] block">
                    Delivery Logistics
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium text-[#1A2E23]">
                      Method: {order.deliveryMethod.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[#4E5C52] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#245C38] shrink-0 mt-0.5" />
                      <span>{order.deliveryLocation}</span>
                    </p>
                  </div>
                </div>
              </div>

              {order.orderNotes && (
                <div className="p-3.5 rounded-xl bg-[#FEF9E7] border border-[#F9E79F] text-xs text-[#7D6608]">
                  <strong>Customer Instructions:</strong> {order.orderNotes}
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-3">
                <h4 className="font-medium text-xs uppercase tracking-wider text-[#4E5C52]">
                  Purchased Apothecary Remedies ({order.items.length})
                </h4>
                <div className="divide-y divide-[#F0EFEB] border border-[#E8ECE9] rounded-xl overflow-hidden">
                  {order.items.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between text-xs bg-white">
                      <div className="flex items-center gap-3">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover border border-[#E8ECE9]"
                          />
                        )}
                        <div>
                          <p className="font-medium text-[#182C22]">{item.productName}</p>
                          <p className="text-[#64746A]">
                            Qty: <strong className="text-[#1A2E23]">{item.quantity}</strong> × {formatKES(item.priceAtPurchase)}
                          </p>
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-sm text-[#1A2E23] tabular-nums">
                        {formatKES(item.priceAtPurchase * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-4 rounded-xl bg-[#F6F8F6] border border-[#E2E8E4] space-y-2 text-xs">
                <div className="flex justify-between text-[#556358]">
                  <span>Products Subtotal:</span>
                  <span className="font-mono font-medium text-[#1A2E23]">{formatKES(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#556358]">
                  <span>Delivery & Courier Transport:</span>
                  <span className="font-mono font-medium text-[#1A2E23]">
                    {order.deliveryFee !== null ? formatKES(order.deliveryFee) : 'Pending Review'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-[#DDE4DF] pt-2 text-[#1A2E23]">
                  <span>Total Order Amount:</span>
                  <span className="font-mono text-base text-[#1E3B2F]">{formatKES(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: STEP 1 — ROUTE REVIEW & DELIVERY FEE */}
          {/* ========================================================= */}
          {activeTab === 'FEE' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2E6E3] shadow-xs space-y-6">
              <div className="border-b border-[#F0EFEB] pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309] uppercase tracking-wider mb-1">
                  <span>Step 1 of 5</span>
                  <span>·</span>
                  <span>Logistics Calculation</span>
                </div>
                <h3 className="font-display font-medium text-lg text-[#182C22]">
                  Review Route & Set Delivery Fee
                </h3>
                <p className="text-xs text-[#5D6B62]">
                  Verify customer destination and set the final delivery cost before requesting payment.
                </p>
              </div>

              {/* Customer Location Card */}
              <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#E6ECE8] text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#245C38] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#182C22] block">Destination:</span>
                    <span className="text-[#3A4B3F] text-sm font-medium">{order.deliveryLocation}</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#5C6E62] pl-6">
                  Selected Method: <strong className="text-[#1A2E23]">{order.deliveryMethod.replace(/_/g, ' ')}</strong>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#3A463D]">
                  Quick Standard Rates (Nairobi & Countrywide):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Shop Pickup (Free)', fee: 0 },
                    { label: 'Nairobi CBD / Local (KES 200)', fee: 200 },
                    { label: 'Nairobi Outskirts (KES 350)', fee: 350 },
                    { label: 'Countrywide Parcel (KES 450)', fee: 450 },
                  ].map((preset) => (
                    <button
                      key={preset.fee}
                      type="button"
                      onClick={() => setDeliveryFeeInput(String(preset.fee))}
                      className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                        deliveryFeeInput === String(preset.fee)
                          ? 'border-[#20392D] bg-[#EBF5EF] font-semibold text-[#182C22]'
                          : 'border-[#DCDAD2] hover:border-[#20392D] text-[#4E5C52]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Fee Input */}
              <div className="space-y-1.5 max-w-xs">
                <label className="block text-xs font-medium text-[#3A463D]">
                  Agreed Delivery Fee (KSh)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#7A877E] font-mono">
                    KES
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={deliveryFeeInput}
                    onChange={(e) => setDeliveryFeeInput(e.target.value)}
                    placeholder="Enter transport fee"
                    className="w-full pl-12 pr-3 py-2.5 text-xs bg-white border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none font-mono text-[#182C22]"
                  />
                </div>
              </div>

              {/* WhatsApp Notification Action */}
              <div className="p-4 rounded-xl bg-[#EBF5EF] border border-[#C5E1CF] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#245C38] flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#245C38]" />
                    WhatsApp Customer Notification
                  </span>
                  <a
                    href={buildAdminCustomerWhatsAppUrl(
                      { ...order, deliveryFee: Number(deliveryFeeInput) || 0, totalAmount: order.subtotal + (Number(deliveryFeeInput) || 0) },
                      'DELIVERY_QUOTE'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#1B5E20] hover:bg-[#144718] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Quote via WhatsApp</span>
                  </a>
                </div>
                <p className="text-[11px] text-[#3B664B]">
                  Pre-fills a polite message with products subtotal, the calculated transport fee, and M-Pesa Buy Goods payment instructions.
                </p>
              </div>

              {/* Action Advancement Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#F0EFEB]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveFee(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D5D3CA] text-xs font-medium text-[#29362D] hover:bg-[#F8FAF8] transition-colors cursor-pointer"
                >
                  Save Fee Only
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveFee(true)}
                  className="px-5 py-2.5 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <span>Confirm Fee & Advance to Payment</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: STEP 2 — PAYMENT VERIFICATION */}
          {/* ========================================================= */}
          {activeTab === 'PAYMENT' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2E6E3] shadow-xs space-y-6">
              <div className="border-b border-[#F0EFEB] pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] uppercase tracking-wider mb-1">
                  <span>Step 2 of 5</span>
                  <span>·</span>
                  <span>Financial Confirmation</span>
                </div>
                <h3 className="font-display font-medium text-lg text-[#182C22]">
                  Verify M-Pesa Payment
                </h3>
                <p className="text-xs text-[#5D6B62]">
                  Match the customer's transaction code against your official Buy Goods Till.
                </p>
              </div>

              {/* Store M-Pesa Details */}
              <div className="p-4 rounded-xl bg-[#F6F8F6] border border-[#E2E8E4] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#64746A] block mb-0.5">M-Pesa Buy Goods Till:</span>
                  <strong className="font-mono text-sm text-[#1A2E23]">{BUSINESS_CONFIG.mpesaTill}</strong>
                </div>
                <div>
                  <span className="text-[#64746A] block mb-0.5">Expected Amount:</span>
                  <strong className="font-mono text-sm text-[#1E3B2F]">{formatKES(order.totalAmount)}</strong>
                </div>
                <div>
                  <span className="text-[#64746A] block mb-0.5">Payment Status:</span>
                  <span
                    className={`font-semibold ${
                      order.paymentStatus === 'CONFIRMED' ? 'text-[#15803D]' : 'text-[#B45309]'
                    }`}
                  >
                    {order.paymentStatus === 'CONFIRMED' ? '✓ CONFIRMED' : '⏳ AWAITING VERIFICATION'}
                  </span>
                </div>
              </div>

              {/* Transaction Code Form */}
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#3A463D]">
                    M-Pesa Confirmation Reference Code
                  </label>
                  <input
                    type="text"
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value.toUpperCase())}
                    placeholder="e.g. QJK8912P4"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none font-mono uppercase tracking-wider text-[#182C22]"
                  />
                  <p className="text-[11px] text-[#637267]">
                    Confirming payment automatically decrements product stock from your apothecary inventory.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting || !paymentRefInput.trim()}
                    onClick={() => handleConfirmMpesaPayment(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D5D3CA] text-xs font-medium text-[#29362D] hover:bg-[#F8FAF8] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Save Code Only
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting || !paymentRefInput.trim()}
                    onClick={() => handleConfirmMpesaPayment(true)}
                    className="px-5 py-2.5 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    <span>Confirm Payment & Advance to Packing</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* WhatsApp Receipt Acknowledgment */}
              {order.paymentStatus === 'CONFIRMED' && (
                <div className="p-4 rounded-xl bg-[#EBF5EF] border border-[#C5E1CF] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#245C38] block">Payment Acknowledgment</span>
                    <span className="text-[#3B664B] text-[11px]">Send customer an instant payment receipt via WhatsApp.</span>
                  </div>
                  <a
                    href={buildAdminCustomerWhatsAppUrl(order, 'PAYMENT_CONFIRMED')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#1B5E20] hover:bg-[#144718] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Receipt</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: STEP 3 — APOTHECARY PACKAGING */}
          {/* ========================================================= */}
          {activeTab === 'PACKAGING' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2E6E3] shadow-xs space-y-6">
              <div className="border-b border-[#F0EFEB] pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#7C3AED] uppercase tracking-wider mb-1">
                  <span>Step 3 of 5</span>
                  <span>·</span>
                  <span>Physical Fulfillment</span>
                </div>
                <h3 className="font-display font-medium text-lg text-[#182C22]">
                  Package Herbal Wellness Remedies
                </h3>
                <p className="text-xs text-[#5D6B62]">
                  Check off each botanical item as it is safely sealed into the apothecary package.
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#3A463D] uppercase tracking-wide">
                  Item Pack Checklist ({Object.values(packedItems).filter(Boolean).length}/{order.items.length} Ready):
                </label>
                <div className="space-y-2">
                  {order.items.map((it) => {
                    const isPacked = Boolean(packedItems[it.id]);
                    return (
                      <div
                        key={it.id}
                        onClick={() => handleToggleItemPacked(it.id)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isPacked
                            ? 'bg-[#F2F7F4] border-[#245C38] text-[#1A2E23]'
                            : 'bg-white border-[#E2E6E3] text-[#3D4C42] hover:border-[#20392D]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                              isPacked ? 'bg-[#20392D] text-white' : 'border border-[#C2C9C4] bg-white'
                            }`}
                          >
                            {isPacked && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-medium text-xs block">{it.productName}</span>
                            <span className="text-[11px] text-[#64746A]">
                              Quantity: <strong>{it.quantity}</strong> jar/pouch
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-medium">
                          {isPacked ? '✓ Packed' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Packaging Quality Assurance */}
              <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#E6ECE8] text-xs text-[#425447] space-y-1.5">
                <strong className="block font-semibold text-[#182C22]">🌿 Apothecary Packing Standards:</strong>
                <p>• Include measuring spoon for resins/powders (Shilajit, Moringa, Ashwagandha).</p>
                <p>• Verify seal integrity and batch number.</p>
                <p>• Insert herbal usage and safety guide leaflet.</p>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-4 border-t border-[#F0EFEB]">
                <button
                  type="button"
                  onClick={() => handleUpdateStatusAndAdvance('PROCESSING', undefined)}
                  className="px-4 py-2.5 rounded-xl border border-[#D5D3CA] text-xs font-medium text-[#29362D] hover:bg-[#F8FAF8] cursor-pointer"
                >
                  Save as Packaging
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleUpdateStatusAndAdvance('PROCESSING', 'DISPATCH')}
                  className="px-5 py-2.5 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <span>Packaging Ready → Advance to Dispatch</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: STEP 4 — DISPATCH & TRANSPORT */}
          {/* ========================================================= */}
          {activeTab === 'DISPATCH' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2E6E3] shadow-xs space-y-6">
              <div className="border-b border-[#F0EFEB] pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706] uppercase tracking-wider mb-1">
                  <span>Step 4 of 5</span>
                  <span>·</span>
                  <span>Logistics Handover</span>
                </div>
                <h3 className="font-display font-medium text-lg text-[#182C22]">
                  Dispatch Package to Rider / Courier
                </h3>
                <p className="text-xs text-[#5D6B62]">
                  Assign carrier transport and alert customer that their wellness order is on the way.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#3A463D] mb-1">
                    Courier / Rider Handover Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="e.g. Bolt Rider John (0712345678) dispatched. Estimated arrival 45 mins."
                    className="w-full p-3 text-xs bg-white border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#182C22]"
                  />
                </div>

                {/* Instant WhatsApp Dispatch Notice */}
                <div className="p-4 rounded-xl bg-[#EBF5EF] border border-[#C5E1CF] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#245C38] block">WhatsApp Dispatch Alert</span>
                    <span className="text-[#3B664B] text-[11px]">Notify customer their rider/courier is moving.</span>
                  </div>
                  <a
                    href={buildAdminCustomerWhatsAppUrl(order, 'DISPATCHED')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#1B5E20] hover:bg-[#144718] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Dispatch WhatsApp</span>
                  </a>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#F0EFEB]">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleUpdateStatusAndAdvance('OUT_FOR_DELIVERY', undefined)}
                    className="px-4 py-2.5 rounded-xl border border-[#D5D3CA] text-xs font-medium text-[#29362D] hover:bg-[#F8FAF8] cursor-pointer"
                  >
                    Save Dispatch Notes
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleUpdateStatusAndAdvance('OUT_FOR_DELIVERY', 'DELIVERY')}
                    className="px-5 py-2.5 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <span>Mark Out for Delivery → Advance</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: STEP 5 — FINAL DELIVERY & SIGN-OFF */}
          {/* ========================================================= */}
          {activeTab === 'DELIVERY' && (
            <div className="bg-white p-6 rounded-2xl border border-[#E2E6E3] shadow-xs space-y-6">
              <div className="border-b border-[#F0EFEB] pb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D] uppercase tracking-wider mb-1">
                  <span>Step 5 of 5</span>
                  <span>·</span>
                  <span>Fulfillment Completion</span>
                </div>
                <h3 className="font-display font-medium text-lg text-[#182C22]">
                  Confirm Successful Delivery
                </h3>
                <p className="text-xs text-[#5D6B62]">
                  Customer received package in good condition. Order lifecycle completed.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F8F6] border border-[#E2E8E4] text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64746A]">Customer:</span>
                  <span className="font-semibold text-[#182C22]">{order.customerName} ({order.customerPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64746A]">Destination:</span>
                  <span className="text-[#182C22]">{order.deliveryLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64746A]">Payment Reference:</span>
                  <span className="font-mono font-semibold text-[#1E3B2F]">{order.paymentReference || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#F0EFEB]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleUpdateStatusAndAdvance('CANCELLED', 'OVERVIEW')}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#9B1C1C] hover:bg-[#FDF2F2] border border-[#F8D7D7] transition-colors cursor-pointer"
                >
                  Cancel Order
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleUpdateStatusAndAdvance('DELIVERED', 'OVERVIEW')}
                  className="px-6 py-2.5 bg-[#15803D] hover:bg-[#126631] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Order as Delivered & Archive</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Right Column: Order Context Panel (Always visible) */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-5">
          {/* Order Summary Snapshot */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E6E3] shadow-xs space-y-4">
            <h4 className="font-display font-medium text-sm text-[#182C22] border-b border-[#F0EFEB] pb-2">
              Fulfillment Summary
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#5C6E62]">
                <span>Order Status:</span>
                <strong className="text-[#1A2E23]">{order.status.replace(/_/g, ' ')}</strong>
              </div>
              <div className="flex justify-between text-[#5C6E62]">
                <span>Payment:</span>
                <span className={`font-semibold ${order.paymentStatus === 'CONFIRMED' ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between text-[#5C6E62]">
                <span>Items:</span>
                <span className="font-mono text-[#1A2E23]">{order.items.length} items</span>
              </div>
              <div className="flex justify-between text-[#5C6E62]">
                <span>Total Value:</span>
                <strong className="font-mono text-[#1E3B2F] text-sm">{formatKES(order.totalAmount)}</strong>
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-1.5 pt-2 border-t border-[#F0EFEB]">
              <label className="block text-[11px] font-semibold text-[#3A463D] uppercase tracking-wide">
                Admin Notes:
              </label>
              <textarea
                rows={2}
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                placeholder="Add internal notes for staff/courier..."
                className="w-full p-2.5 text-xs bg-[#F8FAF8] border border-[#D5D3CA] rounded-xl outline-none focus:border-[#20392D]"
              />
            </div>
          </div>

          {/* Quick WhatsApp Helper */}
          <div className="bg-[#EBF5EF] p-4 rounded-2xl border border-[#C5E1CF] text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-[#245C38]">
              <MessageCircle className="w-4 h-4 text-[#245C38]" />
              <span>Customer Communications</span>
            </div>
            <p className="text-[11px] text-[#3A664B]">
              Keep customers informed at every stage to build trust and guarantee fast M-Pesa payments.
            </p>
            <div className="space-y-1.5 pt-1">
              <a
                href={buildAdminCustomerWhatsAppUrl(order, 'DELIVERY_QUOTE')}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[11px] font-medium text-[#1B5E20] hover:underline"
              >
                → Send Delivery Quote & Till Info
              </a>
              <a
                href={buildAdminCustomerWhatsAppUrl(order, 'PAYMENT_CONFIRMED')}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[11px] font-medium text-[#1B5E20] hover:underline"
              >
                → Send Payment Acknowledged Notice
              </a>
              <a
                href={buildAdminCustomerWhatsAppUrl(order, 'DISPATCHED')}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[11px] font-medium text-[#1B5E20] hover:underline"
              >
                → Send Rider / Courier Dispatch Notice
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
