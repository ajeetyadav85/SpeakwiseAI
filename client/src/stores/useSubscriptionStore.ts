import { create } from 'zustand';
import { apiClient } from '../services/api';
import { SubscriptionPlanId, SubscriptionPlanOption } from '../types';

export type PlanType = 'GUEST' | 'FREESTYLE' | 'PRO';

export const SUBSCRIPTION_PLANS: SubscriptionPlanOption[] = [
  {
    id: '1_DAY',
    name: '1 Day Pass',
    durationLabel: '24 Hours',
    validityText: 'Valid for 24 Hours from payment',
    durationHours: 24,
    priceInr: 9,
    badge: '⚡ Flash Pass',
    description: 'Instant 24-hr unlimited AI speech analysis & metrics',
  },
  {
    id: '1_WEEK',
    name: '1 Week Recharge',
    durationLabel: '7 Days',
    validityText: 'Valid for 7 Days from payment',
    durationHours: 168,
    priceInr: 49,
    badge: '🚀 Weekly Sprint',
    description: '7-day full access for interview prep & speech rehearsal',
  },
  {
    id: '1_MONTH',
    name: '1 Month Pro',
    durationLabel: '30 Days',
    validityText: 'Valid for 30 Days from payment',
    durationHours: 720,
    priceInr: 99,
    popular: true,
    badge: '🔥 Most Popular',
    description: '30 days unlimited AI feedback, phonetics & executive drills',
  },
  {
    id: '3_MONTH',
    name: '3 Months Pro',
    durationLabel: '90 Days',
    validityText: 'Valid for 90 Days from payment',
    durationHours: 2160,
    priceInr: 199,
    savings: 'Save 33%',
    badge: '💡 Great Value',
    description: 'Full quarter speaker transformation with streak tracking',
  },
  {
    id: '6_MONTH',
    name: '6 Months Pro',
    durationLabel: '180 Days',
    validityText: 'Valid for 180 Days from payment',
    durationHours: 4320,
    priceInr: 299,
    savings: 'Save 50%',
    badge: '💎 Executive Choice',
    description: 'Half-year mastery for leadership & executive communication',
  },
  {
    id: '1_YEAR',
    name: '1 Year Ultimate',
    durationLabel: '365 Days',
    validityText: 'Valid for 365 Days from payment',
    durationHours: 8760,
    priceInr: 599,
    savings: 'Save 50%',
    badge: '👑 Ultimate VIP',
    description: '365 days of continuous AI vocal intelligence & keynote analysis',
  },
];

// Special trial plan for first-time new users only
export const TRIAL_OFFER_PLAN: SubscriptionPlanOption = {
  id: 'TRIAL_7_DAYS',
  name: '7-Day Pro Trial',
  durationLabel: '7 Days',
  validityText: 'Valid for 7 Days from payment',
  durationHours: 168,
  priceInr: 1,
  badge: '🎉 New User Offer',
  description: 'Full SpeakWise Pro access for 7 days at just ₹1 (First-time users only)',
};

interface UsageStatusResponse {
  planType: PlanType;
  attemptsUsed: number;
  attemptsLeft: number;
  maxAttempts: number;
  canProceed: boolean;
  isPro: boolean;
  message?: string;
  planId?: SubscriptionPlanId;
  expiresAt?: string;
  isTrialEligible?: boolean;
  trialEndsAt?: string;
  planStartsAt?: string;
}

interface SubscriptionState {
  planType: PlanType;
  freeAttemptsLeft: number;
  maxAttempts: number;
  attemptsUsed: number;
  isPro: boolean;
  isTrialEligible: boolean;
  trialEndsAt: string | null;
  planStartsAt: string | null;
  canProceed: boolean;
  message: string;
  activePlanId: SubscriptionPlanId | null;
  planExpiresAt: string | null;
  subscriptionModalOpen: boolean;
  upgradeLimitModalOpen: boolean;

  // Actions
  resetSubscription: () => void;
  fetchUsageStatus: () => Promise<UsageStatusResponse>;
  decrementAttempts: () => Promise<boolean>;
  upgradeToPro: (planId?: SubscriptionPlanId, durationHours?: number, explicitExpiresAt?: string) => void;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
  openUpgradeLimitModal: () => void;
  closeUpgradeLimitModal: () => void;
}

// Clean up any stale legacy subscription keys from device localStorage immediately
try {
  localStorage.removeItem('speakwise_sub_expiry');
  localStorage.removeItem('speakwise_sub_plan');
  localStorage.removeItem('speakwise_guest_attempts');
} catch (e) {}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  planType: 'GUEST',
  freeAttemptsLeft: 3,
  maxAttempts: 3,
  attemptsUsed: 0,
  isPro: false,
  isTrialEligible: true,
  trialEndsAt: null,
  planStartsAt: null,
  canProceed: true,
  message: 'Free uses remaining: 3/3',
  activePlanId: null,
  planExpiresAt: null,
  subscriptionModalOpen: false,
  upgradeLimitModalOpen: false,

  resetSubscription: () => {
    try {
      localStorage.removeItem('speakwise_sub_expiry');
      localStorage.removeItem('speakwise_sub_plan');
      localStorage.removeItem('speakwise_guest_attempts');
    } catch (e) {}
    set({
      planType: 'GUEST',
      freeAttemptsLeft: 3,
      maxAttempts: 3,
      attemptsUsed: 0,
      isPro: false,
      isTrialEligible: true,
      trialEndsAt: null,
      planStartsAt: null,
      canProceed: true,
      message: 'Free uses remaining: 3/3',
      activePlanId: null,
      planExpiresAt: null,
      subscriptionModalOpen: false,
      upgradeLimitModalOpen: false,
    });
  },

  fetchUsageStatus: async () => {
    try {
      const res = await apiClient.get('/usage/status');
      const data: UsageStatusResponse = res.data.data;
      const isPro = Boolean(data.isPro);
      const isTrialEligible = data.isTrialEligible !== undefined ? Boolean(data.isTrialEligible) : !isPro;

      set({
        planType: isPro ? 'PRO' : (data.planType || 'GUEST'),
        freeAttemptsLeft: isPro ? 9999 : (data.attemptsLeft ?? 3),
        maxAttempts: isPro ? 9999 : (data.maxAttempts ?? 3),
        attemptsUsed: data.attemptsUsed || 0,
        isPro,
        isTrialEligible,
        trialEndsAt: data.trialEndsAt || null,
        planStartsAt: data.planStartsAt || null,
        canProceed: isPro || Boolean(data.canProceed),
        message: data.message || (isPro ? 'Pro Active' : `Remaining: ${data.attemptsLeft ?? 3}/${data.maxAttempts ?? 3}`),
        activePlanId: isPro ? (data.planId || null) : null,
        planExpiresAt: isPro ? (data.expiresAt || null) : null,
      });
      return { ...data, isPro, isTrialEligible, canProceed: isPro || Boolean(data.canProceed) };
    } catch (err) {
      // Offline fallback: never assume Pro without server confirmation
      set({
        planType: 'GUEST',
        freeAttemptsLeft: 3,
        attemptsUsed: 0,
        canProceed: true,
        isPro: false,
        isTrialEligible: true,
        trialEndsAt: null,
        planStartsAt: null,
        activePlanId: null,
        planExpiresAt: null,
      });
      return {
        planType: 'GUEST',
        attemptsUsed: 0,
        attemptsLeft: 3,
        maxAttempts: 3,
        canProceed: true,
        isPro: false,
        isTrialEligible: true,
      };
    }
  },

  decrementAttempts: async () => {
    const { isPro } = get();
    if (isPro) return true;

    try {
      const res = await apiClient.post('/usage/consume');
      const data: UsageStatusResponse = res.data.data;
      const isProResult = Boolean(data.isPro);

      set({
        planType: data.planType,
        freeAttemptsLeft: data.attemptsLeft,
        maxAttempts: data.maxAttempts,
        attemptsUsed: data.attemptsUsed,
        isPro: isProResult,
        canProceed: data.canProceed,
        message: data.message || `Remaining: ${data.attemptsLeft}/${data.maxAttempts}`,
      });

      if (!data.canProceed && !isProResult) {
        set({ upgradeLimitModalOpen: true });
        return false;
      }
      return true;
    } catch (err: any) {
      // If limit reached on server (402/403)
      if (err.response?.status === 402 || err.response?.status === 403 || get().freeAttemptsLeft <= 0) {
        set({ freeAttemptsLeft: 0, canProceed: false, upgradeLimitModalOpen: true });
        return false;
      }
      const current = get().freeAttemptsLeft;
      if (current > 0) {
        const next = current - 1;
        set({ freeAttemptsLeft: next, attemptsUsed: 3 - next, canProceed: next > 0 });
        if (next === 0) set({ upgradeLimitModalOpen: true });
        return true;
      }
      set({ upgradeLimitModalOpen: true });
      return false;
    }
  },

  upgradeToPro: (
    planId: SubscriptionPlanId = '1_MONTH',
    durationHours: number = 720,
    explicitExpiresAt?: string
  ) => {
    let finalExpiresAt: string;

    if (explicitExpiresAt && !isNaN(new Date(explicitExpiresAt).getTime())) {
      finalExpiresAt = explicitExpiresAt;
    } else {
      finalExpiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
    }

    set({
      isPro: true,
      planType: 'PRO',
      activePlanId: planId,
      planExpiresAt: finalExpiresAt,
      freeAttemptsLeft: 9999,
      maxAttempts: 9999,
      attemptsUsed: 0,
      canProceed: true,
      subscriptionModalOpen: false,
      upgradeLimitModalOpen: false,
      message: 'Pro Active',
    });

    // Re-verify fresh status against backend
    get().fetchUsageStatus();
  },

  openSubscriptionModal: () => set({ subscriptionModalOpen: true, upgradeLimitModalOpen: false }),
  closeSubscriptionModal: () => set({ subscriptionModalOpen: false }),
  openUpgradeLimitModal: () => set({ upgradeLimitModalOpen: true }),
  closeUpgradeLimitModal: () => set({ upgradeLimitModalOpen: false }),
}));
