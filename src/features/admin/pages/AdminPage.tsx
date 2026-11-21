import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  LogOut,
  Store,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Check,
  UserCheck,
  Phone,
} from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { AdminSetupStatus, Category, MpesaPublicConfig, Order, OrderStatus, Product } from '../../../types';
import { api } from '../../../lib/api';
import { AdminInventoryTable } from '../components/AdminInventoryTable';
import { AdminOrderManagement } from '../components/AdminOrderManagement';
import { AdminProductEditor } from '../components/AdminProductEditor';

interface AdminPageProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  isLoggedIn: boolean;
  mpesaTill?: string;
  mpesaStoreName?: string;
  onPaymentConfigUpdated?: (cfg: MpesaPublicConfig) => void;
  onLogin: (credentials: { phone: string; password: string }) => Promise<boolean>;
  onLogout: () => void;
  onNavigateHome: () => void;
  onUpdateDeliveryFee: (orderId: string, fee: number, notes?: string) => Promise<void>;
  onUpdateStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  onConfirmPayment: (orderId: string, reference?: string) => Promise<void>;
  onRevertPayment?: (orderId: string) => Promise<void>;
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
  mpesaTill = '',
  mpesaStoreName = BUSINESS_CONFIG.mpesaStoreName,
  onPaymentConfigUpdated,
  onLogin,
  onLogout,
  onNavigateHome,
  onUpdateDeliveryFee,
  onUpdateStatus,
  onConfirmPayment,
  onRevertPayment,
  onSaveProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onUpdateStock,
  onToggleActive,
}) => {
  // Setup & Auth Status
  const [setupStatus, setSetupStatus] = useState<AdminSetupStatus | null>(null);
  const [setupLoading, setSetupLoading] = useState(true);

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Credentials Update State
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Payment & M-Pesa Till Configuration State
  const [tillInput, setTillInput] = useState(mpesaTill);
  const [storeNameInput, setStoreNameInput] = useState(mpesaStoreName);
  const [paymentSettingsMsg, setPaymentSettingsMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(false);

  // Workspace Tabs & Modals
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'INVENTORY' | 'SETTINGS'>('ORDERS');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchSetupStatus = async () => {
    try {
      const [status, mpesaCfg] = await Promise.all([
        api.getAdminSetupStatus(),
        api.getMpesaConfig(),
      ]);
      setSetupStatus(status);
      setNewPhoneInput(status.ownerPhone || BUSINESS_CONFIG.adminDefaultPhone);
      setTillInput(mpesaCfg.till || '');
      setStoreNameInput(mpesaCfg.storeName || BUSINESS_CONFIG.mpesaStoreName);
    } catch {
      // Fallback
    } finally {
      setSetupLoading(false);
    }
  };

  useEffect(() => {
    fetchSetupStatus();
  }, [isLoggedIn]);

  useEffect(() => {
    setTillInput(mpesaTill || '');
  }, [mpesaTill]);

  useEffect(() => {
    if (mpesaStoreName) setStoreNameInput(mpesaStoreName);
  }, [mpesaStoreName]);

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSettingsMsg(null);
    const cleanedTill = tillInput.trim();
    if (cleanedTill && !/^\d{4,12}$/.test(cleanedTill)) {
      setPaymentSettingsMsg({
        type: 'error',
        text: 'M-Pesa Buy Goods Till must be 4 to 12 digits (or leave empty until your Till is registered).',
      });
      return;
    }

    setPaymentSettingsLoading(true);
    try {
      const res = await api.updatePaymentSettings({
        mpesaTill: cleanedTill,
        mpesaStoreName: storeNameInput.trim() || BUSINESS_CONFIG.mpesaStoreName,
      });
      if (res.success && res.data) {
        onPaymentConfigUpdated?.(res.data);
        setTillInput(res.data.till || '');
        setStoreNameInput(res.data.storeName || BUSINESS_CONFIG.mpesaStoreName);
        setPaymentSettingsMsg({
          type: 'success',
          text: res.message || 'M-Pesa Buy Goods settings saved!',
        });
      } else {
        setPaymentSettingsMsg({
          type: 'error',
          text: res.error || 'Failed to save M-Pesa settings.',
        });
      }
    } catch {
      setPaymentSettingsMsg({ type: 'error', text: 'Network request failed.' });
    } finally {
      setPaymentSettingsLoading(false);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const ok = await onLogin({ phone: loginPhone, password: loginPassword });
      if (!ok) {
        setLoginError('Invalid phone number or password.');
      } else {
        setLoginPassword('');
      }
    } catch {
      setLoginError('Authentication failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Credentials / Password Change
  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg(null);

    const trimmedNewPhone = newPhoneInput.trim();
    const trimmedNewPassword = newPasswordInput.trim();

    if (!trimmedNewPhone) {
      setPasswordChangeMsg({ type: 'error', text: 'Please provide an admin phone number.' });
      return;
    }

    if (trimmedNewPassword && trimmedNewPassword.length < 4) {
      setPasswordChangeMsg({
        type: 'error',
        text: 'New password must be at least 4 characters.',
      });
      return;
    }

    if (trimmedNewPassword && trimmedNewPassword !== confirmPasswordInput.trim()) {
      setPasswordChangeMsg({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changeOwnerPassword({
        currentPassword: currentPasswordInput,
        newPassword: trimmedNewPassword || undefined,
        newPhone: trimmedNewPhone,
      });

      if (res.success) {
        setPasswordChangeMsg({
          type: 'success',
          text: 'Admin phone number & password updated successfully!',
        });
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        await fetchSetupStatus();
      } else {
        setPasswordChangeMsg({
          type: 'error',
          text: res.error || 'Failed to update credentials.',
        });
      }
    } catch {
      setPasswordChangeMsg({ type: 'error', text: 'Network request failed.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // -------------------------------------------------------------
  // IF NOT LOGGED IN: Render Phone + Password Login Screen
  // -------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F4F6F4] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E2E6E3] p-6 sm:p-8 space-y-6">
          {/* Brand & Portal Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E8EFEA] text-[#224032] mx-auto flex items-center justify-center font-bold text-lg shadow-2xs">
              NN
            </div>
            <h1 className="font-display font-semibold text-2xl text-[#182C22]">
              Nature’s Nectar Wellness
            </h1>
            <p className="text-xs text-[#58665C]">
              Admin Operations & Store Management Console
            </p>
          </div>

          {setupLoading ? (
            <div className="py-10 text-center text-xs text-[#6B796F]">
              Loading admin sign-in...
            </div>
          ) : (
            <div className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#3A463D] mb-1">
                    Admin Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      autoFocus
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="0757122299"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#3A463D] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
                    />
                  </div>
                </div>

                {!setupStatus?.isClaimed && (
                  <p className="text-[11px] text-[#5C6A60] bg-[#F4F7F5] border border-[#E1E8E3] rounded-xl px-3 py-2 text-center">
                    Default phone: <span className="font-mono font-semibold text-[#182C22]">{BUSINESS_CONFIG.adminDefaultPhone}</span> · Default password: <span className="font-mono font-semibold text-[#182C22]">{BUSINESS_CONFIG.adminDefaultPassword}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loginLoading || !loginPhone || !loginPassword}
                  className="w-full bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7D9185] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
                >
                  {loginLoading ? 'Verifying...' : 'Sign In to Admin Portal'}
                </button>
              </form>
            </div>
          )}

          {/* Back to Customer Storefront */}
          <div className="pt-4 border-t border-[#ECEBE6] text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs font-medium text-[#4D5A50] hover:text-[#182C22] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customer Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LOGGED IN WORKSPACE
  // -------------------------------------------------------------
  const pendingRouteReviews = orders.filter(
    (o) => o.status === 'REVIEWING_DELIVERY' || o.deliveryFee === null
  ).length;

  const awaitingPayment = orders.filter(
    (o) => o.status === 'AWAITING_PAYMENT'
  ).length;

  const activePhone = setupStatus?.ownerPhone || BUSINESS_CONFIG.adminDefaultPhone;

  return (
    <div className="min-h-screen bg-[#F7F9F7] text-[#242A24] flex flex-col">
      {/* Standalone Admin Top Navigation */}
      <header className="bg-white border-b border-[#E5E9E6] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E8EFEA] text-[#224032] flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
              NN
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-semibold text-base sm:text-lg text-[#1A2E23] truncate">
                  Nature’s Nectar
                </span>
                <span className="text-[10px] sm:text-[11px] bg-[#E2ECE5] text-[#1E3B2F] font-semibold px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-[#5D6B62] truncate hidden sm:block">
                Apothecary Management & Fulfillment Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#EBF5EF] border border-[#C5E1CF] rounded-xl text-xs text-[#245C38]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#245C38]" />
              <span>
                Admin: <strong className="font-mono">{activePhone}</strong>
              </span>
            </div>

            <button
              onClick={onNavigateHome}
              className="text-xs font-medium text-[#384A3E] hover:text-[#182C22] bg-[#F2F5F3] hover:bg-[#E6EDE8] p-2 sm:px-3.5 sm:py-2 rounded-xl border border-[#D6E0D9] flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              title="View Customer Storefront"
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            <button
              onClick={onLogout}
              className="text-xs font-medium text-[#7C3636] hover:bg-[#FDF2F2] p-2 sm:px-3 sm:py-2 rounded-xl border border-[#F2D4D4] flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full space-y-5">
        {/* Tab Navigation - Touch Scrollable for Phones */}
        <div className="flex border-b border-[#E2E8E4] space-x-4 sm:space-x-6 text-xs sm:text-sm overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`pb-3 font-medium transition-colors cursor-pointer border-b-2 -mb-[2px] flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ORDERS'
                ? 'border-[#20392D] text-[#1A2E23] font-semibold'
                : 'border-transparent text-[#66756B] hover:text-[#1A2E23]'
            }`}
          >
            <span>Orders ({orders.length})</span>
            {pendingRouteReviews + awaitingPayment > 0 && (
              <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] font-bold px-1.5 py-0.2 rounded-full">
                {pendingRouteReviews + awaitingPayment}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`pb-3 font-medium transition-colors cursor-pointer border-b-2 -mb-[2px] shrink-0 ${
              activeTab === 'INVENTORY'
                ? 'border-[#20392D] text-[#1A2E23] font-semibold'
                : 'border-transparent text-[#66756B] hover:text-[#1A2E23]'
            }`}
          >
            Inventory ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-3 font-medium transition-colors cursor-pointer border-b-2 -mb-[2px] shrink-0 ${
              activeTab === 'SETTINGS'
                ? 'border-[#20392D] text-[#1A2E23] font-semibold'
                : 'border-transparent text-[#66756B] hover:text-[#1A2E23]'
            }`}
          >
            Security & Account
          </button>
        </div>

        {/* Tab 1: Orders Management & Dedicated Workflow */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            <AdminOrderManagement
              orders={orders}
              mpesaTill={tillInput}
              mpesaStoreName={storeNameInput}
              onUpdateDeliveryFee={onUpdateDeliveryFee}
              onUpdateStatus={onUpdateStatus}
              onConfirmPayment={onConfirmPayment}
              onRevertPayment={onRevertPayment}
            />
          </div>
        )}

        {/* Tab 2: Inventory */}
        {activeTab === 'INVENTORY' && (
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8E4] shadow-xs">
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

        {/* Tab 3: Settings & Admin Credentials */}
        {activeTab === 'SETTINGS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Credentials Card */}
            <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-[#E2E8E4] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EFEB] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF0EC] text-[#20392D] flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-medium text-base text-[#1A2E23]">
                      Admin Phone & Password
                    </h3>
                    <p className="text-xs text-[#5D6B62]">
                      Manage the phone number and password used to access this admin console.
                    </p>
                  </div>
                </div>

                <div>
                  {setupStatus?.isClaimed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]">
                      <Check className="w-3.5 h-3.5 text-[#245C38]" />
                      Custom Credentials Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      <AlertCircle className="w-3.5 h-3.5 text-[#B45309]" />
                      Using Default Credentials
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F8F9F8] rounded-xl border border-[#E6EAE7] text-xs">
                  <div>
                    <span className="text-[#64746A] block mb-0.5">Role:</span>
                    <strong className="text-[#1A2E23] font-semibold text-sm">
                      {setupStatus?.ownerName || 'Store Owner'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#64746A] block mb-0.5">Admin Phone Number:</span>
                    <strong className="text-[#1A2E23] font-mono">
                      {activePhone}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#64746A] block mb-0.5">Last Updated:</span>
                    <span className="text-[#4D5D51]">
                      {setupStatus?.claimedAt
                        ? new Date(setupStatus.claimedAt).toLocaleDateString()
                        : 'Default setup'}
                    </span>
                  </div>
                </div>

                {/* Update Phone & Password Form */}
                <form onSubmit={handleChangeCredentials} className="space-y-4 max-w-2xl">
                  <h4 className="text-xs font-semibold text-[#29362D] uppercase tracking-wide">
                    Update Admin Credentials
                  </h4>

                  {passwordChangeMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        passwordChangeMsg.type === 'success'
                          ? 'bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]'
                          : 'bg-[#FDF2F2] text-[#C53030] border border-[#F8D7D7]'
                      }`}
                    >
                      {passwordChangeMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245C38]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-[#C53030]" />
                      )}
                      <span>{passwordChangeMsg.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                        Admin Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newPhoneInput}
                        onChange={(e) => setNewPhoneInput(e.target.value)}
                        placeholder="0757122299"
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                        New Password (optional, min 4 chars)
                      </label>
                      <input
                        type="password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-4 py-2 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading ? 'Saving Changes...' : 'Save Credentials'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* M-Pesa Buy Goods Configuration */}
            <form
              onSubmit={handleSavePaymentSettings}
              className="p-6 bg-white rounded-2xl border border-[#E2E8E4] shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-medium text-base text-[#1A2E23]">
                  M-Pesa Buy Goods Till
                </h3>
                {tillInput.trim() ? (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]">
                    Till Active
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F4F6F4] text-[#5D6B62] border border-[#DCE2DD]">
                    Not Set Yet
                  </span>
                )}
              </div>

              <p className="text-xs text-[#5D6B62] leading-relaxed">
                Leave Till Number empty until your real Lipa na M-Pesa Till is registered. Add it anytime to activate live storefront Till display immediately without code changes.
              </p>

              {paymentSettingsMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    paymentSettingsMsg.type === 'success'
                      ? 'bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]'
                      : 'bg-[#FDF2F2] text-[#C53030] border border-[#F8D7D7]'
                  }`}
                >
                  {paymentSettingsMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245C38]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#C53030]" />
                  )}
                  <span>{paymentSettingsMsg.text}</span>
                </div>
              )}

              <div className="space-y-3 text-xs text-[#45544A]">
                <div>
                  <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                    Buy Goods Till Number (Optional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tillInput}
                    onChange={(e) => setTillInput(e.target.value)}
                    placeholder="Add real M-Pesa Till when ready"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                    Account Store Name
                  </label>
                  <input
                    type="text"
                    value={storeNameInput}
                    onChange={(e) => setStoreNameInput(e.target.value)}
                    placeholder={BUSINESS_CONFIG.mpesaStoreName}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                  />
                </div>
                <div className="flex justify-between p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="text-[#64746A]">Bank Account:</span>
                  <span className="font-mono text-[#1B3527]">
                    {BUSINESS_CONFIG.bankDetails.bank} - {BUSINESS_CONFIG.bankDetails.accountNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {tillInput && (
                  <button
                    type="button"
                    disabled={paymentSettingsLoading}
                    onClick={() => setTillInput('')}
                    className="px-3 py-2 text-xs font-medium text-[#5D6B62] hover:text-[#1A2E23] rounded-xl border border-[#DCDAD2] cursor-pointer"
                  >
                    Clear Till
                  </button>
                )}
                <button
                  type="submit"
                  disabled={paymentSettingsLoading}
                  className="px-4 py-2 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {paymentSettingsLoading ? 'Saving...' : 'Save M-Pesa Settings'}
                </button>
              </div>
            </form>

            {/* Apothecary Shop Logistics */}
            <div className="p-6 bg-white rounded-2xl border border-[#E2E8E4] shadow-xs space-y-4">
              <h3 className="font-display font-medium text-base text-[#1A2E23]">
                Apothecary Shop Logistics
              </h3>
              <div className="space-y-2 text-xs text-[#45544A]">
                <div className="p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="block text-[#64746A] mb-0.5">Physical Shop Location:</span>
                  <span className="font-medium text-[#1B3527]">
                    {BUSINESS_CONFIG.location}
                  </span>
                </div>
                <div className="p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="block text-[#64746A] mb-0.5">Operating Hours:</span>
                  <span className="font-medium text-[#1B3527]">
                    {BUSINESS_CONFIG.hours}
                  </span>
                </div>
                <div className="p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="block text-[#64746A] mb-0.5">WhatsApp Helpline:</span>
                  <span className="font-mono font-semibold text-[#1B3527]">
                    {BUSINESS_CONFIG.whatsappNumber}
                  </span>
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
