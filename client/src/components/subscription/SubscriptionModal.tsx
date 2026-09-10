import React, { useState, useEffect } from 'react';
import { useSubscriptionStore, SUBSCRIPTION_PLANS } from '../../stores/useSubscriptionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { RazorpayService } from '../../services/razorpay.service';
import { getSubscriptionRemainingTime } from '../../lib/subscriptionTimer';
import { SubscriptionPlanOption } from '../../types';
import {
  X,
  Crown,
  ShieldCheck,
  ArrowRight,
  Clock,
  Zap,
  Check,
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

  // Selected plan (default 1 Month Pro ₹99 or 1 Day ₹9)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanOption>(SUBSCRIPTION_PLANS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Live real-time seconds ticker
  useEffect(() => {
    if (!subscriptionModalOpen) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [subscriptionModalOpen]);

  if (!subscriptionModalOpen) return null;

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === activePlanId) || SUBSCRIPTION_PLANS[2];
  const remaining = getSubscriptionRemainingTime(planExpiresAt);

  // Compute what the new stacked expiry would be if user recharges with selectedPlan
  const calculateStackedExpiry = (durationHours: number) => {
    let baseTimeMs = Date.now();
    if (planExpiresAt) {
      const existingMs = new Date(planExpiresAt).getTime();
      if (existingMs > baseTimeMs) {
        baseTimeMs = existingMs;
      }
    }
    return new Date(baseTimeMs + durationHours * 3600 * 1000);
  };

  const previewNewExpiry = calculateStackedExpiry(selectedPlan.durationHours);

  // Directly launch official Razorpay checkout (PhonePe, GPay, Paytm, Cards, NetBanking)
  const handleProceedToPay = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const result = await RazorpayService.processSubscriptionPayment(selectedPlan);
    setIsLoading(false);
    if (result.success) {
      setSuccess(true);
      const serverExpiresAt = result.data?.expiresAt;
      upgradeToPro(selectedPlan.id, selectedPlan.durationHours, serverExpiresAt);
      if (user) {
        useAuthStore.getState().updateUser({
          role: 'PRO_USER',
          subscriptionPlan: selectedPlan.id,
          subscriptionExpiresAt: serverExpiresAt,
        });
      }
      setTimeout(() => {
        setSuccess(false);
        closeSubscriptionModal();
      }, 1500);
    } else if (result.error) {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <Card className="w-full max-w-xl p-5 sm:p-7 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden rounded-3xl my-auto max-h-[92vh] overflow-y-auto">
        {/* Ambient Top Glow */}
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
            {isPro ? 'Manage Your Subscription' : 'Upgrade to SpeakWise Pro'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
            Select an affordable recharge pass and pay securely with PhonePe, UPI, Cards, or NetBanking.
          </p>
        </div>

        {/* Active Pro Membership Status (When already subscribed) */}
        {isPro && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-indigo-500/10 to-transparent border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Active Pro Membership
                </span>
              </div>
              <Badge variant="emerald">{remaining.badgeText}</Badge>
            </div>


            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-500/20">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px]">Current Plan</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{currentPlan.name}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px]">Valid Until</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {planExpiresAt
                    ? new Date(planExpiresAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                    : 'Continuous Access'}
                </span>
              </div>
            </div>
          </div>
        )}



        {/* 6-Plan Recharge Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>{isPro ? 'Extend / Upgrade Your Plan:' : '1. Select Recharge Pass:'}</span>
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

        {/* Selected Plan Summary & Features Overview */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{selectedPlan.name} — <strong className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">₹{selectedPlan.priceInr}</strong></span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium font-mono">{selectedPlan.validityText}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Unlimited Speech Analysis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Pronunciation & Phonetics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Pacing & Acoustic Charts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Executive Drill Exercises</span>
            </div>
          </div>
        </div>

        {/* Supported Payment Apps Pills */}
        <div className="space-y-1.5 text-center">
          <div className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-2">
            <span>Pay with:</span>
            <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
              <span className="px-2 py-0.5 rounded-lg neu-pressed">PhonePe</span>
              <span className="px-2 py-0.5 rounded-lg neu-pressed">Google Pay</span>
              <span className="px-2 py-0.5 rounded-lg neu-pressed">Paytm</span>
              <span className="px-2 py-0.5 rounded-lg neu-pressed">UPI ID / QR</span>
              <span className="px-2 py-0.5 rounded-lg neu-pressed">Cards & NetBanking</span>
            </div>
          </div>
        </div>

        {/* Payment Error Notification Banner */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-bold shrink-0 ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Direct Proceed to Pay Button (Opens Razorpay Checkout) */}
        <div className="space-y-1.5">
          <Button
            size="lg"
            variant="primary"
            className="w-full rounded-full py-3.5 text-xs sm:text-sm font-extrabold shadow-xl shadow-indigo-600/30 justify-center flex items-center gap-2"
            onClick={handleProceedToPay}
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {success
              ? 'Pro Plan Activated! 🎉'
              : isPro
              ? `Add +${selectedPlan.durationLabel} to Pro • Pay ₹${selectedPlan.priceInr}`
              : `Proceed to Pay ₹${selectedPlan.priceInr} with Razorpay`}
          </Button>
          {isPro && (
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
              ⚡ Extended expiry after recharge:{' '}
              <strong className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {previewNewExpiry.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </strong>
            </p>
          )}
        </div>

        {/* Security Trust Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pt-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit SSL Encrypted • Official Razorpay Secure Gateway</span>
        </div>
      </Card>
    </div>
  );
};
