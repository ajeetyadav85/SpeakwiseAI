import { create } from 'zustand';
import { User, UserRole } from '../types';
import { apiClient } from '../services/api';
import { useSubscriptionStore } from './useSubscriptionStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (fullName: string, email: string, password?: string) => Promise<void>;
  loginWithGoogle: (payload: { email: string; fullName: string; googleId: string; avatarUrl?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';

const getSavedUser = (): User | null => {
  try {
    const saved = localStorage.getItem('speakwise_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.email) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
};

const initialUser = getSavedUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,

  login: async (email: string, password?: string) => {
    try {
      useSubscriptionStore.getState().resetSubscription();
      const response = await apiClient.post('/auth/login', {
        email,
        password: password || 'password123',
      });

      const { user, accessToken } = response.data.data;
      const authenticatedUser: User = {
        id: user.id || user._id,
        email: user.email || email,
        fullName: user.fullName || email.split('@')[0],
        avatarUrl: user.avatarUrl || DEFAULT_AVATAR,
        role: user.role || 'FREE_USER',
        streakDays: user.streakDays ?? 1,
        totalPracticeMinutes: user.totalPracticeMinutes ?? 0,
        averageScore: user.averageScore ?? 85,
        targetWpm: user.targetWpm ?? 145,
        exp: user.exp ?? 250,
        level: user.level ?? 1,
        createdAt: user.createdAt || new Date().toISOString(),
      };

      localStorage.setItem('speakwise_user', JSON.stringify(authenticatedUser));
      if (accessToken) {
        localStorage.setItem('speakwise_token', accessToken);
      }
      set({ user: authenticatedUser, isAuthenticated: true });
      useSubscriptionStore.getState().fetchUsageStatus();
    } catch (error: any) {
      // If network error (backend offline/standalone demo), allow client demo login
      if (error.code === 'ERR_NETWORK' || !error.response) {
        useSubscriptionStore.getState().resetSubscription();
        const demoUser: User = {
          id: 'usr_' + Date.now(),
          email,
          fullName: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          avatarUrl: DEFAULT_AVATAR,
          role: 'FREE_USER',
          streakDays: 1,
          totalPracticeMinutes: 0,
          averageScore: 85,
          targetWpm: 145,
          exp: 250,
          level: 1,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('speakwise_user', JSON.stringify(demoUser));
        set({ user: demoUser, isAuthenticated: true });
        useSubscriptionStore.getState().fetchUsageStatus();
        return;
      }
      const msg = error?.response?.data?.error || error?.response?.data?.message || 'Invalid email or password';
      throw new Error(msg);
    }
  },

  register: async (fullName: string, email: string, password?: string) => {
    try {
      useSubscriptionStore.getState().resetSubscription();
      const response = await apiClient.post('/auth/register', {
        fullName,
        email,
        password: password || 'password123',
      });

      const { user, accessToken } = response.data.data;
      const authenticatedUser: User = {
        id: user.id || user._id,
        email: user.email || email,
        fullName: user.fullName || fullName,
        avatarUrl: user.avatarUrl || DEFAULT_AVATAR,
        role: user.role || 'FREE_USER',
        streakDays: user.streakDays ?? 1,
        totalPracticeMinutes: user.totalPracticeMinutes ?? 0,
        averageScore: user.averageScore ?? 0,
        targetWpm: user.targetWpm ?? 140,
        exp: user.exp ?? 100,
        level: user.level ?? 1,
        createdAt: user.createdAt || new Date().toISOString(),
      };

      localStorage.setItem('speakwise_user', JSON.stringify(authenticatedUser));
      if (accessToken) {
        localStorage.setItem('speakwise_token', accessToken);
      }
      set({ user: authenticatedUser, isAuthenticated: true });
      useSubscriptionStore.getState().fetchUsageStatus();
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        useSubscriptionStore.getState().resetSubscription();
        const newUser: User = {
          id: 'usr_' + Date.now(),
          email,
          fullName,
          avatarUrl: DEFAULT_AVATAR,
          role: 'FREE_USER',
          streakDays: 1,
          totalPracticeMinutes: 0,
          averageScore: 0,
          targetWpm: 140,
          exp: 100,
          level: 1,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('speakwise_user', JSON.stringify(newUser));
        set({ user: newUser, isAuthenticated: true });
        useSubscriptionStore.getState().fetchUsageStatus();
        return;
      }
      const msg = error?.response?.data?.error || error?.response?.data?.message || 'Registration failed';
      throw new Error(msg);
    }
  },

  loginWithGoogle: async ({ email, fullName, googleId, avatarUrl }) => {
    try {
      useSubscriptionStore.getState().resetSubscription();
      const response = await apiClient.post('/auth/google', {
        email,
        fullName,
        googleId,
        avatarUrl,
      });

      const { user, accessToken } = response.data.data;
      const authenticatedUser: User = {
        id: user.id || user._id,
        email: user.email || email,
        fullName: user.fullName || fullName,
        avatarUrl: user.avatarUrl || avatarUrl || DEFAULT_AVATAR,
        role: user.role || 'FREE_USER',
        streakDays: user.streakDays ?? 1,
        totalPracticeMinutes: user.totalPracticeMinutes ?? 0,
        averageScore: user.averageScore ?? 85,
        targetWpm: user.targetWpm ?? 145,
        exp: user.exp ?? 250,
        level: user.level ?? 1,
        createdAt: user.createdAt || new Date().toISOString(),
      };

      localStorage.setItem('speakwise_user', JSON.stringify(authenticatedUser));
      if (accessToken) {
        localStorage.setItem('speakwise_token', accessToken);
      }
      set({ user: authenticatedUser, isAuthenticated: true });
      useSubscriptionStore.getState().fetchUsageStatus();
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        useSubscriptionStore.getState().resetSubscription();
        const gUser: User = {
          id: 'usr_g_' + (googleId || Date.now()),
          email,
          fullName,
          avatarUrl: avatarUrl || DEFAULT_AVATAR,
          role: 'FREE_USER',
          streakDays: 1,
          totalPracticeMinutes: 0,
          averageScore: 85,
          targetWpm: 145,
          exp: 250,
          level: 1,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('speakwise_user', JSON.stringify(gUser));
        set({ user: gUser, isAuthenticated: true });
        useSubscriptionStore.getState().fetchUsageStatus();
        return;
      }
      const msg = error?.response?.data?.error || error?.response?.data?.message || 'Google Authentication failed';
      throw new Error(msg);
    }
  },

  logout: () => {
    try {
      localStorage.removeItem('speakwise_user');
      localStorage.removeItem('speakwise_token');
      localStorage.removeItem('speakwise_sub_expiry');
      localStorage.removeItem('speakwise_sub_plan');
      localStorage.removeItem('speakwise_guest_attempts');
      localStorage.removeItem('speakwise_guest_id');
    } catch (e) {}
    useSubscriptionStore.getState().resetSubscription();
    set({ user: null, isAuthenticated: false });
    useSubscriptionStore.getState().fetchUsageStatus();
  },

  updateUser: (data) =>
    set((state) => {
      const updated = state.user ? { ...state.user, ...data } : null;
      if (updated) localStorage.setItem('speakwise_user', JSON.stringify(updated));
      return { user: updated };
    }),
}));
