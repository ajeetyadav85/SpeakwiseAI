import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { signInWithGooglePopup, checkGoogleRedirectResult } from '../config/firebase';
import { Mic, ArrowRight, Lock, Mail, Globe, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('alex.morgan@speakwise.ai');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  // Check for redirect result on mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      const redirectUser = await checkGoogleRedirectResult();
      if (redirectUser) {
        setIsGoogleLoading(true);
        await loginWithGoogle(redirectUser);
        setIsGoogleLoading(false);
        navigate('/dashboard');
      }
    };
    handleRedirectResult();
  }, [loginWithGoogle, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      login(email, 'PRO_USER');
      setIsLoading(false);
      navigate('/dashboard');
    }, 600);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);

      const googleUser = await signInWithGooglePopup();
      await loginWithGoogle(googleUser);

      setIsGoogleLoading(false);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      setErrorMessage('Google Authentication failed. Please try again.');
      setIsGoogleLoading(false);
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
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome back</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Enter your credentials to access your speech analytics</p>
        </div>

        <Card className="p-8 neu-flat">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl neu-pressed text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                <a href="#" className="text-xs text-indigo-500 dark:text-indigo-400 font-bold hover:underline">
                  Forgot password?
                </a>
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

            <Button type="submit" variant="primary" className="w-full py-3 rounded-2xl" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Sign In to Account
            </Button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20 dark:border-white/5" /></div>
            <span className="relative px-3 bg-[var(--bg-card)] text-xs text-slate-500 font-bold">Or continue with</span>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full font-bold flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
              isLoading={isGoogleLoading}
              leftIcon={<Globe className="w-4 h-4 text-cyan-500" />}
            >
              Sign in with Google (Firebase)
            </Button>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6 font-semibold">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">
            Create free account
          </Link>
        </p>
      </div>
    </div>
  );
};
