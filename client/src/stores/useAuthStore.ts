import { create } from 'zustand';
import { User, UserRole } from '../types';
import { apiClient } from '../services/api';
import { useSubscriptionStore } from './useSubscriptionStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => void;
  loginWithGoogle: (payload: { email: string; fullName: string; googleId: string; avatarUrl?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const mockDefaultUser: User = {
  id: 'usr_99812',
  email: 'alex.morgan@speakwise.ai',
  fullName: 'Alex Morgan',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  role: 'PRO_USER',
  teamName: 'Acme Enterprise',
  streakDays: 7,
  totalPracticeMinutes: 142,
  averageScore: 88,
  targetWpm: 145,
  createdAt: '2026-01-15',
};

const getSavedUser = (): User | null => {
  try {
    const saved = localStorage.getItem('speakwise_user');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return mockDefaultUser;
};

const initialUser = getSavedUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,

  login: (email: string, role: UserRole = 'FREESTYLE_USER') => {
    const newUser: User = {
      ...mockDefaultUser,
      email,
      role,
      fullName: email.split('@')[0].replace('.', ' ').toUpperCase(),
    };
    localStorage.setItem('speakwise_user', JSON.stringify(newUser));
    localStorage.setItem('speakwise_token', 'mock_jwt_token_' + Date.now());
    set({ user: newUser, isAuthenticated: true });
    useSubscriptionStore.getState().fetchUsageStatus();
  },

  loginWithGoogle: async ({ email, fullName, googleId, avatarUrl }) => {
    try {
      const response = await apiClient.post('/auth/google', {
        email,
        fullName,
        googleId,
        avatarUrl,
      });

      const { user, accessToken } = response.data.data;
      const authenticatedUser: User = {
        id: user.id || user._id || 'usr_g_' + Date.now(),
        email: user.email || email,
        fullName: user.fullName || fullName,
        avatarUrl: user.avatarUrl || avatarUrl || mockDefaultUser.avatarUrl,
        role: user.role || 'FREESTYLE_USER',
        streakDays: user.streakDays || 1,
        totalPracticeMinutes: user.totalPracticeMinutes || 0,
        averageScore: user.averageScore || 85,
        targetWpm: 145,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('speakwise_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('speakwise_token', accessToken || 'mock_jwt_google');
      set({ user: authenticatedUser, isAuthenticated: true });
      useSubscriptionStore.getState().fetchUsageStatus();
    } catch (error) {
      // Fallback for standalone / offline mode
      const authenticatedUser: User = {
        ...mockDefaultUser,
        id: 'usr_g_' + Date.now(),
        email,
        role: 'FREESTYLE_USER',
        fullName,
        avatarUrl: avatarUrl || mockDefaultUser.avatarUrl,
      };

      localStorage.setItem('speakwise_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('speakwise_token', 'mock_jwt_google_fallback');
      set({ user: authenticatedUser, isAuthenticated: true });
      useSubscriptionStore.getState().fetchUsageStatus();
    }
  },

  logout: () => {
    localStorage.removeItem('speakwise_user');
    localStorage.removeItem('speakwise_token');
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
