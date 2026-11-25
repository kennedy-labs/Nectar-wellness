import React, { useEffect, useState } from 'react';
import { Check, CheckCircle2, Copy, Loader2, RefreshCw, Smartphone, AlertCircle } from 'lucide-react';
import { BUSINESS_CONFIG } from '../../../config/constants';
import { api } from '../../../lib/api';
import { formatKES } from '../../../lib/utils';
import { Order } from '../../../types';

interface MpesaPayBoxProps {
  order: Order;
  mpesaTill?: string;
  mpesaStoreName?: string;
  onOrderUpdated?: (order: Order) => void;
}

export const MpesaPayBox: React.FC<MpesaPayBoxProps> = ({
  order,
  mpesaTill = '',
  mpesaStoreName = BUSINESS_CONFIG.mpesaStoreName,
  onOrderUpdated,
}) => {
  const [liveOrder, setLiveOrder] = useState<Order>(order);
  const [mpesaEnabled, setMpesaEnabled] = useState<boolean>(false);
  const [tillNumber, setTillNumber] = useState<string>(mpesaTill.trim());
  const [storeName, setStoreName] = useState<string>(mpesaStoreName);
  const [phone, setPhone] = useState<string>(order.customerPhone || '');
  const [copiedTill, setCopiedTill] = useState(false);

  const [sendingPrompt, setSendingPrompt] = useState(false);
  const [awaitingPin, setAwaitingPin] = useState(order.mpesaStatus === 'PENDING');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(order.mpesaStatusMessage || '');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setLiveOrder(order);
    setPhone(order.customerPhone || '');
    if (order.mpesaStatus === 'PENDING' && order.paymentStatus !== 'CONFIRMED') {
      setAwaitingPin(true);
    } else if (order.paymentStatus === 'CONFIRMED') {
      setAwaitingPin(false);
    }
  }, [order]);

  useEffect(() => {
    let mounted = true;
    api.getMpesaConfig().then((cfg) => {
      if (!mounted) return;
      setMpesaEnabled(Boolean(cfg.enabled));
      setTillNumber((cfg.till || '').trim());
      if (cfg.storeName) setStoreName(cfg.storeName);
    });
    return () => {
      mounted = false;
    };
  }, [mpesaTill, mpesaStoreName]);

  // Poll order status while waiting for M-Pesa PIN confirmation
  useEffect(() => {
    if (!awaitingPin || liveOrder.paymentStatus === 'CONFIRMED') return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        // Every 3rd poll, also query Daraja directly in case callback is delayed
        const updated =
          attempts % 3 === 0
            ? await api.queryMpesaStatus(liveOrder.id)
            : await api.getOrderById(liveOrder.id);

        if (updated) {
          setLiveOrder(updated);
          if (updated.paymentStatus === 'CONFIRMED') {
            setAwaitingPin(false);
            setStatusMessage('M-Pesa payment confirmed.');
            onOrderUpdated?.(updated);
          } else if (updated.mpesaStatus === 'FAILED') {
            setAwaitingPin(false);
            setErrorMessage(updated.mpesaStatusMessage || 'M-Pesa prompt was cancelled or timed out.');
            onOrderUpdated?.(updated);
          }
        }
      } catch {
        // Keep polling until max attempts
      }

      if (attempts >= 20) {
        setAwaitingPin(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [awaitingPin, liveOrder.id, liveOrder.paymentStatus, onOrderUpdated]);

  const handleCopyTill = () => {
    navigator.clipboard.writeText(tillNumber);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

  const handleSendStkPush = async () => {
    setErrorMessage('');
    setStatusMessage('');
    try {
      setSendingPrompt(true);
      const res = await api.initiateMpesaStkPush(liveOrder.id, phone);
      setLiveOrder(res.order);
      setAwaitingPin(true);
      setStatusMessage(res.customerMessage || 'Check your phone and enter your M-Pesa PIN.');
      onOrderUpdated?.(res.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not send M-Pesa prompt. You can pay via Till below.');
    } finally {
      setSendingPrompt(false);
    }
  };

  const handleVerifyNow = async () => {
    setErrorMessage('');
    try {
      setCheckingStatus(true);
      const updated = await api.queryMpesaStatus(liveOrder.id);
      if (updated) {
        setLiveOrder(updated);
        if (updated.paymentStatus === 'CONFIRMED') {
          setAwaitingPin(false);
          setStatusMessage('M-Pesa payment confirmed.');
          onOrderUpdated?.(updated);
        } else if (updated.mpesaStatus === 'FAILED') {
          setAwaitingPin(false);
          setErrorMessage(updated.mpesaStatusMessage || 'Payment was not completed.');
        } else {
          setStatusMessage('Still waiting for M-Pesa PIN confirmation...');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not check payment status right now.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const isPaid = liveOrder.paymentStatus === 'CONFIRMED';
  const isTotalFinalized = liveOrder.deliveryMethod === 'PICKUP' || liveOrder.deliveryFee !== null;
  const amountToPay = liveOrder.totalAmount > 0 ? liveOrder.totalAmount : liveOrder.subtotal;

  if (isPaid) {
    return (
      <div className="p-4 rounded-xl bg-[#EAF5EE] border border-[#BFE0CA] text-left space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[#1B5E20]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>M-Pesa Payment Confirmed</span>
          </div>
          <span className="font-mono font-bold text-[#172A22]">{formatKES(amountToPay)}</span>
        </div>
        {liveOrder.paymentReference && (
          <div className="text-[11px] text-[#2B5338] flex items-center justify-between">
            <span>Receipt Reference:</span>
            <span className="font-mono font-semibold">{liveOrder.paymentReference}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-left">
      {/* Direct STK Push Box when Daraja is configured & total is finalized */}
      {mpesaEnabled && isTotalFinalized && (
        <div className="p-4 rounded-xl bg-[#F2F8F4] border border-[#C6DFCF] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-[#172A22]">
              <Smartphone className="w-4 h-4 text-[#2E7D32]" />
              <span>Instant M-Pesa Prompt</span>
            </div>
            <span className="font-mono font-bold text-[#1F372C]">{formatKES(amountToPay)}</span>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-[#FDF2F2] border border-[#F8D7D7] text-[11px] text-[#9B1C1C] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {awaitingPin ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-white border border-[#D4E6DA] text-[11px] text-[#244732] flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-[#2E7D32] shrink-0" />
                <span>{statusMessage || 'Check your phone and enter your M-Pesa PIN to complete payment.'}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleVerifyNow}
                  disabled={checkingStatus}
                  className="flex-1 min-h-[44px] bg-[#20392D] hover:bg-[#162920] disabled:opacity-60 text-white py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
                  <span>{checkingStatus ? 'Verifying...' : "I've Paid — Verify Now"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendStkPush}
                  disabled={sendingPrompt}
                  className="min-h-[44px] px-4 py-2.5 rounded-lg border border-[#C9D8CE] bg-white hover:bg-[#F5F8F6] text-[#1F372C] text-xs font-medium cursor-pointer touch-manipulation"
                >
                  Resend
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="M-Pesa Number (e.g. 07XX...)"
                  className="flex-1 min-h-[44px] text-base sm:text-xs px-3 py-2.5 rounded-lg border border-[#CED9D1] bg-white focus:border-[#2D4C3D] outline-none text-[#172A22]"
                />
                <button
                  type="button"
                  onClick={handleSendStkPush}
                  disabled={sendingPrompt}
                  className="min-h-[44px] bg-[#2E7D32] hover:bg-[#236326] disabled:bg-[#82AD85] text-white px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap touch-manipulation"
                >
                  {sendingPrompt ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Pay Now via M-Pesa</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#4C6154]">
                Tap Pay Now to receive an instant M-Pesa PIN popup on your phone (zero extra gateway fee).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual M-Pesa Buy Goods Till Fallback / Direct Payment Confirmation */}
      {tillNumber ? (
        <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E6DF] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#1F372C]">
              {mpesaEnabled && isTotalFinalized ? 'Or Pay Manually via M-Pesa Till' : 'M-Pesa Buy Goods Till'}
            </span>
            <button
              type="button"
              onClick={handleCopyTill}
              className="text-[#2D4C3D] hover:text-[#183023] flex items-center gap-1 font-medium cursor-pointer min-h-[36px] px-2 -mr-2 rounded-lg hover:bg-[#EFECE5] transition-colors"
            >
              {copiedTill ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Till</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-[#E0DED7]">
            <span className="text-[#5B665E]">Till Number:</span>
            <span className="font-mono font-bold text-sm text-[#1B3527]">{tillNumber}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#637066]">
            <span>Store Name:</span>
            <span className="font-semibold text-[#20392D]">{storeName}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#637066] border-t border-[#EAE8E1] pt-2">
            <span>{isTotalFinalized ? 'Total Amount:' : 'Products Subtotal:'}</span>
            <span className="font-mono font-semibold text-[#172A22] tabular-nums">
              {formatKES(amountToPay)}
            </span>
          </div>

          {mpesaEnabled && !isTotalFinalized && (
            <p className="text-[11px] text-[#4C6154] pt-1">
              Instant M-Pesa PIN prompt unlocks automatically once our team confirms your delivery fee.
            </p>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E6DF] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#1F372C]">M-Pesa Payment Confirmation</span>
            <span className="font-mono font-semibold text-[#172A22] tabular-nums">
              {formatKES(amountToPay)}
            </span>
          </div>
          <p className="text-[11px] text-[#556358] leading-relaxed">
            {isTotalFinalized
              ? `Our team will share verified M-Pesa payment details directly on WhatsApp or call/SMS ${BUSINESS_CONFIG.phoneDisplay} to complete your order.`
              : `Once our team confirms your delivery fee, verified M-Pesa payment details will be shared right on WhatsApp (${BUSINESS_CONFIG.phoneDisplay}).`}
          </p>
        </div>
      )}
    </div>
  );
};
