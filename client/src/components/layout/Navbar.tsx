import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { mockNotifications } from '../../services/api';
import {
  Mic,
  Sun,
  Moon,
  Bell,
  LogOut,
  Sparkles,
  Menu,
  X,
  CheckCircle2,
  Zap,
  Crown,
  User as UserIcon,
  History as HistoryIcon,
  CreditCard,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Trophy,
  Award,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { SubscriptionModal } from '../subscription/SubscriptionModal';
import { UpgradeLimitModal } from '../subscription/UpgradeLimitModal';
import { getSubscriptionRemainingTime } from '../../lib/subscriptionTimer';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const {
    freeAttemptsLeft,
    planType,
    isPro,
    planExpiresAt,
    fetchUsageStatus,
    openSubscriptionModal,
  } = useSubscriptionStore();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setTick] = useState(0);

  // Live countdown ticker for Pro validity
  useEffect(() => {
    if (!isPro) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPro]);

  const subRemaining = getSubscriptionRemainingTime(planExpiresAt);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsageStatus();
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setShowProfileMenu(false);
    setShowNotifications(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = mockNotifications.filter((n) => !n.read).length;

  // Header Studio Navbar Tabs
  const studioNavItems = [
    ...(user ? [{ label: 'Dashboard', path: '/dashboard', isRoute: true }] : []),
    { label: 'Topics', path: '/practice?tab=topics', isRoute: false },
    { label: 'Questions', path: '/practice?tab=questions', isRoute: false },
    { label: 'Words', path: '/practice?tab=words', isRoute: false },
    { label: 'Freestyle', path: '/practice?tab=freestyle', isRoute: false },
    { label: 'Corporate Talks', path: '/practice?tab=corporate', badge: 'NEW', isRoute: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full neu-flat rounded-none border-b border-white/20 dark:border-white/5 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl neu-button p-0.5 shadow-neu-glow group-hover:scale-105 transition-transform flex items-center justify-center">
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                SpeakWise <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full neu-pressed text-indigo-600 dark:text-indigo-400 font-extrabold">AI</span>
              </span>
            </div>
          </Link>

          {/* Center: Practice Studio Navbar Options (Desktop only) */}
          <div className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-full neu-pressed">
            {studioNavItems.map((item) => {
              let isActive = false;
              if (item.isRoute) {
                isActive = location.pathname === item.path;
              } else {
                const searchTab = new URLSearchParams(location.search).get('tab') || 'topics';
                const itemTab = new URLSearchParams(item.path.split('?')[1]).get('tab');
                isActive = location.pathname === '/practice' && searchTab === itemTab;
              }

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:neu-button'
                  }`}
                >
                  {item.label === 'Dashboard' && <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{item.label}</span>
                  {item.badge && <span className="badge-new">{item.badge}</span>}
                </Link>
              );
            })}
          </div>

          {/* Right Controls: Desktop full controls + Mobile Account & Hamburger */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Desktop Pro / Usage Counter Pill (Hidden on Mobile) */}
            <div className="hidden md:flex items-center">
              {isPro ? (
                <div
                  onClick={openSubscriptionModal}
                  className="cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-flat-sm text-indigo-600 dark:text-indigo-400 text-xs font-extrabold hover:scale-105 transition-transform border border-indigo-500/30"
                  title={`Pro Active until ${planExpiresAt ? new Date(planExpiresAt).toLocaleString() : 'Continuous'}. Click to extend or view timer.`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>✨ Pro: {subRemaining.shortText}</span>
                </div>
              ) : (
                <div
                  onClick={openSubscriptionModal}
                  className="cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-flat-sm text-amber-700 dark:text-amber-400 text-xs font-extrabold hover:scale-105 transition-transform"
                  title="Click to View Plans & Upgrade"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>
                    {planType === 'FREESTYLE'
                      ? `${freeAttemptsLeft}/10 Left`
                      : `${freeAttemptsLeft}/3 Free`}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Theme Toggle (Hidden on Mobile; Mobile uses floating bottom-left toggle) */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2 rounded-full neu-button text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Desktop Notifications Bell (Hidden on Mobile) */}
            {user && (
              <div className="relative hidden md:block" ref={notifMenuRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className="p-2 rounded-full neu-button text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 neu-flat p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 max-w-sm rounded-3xl border border-white/20 dark:border-white/10 backdrop-blur-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/5">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Notifications</h4>
                      <span className="text-xs text-indigo-500 font-bold cursor-pointer">Mark all read</span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-64 overflow-y-auto">
                      {mockNotifications.map((notif) => (
                        <div key={notif.id} className="py-3 text-xs flex gap-3">
                          <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{notif.title}</div>
                            <div className="text-slate-500 dark:text-slate-400 mt-0.5">{notif.message}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{notif.timestamp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Account / Profile Icon Button (Visible on Both Web & Mobile Screens) */}
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center p-0.5 rounded-full neu-button hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  title="Account Profile Menu"
                  aria-label="Account Profile Menu"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-indigo-500/30"
                  />
                </button>

                {/* Profile Dropdown (Same unified options for Web & Mobile Screens) */}
                {showProfileMenu && (
                  <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-64 max-w-xs neu-flat p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 space-y-1 rounded-3xl border border-white/20 dark:border-white/10 backdrop-blur-2xl">
                    {/* User Info Header */}
                    <div className="px-3.5 py-3 border-b border-white/20 dark:border-white/5">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {user.email}
                      </div>
                    </div>

                    {/* Option 1: Profile */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:neu-pressed flex items-center gap-3 transition-all"
                    >
                      <UserIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span>Profile</span>
                    </button>

                    {/* Option 2: Leaderboard */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/leaderboard');
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:neu-pressed flex items-center gap-3 transition-all"
                    >
                      <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>Leaderboard</span>
                    </button>

                    {/* Option 3: Badges & Milestones */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/achievements');
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:neu-pressed flex items-center gap-3 transition-all"
                    >
                      <Award className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Badges & Milestones</span>
                    </button>

                    {/* Option 4: History */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/sessions');
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:neu-pressed flex items-center gap-3 transition-all"
                    >
                      <HistoryIcon className="w-4 h-4 text-violet-500 flex-shrink-0" />
                      <span>History</span>
                    </button>

                    {/* Option 5: Subscription Details */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        openSubscriptionModal();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:neu-pressed flex items-center gap-3 transition-all"
                    >
                      <CreditCard className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>Subscription Details</span>
                    </button>

                    {/* Option 6: Log Out */}
                    <div className="pt-1 border-t border-white/20 dark:border-white/5">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 transition-all"
                      >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Account Icon on Mobile / Buttons on Desktop */
              <div className="flex items-center gap-1.5">
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login">
                    <Button size="sm" variant="outline" className="rounded-full text-xs px-3.5 py-1.5 font-bold">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" variant="primary" className="rounded-full text-xs px-3.5 py-1.5 font-bold">
                      Sign Up
                    </Button>
                  </Link>
                </div>
                {/* Mobile Guest Account Icon */}
                <Link to="/login" className="sm:hidden p-2 rounded-full neu-button text-indigo-600 dark:text-indigo-400" title="Sign In">
                  <UserIcon className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Rightmost Hamburger Icon (☰) for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full neu-button text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
              title="Practice Menu"
              aria-label="Practice Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer for Hamburger (Topics, Questions, Words, Freestyle, Corporate Talks) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 dark:border-white/5 neu-flat p-4 space-y-3 rounded-none animate-in fade-in slide-in-from-top-2">
            <div className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider px-1">
              Practice Studio Modes
            </div>

            {/* Studio Navigation Grid */}
            <div className="grid grid-cols-2 gap-2 pb-2">
              {studioNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 neu-button flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  {item.badge && <span className="badge-new">{item.badge}</span>}
                </Link>
              ))}
            </div>

            {!user && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 dark:border-white/5">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full py-2.5 text-xs font-bold justify-center" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full rounded-full py-2.5 text-xs font-bold justify-center" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2 border-t border-white/20 dark:border-white/5">
              <Link
                to="/practice/studio"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-full neu-button text-indigo-600 dark:text-indigo-400 font-extrabold text-xs text-center flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Launch Recording Studio HUD</span>
              </Link>
              <Button
                variant="primary"
                className="w-full rounded-full py-2.5 text-xs font-extrabold shadow-lg shadow-indigo-600/30 justify-center"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSubscriptionModal();
                }}
                leftIcon={<Crown className="w-4 h-4 text-amber-300" />}
              >
                {isPro ? `✨ Pro Active: ${subRemaining.shortText} (Extend)` : 'Recharge Pro (Starting ₹9)'}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Global Subscription Modals */}
      <SubscriptionModal />
      <UpgradeLimitModal />
    </>
  );
};
