import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { X, Lock, Crown, LogIn, UserPlus, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const UpgradeLimitModal: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    upgradeLimitModalOpen,
    closeUpgradeLimitModal,
    openSubscriptionModal,
    planType,
    attemptsUsed,
  } = useSubscriptionStore();

  if (!upgradeLimitModalOpen) return null;

  const isFreestyleLimit = planType === 'FREESTYLE';

  const handleSignIn = () => {
    closeUpgradeLimitModal();
    navigate('/login');
  };

  const handleSignUp = () => {
    closeUpgradeLimitModal();
    navigate('/register');
  };

  const handleViewPlans = () => {
    closeUpgradeLimitModal();
    openSubscriptionModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden rounded-3xl text-center">
        {/* Soft Background Accent */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={closeUpgradeLimitModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon Header */}
        <div className="pt-2">
          <div className="w-14 h-14 rounded-2xl neu-button text-amber-500 mx-auto flex items-center justify-center shadow-neu-glow">
            <Lock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {!isAuthenticated ? '3 Free Guest Uses Consumed' : '10 Free Freestyle Uses Consumed'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-medium">
            {!isAuthenticated
              ? "You've used your 3 free guest uses. Create a free account or Sign In to unlock 10 Free Freestyle attempts without purchasing a plan!"
              : "You've reached your 10 Free Freestyle uses limit. Upgrade to Pro Plan starting at ₹99 for Unlimited access!"}
          </p>
        </div>

        {/* Status Badge */}
        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <span>Usage Status: </span>
          <strong className="font-extrabold">
            {!isAuthenticated ? '3/3 Free Guest Attempts Used' : `${attemptsUsed}/10 Free Freestyle Uses Consumed`}
          </strong>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {!isAuthenticated ? (
            <>
              <Button
                size="lg"
                variant="primary"
                onClick={handleSignUp}
                className="w-full rounded-full py-3.5 text-xs font-extrabold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Sign Up Free (Get 10 Uses)
              </Button>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Button
                  variant="outline"
                  onClick={handleSignIn}
                  className="rounded-full text-xs font-bold py-2.5"
                  leftIcon={<LogIn className="w-4 h-4 text-indigo-500" />}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={handleViewPlans}
                  className="rounded-full text-xs font-bold py-2.5"
                  leftIcon={<Crown className="w-4 h-4 text-amber-500" />}
                >
                  Pro Plan (₹99)
                </Button>
              </div>
            </>
          ) : (
            <Button
              size="lg"
              variant="primary"
              onClick={handleViewPlans}
              className="w-full rounded-full py-3.5 text-xs font-extrabold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Upgrade to Pro Plan (₹99)
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
