import React, { useState } from 'react';
import { X, LogOut, Package, Clock, ShieldCheck, DollarSign, Store } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { formatKES } from '../../../lib/utils';
import { Category, Order, OrderStatus, Product } from '../../../types';
import { AdminInventoryTable } from './AdminInventoryTable';
import { AdminOrderManagement } from './AdminOrderManagement';
import { AdminProductEditor } from './AdminProductEditor';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  orders: Order[];
  products: Product[];
  categories: Category[];
  onUpdateDeliveryFee: (orderId: string, fee: number, notes?: string) => Promise<void>;
  onUpdateStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  onConfirmPayment: (orderId: string, reference: string) => Promise<void>;
  onSaveProduct: (productData: Partial<Product>) => Promise<void>;
  onUpdateStock: (productId: string, stock: number) => Promise<void>;
  onToggleActive: (product: Product) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onLogout,
  orders,
  products,
  categories,
  onUpdateDeliveryFee,
  onUpdateStatus,
  onConfirmPayment,
  onSaveProduct,
  onUpdateStock,
  onToggleActive,
}) => {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'INVENTORY'>('ORDERS');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  if (!isOpen) return null;

  // Overview metrics
  const pendingDeliveryReviewCount = orders.filter(
    (o) => o.status === 'REVIEWING_DELIVERY' || o.deliveryFee === null
  ).length;
  const awaitingPaymentCount = orders.filter((o) => o.status === 'AWAITING_PAYMENT').length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'CONFIRMED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-[#FAFAF8] w-full max-w-6xl rounded-2xl shadow-2xl border border-[#E6E4DD] flex flex-col max-h-[92vh] overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navbar */}
        <div className="p-4 sm:p-6 border-b border-[#EAE8E1] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EBF2EE] text-[#2C4C3D] flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-medium text-lg sm:text-xl text-[#172A22]">
                  Apothecary Operations Portal
                </h2>
                <span className="text-xs bg-[#E4ECE6] text-[#20392D] font-medium px-2 py-0.5 rounded-md">
                  Owner
                </span>
              </div>
              <p className="text-xs text-[#5D6B62]">
                {BUSINESS_CONFIG.name} · Bazaar Plaza, Nairobi CBD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="text-xs font-medium text-[#7A4040] hover:bg-[#FDF2F2] px-3 py-1.5 rounded-lg border border-[#F2D7D7] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close dashboard"
              className="w-8 h-8 rounded-full text-[#5B665E] hover:text-[#172A22] hover:bg-[#EFECE5] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Actionable KPIs / Scoreboard */}
        <div className="p-4 sm:p-6 bg-white border-b border-[#EAE8E1] grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-[#F6F8F6] border border-[#DEE7E0] space-y-1">
            <span className="text-[11px] font-semibold text-[#546458] uppercase tracking-wide">
              Route Reviews
            </span>
            <div className="text-xl font-bold font-mono text-[#B45309] tabular-nums">
              {pendingDeliveryReviewCount}
            </div>
            <p className="text-[10px] text-[#697A6D]">Need delivery pricing</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F8F6] border border-[#DEE7E0] space-y-1">
            <span className="text-[11px] font-semibold text-[#546458] uppercase tracking-wide">
              Awaiting Payment
            </span>
            <div className="text-xl font-bold font-mono text-[#1E3B2F] tabular-nums">
              {awaitingPaymentCount}
            </div>
            <p className="text-[10px] text-[#697A6D]">Till 9823412 pending</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F8F6] border border-[#DEE7E0] space-y-1">
            <span className="text-[11px] font-semibold text-[#546458] uppercase tracking-wide">
              Total Orders
            </span>
            <div className="text-xl font-bold font-mono text-[#172A22] tabular-nums">
              {orders.length}
            </div>
            <p className="text-[10px] text-[#697A6D]">Logged on system</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F8F6] border border-[#DEE7E0] space-y-1">
            <span className="text-[11px] font-semibold text-[#546458] uppercase tracking-wide">
              Verified Revenue
            </span>
            <div className="text-xl font-bold font-mono text-[#2E7D32] tabular-nums">
              {formatKES(totalRevenue)}
            </div>
            <p className="text-[10px] text-[#697A6D]">Confirmed receipts</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-4 sm:px-6 pt-4 flex gap-2 border-b border-[#EAE8E1] bg-[#FAFAF8]">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'ORDERS'
                ? 'border-[#20392D] text-[#172A22]'
                : 'border-transparent text-[#66756B] hover:text-[#172A22]'
            }`}
          >
            Order Workflow ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'INVENTORY'
                ? 'border-[#20392D] text-[#172A22]'
                : 'border-transparent text-[#66756B] hover:text-[#172A22]'
            }`}
          >
            Remedies & Inventory ({products.length})
          </button>
        </div>

        {/* Main Tab Content Area */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {activeTab === 'ORDERS' ? (
            <AdminOrderManagement
              orders={orders}
              onUpdateDeliveryFee={onUpdateDeliveryFee}
              onUpdateStatus={onUpdateStatus}
              onConfirmPayment={onConfirmPayment}
            />
          ) : (
            <AdminInventoryTable
              products={products}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setIsEditorOpen(true);
              }}
              onAddNew={() => {
                setEditingProduct(null);
                setIsEditorOpen(true);
              }}
              onUpdateStock={onUpdateStock}
              onToggleActive={onToggleActive}
            />
          )}
        </div>

        {/* Product Editor Modal */}
        {isEditorOpen && (
          <AdminProductEditor
            product={editingProduct}
            categories={categories}
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            onSave={onSaveProduct}
          />
        )}
      </div>
    </div>
  );
};
