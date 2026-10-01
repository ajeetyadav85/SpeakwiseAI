import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Mic,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  Target,
  Crown,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/layout/Footer';
import { SEOHead } from '../components/common/SEOHead';

export const BestEnglishAppLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
      <SEOHead
        title="Best English Speaking Practice App: Honest Review & Free Features | SpeakWise AI"
        description="Looking for the best English speaking practice app? Compare SpeakWise AI features, what is included in the free tier, and how real-time AI speech feedback works."
        canonicalUrl="https://www.speakwiseai.app/best-english-speaking-practice-app"
        ogTitle="Best English Speaking Practice App: Honest Review & Free Features | SpeakWise AI"
        ogDescription="An honest guide to choosing an English speaking practice app. Compare real voice practice vs multiple-choice drills, plus free tier details."
        ogUrl="https://www.speakwiseai.app/best-english-speaking-practice-app"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 sm:space-y-20">
        {/* ========================================================================= */}
        {/* HERO SECTION                                                              */}
        {/* ========================================================================= */}
        <header className="text-center max-w-4xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neu-pressed text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Honest Evaluation & Feature Breakdown</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Finding the Best English Speaking Practice App: What to Look For (And What SpeakWise Delivers)
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-3xl mx-auto">
            Most language apps test your ability to tap grammar options on a screen. SpeakWise AI gives you 3 completely free, full-feature AI speech analyses with detailed scorecards and grammar feedback to start, followed by an accessible ₹1 7-Day trial or flexible plans.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/practice" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-auto rounded-full px-8 py-3.5 text-sm font-extrabold shadow-neu-glow flex items-center justify-center gap-2"
                leftIcon={<Mic className="w-4 h-4 text-emerald-300" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start 3 Free Speech Analyses
              </Button>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full px-7 py-3.5 text-sm font-bold justify-center"
              >
                Unlock 7 Days Pro @ ₹1
              </Button>
            </Link>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SECTION 1: CRITERIA FOR CHOOSING A SPEAKING APP                          */}
        {/* ========================================================================= */}
        <section aria-labelledby="criteria-heading" className="space-y-6 neu-flat p-6 sm:p-10 rounded-3xl border border-white/20 dark:border-white/5">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Buyer's & Learner's Checklist
            </span>
            <h2 id="criteria-heading" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              What Separates Good Speaking Apps from Tap-and-Quiz Apps?
            </h2>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            If you have spent months on traditional language apps and still freeze when a stranger asks a question in English,
            the problem is not your memory—it is your training method. When evaluating an English speaking practice app, verify these three pillars:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="p-5 rounded-2xl neu-pressed space-y-2.5">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-500" />
                <span>Real Voice Input Under a Timer</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                The app must listen to your continuous spoken sentences, not just single isolated words or pronunciation of pre-written lines.
              </p>
            </div>

            <div className="p-5 rounded-2xl neu-pressed space-y-2.5">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span>Linguistic & Grammar Diagnosis</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Immediate feedback should point out subject-verb disagreements, incorrect prepositions, and repetitive vocabulary in what you actually spoke.
              </p>
            </div>

            <div className="p-5 rounded-2xl neu-pressed space-y-2.5">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Pacing (WPM) & Hesitation Metrics</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Speaking too slowly makes you sound uncertain; speaking too quickly creates blunders. A good coach gives you exact Words-Per-Minute metrics.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: WHERE SPEAKWISE AI EXCELS (AND HONEST LIMITS)                  */}
        {/* ========================================================================= */}
        <section aria-labelledby="why-speakwise-heading" className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 id="why-speakwise-heading" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Why SpeakWise AI is a Strong Contender
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
              We designed SpeakWise specifically to bridge the gap between knowing English grammar rules and speaking with effortless confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="neu-flat p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Live Recording Studio HUD</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Practice in an interface with real-time mic volume tracking, countdown timers, and prompt reminders that simulate authentic interview pressure.
              </p>
            </div>

            <div className="neu-flat p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-emerald-500 font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Instant 5-Pillar Scorecard</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Get an objective percentage score on Overall Impact, Grammar Accuracy, Fluency, Vocabulary, and Confidence Delivery after every practice drill.
              </p>
            </div>

            <div className="neu-flat p-6 rounded-3xl border border-white/20 dark:border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-amber-500 font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">On-Demand, Private Practice</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                No need to feel embarrassed in front of a class or wait for a weekly club meetup. Practice at 6 AM or midnight from your phone or laptop.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: TRANSPARENT FREE VS PAID BREAKDOWN                             */}
        {/* ========================================================================= */}
        <section aria-labelledby="pricing-transparency-heading" className="space-y-8 neu-flat p-6 sm:p-10 rounded-3xl border border-white/20 dark:border-white/5">
          <div className="space-y-2 text-center max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Honest & Transparent Pricing
            </span>
            <h2 id="pricing-transparency-heading" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Free English Speaking Practice vs SpeakWise Pro
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              We believe in complete clarity. You do not need to enter credit card details to start practicing. Here is exactly what is free versus paid:
            </p>
          </div>

          {/* Prominent ₹1 Trial Banner Callout */}
          <div className="neu-pressed p-5 sm:p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Trust-Building Free Tier: 3 Free Analyses Included
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Every learner receives 3 completely free, full-feature AI speech analyses with detailed scorecards and grammar feedback (no payment needed). Once you use your 3 free analyses, unlock 7 full days of unlimited analyses for just ₹1.
              </p>
            </div>
            <Link to="/register" className="flex-shrink-0">
              <Button size="sm" variant="primary" className="rounded-full px-6 py-2.5 text-xs font-extrabold shadow-md">
                Try 7 Days Pro @ ₹1
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4 font-black text-slate-900 dark:text-white">Feature</th>
                  <th className="py-3.5 px-4 font-black text-slate-600 dark:text-slate-300">Free Tier (No Card Needed)</th>
                  <th className="py-3.5 px-4 font-black text-indigo-600 dark:text-indigo-400">SpeakWise Pro (or ₹1 Trial)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">Full AI Speech Analysis Reports</td>
                  <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> 3 completely free full analyses included
                  </td>
                  <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" /> Unlimited speech analyses
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">Speaking Studio HUD & Timers</td>
                  <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Full access (30s, 60s, 90s, 2m, 3m)
                  </td>
                  <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Full access (30s, 60s, 90s, 2m, 3m)
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">Prompt & Topic Categories</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">Full access to all curated categories</td>
                  <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">Full access + custom user topics</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">5-Pillar Scorecards (Grammar, Fluency, WPM)</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    Included with your 3 free analyses
                  </td>
                  <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" /> Unlimited 5-pillar scorecards
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">After Free Analyses Used</td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                    Locked until trial or plan upgrade
                  </td>
                  <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" /> Continuous uninterrupted access
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">Pricing / Trial Offer</td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">₹0 (3 Free Analyses)</td>
                  <td className="py-3.5 px-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                    ₹1 for 7-Day Trial (Then flexible passes starting ₹9)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FINAL CALL TO ACTION                                                      */}
        {/* ========================================================================= */}
        <footer className="text-center max-w-2xl mx-auto space-y-4 pt-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Start Your Daily English Speaking Habit
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Get started with 3 completely free, full-feature speech analyses. When ready, unlock 7 full days of unlimited AI evaluations for just ₹1.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/practice">
              <Button size="lg" variant="primary" className="rounded-full px-8 py-3.5 font-black shadow-neu-glow">
                Start 3 Free Speech Analyses
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="rounded-full px-7 py-3.5 font-bold">
                Unlock 7 Days Pro @ ₹1
              </Button>
            </Link>
          </div>
        </footer>
      </div>

      <Footer />
    </div>
  );
};
