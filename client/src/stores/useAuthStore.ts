import { create } from 'zustand';
import { User } from '../types';
import { apiClient } from '../services/api';
import { useSubscriptionStore } from './useSubscriptionStore';

export interface AuthError extends Error {
  requiresVerification?: boolean;
  unverifiedEmail?: string;
  code?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (fullName: string, email: string, password?: string) => Promise<{ requiresVerification: boolean; email: string }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  sendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyResetOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (payload: { email: string; fullName: string; googleId: string; avatarUrl?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<User | null>;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,

  login: async (email: string, password?: string) => {
    try {
      useSubscriptionStore.getState().resetSubscription();
      const response = await apiClient.post('/auth/login', {
        email,
        password: password || 'password123',
      });

      const { user, accessToken, refreshToken } = response.data.data;
      const authenticatedUser: User = {
        id: user.id || user._id,
        email: user.email || email,
        fullName: user.fullName || email.split('@')[0],
        avatarUrl: user.avatarUrl || DEFAULT_AVATAR,
        role: user.role || 'FREE_USER',
        authProvider: user.authProvider || 'email',
        emailVerified: user.emailVerified ?? true,
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
      if (refreshToken) {
        localStorage.setItem('speakwise_refresh_token', refreshToken);
      }
      set({ user: authenticatedUser, isAuthenticated: true });
      useSubscriptionStore.getState().fetchUsageStatus();
    } catch (error: any) {
      // Check if unverified email
      const isUnverified =
        error?.response?.status === 403 ||
        error?.response?.data?.requiresVerification ||
        error?.response?.data?.error?.code === 'FORBIDDEN' ||
        (error?.response?.data?.error?.message || '').toLowerCase().includes('not verified') ||
        (error?.response?.data?.error || '').toString().toLowerCase().includes('not verified');

      if (isUnverified) {
        const authErr: AuthError = new Error(
          error?.response?.data?.error?.message ||
          error?.response?.data?.error ||
          'Your email address is not verified. Please verify your email before logging in.'
        );
        authErr.requiresVerification = true;
        authErr.unverifiedEmail = email;
        throw authErr;
      }

      // If network error (backend offline/standalone demo), allow client demo login
      if (error.code === 'ERR_NETWORK' || !error.response) {
        useSubscriptionStore.getState().resetSubscription();
        const demoUser: User = {
          id: 'usr_' + Date.now(),
          email,
          fullName: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          avatarUrl: DEFAULT_AVATAR,
          role: 'FREE_USER',
          authProvider: 'email',
          emailVerified: true,
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

      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Invalid email or password';
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

      const resData = response.data.data;
      const requiresVerification = resData?.requiresVerification !== false;

      // If email verification is required, do NOT authenticate yet; notify caller to show OTP step
      if (requiresVerification) {
        return { requiresVerification: true, email };
      }

      // If already verified or server bypasses
      const { user, accessToken, refreshToken } = resData;
      const authenticatedUser: User = {
        id: user.id || user._id,
        email: user.email || email,
        fullName: user.fullName || fullName,
        avatarUrl: user.avatarUrl || DEFAULT_AVATAR,
        role: user.role || 'FREE_USER',
        authProvider: 'email',
        emailVerified: true,
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
      if (refreshToken) {
        localStorage.setItem('speakwise_refresh_token', refreshToken);
      }
      set({ user: authenticatedUser, isAuthenticated: true });
      useSubscriptionStore.getState().fetchUsageStatus();
      return { requiresVerification: false, email };
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        return { requiresVerification: true, email };
      }
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Registration failed';
      throw new Error(msg);
    }
  },

  verifyEmail: async (email: string, otp: string) => {
    try {
      useSubscriptionStore.getState().resetSubscription();
      const response = await apiClient.post('/auth/verify-email', {
        email,
        otp,
      });

      const { user, accessToken, refreshToken } = response.data.data;
      const authenticatedUser: User = {
        id: user.id || user._id,
        email: user.email || email,
        fullName: user.fullName || email.split('@')[0],
        avatarUrl: user.avatarUrl || DEFAULT_AVATAR,
        role: user.role || 'FREE_USER',
        authProvider: user.authProvider || 'email',
        emailVerified: true,
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
      if (refreshToken) {
        localStorage.setItem('speakwise_refresh_token', refreshToken);
      }
      set({ user: authenticatedUser, isAuthenticated: true });
      useSubscriptionStore.getState().fetchUsageStatus();
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Verification failed. Please check your code and try again.';
      throw new Error(msg);
    }
  },

  sendVerificationEmail: async (email: string) => {
    try {
      const response = await apiClient.post('/auth/send-verification', { email });
      return {
        success: true,
        message: response.data.message || 'Verification code sent to your email.',
      };
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to send verification code.';
      throw new Error(msg);
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: response.data.message || 'If an account exists for this email, password reset instructions have been sent.',
      };
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Unable to process reset request. Please try again.';
      throw new Error(msg);
    }
  },

  verifyResetOtp: async (email: string, otp: string) => {
    try {
      const response = await apiClient.post('/auth/verify-reset-otp', { email, otp });
      return {
        success: true,
        message: response.data.message || 'Code verified successfully.',
      };
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Invalid or expired reset code.';
      throw new Error(msg);
    }
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      return {
        success: true,
        message: response.data.message || 'Password reset successfully. You can now log in.',
      };
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Password reset failed. Please try again.';
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

      const { user, accessToken, refreshToken } = response.data.data;
      const authenticatedUser: User = {
        id: user.id || user._id,
        email: user.email || email,
        fullName: user.fullName || fullName,
        avatarUrl: user.avatarUrl || avatarUrl || DEFAULT_AVATAR,
        role: user.role || 'FREE_USER',
        authProvider: 'google',
        emailVerified: true,
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
      if (refreshToken) {
        localStorage.setItem('speakwise_refresh_token', refreshToken);
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
          authProvider: 'google',
          emailVerified: true,
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
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Google Authentication failed';
      throw new Error(msg);
    }
  },

  logout: () => {
    try {
      localStorage.removeItem('speakwise_user');
      localStorage.removeItem('speakwise_token');
      localStorage.removeItem('speakwise_refresh_token');
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

  // =========================================================================
  // CRITICAL POST-PAYMENT STATE SYNCHRONIZATION (REGRESSION GUARD):
  // After a successful payment, the frontend must immediately re-fetch the user
  // profile and subscription/usage status from the backend without requiring
  // the user to manually log out and log back in.
  // =========================================================================
  refreshUser: async () => {
    try {
      const token = localStorage.getItem('speakwise_token');
      if (!token) return get().user;

      const res = await apiClient.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        const me = res.data.data;
        const current = get().user;
        const updated: User = {
          id: me.id || me._id || current?.id || '',
          email: me.email || current?.email || '',
          fullName: me.fullName || current?.fullName || '',
          avatarUrl: me.avatarUrl || current?.avatarUrl || DEFAULT_AVATAR,
          role: me.role || current?.role || 'FREE_USER',
          authProvider: me.authProvider || current?.authProvider || 'email',
          emailVerified: me.emailVerified ?? current?.emailVerified ?? true,
          streakDays: me.streakDays ?? current?.streakDays ?? 1,
          totalPracticeMinutes: me.totalPracticeMinutes ?? current?.totalPracticeMinutes ?? 0,
          averageScore: me.averageScore ?? current?.averageScore ?? 85,
          targetWpm: me.targetWpm ?? current?.targetWpm ?? 145,
          exp: me.exp ?? current?.exp ?? 250,
          level: me.level ?? current?.level ?? 1,
          subscriptionPlan: me.subscriptionPlan || current?.subscriptionPlan,
          subscriptionExpiresAt: me.subscriptionExpiresAt || current?.subscriptionExpiresAt,
          createdAt: me.createdAt || current?.createdAt || new Date().toISOString(),
        };
        localStorage.setItem('speakwise_user', JSON.stringify(updated));
        set({ user: updated, isAuthenticated: true });
        return updated;
      }
    } catch (e: any) {
      console.error('[AUTH refreshUser ERROR] refreshUser failed:', e?.response?.data || e?.message || e);
      if (e?.response?.status === 401 || e?.response?.status === 404) {
        get().logout();
        return null;
      }
    }
    return get().user;
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('auth:expired', () => {
    useAuthStore.getState().logout();
  });
}
