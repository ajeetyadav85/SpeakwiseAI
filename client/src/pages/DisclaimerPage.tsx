import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FileCheck, Scale, RefreshCw, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const DisclaimerPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
        <span className="text-xs font-mono text-slate-500">Effective: August 2026</span>
      </div>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full neu-pressed text-xs font-bold text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Legal & Compliance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Disclaimer & Terms of Service
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Please read this legal disclaimer and terms of service before using the SpeakWise AI speech practice software and subscription services.
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
        <Card className="neu-flat p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-500" />
            1. AI Speech Analysis & Coaching Disclaimer
          </h2>
          <p>
            SpeakWise AI is an artificial intelligence-driven educational and communication coaching tool designed to assist users in improving pacing, confidence, pronunciation, and vocabulary structure.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            While our proprietary algorithms and large language model engines provide high-fidelity feedback, speech metrics and automated grades are provided for educational and self-improvement purposes only. They do not constitute official linguistic accreditation, medical speech therapy, or legal employment guarantees for interviews or high-stakes pitches.
          </p>
        </Card>

        <Card className="neu-flat p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-500" />
            2. Subscription & Payment Terms
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li><strong>Subscription Billing:</strong> Pro plan memberships are billed on a recurring monthly or annual basis as specified during checkout.</li>
            <li><strong>Trial Access:</strong> First-time users are entitled to free guest practice sessions on the homepage. Full analytical reports and advanced AI modules require an active paid subscription or user login.</li>
            <li><strong>Cancellation Policy:</strong> You may cancel your subscription at any time via your account Settings or Subscription modal. Upon cancellation, your Pro benefits remain active until the end of the current billing cycle.</li>
          </ul>
        </Card>

        <Card className="neu-flat p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            3. Refund & Cancellation Policy
          </h2>
          <p>
            We strive for total satisfaction with our public speaking AI tools. If you experience technical defects preventing access to your paid subscription, you may request a review for a refund within <strong>7 days</strong> of purchase by contacting our billing team at <a href="mailto:billing@speakwise.ai" className="text-indigo-600 dark:text-indigo-400 font-bold underline">billing@speakwise.ai</a>.
          </p>
        </Card>

        <Card className="neu-flat p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            4. Limitation of Liability
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Under no circumstances shall SpeakWise AI, its founders, or affiliates be liable for any direct, indirect, incidental, or consequential damages resulting from the use of or inability to use this platform, including speech competition outcomes, hiring decisions, or hardware microphone performance.
          </p>
        </Card>
      </div>

      <div className="text-center pt-4">
        <Link to="/contact">
          <Button variant="outline" size="sm">
            Contact Support & Inquiries
          </Button>
        </Link>
      </div>
    </div>
  );
};
