import React, { useState } from 'react';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { RazorpayService } from '../../services/razorpay.service';
import {
  X,
  Zap,
  CheckCircle2,
  Lock,
  Crown,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const SubscriptionModal: React.FC = () => {
  const {
    subscriptionModalOpen,
    closeSubscriptionModal,
    freeAttemptsLeft,
    attemptsUsed,
    isPro,
    upgradeToPro,
  } = useSubscriptionStore();

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!subscriptionModalOpen || isPro) return null;

  const handlePayment = async () => {
    setIsLoading(true);
    const result = await RazorpayService.processSubscriptionPayment();
    setIsLoading(false);
    if (result) {
      setSuccess(true);
      upgradeToPro();
      setTimeout(() => {
        setSuccess(false);
        closeSubscriptionModal();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <Card className="w-full max-w-lg p-6 sm:p-8 space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden rounded-3xl">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={closeSubscriptionModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-0.5 shadow-xl shadow-indigo-600/30 mx-auto flex items-center justify-center">
            <Crown className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Unlock SpeakWise Pro
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto font-medium">
            Get unlimited AI speech coaching, acoustic analytics, and PDF exports.
          </p>
        </div>

        {/* Pro Features Checklist */}
        <div className="space-y-3 py-1 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">What's Included in Pro:</span>
          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>Unlimited AI Speech Analysis</strong> sessions</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Full Acoustic WPM, Pitch Modulation & Disfluency graphs</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>AI Executive Sentence Re-Writer & 5-Min Daily Drills</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>PDF, PNG, CSV & JSON Performance Exports</span>
            </div>
          </div>
        </div>

        {/* Pricing Card & Payment Trigger */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent border border-indigo-500/30 space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">₹99</span>
              <span className="text-xs text-slate-500 font-medium"> / month</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              ⚡ Special ₹99 Pricing
            </span>
          </div>

          <Button
            size="lg"
            variant="primary"
            className="w-full font-bold py-3.5 shadow-xl shadow-indigo-600/30 text-xs sm:text-sm flex items-center justify-center gap-2 rounded-full"
            onClick={handlePayment}
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {success ? 'Pro Plan Activated! 🎉' : 'Upgrade to Pro — ₹99'}
          </Button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit Encrypted Razorpay Checkout</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
