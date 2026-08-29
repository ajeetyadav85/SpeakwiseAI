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
}

interface SubscriptionState {
  planType: PlanType;
  freeAttemptsLeft: number;
  maxAttempts: number;
  attemptsUsed: number;
  isPro: boolean;
  canProceed: boolean;
  message: string;
  activePlanId: SubscriptionPlanId | null;
  planExpiresAt: string | null;
  subscriptionModalOpen: boolean;
  upgradeLimitModalOpen: boolean;

  // Actions
  fetchUsageStatus: () => Promise<UsageStatusResponse>;
  decrementAttempts: () => Promise<boolean>;
  upgradeToPro: (planId?: SubscriptionPlanId, durationHours?: number) => void;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
  openUpgradeLimitModal: () => void;
  closeUpgradeLimitModal: () => void;
}

const getInitialGuestAttempts = (): number => {
  try {
    const saved = localStorage.getItem('speakwise_guest_attempts');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return Math.min(3, parsed);
    }
  } catch (e) {}
  return 0;
};

const getSavedSubscriptionStatus = (): { isPro: boolean; planId: SubscriptionPlanId | null; expiresAt: string | null } => {
  try {
    const expiryStr = localStorage.getItem('speakwise_sub_expiry');
    const planId = (localStorage.getItem('speakwise_sub_plan') as SubscriptionPlanId) || null;
    if (expiryStr) {
      const expiry = new Date(expiryStr);
      if (expiry.getTime() > Date.now()) {
        return { isPro: true, planId, expiresAt: expiryStr };
      } else {
        localStorage.removeItem('speakwise_sub_expiry');
        localStorage.removeItem('speakwise_sub_plan');
      }
    }
  } catch (e) {}
  return { isPro: false, planId: null, expiresAt: null };
};

const initialGuestUsed = getInitialGuestAttempts();
const initialSub = getSavedSubscriptionStatus();

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  planType: initialSub.isPro ? 'PRO' : 'GUEST',
  freeAttemptsLeft: initialSub.isPro ? 9999 : Math.max(0, 3 - initialGuestUsed),
  maxAttempts: initialSub.isPro ? 9999 : 3,
  attemptsUsed: initialGuestUsed,
  isPro: initialSub.isPro,
  canProceed: initialSub.isPro || initialGuestUsed < 3,
  message: initialSub.isPro ? 'Pro Active' : `Free uses remaining: ${Math.max(0, 3 - initialGuestUsed)}/3`,
  activePlanId: initialSub.planId,
  planExpiresAt: initialSub.expiresAt,
  subscriptionModalOpen: false,
  upgradeLimitModalOpen: false,

  fetchUsageStatus: async () => {
    try {
      const res = await apiClient.get('/usage/status');
      const data: UsageStatusResponse = res.data.data;
      
      const isStillPro = data.isPro || (get().planExpiresAt ? new Date(get().planExpiresAt!).getTime() > Date.now() : false);

      set({
        planType: isStillPro ? 'PRO' : data.planType,
        freeAttemptsLeft: isStillPro ? 9999 : data.attemptsLeft,
        maxAttempts: isStillPro ? 9999 : data.maxAttempts,
        attemptsUsed: data.attemptsUsed,
        isPro: isStillPro,
        canProceed: isStillPro || data.canProceed,
        message: data.message || `Remaining: ${data.attemptsLeft}/${data.maxAttempts}`,
        activePlanId: data.planId || get().activePlanId,
        planExpiresAt: data.expiresAt || get().planExpiresAt,
      });
      return { ...data, isPro: isStillPro, canProceed: isStillPro || data.canProceed };
    } catch (err) {
      // Fallback local memory state
      const { isPro, planType, activePlanId, planExpiresAt } = get();
      const used = getInitialGuestAttempts();
      const left = Math.max(0, 3 - used);
      const canProc = isPro || left > 0;
      set({
        freeAttemptsLeft: isPro ? 9999 : left,
        attemptsUsed: used,
        canProceed: canProc,
      });
      return {
        planType,
        attemptsUsed: used,
        attemptsLeft: isPro ? 9999 : left,
        maxAttempts: isPro ? 9999 : planType === 'FREESTYLE' ? 10 : 3,
        canProceed: canProc,
        isPro,
        planId: activePlanId || undefined,
        expiresAt: planExpiresAt || undefined,
      };
    }
  },

  decrementAttempts: async () => {
    const { isPro } = get();
    if (isPro) return true;

    try {
      const res = await apiClient.post('/usage/consume');
      const data: UsageStatusResponse = res.data.data;
      set({
        planType: data.planType,
        freeAttemptsLeft: data.attemptsLeft,
        maxAttempts: data.maxAttempts,
        attemptsUsed: data.attemptsUsed,
        isPro: data.isPro,
        canProceed: data.canProceed,
        message: data.message || `Remaining: ${data.attemptsLeft}/${data.maxAttempts}`,
      });

      if (!data.canProceed) {
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
      // Local fallback
      const current = get().freeAttemptsLeft;
      if (current > 0) {
        const next = current - 1;
        const used = 3 - next;
        try {
          localStorage.setItem('speakwise_guest_attempts', used.toString());
        } catch (e) {}
        set({ freeAttemptsLeft: next, attemptsUsed: used, canProceed: next > 0 });
        if (next === 0) set({ upgradeLimitModalOpen: true });
        return true;
      }
      set({ upgradeLimitModalOpen: true });
      return false;
    }
  },

  upgradeToPro: (planId: SubscriptionPlanId = '1_MONTH', durationHours: number = 720) => {
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
    try {
      localStorage.setItem('speakwise_sub_expiry', expiresAt);
      localStorage.setItem('speakwise_sub_plan', planId);
    } catch (e) {}

    set({
      isPro: true,
      planType: 'PRO',
      activePlanId: planId,
      planExpiresAt: expiresAt,
      freeAttemptsLeft: 9999,
      canProceed: true,
      subscriptionModalOpen: false,
      upgradeLimitModalOpen: false,
    });
  },

  openSubscriptionModal: () => set({ subscriptionModalOpen: true, upgradeLimitModalOpen: false }),
  closeSubscriptionModal: () => set({ subscriptionModalOpen: false }),
  openUpgradeLimitModal: () => set({ upgradeLimitModalOpen: true }),
  closeUpgradeLimitModal: () => set({ upgradeLimitModalOpen: false }),
}));
