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
    isTrialEligible,
  } = useSubscriptionStore();

  if (!upgradeLimitModalOpen) return null;

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
            All 3 Free Speech Analyses Used
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-medium">
            {!isAuthenticated
              ? "You've used your 3 free analyses. Create an account to unlock 7 Days of Pro for just ₹1!"
              : isTrialEligible
              ? "Special New User Offer: Unlock 7 full days of unlimited AI speech scorecards & reports for just ₹1!"
              : "You've completed your 3 free analyses. Recharge starting at just ₹9 for unlimited speech practice & AI feedback!"}
          </p>
        </div>

        {/* Status Badge */}
        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <span>Usage Status: </span>
          <strong className="font-extrabold">
            {attemptsUsed >= 3 ? '3 of 3 Free Analyses Used (0 uses left)' : `${attemptsUsed} of 3 Free Analyses Used`}
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
                Sign Up & Claim ₹1 Pro Trial
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
                  {isTrialEligible ? 'Try Pro at ₹1' : 'Recharge (₹9+)'}
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
              {isTrialEligible ? 'Claim 7 Days Pro at ₹1' : 'Recharge Pro (Starting ₹9)'}
            </Button>
          )}
        </div>

      </Card>
    </div>
  );
};
