import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Clock,
  Sparkles,
  ArrowRight,
  Brain,
  Target,
  CheckCircle2,
  BookOpen,
  Volume2,
  Layers,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/layout/Footer';
import { SEOHead } from '../components/common/SEOHead';

const SAMPLE_EXTEMPORE_TOPICS = [
  {
    category: 'Workplace & Career',
    topics: [
      'Should remote work be a permanent standard for tech companies?',
      'How to decline a manager request without damaging professional rapport',
      'The impact of artificial intelligence on entry-level hiring',
    ],
  },
  {
    category: 'Society & Technology',
    topics: [
      'Is social media reducing our collective attention span?',
      'Cashless economies: Convenience versus digital privacy',
      'Electric vehicles in developing nations: Promise versus infrastructure realities',
    ],
  },
  {
    category: 'Abstract & Creative',
    topics: [
      'Comfort zones are silent career killers',
      'Failure is simply data for the next iteration',
      'If you could add one mandatory subject to school curriculums, what would it be?',
    ],
  },
];

export const ImpromptuSpeakingLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
      <SEOHead
        title="Impromptu Speaking Practice & Online Extempore Coach | SpeakWise AI"
        description="Master impromptu speaking practice and online extempore with structured frameworks, sample topics, and instant AI speech feedback on grammar and pace."
        canonicalUrl="https://speakwiseai.app/impromptu-speaking-practice"
        ogTitle="Impromptu Speaking Practice & Online Extempore Coach | SpeakWise AI"
        ogDescription="Learn how to organize your thoughts rapidly under pressure using the PREP framework and real-time AI speech evaluation."
        ogUrl="https://speakwiseai.app/impromptu-speaking-practice"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 sm:space-y-20">
        {/* ========================================================================= */}
        {/* HERO SECTION                                                              */}
        {/* ========================================================================= */}
        <header className="text-center max-w-4xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neu-pressed text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Online Extempore & Impromptu Mastery</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Impromptu Speaking Practice: How to Speak Confidently Without Prior Preparation
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-3xl mx-auto">
            Whether you are called on unexpectedly in a team meeting, stepping up for an extempore round in a campus placement,
            or answering an unscripted interview prompt—impromptu speaking is a trainable skill, not an innate personality trait.
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
                Unlock Pro @ ₹1 Trial
              </Button>
            </Link>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SECTION 1: WHY PEOPLE FREEZE & THE ROOT CAUSE                            */}
        {/* ========================================================================= */}
        <section aria-labelledby="why-freeze-heading" className="space-y-6 neu-flat p-6 sm:p-10 rounded-3xl border border-white/20 dark:border-white/5">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              The Psychology of Speech Anxiety
            </span>
            <h2 id="why-freeze-heading" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Why Do We Freeze During Extempore Speaking?
            </h2>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            When asked to speak with zero seconds of prep time, your brain attempts to do three complex tasks simultaneously:
            formulate a logical argument, search for precise vocabulary, and evaluate how the listener perceives you.
            This cognitive overload triggers the classic "mental blank" or an avalanche of filler words like <em>"um"</em>, <em>"basically"</em>, and <em>"you know"</em>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl neu-pressed space-y-2">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-rose-500" />
                <span>Absence of a Mental Structure</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Without a ready mental blueprint, your thoughts wander without a cohesive conclusion.
              </p>
            </div>

            <div className="p-4 rounded-2xl neu-pressed space-y-2">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Rushing into the First Second</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Speakers panic at 2 seconds of silence, beginning before deciding their main message.
              </p>
            </div>

            <div className="p-4 rounded-2xl neu-pressed space-y-2">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-500" />
                <span>Lack of Private Feedback Reps</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Reading speaking tips does not build fluency—only speaking out loud under a timer creates composure.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: HOW TO PRACTICE IMPROMPTU SPEAKING (PREP FRAMEWORK)            */}
        {/* ========================================================================= */}
        <section aria-labelledby="framework-heading" className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 id="framework-heading" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              How to Practice Impromptu Speaking: The PREP Framework
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
              The world's top debaters and executive communicators rely on simple structural formulas.
              The simplest and most versatile framework for any 60-second impromptu speech is <strong>PREP</strong>:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="neu-flat p-5 rounded-2xl border border-white/20 dark:border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-xl neu-button flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm">
                P
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Point</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                State your core stance clearly in one decisive opening sentence. Avoid vague introductions.
              </p>
            </div>

            <div className="neu-flat p-5 rounded-2xl border border-white/20 dark:border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-xl neu-button flex items-center justify-center font-black text-amber-500 text-sm">
                R
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Reason</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Explain <em>why</em> you hold this stance. Provide the logical rationale or underlying principle.
              </p>
            </div>

            <div className="neu-flat p-5 rounded-2xl border border-white/20 dark:border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-xl neu-button flex items-center justify-center font-black text-emerald-500 text-sm">
                E
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Example</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Anchor your reason with a concrete personal story, real-world case study, or relatable scenario.
              </p>
            </div>

            <div className="neu-flat p-5 rounded-2xl border border-white/20 dark:border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-xl neu-button flex items-center justify-center font-black text-violet-500 text-sm">
                P
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Point (Reiterated)</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Wrap up cleanly by linking your example back to your original premise in a memorable concluding line.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MID-PAGE CALL TO ACTION                                                   */}
        {/* ========================================================================= */}
        <div className="neu-flat p-6 sm:p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Ready to test the PREP framework right now?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Pick a 60-second topic, speak into your microphone, and view your instant speech report.
            </p>
          </div>
          <Link to="/practice" className="flex-shrink-0">
            <Button size="md" variant="primary" className="rounded-full px-6 py-3 font-extrabold shadow-md">
              Try a 60-Second Practice Session
            </Button>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: CURATED EXTEMPORE SPEAKING TOPICS FOR PRACTICE                 */}
        {/* ========================================================================= */}
        <section aria-labelledby="topics-heading" className="space-y-6">
          <div className="space-y-2">
            <h2 id="topics-heading" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Curated Extempore Speaking Topics for Practice
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
              Here are sample topics commonly encountered in college extempore competitions, campus job drives, and Toastmasters table topics:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SAMPLE_EXTEMPORE_TOPICS.map((group) => (
              <div key={group.category} className="neu-flat p-5 rounded-2xl border border-white/20 dark:border-white/5 space-y-3">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{group.category}</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {group.topics.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>"{t}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: WHY ONLINE EXTEMPORE PRACTICE WITH SPEAKWISE AI WORKS           */}
        {/* ========================================================================= */}
        <section aria-labelledby="ai-platform-heading" className="space-y-6 neu-flat p-6 sm:p-10 rounded-3xl border border-white/20 dark:border-white/5">
          <div className="space-y-2">
            <h2 id="ai-platform-heading" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Why SpeakWise AI is Built for Online Extempore Practice
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Practicing in front of a mirror gives you zero data on pacing, pauses, or vocabulary range.
              SpeakWise AI acts as a private, non-judgmental digital speech coach:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Live Microphone HUD with Timer</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  Practice sessions with 30s, 60s, 90s, or 2-minute durations to build strict time discipline.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">3 Free Full AI Analyses (Reports Included)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  Get 3 complete evaluations with grammar breakdowns, tense corrections, and pace analytics at zero cost, then continue with the ₹1 7-Day trial.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Pace & Hesitation Tracking</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  Know whether you spoke too fast (over 160 WPM) or choked with long pauses (under 90 WPM).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Goal-Specific Practice Libraries</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  Switch effortlessly between Everyday English, Corporate Talks, Interview Prep, and Abstract Extempore prompts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FINAL CALL TO ACTION                                                      */}
        {/* ========================================================================= */}
        <footer className="text-center max-w-2xl mx-auto space-y-4 pt-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Stop Overthinking. Start Speaking.
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Start with 3 completely free speech analyses (full scorecard and report included). Then continue your progress with our ₹1 7-Day trial or flexible passes.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/practice">
              <Button size="lg" variant="primary" className="rounded-full px-8 py-3.5 font-black shadow-neu-glow">
                Start 3 Free Speech Analyses
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="rounded-full px-7 py-3.5 font-bold">
                Unlock Pro @ ₹1 Trial
              </Button>
            </Link>
          </div>
        </footer>
      </div>

      <Footer />
    </div>
  );
};
