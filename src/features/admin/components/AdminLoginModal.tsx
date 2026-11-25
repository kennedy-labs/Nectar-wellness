import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Phone, AlertCircle } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: { phone: string; password: string }) => Promise<boolean>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const ok = await onLogin({ phone, password });
      if (!ok) {
        setError('Invalid phone number or password. Please try again.');
      } else {
        setPhone('');
        setPassword('');
        onClose();
      }
    } catch {
      setError('Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-[#E6E4DD] p-6 space-y-5 text-center my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full text-[#5B665E] hover:text-[#172A22] hover:bg-[#F2F1EC] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-[#EBF3EE] text-[#2C4C3D] mx-auto flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="font-display font-medium text-lg text-[#172A22]">
            Apothecary Admin Access
          </h2>
          <p className="text-xs text-[#5C6A60] leading-relaxed">
            Sign in with your admin phone number and password to manage orders, delivery fees, and inventory.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {error && (
            <div className="p-2.5 rounded-lg bg-[#FDF2F2] border border-[#F8D7D7] text-xs text-[#9B1C1C] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#3A463D]">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={BUSINESS_CONFIG.adminDefaultPhone}
                className="w-full min-h-[44px] pl-9 pr-3.5 py-2.5 text-base sm:text-sm bg-white border border-[#D5D3CA] focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#3A463D]">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7A877E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full min-h-[44px] pl-9 pr-3.5 py-2.5 text-base sm:text-sm bg-white border border-[#D5D3CA] focus:border-[#2D4C3D] focus:ring-1 focus:ring-[#2D4C3D] rounded-xl outline-none text-[#242A24]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !phone || !password}
            className="w-full min-h-[46px] bg-[#20392D] hover:bg-[#162920] disabled:bg-[#7D9185] text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer touch-manipulation"
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
