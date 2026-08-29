import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, ShieldCheck, Lock, Mail, Heart, Sparkles, CreditCard } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';

export const Footer: React.FC = () => {
  const { openSubscriptionModal } = useSubscriptionStore();

  return (
    <footer className="w-full border-t border-white/20 dark:border-white/5 neu-flat rounded-none mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-2xl neu-button p-0.5 shadow-neu-glow flex items-center justify-center">
                <Mic className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                SpeakWise <span className="text-[9px] px-1.5 py-0.5 rounded-full neu-pressed text-indigo-600 dark:text-indigo-400 font-extrabold">AI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Enterprise public speaking intelligence and real-time executive voice cadence coaching.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PCI-DSS 256-Bit SSL Secure</span>
            </div>
          </div>

          {/* Col 2: Practice Modes */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider">Practice Studio</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/practice?tab=topics" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Impromptu Topics
                </Link>
              </li>
              <li>
                <Link to="/practice?tab=questions" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Interview Questions Drill
                </Link>
              </li>
              <li>
                <Link to="/practice?tab=words" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Words & Idioms Studio
                </Link>
              </li>
              <li>
                <Link to="/practice?tab=corporate" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Corporate Executive Talks
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance & Legal (Payment Gateway Requirements) */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider">Legal & Policies</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold text-indigo-600 dark:text-indigo-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold text-indigo-600 dark:text-indigo-400">
                  Disclaimer & Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold text-indigo-600 dark:text-indigo-400">
                  Contact Us & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Payments & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider">Payments & Gateway</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Accepting UPI, Credit/Debit Cards, Net Banking & Wallets via certified secure gateways.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="px-2 py-1 rounded-lg neu-pressed text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">UPI</span>
              <span className="px-2 py-1 rounded-lg neu-pressed text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">VISA</span>
              <span className="px-2 py-1 rounded-lg neu-pressed text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">Mastercard</span>
              <span className="px-2 py-1 rounded-lg neu-pressed text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">NetBanking</span>
            </div>
            <button
              onClick={openSubscriptionModal}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline block pt-1"
            >
              View Affordable Passes (Starting ₹9 / 24h) →
            </button>

          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            © {new Date().getFullYear()} SpeakWise AI Technologies. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <span>•</span>
            <Link to="/disclaimer" className="hover:underline">Disclaimer</Link>
            <span>•</span>
            <Link to="/contact" className="hover:underline">Contact Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
