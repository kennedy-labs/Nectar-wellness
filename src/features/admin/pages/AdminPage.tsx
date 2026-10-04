import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  LogOut,
  Store,
  ExternalLink,
  AlertCircle,
  Truck,
  CheckCircle2,
  Package,
  Layers,
  ArrowLeft,
  Settings,
  KeyRound,
  Check,
} from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { formatKES } from '../../../lib/utils';
import { Category, Order, OrderStatus, Product } from '../../../types';
import { api } from '../../../lib/api';
import { AdminInventoryTable } from '../components/AdminInventoryTable';
import { AdminOrderManagement } from '../components/AdminOrderManagement';
import { AdminProductEditor } from '../components/AdminProductEditor';

interface AdminPageProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  isLoggedIn: boolean;
  onLogin: (pin: string) => Promise<boolean>;
  onLogout: () => void;
  onNavigateHome: () => void;
  onUpdateDeliveryFee: (orderId: string, fee: number, notes?: string) => Promise<void>;
  onUpdateStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  onConfirmPayment: (orderId: string, reference: string) => Promise<void>;
  onSaveProduct: (productData: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onDuplicateProduct: (product: Product) => Promise<void>;
  onUpdateStock: (productId: string, stock: number) => Promise<void>;
  onToggleActive: (product: Product) => Promise<void>;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  orders,
  products,
  categories,
  isLoggedIn,
  onLogin,
  onLogout,
  onNavigateHome,
  onUpdateDeliveryFee,
  onUpdateStatus,
  onConfirmPayment,
  onSaveProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onUpdateStock,
  onToggleActive,
}) => {
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'INVENTORY' | 'SETTINGS'>('ORDERS');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Security Credentials Management
  const [securityStatus, setSecurityStatus] = useState<{ hasEnvOverride: boolean; isDefaultPin: boolean } | null>(null);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'SETTINGS') {
      api.getAdminSecurityStatus().then(setSecurityStatus);
    }
  }, [isLoggedIn, activeTab]);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    if (newPinInput.length < 4) {
      setPinChangeMsg({ type: 'error', text: 'New PIN must be at least 4 digits or characters.' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinChangeMsg({ type: 'error', text: 'New PIN and Confirmation PIN do not match.' });
      return;
    }

    setPinLoading(true);
    try {
      const res = await api.changeAdminPin(currentPinInput, newPinInput);
      if (res.success) {
        setPinChangeMsg({ type: 'success', text: 'Owner PIN updated successfully! Keep it confidential.' });
        setCurrentPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
        api.getAdminSecurityStatus().then(setSecurityStatus);
      } else {
        setPinChangeMsg({ type: 'error', text: res.error || 'Failed to update PIN.' });
      }
    } catch {
      setPinChangeMsg({ type: 'error', text: 'Network request failed.' });
    } finally {
      setPinLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const ok = await onLogin(pin);
      if (!ok) {
        setLoginError('Invalid Admin PIN. Please verify and try again.');
      } else {
        setPin('');
      }
    } catch {
      setLoginError('Authentication failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  // If not logged in, render the standalone Owner Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F4F6F4] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#E2E6E3] p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E8EFEA] text-[#224032] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="font-display font-medium text-2xl text-[#182C22]">
              Apothecary Management
            </h1>
            <p className="text-xs text-[#58665C] leading-relaxed">
              Dedicated portal for Nature’s Nectar Wellness operations. Authorized access only.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#29362D] uppercase tracking-wide">
                Security PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7A877E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="w-full pl-10 pr-3.5 py-3 text-center tracking-widest text-base font-mono bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
                />
              </div>
              <p className="text-[11px] text-[#697A6F] text-center pt-1">
                Authorized owner PIN: <span className="font-mono font-semibold text-[#20392D]">{BUSINESS_CONFIG.adminDefaultPin}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loginLoading || !pin}
              className="w-full bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7D9185] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
            >
              {loginLoading ? 'Authenticating...' : 'Access Management Console'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#ECEBE6] text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs font-medium text-[#4D5A50] hover:text-[#182C22] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Customer Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in Standalone Owner Management Screen
  const pendingDeliveryReviewCount = orders.filter(
    (o) => o.status === 'REVIEWING_DELIVERY' || o.deliveryFee === null
  ).length;
  const awaitingPaymentCount = orders.filter((o) => o.status === 'AWAITING_PAYMENT').length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'CONFIRMED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="min-h-screen bg-[#F7F9F7] text-[#242A24] flex flex-col">
      {/* Standalone Admin Top Navigation */}
      <header className="bg-white border-b border-[#E5E9E6] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8EFEA] text-[#224032] flex items-center justify-center font-bold text-sm">
              NN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-lg text-[#1A2E23]">
                  Nature’s Nectar Operations
                </span>
                <span className="text-[11px] bg-[#E2ECE5] text-[#1E3B2F] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <p className="text-xs text-[#5D6B62]">
                Apothecary Management & Logistics Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="text-xs font-medium text-[#384A3E] hover:text-[#182C22] bg-[#F2F5F3] hover:bg-[#E6EDE8] px-3.5 py-2 rounded-lg border border-[#D6E0D9] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Customer Storefront</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>

            <button
              onClick={onLogout}
              className="text-xs font-medium text-[#7C3636] hover:bg-[#FDF2F2] px-3 py-2 rounded-lg border border-[#F2D4D4] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#E2E8E4] shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-[#57685D] uppercase tracking-wide">
              Route Reviews Needed
            </span>
            <div className="text-2xl font-bold font-mono text-[#B45309] tabular-nums">
              {pendingDeliveryReviewCount}
            </div>
            <p className="text-[11px] text-[#697A6E]">Pending transport calculation</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E2E8E4] shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-[#57685D] uppercase tracking-wide">
              Awaiting M-Pesa Payment
            </span>
            <div className="text-2xl font-bold font-mono text-[#1E3B2F] tabular-nums">
              {awaitingPaymentCount}
            </div>
            <p className="text-[11px] text-[#697A6E]">Till 9823412 verification</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E2E8E4] shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-[#57685D] uppercase tracking-wide">
              Total Orders Logged
            </span>
            <div className="text-2xl font-bold font-mono text-[#1A2E23] tabular-nums">
              {orders.length}
            </div>
            <p className="text-[11px] text-[#697A6E]">Customer requests</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E2E8E4] shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-[#57685D] uppercase tracking-wide">
              Verified Revenue
            </span>
            <div className="text-2xl font-bold font-mono text-[#2E7D32] tabular-nums">
              {formatKES(totalRevenue)}
            </div>
            <p className="text-[11px] text-[#697A6E]">Paid orders completed</p>
          </div>
        </div>

        {/* Workspace Segmented Navigation */}
        <div className="flex border-b border-[#E2E8E4] gap-2">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'ORDERS'
                ? 'border-[#20392D] text-[#1A2E23]'
                : 'border-transparent text-[#66756B] hover:text-[#1A2E23]'
            }`}
          >
            Orders & Route Pricing ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'INVENTORY'
                ? 'border-[#20392D] text-[#1A2E23]'
                : 'border-transparent text-[#66756B] hover:text-[#1A2E23]'
            }`}
          >
            Remedies & Stock Levels ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'border-[#20392D] text-[#1A2E23]'
                : 'border-transparent text-[#66756B] hover:text-[#1A2E23]'
            }`}
          >
            Operational Info
          </button>
        </div>

        {/* Workspace Active View */}
        {activeTab === 'ORDERS' && (
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8E4] shadow-2xs">
            <AdminOrderManagement
              orders={orders}
              onUpdateDeliveryFee={onUpdateDeliveryFee}
              onUpdateStatus={onUpdateStatus}
              onConfirmPayment={onConfirmPayment}
            />
          </div>
        )}

        {activeTab === 'INVENTORY' && (
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8E4] shadow-2xs">
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
              onDeleteProduct={onDeleteProduct}
              onDuplicateProduct={onDuplicateProduct}
            />
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Owner Security & PIN Management */}
            <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-[#E2E8E4] shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EFEB] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF0EC] text-[#20392D] flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-medium text-base text-[#1A2E23]">
                      Store Owner Security & Access Credentials
                    </h3>
                    <p className="text-xs text-[#5D6B62]">
                      Control the administrator PIN used to access order dispatch and inventory controls.
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {securityStatus?.hasEnvOverride ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#245C38]" />
                      Render Secret Override Active
                    </span>
                  ) : securityStatus?.isDefaultPin ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      <AlertCircle className="w-3.5 h-3.5 text-[#B45309]" />
                      Initial Setup PIN Active (2540)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]">
                      <Check className="w-3.5 h-3.5 text-[#245C38]" />
                      Custom Owner PIN Active
                    </span>
                  )}
                </div>
              </div>

              {securityStatus?.hasEnvOverride ? (
                <div className="p-4 rounded-xl bg-[#F6F8F6] border border-[#E2E8E4] text-xs text-[#37473D] space-y-1">
                  <p className="font-semibold text-[#1B3527]">
                    🔒 Locked by Server Environment Variable
                  </p>
                  <p className="text-[#556358]">
                    Your owner PIN is currently managed securely via the <code className="bg-white px-1.5 py-0.5 rounded border border-[#DAD8CF] font-mono">ADMIN_PIN</code> environment variable in your hosting dashboard (e.g. Render). To change it, update your environment variables and redeploy.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleChangePin} className="space-y-4 max-w-xl">
                  {pinChangeMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        pinChangeMsg.type === 'success'
                          ? 'bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]'
                          : 'bg-[#FDF2F2] text-[#C53030] border border-[#F8D7D7]'
                      }`}
                    >
                      {pinChangeMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245C38]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-[#C53030]" />
                      )}
                      <span>{pinChangeMsg.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                        Current PIN
                      </label>
                      <input
                        type="password"
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value)}
                        placeholder="Current PIN"
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                        New PIN / Passcode
                      </label>
                      <input
                        type="password"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="Min 4 digits"
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                        Confirm New PIN
                      </label>
                      <input
                        type="password"
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="Confirm"
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-[#69776E]">
                      Must be at least 4 digits or characters. Changes take effect immediately.
                    </p>
                    <button
                      type="submit"
                      disabled={pinLoading}
                      className="px-4 py-2 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {pinLoading ? 'Updating PIN...' : 'Update Owner PIN'}
                    </button>
                  </div>
                </form>
              )}

              {/* Handover & Environment Tip */}
              <div className="pt-3 border-t border-[#F0EFEB] text-xs text-[#5D6B62] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#20392D] shrink-0 mt-0.5" />
                <p>
                  <strong>Owner Handover Tip:</strong> You can also set a private <code className="bg-[#F4F2EC] px-1 py-0.5 rounded font-mono text-[#1A2E23]">ADMIN_PIN</code> environment variable in your Render dashboard under <em>Environment Variables</em>. Render environment variables automatically take highest priority.
                </p>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-[#E2E8E4] shadow-2xs space-y-4">
              <h3 className="font-display font-medium text-base text-[#1A2E23]">
                M-Pesa Buy Goods Configuration
              </h3>
              <div className="space-y-2 text-xs text-[#45544A]">
                <div className="flex justify-between p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="text-[#64746A]">Till Number:</span>
                  <span className="font-mono font-bold text-sm text-[#1B3527]">{BUSINESS_CONFIG.mpesaTill}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="text-[#64746A]">Account Store Name:</span>
                  <span className="font-semibold text-[#1B3527]">{BUSINESS_CONFIG.mpesaStoreName}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="text-[#64746A]">Bank Account:</span>
                  <span className="font-mono text-[#1B3527]">{BUSINESS_CONFIG.bankDetails.bank} - {BUSINESS_CONFIG.bankDetails.accountNumber}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-[#E2E8E4] shadow-2xs space-y-4">
              <h3 className="font-display font-medium text-base text-[#1A2E23]">
                Apothecary Shop Logistics
              </h3>
              <div className="space-y-2 text-xs text-[#45544A]">
                <div className="p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="block text-[#64746A] mb-0.5">Physical Shop Location:</span>
                  <span className="font-medium text-[#1B3527]">{BUSINESS_CONFIG.location}</span>
                </div>
                <div className="p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="block text-[#64746A] mb-0.5">Operating Hours:</span>
                  <span className="font-medium text-[#1B3527]">{BUSINESS_CONFIG.hours}</span>
                </div>
                <div className="p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="block text-[#64746A] mb-0.5">WhatsApp Helpline:</span>
                  <span className="font-mono font-semibold text-[#1B3527]">{BUSINESS_CONFIG.whatsappNumber}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Editor Modal */}
        {isEditorOpen && (
          <AdminProductEditor
            product={editingProduct}
            categories={categories}
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            onSave={onSaveProduct}
            onDelete={onDeleteProduct}
          />
        )}
      </main>
    </div>
  );
};
