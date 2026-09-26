import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { triggerGoogleAuth, checkGoogleRedirectResult } from '../config/firebase';
import { Mic, ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
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

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const { isAuthenticated, register, verifyEmail, sendVerificationEmail, loginWithGoogle } = useAuthStore();
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

  // Check for Google redirect result on mount
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    // Validation
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(fullName.trim(), cleanEmail, password);
      setIsLoading(false);

      if (result.requiresVerification) {
        setIsVerifying(true);
        setResendCooldown(60);
        setInfoMessage(`We've sent a 6-digit verification code to ${cleanEmail}. Please enter it below to activate your account.`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);

    try {
      await verifyEmail(email.trim(), cleanOtp);
      setSuccessMessage('Email verified successfully! Taking you to your dashboard...');
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (error: any) {
      setErrorMessage(error.message || 'Invalid verification code. Please check and try again.');
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await sendVerificationEmail(email.trim());
      setResendCooldown(60);
      setInfoMessage(res.message || 'A fresh verification code has been sent to your email.');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resend verification code. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);

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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center shadow-neu-glow">
              <Mic className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">SpeakWise AI</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isVerifying ? 'Verify Your Email' : 'Create Account'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {isVerifying
              ? 'Complete registration to unlock your speaking analytics'
              : 'Sign up to get instant speech insights & 7-day Pro trial'}
          </p>
        </div>

        <Card className="p-8 neu-flat">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl neu-pressed text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
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

          {/* STEP 2: EMAIL VERIFICATION OTP SCREEN */}
          {isVerifying ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enter the 6-digit code sent to:
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
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
                Verify & Launch Account
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsVerifying(false)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Edit details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
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
          ) : (
            /* STEP 1: INITIAL REGISTRATION FORM */
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none"
                      placeholder="Alex Morgan"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
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
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none"
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none"
                      placeholder="Re-enter your password"
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
                  Create Account & Continue
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
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6 font-semibold">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
