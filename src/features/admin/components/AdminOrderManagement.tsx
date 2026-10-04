import React, { useState } from 'react';
import {
  Search,
  MessageCircle,
  Phone,
  MapPin,
  Truck,
  ArrowRight,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { formatDate, formatKES } from '../../../lib/utils';
import { Order, OrderStatus } from '../../../types';
import { AdminOrderWorkflow } from './AdminOrderWorkflow';

interface AdminOrderManagementProps {
  orders: Order[];
  onUpdateDeliveryFee: (orderId: string, fee: number, notes?: string) => Promise<void>;
  onUpdateStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  onConfirmPayment: (orderId: string, reference: string) => Promise<void>;
}

const ALL_STATUSES: { key: OrderStatus | 'ALL'; label: string; countFilter?: (orders: Order[]) => number }[] = [
  { key: 'ALL', label: 'All Orders' },
  {
    key: 'REVIEWING_DELIVERY',
    label: 'Needs Route Review',
    countFilter: (ords) => ords.filter((o) => o.status === 'REVIEWING_DELIVERY' || o.deliveryFee === null).length,
  },
  {
    key: 'AWAITING_PAYMENT',
    label: 'Awaiting Payment',
    countFilter: (ords) => ords.filter((o) => o.status === 'AWAITING_PAYMENT').length,
  },
  {
    key: 'PAID',
    label: 'Paid',
    countFilter: (ords) => ords.filter((o) => o.status === 'PAID').length,
  },
  {
    key: 'PROCESSING',
    label: 'Packaging',
    countFilter: (ords) => ords.filter((o) => o.status === 'PROCESSING').length,
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Dispatched',
    countFilter: (ords) => ords.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    countFilter: (ords) => ords.filter((o) => o.status === 'DELIVERED').length,
  },
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

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  // If an order is selected, isolate the view and display the dedicated workflow experience!
  if (selectedOrder) {
    return (
      <AdminOrderWorkflow
        order={selectedOrder}
        allOrders={orders}
        onBack={() => setSelectedOrderId(null)}
        onSelectOrder={(ord) => setSelectedOrderId(ord.id)}
        onUpdateDeliveryFee={onUpdateDeliveryFee}
        onUpdateStatus={onUpdateStatus}
        onConfirmPayment={onConfirmPayment}
      />
    );
  }

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (filter !== 'ALL') {
      if (filter === 'REVIEWING_DELIVERY') {
        if (o.status !== 'REVIEWING_DELIVERY' && o.deliveryFee !== null) return false;
      } else if (o.status !== filter) {
        return false;
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.deliveryLocation.toLowerCase().includes(q) ||
        o.items.some((it) => it.productName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* TOP CONTROL BAR: SEARCH & STATUS FILTER */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Segmented Tabs with Action Counts */}
        <div className="flex items-center gap-1.5 p-1 bg-[#ECEBE6] rounded-xl overflow-x-auto scrollbar-none">
          {ALL_STATUSES.map((st) => {
            const count = st.countFilter ? st.countFilter(orders) : undefined;
            return (
              <button
                key={st.key}
                onClick={() => setFilter(st.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  filter === st.key
                    ? 'bg-white text-[#192C23] shadow-xs font-semibold'
                    : 'text-[#5B675E] hover:text-[#192C23]'
                }`}
              >
                <span>{st.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                      st.key === 'REVIEWING_DELIVERY'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : st.key === 'AWAITING_PAYMENT'
                        ? 'bg-[#DBEAFE] text-[#1E40AF]'
                        : 'bg-[#E2ECE5] text-[#1E3B2F]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-[#7C887F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, phone, item..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-[#DEDCD5] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ORDERS CARDS / TABLE LIST */}
      {/* ------------------------------------------------------------- */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E6DF] space-y-2">
          <Package className="w-8 h-8 text-[#A3AFA6] mx-auto" />
          <p className="font-medium text-sm text-[#1A2E23]">No orders found in this view</p>
          <p className="text-xs text-[#637066]">
            Try adjusting your search filter or selecting &quot;All Orders&quot;.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const needsReview = order.status === 'REVIEWING_DELIVERY' || order.deliveryFee === null;
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="group p-4 sm:p-5 rounded-2xl border border-[#E6E4DD] hover:border-[#20392D] hover:shadow-xs bg-white transition-all cursor-pointer space-y-3"
              >
                {/* Row 1: Header (ID, Customer, Value & Stage) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm sm:text-base text-[#1A2E23] group-hover:text-[#245C38] transition-colors">
                      #{order.id}
                    </span>
                    <span className="text-xs text-[#8E9B91]">·</span>
                    <span className="font-semibold text-xs sm:text-sm text-[#242E27]">
                      {order.customerName}
                    </span>
                    <span className="text-xs text-[#8E9B91]">·</span>
                    <span className="text-xs text-[#5D6B61]">{order.customerPhone}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm sm:text-base tabular-nums text-[#1E3B2F]">
                      {formatKES(order.totalAmount)}
                    </span>

                    {/* Stage Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                        order.status === 'DELIVERED'
                          ? 'bg-[#EBF5EF] text-[#15803D]'
                          : order.status === 'CANCELLED'
                          ? 'bg-[#FDF2F2] text-[#B91C1C]'
                          : order.status === 'PAID' || order.status === 'PROCESSING'
                          ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                          : order.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-[#F5F3FF] text-[#6D28D9]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'DELIVERED'
                            ? 'bg-[#15803D]'
                            : order.status === 'PAID' || order.status === 'PROCESSING'
                            ? 'bg-[#2563EB]'
                            : order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-[#7C3AED]'
                            : 'bg-[#D97706]'
                        }`}
                      />
                      <span>{order.status.replace(/_/g, ' ')}</span>
                    </div>

                    <button
                      type="button"
                      className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#20392D] group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Workflow</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Location, Items Breakdown & Workflow Action Prompt */}
                <div className="pt-2 border-t border-[#F2F0EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#566359]">
                  <div className="flex items-center gap-2 truncate max-w-xl">
                    <MapPin className="w-3.5 h-3.5 text-[#3A624F] shrink-0" />
                    <span className="truncate">{order.deliveryLocation}</span>
                    <span className="text-[#8E9B91]">·</span>
                    <span className="text-[#39493E]">
                      {order.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {needsReview && (
                      <span className="text-[#B45309] font-medium flex items-center gap-1 bg-[#FEF9E7] px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3" />
                        <span>Action: Quote Delivery Fee</span>
                      </span>
                    )}

                    {order.status === 'AWAITING_PAYMENT' && (
                      <span className="text-[#1E40AF] font-medium flex items-center gap-1 bg-[#EFF6FF] px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" />
                        <span>Awaiting M-Pesa Code</span>
                      </span>
                    )}

                    <span className="text-[11px] text-[#718076]">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
