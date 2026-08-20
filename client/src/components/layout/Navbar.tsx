import React, { useState, useEffect } from 'react';
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
  User,
  History as HistoryIcon,
  CreditCard,
  LayoutDashboard,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { SubscriptionModal } from '../subscription/SubscriptionModal';
import { UpgradeLimitModal } from '../subscription/UpgradeLimitModal';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const {
    freeAttemptsLeft,
    maxAttempts,
    planType,
    isPro,
    fetchUsageStatus,
    openSubscriptionModal,
  } = useSubscriptionStore();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUsageStatus();
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl neu-button p-0.5 shadow-neu-glow group-hover:scale-105 transition-transform flex items-center justify-center">
              <Mic className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                SpeakWise <span className="text-[10px] px-2 py-0.5 rounded-full neu-pressed text-indigo-600 dark:text-indigo-400 font-extrabold">AI</span>
              </span>
            </div>
          </Link>

          {/* Center: Practice Studio Navbar Options */}
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

          {/* Right: Actions, Usage Counter Pill & User / Sign-In Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Trial / Usage Counter Pill */}
            {isPro ? (
              <div
                onClick={openSubscriptionModal}
                className="cursor-pointer flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full neu-flat-sm text-indigo-600 dark:text-indigo-400 text-[11px] sm:text-xs font-extrabold hover:scale-105 transition-transform"
                title="Pro Subscription Active"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden xs:inline">✨ Pro</span>
                <span className="xs:hidden">Pro</span>
              </div>
            ) : (
              <div
                onClick={openSubscriptionModal}
                className="cursor-pointer flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full neu-flat-sm text-amber-700 dark:text-amber-400 text-[11px] sm:text-xs font-extrabold hover:scale-105 transition-transform"
                title="Click to View Plans & Upgrade"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 animate-pulse" />
                <span>
                  {planType === 'FREESTYLE'
                    ? `${freeAttemptsLeft}/10 Left`
                    : `${freeAttemptsLeft}/3 Free`}
                </span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-full neu-button text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Logged-in User Profile Controls */}
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowProfileMenu(false);
                    }}
                    className="p-1.5 sm:p-2 rounded-full neu-button text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 relative"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifs > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                        {unreadNotifs}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-72 sm:w-80 neu-flat p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 max-w-[calc(100vw-2rem)]">
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

                {/* Profile Avatar & Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowProfileMenu(!showProfileMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center p-0.5 rounded-full neu-button hover:scale-105 transition-transform"
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-56 neu-flat p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 space-y-1 max-w-[calc(100vw-2rem)]">
                      <div className="px-3 py-2 border-b border-white/20 dark:border-white/5">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{user.fullName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/settings');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:neu-pressed flex items-center gap-2.5"
                      >
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/sessions');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:neu-pressed flex items-center gap-2.5"
                      >
                        <HistoryIcon className="w-4 h-4 text-violet-500" />
                        <span>History</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          openSubscriptionModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:neu-pressed flex items-center gap-2.5"
                      >
                        <CreditCard className="w-4 h-4 text-amber-500" />
                        <span>Subscription Details</span>
                      </button>

                      <div className="pt-1 border-t border-white/20 dark:border-white/5">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Visitor / Guest Controls: Clean Sign In & Sign Up Buttons */
              <div className="flex items-center gap-2">
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
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-full neu-button text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 dark:border-white/5 neu-flat p-4 space-y-3 rounded-none animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-white/20 dark:border-white/5">
              {studioNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 neu-button flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  {item.badge && <span className="badge-new">{item.badge}</span>}
                </Link>
              ))}
            </div>

            {!user && (
              <div className="grid grid-cols-2 gap-2 pb-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full py-2 text-xs font-bold">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full rounded-full py-2 text-xs font-bold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <div className="pt-1 flex flex-col gap-2">
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
                className="w-full rounded-full py-2.5 text-xs font-extrabold"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSubscriptionModal();
                }}
              >
                Upgrade to Pro (₹99)
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
