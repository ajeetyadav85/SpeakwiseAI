import { create } from 'zustand';
import { apiClient } from '../services/api';

export type PlanType = 'GUEST' | 'FREESTYLE' | 'PRO';

interface UsageStatusResponse {
  planType: PlanType;
  attemptsUsed: number;
  attemptsLeft: number;
  maxAttempts: number;
  canProceed: boolean;
  isPro: boolean;
  message?: string;
}

interface SubscriptionState {
  planType: PlanType;
  freeAttemptsLeft: number;
  maxAttempts: number;
  attemptsUsed: number;
  isPro: boolean;
  canProceed: boolean;
  message: string;
  subscriptionModalOpen: boolean;
  upgradeLimitModalOpen: boolean;
  
  // Actions
  fetchUsageStatus: () => Promise<UsageStatusResponse>;
  decrementAttempts: () => Promise<boolean>;
  upgradeToPro: () => void;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
  openUpgradeLimitModal: () => void;
  closeUpgradeLimitModal: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  planType: 'GUEST',
  freeAttemptsLeft: 3,
  maxAttempts: 3,
  attemptsUsed: 0,
  isPro: false,
  canProceed: true,
  message: 'Free uses remaining today: 3/3',
  subscriptionModalOpen: false,
  upgradeLimitModalOpen: false,

  fetchUsageStatus: async () => {
    try {
      const res = await apiClient.get('/usage/status');
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
      return data;
    } catch (err) {
      // Fallback local memory state
      const { isPro, freeAttemptsLeft, planType } = get();
      return {
        planType,
        attemptsUsed: 3 - freeAttemptsLeft,
        attemptsLeft: freeAttemptsLeft,
        maxAttempts: planType === 'FREESTYLE' ? 10 : 3,
        canProceed: isPro || freeAttemptsLeft > 0,
        isPro,
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
        set({ freeAttemptsLeft: next, canProceed: next > 0 });
        if (next === 0) set({ upgradeLimitModalOpen: true });
        return true;
      }
      set({ upgradeLimitModalOpen: true });
      return false;
    }
  },

  upgradeToPro: () => {
    set({ isPro: true, planType: 'PRO', subscriptionModalOpen: false, upgradeLimitModalOpen: false });
  },

  openSubscriptionModal: () => set({ subscriptionModalOpen: true, upgradeLimitModalOpen: false }),
  closeSubscriptionModal: () => set({ subscriptionModalOpen: false }),
  openUpgradeLimitModal: () => set({ upgradeLimitModalOpen: true }),
  closeUpgradeLimitModal: () => set({ upgradeLimitModalOpen: false }),
}));
