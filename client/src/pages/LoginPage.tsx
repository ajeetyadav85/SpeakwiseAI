import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, AuthError } from '../stores/useAuthStore';
import { triggerGoogleAuth, checkGoogleRedirectResult } from '../config/firebase';
import {
  Mic,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

type AuthView = 'LOGIN' | 'FORGOT_EMAIL' | 'FORGOT_RESET' | 'FORGOT_SUCCESS' | 'VERIFY_EMAIL';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active view management
  const [currentView, setCurrentView] = useState<AuthView>('LOGIN');

  // Forgot password / Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Email verification state for unverified users attempting login
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');

  const {
    isAuthenticated,
    login,
    loginWithGoogle,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    verifyEmail,
    sendVerificationEmail,
  } = useAuthStore();
  const navigate = useNavigate();

  // If already authenticated, redirect to Homepage
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Check for redirect result on mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      const redirectUser = await checkGoogleRedirectResult();
      if (redirectUser) {
        setIsGoogleLoading(true);
        try {
          await loginWithGoogle(redirectUser);
          navigate('/');
        } catch (error: any) {
          setErrorMessage(error.message || 'Google Authentication failed.');
        } finally {
          setIsGoogleLoading(false);
        }
      }
    };
    handleRedirectResult();
  }, [loginWithGoogle, navigate]);

  const clearMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setSuccessMessage(null);
  };

  // Standard Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    try {
      await login(email.trim(), password);
      setIsLoading(false);
      navigate('/');
    } catch (error: any) {
      setIsLoading(false);
      const authErr = error as AuthError;

      if (authErr.requiresVerification) {
        setUnverifiedEmail(authErr.unverifiedEmail || email.trim());
        setErrorMessage(authErr.message || 'Your email is not verified yet.');
        return;
      }

      setErrorMessage(error.message || 'Invalid email or password.');
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      clearMessages();

      const googleUser = await triggerGoogleAuth();
      await loginWithGoogle(googleUser);

      setIsGoogleLoading(false);
      navigate('/');
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      setErrorMessage(error.message || 'Google Authentication failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  // FORGOT PASSWORD STEP 1: Submit Email
  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanEmail = resetEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(cleanEmail);
      setIsLoading(false);
      setInfoMessage(res.message);
      setResendCooldown(60);
      setCurrentView('FORGOT_RESET');
    } catch (error: any) {
      setIsLoading(false);
      setErrorMessage(error.message || 'Unable to process request. Please try again.');
    }
  };

  // FORGOT PASSWORD STEP 2: Verify OTP & Enter New Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanOtp = resetOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      // First verify OTP
      await verifyResetOtp(resetEmail.trim(), cleanOtp);
      // Then set new password
      const res = await resetPassword(resetEmail.trim(), cleanOtp, newPassword);
      setIsLoading(false);
      setSuccessMessage(res.message);
      setCurrentView('FORGOT_SUCCESS');
    } catch (error: any) {
      setIsLoading(false);
      setErrorMessage(error.message || 'Failed to reset password. Please check your code and try again.');
    }
  };

  // Resend Password Reset OTP
  const handleResendResetOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    clearMessages();

    try {
      const res = await forgotPassword(resetEmail.trim());
      setResendCooldown(60);
      setInfoMessage(res.message || 'A new reset code has been sent to your email.');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resend reset code.');
    } finally {
      setIsResending(false);
    }
  };

  // UNVERIFIED EMAIL: Submit OTP from Login Screen
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanOtp = verifyOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail(unverifiedEmail.trim(), cleanOtp);
      setSuccessMessage('Email verified successfully! Taking you to your dashboard...');
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (error: any) {
      setIsLoading(false);
      setErrorMessage(error.message || 'Invalid verification code. Please check and try again.');
    }
  };

  // Resend Email Verification OTP
  const handleResendVerifyEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    clearMessages();

    try {
      const res = await sendVerificationEmail(unverifiedEmail.trim());
      setResendCooldown(60);
      setInfoMessage(res.message || 'A fresh verification code has been sent to your email.');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center shadow-neu-glow">
              <Mic className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">SpeakWise AI</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {currentView === 'LOGIN' && 'Welcome back'}
            {currentView === 'FORGOT_EMAIL' && 'Forgot Password'}
            {currentView === 'FORGOT_RESET' && 'Set New Password'}
            {currentView === 'FORGOT_SUCCESS' && 'Password Changed!'}
            {currentView === 'VERIFY_EMAIL' && 'Verify Email Address'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {currentView === 'LOGIN' && 'Enter your credentials to access your speech analytics'}
            {currentView === 'FORGOT_EMAIL' && 'Enter your account email to receive a password reset code'}
            {currentView === 'FORGOT_RESET' && 'Enter the reset code and choose your new password'}
            {currentView === 'FORGOT_SUCCESS' && 'Your account password has been updated successfully'}
            {currentView === 'VERIFY_EMAIL' && 'Enter the code sent to your email to activate your account'}
          </p>
        </div>

        <Card className="p-8 neu-flat">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl neu-pressed text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {/* If unverified email detected on login, offer quick-action button */}
              {unverifiedEmail && currentView === 'LOGIN' && (
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setCurrentView('VERIFY_EMAIL');
                  }}
                  className="underline font-bold text-xs whitespace-nowrap text-indigo-600 dark:text-indigo-400 hover:opacity-80"
                >
                  Verify Now
                </button>
              )}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-2xl neu-pressed text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl neu-pressed text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 1: STANDARD LOGIN FORM */}
          {/* ========================================================================= */}
          {currentView === 'LOGIN' && (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none"
                      placeholder="alex@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setResetEmail(email.trim());
                        setCurrentView('FORGOT_EMAIL');
                      }}
                      className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 rounded-2xl"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In to Account
                </Button>
              </form>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20 dark:border-white/5" />
                </div>
                <span className="relative px-3 bg-[var(--bg-card)] text-xs text-slate-500 font-bold">
                  Or continue with
                </span>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full font-bold flex items-center justify-center gap-2 py-3"
                  onClick={handleGoogleLogin}
                  isLoading={isGoogleLoading}
                  leftIcon={<GoogleIcon />}
                >
                  Continue with Google
                </Button>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: FORGOT PASSWORD - ENTER EMAIL */}
          {/* ========================================================================= */}
          {currentView === 'FORGOT_EMAIL' && (
            <form onSubmit={handleForgotEmailSubmit} className="space-y-5">
              <div className="text-center py-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enter the email address registered with your SpeakWise AI account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none"
                    placeholder="alex@example.com"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 rounded-2xl"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Code
              </Button>

              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setCurrentView('LOGIN');
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: FORGOT PASSWORD - ENTER OTP & NEW PASSWORD */}
          {/* ========================================================================= */}
          {currentView === 'FORGOT_RESET' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="text-center pb-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Code sent to: <span className="font-bold text-slate-900 dark:text-white">{resetEmail}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 text-center">
                  6-Digit Reset Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center py-2.5 rounded-2xl text-xl font-mono tracking-[8px] font-bold focus:outline-none"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm font-medium focus:outline-none"
                    placeholder="At least 8 characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm font-medium focus:outline-none"
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 rounded-2xl mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Reset Password
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setCurrentView('FORGOT_EMAIL');
                  }}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendResetOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className={`inline-flex items-center gap-1 font-bold ${
                    resendCooldown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-indigo-600 dark:text-indigo-400 hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* VIEW 4: FORGOT PASSWORD - SUCCESS CONFIRMATION */}
          {/* ========================================================================= */}
          {currentView === 'FORGOT_SUCCESS' && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Password Reset Complete
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  You can now log in with your updated credentials.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                className="w-full py-3 rounded-2xl"
                onClick={() => {
                  clearMessages();
                  setEmail(resetEmail);
                  setPassword('');
                  setCurrentView('LOGIN');
                }}
              >
                Sign In with New Password
              </Button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 5: UNVERIFIED USER EMAIL VERIFICATION */}
          {/* ========================================================================= */}
          {currentView === 'VERIFY_EMAIL' && (
            <form onSubmit={handleVerifyEmailSubmit} className="space-y-5">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enter the 6-digit confirmation code for:
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {unverifiedEmail}
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center py-3 rounded-2xl text-2xl font-mono tracking-[8px] font-bold focus:outline-none"
                  placeholder="000000"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2">
                  Code expires in 10 minutes
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 rounded-2xl"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Verify & Log In
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setCurrentView('LOGIN');
                  }}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </button>

                <button
                  type="button"
                  onClick={handleResendVerifyEmail}
                  disabled={resendCooldown > 0 || isResending}
                  className={`inline-flex items-center gap-1 font-bold ${
                    resendCooldown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-indigo-600 dark:text-indigo-400 hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}
        </Card>

        {currentView === 'LOGIN' && (
          <p className="text-center text-xs text-slate-500 mt-6 font-semibold">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">
              Create free account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};
