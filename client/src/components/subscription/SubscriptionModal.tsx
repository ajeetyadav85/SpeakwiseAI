import React, { useState } from 'react';
import { useSubscriptionStore, SUBSCRIPTION_PLANS } from '../../stores/useSubscriptionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { RazorpayService } from '../../services/razorpay.service';
import { SubscriptionPlanOption } from '../../types';
import {
  X,
  CheckCircle2,
  Crown,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  QrCode,
  Smartphone,
  CreditCard,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const SubscriptionModal: React.FC = () => {
  const {
    subscriptionModalOpen,
    closeSubscriptionModal,
    isPro,
    activePlanId,
    planExpiresAt,
    upgradeToPro,
  } = useSubscriptionStore();
  const { user } = useAuthStore();

  // Selected recharge plan (default 1 Month Pro ₹99 or 1 Day ₹9)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanOption>(SUBSCRIPTION_PLANS[0]);
  const [paymentTab, setPaymentTab] = useState<'UPI_QR' | 'UPI_ID' | 'CARDS_NETBANKING'>('UPI_QR');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const SPEAKWISE_UPI_ID = 'speakwise.ai@okhdfcbank';

  // Modal must open regardless of whether user is pro or not!
  if (!subscriptionModalOpen) return null;

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === activePlanId) || SUBSCRIPTION_PLANS[2];

  const formatRemainingTime = (expiresAtStr: string | null): string => {
    if (!expiresAtStr) return 'Active';
    const diffMs = new Date(expiresAtStr).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days > 0) {
      return `${days}d ${remainingHours}h remaining`;
    }
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(SPEAKWISE_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleStandardGatewayCheckout = async () => {
    setIsLoading(true);
    const result = await RazorpayService.processSubscriptionPayment(selectedPlan);
    setIsLoading(false);
    if (result) {
      setSuccess(true);
      upgradeToPro(selectedPlan.id, selectedPlan.durationHours);
      setTimeout(() => {
        setSuccess(false);
        closeSubscriptionModal();
      }, 1500);
    }
  };

  const handleDirectUpiVerification = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      upgradeToPro(selectedPlan.id, selectedPlan.durationHours);
      setTimeout(() => {
        setSuccess(false);
        closeSubscriptionModal();
      }, 1500);
    }, 1200);
  };

  // UPI deep-link URI for selected plan amount
  const upiIntentUri = `upi://pay?pa=${SPEAKWISE_UPI_ID}&pn=SpeakWise+AI&am=${selectedPlan.priceInr}&cu=INR&tn=${encodeURIComponent(
    selectedPlan.name + ' Pro'
  )}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiIntentUri
  )}&bgcolor=ffffff&color=1e1b4b&margin=2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <Card className="w-full max-w-xl p-5 sm:p-7 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden rounded-3xl my-auto max-h-[92vh] overflow-y-auto">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={closeSubscriptionModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-0.5 shadow-xl shadow-indigo-600/30 mx-auto flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isPro ? 'Subscription & Membership Details' : 'Choose Your Practice Recharge'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
            {isPro
              ? 'View your active plan, expiration countdown, or extend your validity.'
              : 'Affordable short-term passes & long-term plans. Validity starts from exact time of payment!'}
          </p>
        </div>

        {/* Active Membership Status Banner (Shown when user is currently Pro) */}
        {isPro && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-indigo-500/10 to-transparent border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Active Pro Membership
                </span>
              </div>
              <Badge variant="emerald">{formatRemainingTime(planExpiresAt)}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px]">Current Plan</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentPlan.name}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px]">Valid Until</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {planExpiresAt ? new Date(planExpiresAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Continuous Access'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-1 border-t border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Unlimited Speech Analysis, Pronunciation Phonetics & Acoustic HUD</span>
            </div>
          </div>
        )}

        {/* 6-Plan Recharge Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>{isPro ? 'Extend / Upgrade Your Plan:' : 'Select Recharge Duration:'}</span>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">
              {selectedPlan.validityText}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlan.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-3 rounded-2xl cursor-pointer text-left transition-all relative border flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-500/10 shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {plan.name}
                    </span>
                    {plan.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-indigo-600 text-white leading-none">
                        {plan.badge.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {/* Price & Duration */}
                  <div className="my-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                        ₹{plan.priceInr}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        / {plan.durationLabel}
                      </span>
                    </div>
                    {plan.savings && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        {plan.savings}
                      </span>
                    )}
                  </div>

                  {/* Validity Info Footer */}
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <Clock className="w-2.5 h-2.5 text-indigo-500" />
                    <span>{plan.durationHours >= 24 ? `${plan.durationHours / 24} Days` : `${plan.durationHours}h`} access</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Plan Summary Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-transparent border border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white">
                {selectedPlan.name} — <span className="font-mono text-indigo-600 dark:text-indigo-400">₹{selectedPlan.priceInr}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {selectedPlan.validityText} from time of payment
              </div>
            </div>
          </div>
          <Badge variant="indigo">Selected</Badge>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl neu-pressed text-xs font-bold">
          <button
            onClick={() => setPaymentTab('UPI_QR')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              paymentTab === 'UPI_QR'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan UPI QR (₹{selectedPlan.priceInr})</span>
          </button>

          <button
            onClick={() => setPaymentTab('UPI_ID')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              paymentTab === 'UPI_ID'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Enter UPI ID</span>
          </button>
        </div>

        {/* Tab 1: UPI QR Code Display */}
        {paymentTab === 'UPI_QR' && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2.5 animate-in fade-in">
            <div className="space-y-0.5">
              <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                Scan & Pay ₹{selectedPlan.priceInr} with Any UPI App
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                Google Pay • PhonePe • Paytm • BHIM • CRED • Amazon Pay
              </p>
            </div>

            {/* Dynamic QR Code Box */}
            <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-md mx-auto border border-slate-200 flex items-center justify-center relative">
              <img
                src={qrCodeUrl}
                alt={`SpeakWise Pro UPI Payment QR Code for ₹${selectedPlan.priceInr}`}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            {/* UPI ID Copy Bar */}
            <div className="flex items-center justify-between p-2 rounded-xl neu-pressed max-w-xs mx-auto text-xs">
              <div className="text-left">
                <div className="text-[9px] text-slate-400 font-bold">UPI ID:</div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">{SPEAKWISE_UPI_ID}</div>
              </div>
              <button
                onClick={handleCopyUPI}
                className="px-2.5 py-1 rounded-lg neu-button text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:scale-105 transition-transform"
              >
                {copiedUpi ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <Button
              size="md"
              variant="primary"
              className="w-full rounded-full py-2.5 text-xs font-extrabold shadow-lg shadow-indigo-600/30 justify-center"
              onClick={handleDirectUpiVerification}
              isLoading={isLoading}
            >
              {success ? 'Recharge Activated! 🎉' : `I Have Paid ₹${selectedPlan.priceInr} via UPI (Verify & Activate)`}
            </Button>
          </div>
        )}

        {/* Tab 2: Enter UPI ID Form */}
        {paymentTab === 'UPI_ID' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
            <div className="text-left space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Your UPI Virtual Payment Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. mobile@okhdfcbank or name@paytm"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl neu-pressed text-xs bg-transparent text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                A payment request for ₹{selectedPlan.priceInr} will be dispatched to your UPI application.
              </p>
            </div>

            {/* Quick UPI Suffix Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['@okhdfcbank', '@okaxis', '@ybl', '@paytm', '@ibl'].map((suffix) => (
                <button
                  key={suffix}
                  type="button"
                  onClick={() => {
                    const prefix = upiIdInput.split('@')[0] || 'yourname';
                    setUpiIdInput(prefix + suffix);
                  }}
                  className="px-2 py-1 rounded-lg neu-button text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                >
                  {suffix}
                </button>
              ))}
            </div>

            <Button
              size="md"
              variant="primary"
              className="w-full rounded-full py-2.5 text-xs font-extrabold shadow-lg shadow-indigo-600/30 justify-center"
              onClick={handleDirectUpiVerification}
              isLoading={isLoading}
              disabled={!upiIdInput.includes('@')}
            >
              {success ? 'Payment Verified! 🎉' : `Request ₹${selectedPlan.priceInr} Payment`}
            </Button>
          </div>
        )}

        {/* Collapsible Section: Other Payment Options (Cards, NetBanking, Gateway) */}
        <div className="pt-1 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={() => setShowOtherOptions(!showOtherOptions)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              <span>Or pay ₹{selectedPlan.priceInr} with Credit/Debit Card, NetBanking & Wallets</span>
            </span>
            {showOtherOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showOtherOptions && (
            <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <span>Visa, Mastercard, RuPay, Corporate Cards, 50+ Banks</span>
              </div>

              <Button
                size="md"
                variant="outline"
                className="w-full rounded-full py-2 text-xs font-extrabold justify-center bg-white dark:bg-slate-900 border-indigo-500/30"
                onClick={handleStandardGatewayCheckout}
                isLoading={isLoading}
                leftIcon={<CreditCard className="w-4 h-4 text-indigo-500" />}
              >
                Pay ₹{selectedPlan.priceInr} with Cards / NetBanking / Razorpay
              </Button>
            </div>
          )}
        </div>

        {/* Security Trust Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit SSL Encrypted • Instant Activation from Payment Time</span>
        </div>
      </Card>
    </div>
  );
};
