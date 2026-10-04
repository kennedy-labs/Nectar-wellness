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
  ArrowLeft,
  Settings,
  KeyRound,
  Check,
  UserPlus,
  UserCheck,
  Mail,
  User,
  Sparkles,
} from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { formatKES } from '../../../lib/utils';
import { AdminSetupStatus, Category, Order, OrderStatus, Product } from '../../../types';
import { api } from '../../../lib/api';
import { AdminInventoryTable } from '../components/AdminInventoryTable';
import { AdminOrderManagement } from '../components/AdminOrderManagement';
import { AdminProductEditor } from '../components/AdminProductEditor';

interface AdminPageProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  isLoggedIn: boolean;
  onLogin: (credentials: { email?: string; password?: string; pin?: string } | string) => Promise<boolean>;
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
  // Setup & Auth Status
  const [setupStatus, setSetupStatus] = useState<AdminSetupStatus | null>(null);
  const [setupLoading, setSetupLoading] = useState(true);
  const [authViewMode, setAuthViewMode] = useState<'LOGIN' | 'REGISTER' | 'DEV'>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [pin, setPin] = useState('2540');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Owner Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Password Change State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Workspace Tabs & Modals
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'INVENTORY' | 'SETTINGS'>('ORDERS');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchSetupStatus = async () => {
    try {
      const status = await api.getAdminSetupStatus();
      setSetupStatus(status);
      if (!status.isClaimed) {
        setAuthViewMode('REGISTER');
      } else {
        setAuthViewMode('LOGIN');
        if (status.ownerEmail) {
          setLoginEmail(status.ownerEmail);
        }
      }
    } catch {
      // Fallback
    } finally {
      setSetupLoading(false);
    }
  };

  useEffect(() => {
    fetchSetupStatus();
  }, [isLoggedIn]);

  // Handle Owner Registration
  const handleRegisterOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regEmail || !regEmail.includes('@')) {
      setRegError('Please provide a valid official email address.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await api.setupOwner({
        email: regEmail,
        password: regPassword,
        name: regName.trim() || 'Store Owner',
      });

      if (res.success) {
        await onLogin({ email: regEmail, password: regPassword });
        await fetchSetupStatus();
      } else {
        setRegError(res.error || 'Registration failed.');
      }
    } catch {
      setRegError('Network error during registration.');
    } finally {
      setRegLoading(false);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      let ok = false;
      if (authViewMode === 'DEV') {
        ok = await onLogin(pin);
      } else {
        ok = await onLogin({ email: loginEmail, password: loginPassword });
      }

      if (!ok) {
        setLoginError(
          authViewMode === 'DEV'
            ? 'Invalid Setup PIN. Please check and try again.'
            : 'Invalid owner email or password.'
        );
      }
    } catch {
      setLoginError('Authentication failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg(null);

    if (newPasswordInput.length < 6) {
      setPasswordChangeMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changeOwnerPassword({
        email: setupStatus?.ownerEmail || '',
        currentPassword: currentPasswordInput,
        newPassword: newPasswordInput,
      });

      if (res.success) {
        setPasswordChangeMsg({ type: 'success', text: 'Owner password updated successfully!' });
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      } else {
        setPasswordChangeMsg({ type: 'error', text: res.error || 'Failed to update password.' });
      }
    } catch {
      setPasswordChangeMsg({ type: 'error', text: 'Network request failed.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // -------------------------------------------------------------
  // IF NOT LOGGED IN: Render Setup / Registration or Login Screen
  // -------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F4F6F4] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#E2E6E3] p-6 sm:p-8 space-y-6">
          {/* Brand & Portal Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E8EFEA] text-[#224032] mx-auto flex items-center justify-center font-bold text-lg shadow-2xs">
              NN
            </div>
            <h1 className="font-display font-semibold text-2xl text-[#182C22]">
              Nature’s Nectar Wellness
            </h1>
            <p className="text-xs text-[#58665C]">
              Operations & Store Management Console
            </p>
          </div>

          {setupLoading ? (
            <div className="py-12 text-center text-xs text-[#6B796F]">
              Checking store setup status...
            </div>
          ) : !setupStatus?.isClaimed ? (
            /* UNCLAIMED INITIAL SETUP EXPERIENCE */
            <div className="space-y-5">
              {/* Segmented Mode Selector */}
              <div className="flex bg-[#F2F4F2] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAuthViewMode('REGISTER')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authViewMode === 'REGISTER'
                      ? 'bg-white text-[#182C22] shadow-2xs font-semibold'
                      : 'text-[#5C6E62] hover:text-[#182C22]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#2D5A42]" />
                  <span>Register as Store Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthViewMode('DEV')}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authViewMode === 'DEV'
                      ? 'bg-white text-[#182C22] shadow-2xs font-semibold'
                      : 'text-[#5C6E62] hover:text-[#182C22]'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#856404]" />
                  <span>Developer Access</span>
                </button>
              </div>

              {authViewMode === 'REGISTER' ? (
                /* OWNER REGISTRATION FORM */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#EBF5EF] border border-[#C5E1CF] text-xs text-[#245C38] flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 shrink-0 text-[#245C38] mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Store Ownership Unclaimed</strong>
                      <span>
                        Are you the real owner? Register your email and password below to claim full, permanent ownership of the system.
                      </span>
                    </div>
                  </div>

                  {regError && (
                    <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterOwner} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[#3A463D] mb-1">
                        Full Name / Store Owner Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Kennedy N."
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#3A463D] mb-1">
                        Official Store Owner Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="owner@naturesnectar.co.ke"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#3A463D] mb-1">
                          Create Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Min 6 chars"
                            className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#3A463D] mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="Confirm"
                            className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7D9185] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs mt-2"
                    >
                      {regLoading ? 'Registering Store Owner...' : 'Register & Claim Store Ownership'}
                    </button>
                  </form>
                </div>
              ) : (
                /* DEVELOPER TEMPORARY ACCESS */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#B45309] mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Temporary Developer Access</strong>
                      <span>
                        Use this while setting up and testing. Once the real owner completes registration above, this temporary access is revoked.
                      </span>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[#3A463D] mb-1">
                        Developer Setup PIN
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="2540"
                          className="w-full pl-9 pr-3 py-2.5 text-center font-mono tracking-widest text-sm bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-[#3D5245] hover:bg-[#2A3A30] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
                    >
                      {loginLoading ? 'Entering Console...' : 'Continue as Developer (PIN: 2540)'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* CLAIMED: REAL OWNER EMAIL + PASSWORD LOGIN */
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-[#EBF5EF] border border-[#C5E1CF] text-xs text-[#245C38] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#245C38]" />
                  <span>
                    Store Owner: <strong>{setupStatus.ownerName}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#D3E8DA] px-2 py-0.5 rounded-md text-[#1E4D2F]">
                  Owner Secured
                </span>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#3A463D] mb-1">
                    Registered Owner Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="owner@example.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
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
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAFAF8] border border-[#D5D3CA] focus:border-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7D9185] text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
                >
                  {loginLoading ? 'Verifying...' : 'Sign In as Store Owner'}
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
                Apothecary Management & Fulfillment Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Store Ownership Status Badge */}
            {setupStatus?.isClaimed ? (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#EBF5EF] border border-[#C5E1CF] rounded-xl text-xs text-[#245C38]">
                <UserCheck className="w-3.5 h-3.5 text-[#245C38]" />
                <span>
                  Owner: <strong>{setupStatus.ownerName}</strong> ({setupStatus.ownerEmail})
                </span>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
                <AlertCircle className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Developer Mode (Unclaimed)</span>
                <button
                  onClick={() => setActiveTab('SETTINGS')}
                  className="underline font-semibold text-[#78350F] hover:text-black cursor-pointer"
                >
                  Claim Now
                </button>
              </div>
            )}

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
        {/* Tab Navigation */}
        <div className="flex border-b border-[#E2E8E4] space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`pb-3 font-medium transition-colors cursor-pointer border-b-2 -mb-[2px] flex items-center gap-2 ${
              activeTab === 'ORDERS'
                ? 'border-[#20392D] text-[#1A2E23] font-semibold'
                : 'border-transparent text-[#66756B] hover:text-[#1A2E23]'
            }`}
          >
            <span>Orders Fulfillment ({orders.length})</span>
            {pendingRouteReviews + awaitingPayment > 0 && (
              <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] font-bold px-1.5 py-0.2 rounded-full">
                {pendingRouteReviews + awaitingPayment} pending
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`pb-3 font-medium transition-colors cursor-pointer border-b-2 -mb-[2px] ${
              activeTab === 'INVENTORY'
                ? 'border-[#20392D] text-[#1A2E23] font-semibold'
                : 'border-transparent text-[#66756B] hover:text-[#1A2E23]'
            }`}
          >
            Apothecary Inventory ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-3 font-medium transition-colors cursor-pointer border-b-2 -mb-[2px] ${
              activeTab === 'SETTINGS'
                ? 'border-[#20392D] text-[#1A2E23] font-semibold'
                : 'border-transparent text-[#66756B] hover:text-[#1A2E23]'
            }`}
          >
            Owner Security & Settings
          </button>
        </div>

        {/* Tab 1: Orders Management & Dedicated Workflow */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            <AdminOrderManagement
              orders={orders}
              onUpdateDeliveryFee={onUpdateDeliveryFee}
              onUpdateStatus={onUpdateStatus}
              onConfirmPayment={onConfirmPayment}
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

        {/* Tab 3: Settings & Store Owner Management */}
        {activeTab === 'SETTINGS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Owner Credentials Card */}
            <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-[#E2E8E4] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EFEB] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF0EC] text-[#20392D] flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-medium text-base text-[#1A2E23]">
                      Store Owner Account & Exclusive Ownership
                    </h3>
                    <p className="text-xs text-[#5D6B62]">
                      System ownership credentials and administrative password.
                    </p>
                  </div>
                </div>

                <div>
                  {setupStatus?.isClaimed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EBF5EF] text-[#245C38] border border-[#C5E1CF]">
                      <Check className="w-3.5 h-3.5 text-[#245C38]" />
                      Claimed & Secured by Real Owner
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                      <AlertCircle className="w-3.5 h-3.5 text-[#B45309]" />
                      Ownership Pending Registration
                    </span>
                  )}
                </div>
              </div>

              {setupStatus?.isClaimed ? (
                /* CLAIMED OWNER ACCOUNT INFO & PASSWORD CHANGE */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F8F9F8] rounded-xl border border-[#E6EAE7] text-xs">
                    <div>
                      <span className="text-[#64746A] block mb-0.5">Registered Owner:</span>
                      <strong className="text-[#1A2E23] font-semibold text-sm">
                        {setupStatus.ownerName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#64746A] block mb-0.5">Owner Email Address:</span>
                      <strong className="text-[#1A2E23] font-mono">
                        {setupStatus.ownerEmail}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#64746A] block mb-0.5">Claimed On:</span>
                      <span className="text-[#4D5D51]">
                        {setupStatus.claimedAt
                          ? new Date(setupStatus.claimedAt).toLocaleDateString()
                          : 'Initial setup'}
                      </span>
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                    <h4 className="text-xs font-semibold text-[#29362D] uppercase tracking-wide">
                      Update Owner Password
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPasswordInput}
                          onChange={(e) => setCurrentPasswordInput(e.target.value)}
                          placeholder="Current password"
                          required
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder="Min 6 chars"
                          required
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          placeholder="Confirm"
                          required
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
                        {passwordLoading ? 'Updating Password...' : 'Save New Password'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* UNCLAIMED: OWNER REGISTRATION FORM INSIDE SETTINGS */
                <div className="space-y-4 max-w-xl">
                  <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E]">
                    The store is currently running in <strong>Developer Mode</strong>. As the real owner, register your email and password below to take permanent exclusive control.
                  </div>

                  {regError && (
                    <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterOwner} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                        Store Owner Name
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Owner name"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                        Owner Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="owner@naturesnectar.co.ke"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                          Password (min 6 chars)
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#4D5A50] mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Confirm"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5D3CA] bg-white outline-none focus:border-[#20392D]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="px-4 py-2 bg-[#20392D] hover:bg-[#162920] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                    >
                      {regLoading ? 'Registering...' : 'Register as Store Owner'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* M-Pesa Buy Goods Configuration */}
            <div className="p-6 bg-white rounded-2xl border border-[#E2E8E4] shadow-xs space-y-4">
              <h3 className="font-display font-medium text-base text-[#1A2E23]">
                M-Pesa Buy Goods Configuration
              </h3>
              <div className="space-y-2 text-xs text-[#45544A]">
                <div className="flex justify-between p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="text-[#64746A]">Till Number:</span>
                  <span className="font-mono font-bold text-sm text-[#1B3527]">
                    {BUSINESS_CONFIG.mpesaTill}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="text-[#64746A]">Account Store Name:</span>
                  <span className="font-semibold text-[#1B3527]">
                    {BUSINESS_CONFIG.mpesaStoreName}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#F6F8F6] rounded-lg">
                  <span className="text-[#64746A]">Bank Account:</span>
                  <span className="font-mono text-[#1B3527]">
                    {BUSINESS_CONFIG.bankDetails.bank} - {BUSINESS_CONFIG.bankDetails.accountNumber}
                  </span>
                </div>
              </div>
            </div>

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
