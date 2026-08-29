import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
        <span className="text-xs font-mono text-slate-500">Last updated: August 2026</span>
      </div>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full neu-pressed text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Security</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          At SpeakWise AI, we take your personal privacy, vocal audio data, and payment security with utmost priority. This Privacy Policy details how we collect, process, and protect your information.
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
        <Card className="neu-flat p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            1. Information We Collect
          </h2>
          <p>We collect information you provide directly to us when creating an account, practicing public speaking, and making subscription purchases:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li><strong>Account Information:</strong> Name, email address, password hash, and OAuth profile details (e.g. Google Sign-In).</li>
            <li><strong>Speech & Audio Telemetry:</strong> Real-time audio recordings, transcription transcripts, cadence metrics (WPM, pause durations, vocal pitch), and pronunciation scores during practice sessions.</li>
            <li><strong>Payment & Billing Data:</strong> Transaction references, subscription plan tier, and payment status processed securely through authorized PCI-DSS compliant payment gateways. We never store raw credit/debit card numbers on our servers.</li>
          </ul>
        </Card>

        <Card className="neu-flat p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-500" />
            2. How We Use Your Information
          </h2>
          <p>Your data is used strictly for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li>To generate real-time AI speech feedback, grammar rephrasing, filler word identification, and phonetic pronunciation guidance.</li>
            <li>To track your public speaking consistency, streaks, EXP levels, and competitive leaderboard rank.</li>
            <li>To process billing transactions and manage active subscription memberships.</li>
            <li>To improve speech recognition models and application performance. We do not sell or broker your personal data to third-party advertisers.</li>
          </ul>
        </Card>

        <Card className="neu-flat p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            3. Payment Gateway & Security Standards
          </h2>
          <p>
            All online transactions and subscription checkouts are encrypted using industry-standard 256-bit SSL encryption. Payment processing is handled by certified, PCI-DSS compliant third-party payment gateways (Razorpay / Stripe).
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your payment credentials are tokenized directly by the payment processor and are never stored or accessible on SpeakWise AI internal databases.
          </p>
        </Card>

        <Card className="neu-flat p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-500" />
            4. User Rights & Data Deletion
          </h2>
          <p>
            You retain full ownership of your practice transcripts and account data. You may request account deletion, export speech session history, or revoke permissions at any time by contacting our data protection officer at <a href="mailto:privacy@speakwise.ai" className="text-indigo-600 dark:text-indigo-400 font-bold underline">privacy@speakwise.ai</a>.
          </p>
        </Card>
      </div>

      <div className="text-center pt-4">
        <Link to="/contact">
          <Button variant="outline" size="sm">
            Have questions? Contact Support
          </Button>
        </Link>
      </div>
    </div>
  );
};
