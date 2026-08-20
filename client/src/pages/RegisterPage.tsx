import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { Mic, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('Alex Morgan');
  const [email, setEmail] = useState('alex@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, 'PRO_USER');
      setIsLoading(false);
      navigate('/dashboard');
    }, 800);
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
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Create Pro Account</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Start your 14-day free trial of real-time speech coaching</p>
        </div>

        <Card className="p-8 neu-flat">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
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
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none"
                  placeholder="alex@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
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

            <Button type="submit" variant="primary" className="w-full py-3 rounded-2xl" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Create Account & Launch Studio
            </Button>
          </form>
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
