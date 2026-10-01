import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Mic,
  TrendingUp,
  Target,
  Award,
  Zap,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Wrench,
  Users,
  HelpCircle,
  Brain,
  Clock,
  ShieldCheck,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How can I do daily English speaking practice with AI for free?',
    answer:
      'You can start daily English speaking practice with AI free on SpeakWise AI directly from your browser. Pick any daily conversation topic or impromptu prompt, speak into your microphone for 30 to 180 seconds, and receive an instant scorecard analyzing your grammar accuracy, speaking pace (WPM), and filler words at zero cost.',
  },
  {
    question: 'Why is SpeakWise AI considered the best free app to practice English speaking?',
    answer:
      'Unlike traditional language apps that only test multiple-choice grammar quizzes, SpeakWise AI provides real microphone-based spoken English practice. You speak out loud in real time, and our advanced AI evaluates your sentence structure, vocabulary variety, and fluency metrics—making it the best app for English speaking practice free online.',
  },
  {
    question: 'How to practice English speaking online if I feel nervous or lack a speaking partner?',
    answer:
      'If you want to know how to practice English speaking without fear of judgment, SpeakWise AI acts as your private 24/7 AI speech coach. You practice English speaking online free in a safe, judgment-free space, receiving immediate feedback on hesitations, pronunciation clarity, and pacing before speaking in public or in front of recruiters.',
  },
  {
    question: 'Can I use SpeakWise AI for everyday English conversation practice and interview preparation?',
    answer:
      'Yes! SpeakWise AI features dedicated tracks for English conversation practice, campus placement group discussions (GDs), and behavioral job interviews. The AI speech coach listens to your spoken English practice and highlights corporate vocabulary and executive delivery tips to make you sound natural and confident.',
  },
  {
    question: 'How does SpeakWise AI help with impromptu speaking practice and extempore drills?',
    answer:
      'Impromptu speaking practice requires fast, spontaneous thinking. SpeakWise AI provides instant extempore prompts across corporate, debate, abstract, and current affairs topics. Built-in timers and PREP framework hints teach you how to organize thoughts rapidly without preparation and speak coherently without freezing.',
  },
  {
    question: 'Can I use this English speaking practice app on mobile without downloading anything?',
    answer:
      'Yes. SpeakWise AI is a high-performance web app optimized for both mobile browsers (Chrome, Safari) and desktop. You can start your English practice online anytime, anywhere without downloading large app files or creating complex account setups.',
  },
  {
    question: 'How is SpeakWise AI different from apps like Duolingo, Stimuler, or Toastmasters?',
    answer:
      'Unlike flashcard apps (Duolingo) that focus on vocabulary drills, SpeakWise AI provides full speech analysis with instantaneous scorecards on real spoken audio. Compared to traditional clubs like Toastmasters, SpeakWise AI gives you private, on-demand feedback 24/7 at home without scheduling delays or public speaking anxiety, at a fraction of the cost.',
  },
  {
    question: 'Is SpeakWise AI suitable for Hindi-medium, college, and ITI students in India?',
    answer:
      'Absolutely. SpeakWise AI is built to empower learners from all backgrounds across India—including Hindi-medium graduates, ITI/polytechnic diploma holders, and college freshers preparing for placement drives. The platform offers step-by-step coach hints, simplified grammar corrections, and actionable daily exercises to build real speaking fluency.',
  },
  {
    question: 'How does the ₹1 for 7 Days Pro trial work?',
    answer:
      'First-time users can activate 7 days of full SpeakWise Pro access for just ₹1. You get unlimited AI speech evaluations, comprehensive scorecard breakdowns, and actionable drill recommendations. If you do not upgrade, access automatically reverts to the free tier—no hidden fees and no silent auto-renewals.',
  },
  {
    question: 'What speech metrics does the AI English speaking coach evaluate?',
    answer:
      'The AI speech evaluator analyzes five core communication pillars: Overall Impact score (%), Grammar Accuracy (%), Fluency & Hesitation (%), Vocabulary Range (%), and Confidence Delivery (%). You also receive words-per-minute (WPM) pacing metrics, filler word counts, and personalized coaching drills for your next session.',
  },
];

export const HomeSEOContent: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Structured Data JSON-LD for Google Rich FAQ Snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-24 pt-16 pb-8 text-slate-900 dark:text-slate-100">
      {/* Inject FAQ JSON-LD Schema for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ========================================================================= */}
      {/* SECTION 1: FEATURE SHOWCASE (H2 & H3 Semantic Hierarchy)                  */}
      {/* ========================================================================= */}
      <section aria-labelledby="feature-showcase-heading" className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-pressed text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Speech Evaluation Engine</span>
          </div>
          <h2
            id="feature-showcase-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            The Smartest Way to Master Spoken English & Public Speaking
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            SpeakWise AI combines cutting-edge speech recognition with instant linguistic analysis to provide
            actionable coaching on every word you speak.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Instant AI Speech Evaluation
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Get immediate scoring across Grammar, Fluency, Vocabulary, and Confidence. Discover your exact speaking speed (WPM) and pinpoint hesitations.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Impromptu & Extempore Drills
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Tackle real-time speaking prompts under timed conditions. Train your brain to structure thoughts quickly using proven frameworks like PREP and STAR.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-emerald-500">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Actionable AI Practice Drills
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Do not just see your mistakes—fix them. SpeakWise generates targeted micro-exercises tailored to your grammar weaknesses and filler-word habits.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-cyan-500">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Job Interview & GD Simulations
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Prepare for HR rounds, campus placements, and group discussions with corporate-grade speaking scenarios and recruiter-aligned evaluation standards.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-violet-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Progress Tracking & Analytics
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Review your historical speech transcripts, track your daily speaking streak, and monitor your score improvements over weeks and months.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-rose-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Safe & Judgment-Free Practice
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Eliminate stage fright and hesitation by practicing privately anytime at your own pace before taking the stage or joining high-stakes meetings.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: WHO IS SPEAKWISE AI FOR? (Audience Segmentation)               */}
      {/* ========================================================================= */}
      <section aria-labelledby="target-audience-heading" className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-pressed text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Targeted Learning Pathways</span>
          </div>
          <h2
            id="target-audience-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Who is SpeakWise AI Designed For?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Whether you are stepping into your first college placement or leading boardroom presentations, SpeakWise AI meets you at your current level.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Audience 1 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3 border border-white/20 dark:border-white/5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                College Students & Freshers
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Build spontaneous speaking skills for campus placement interviews, seminar presentations, and college viva examinations.
              </p>
            </div>
            <div className="pt-2 border-t border-white/20 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Campus Placement Ready</span>
            </div>
          </div>

          {/* Audience 2 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3 border border-white/20 dark:border-white/5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-emerald-500">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                ITI & Polytechnic Students
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Transition comfortably from regional languages to spoken English. Master workplace conversations and industrial technical interviews.
              </p>
            </div>
            <div className="pt-2 border-t border-white/20 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Regional to Fluency Support</span>
            </div>
          </div>

          {/* Audience 3 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3 border border-white/20 dark:border-white/5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-amber-500">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Job Seekers & Switchers
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Refine answers to behavioral interview questions, master group discussion strategies, and communicate value with confidence.
              </p>
            </div>
            <div className="pt-2 border-t border-white/20 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Interview Communication</span>
            </div>
          </div>

          {/* Audience 4 */}
          <div className="neu-flat p-6 rounded-3xl space-y-3 border border-white/20 dark:border-white/5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-violet-500">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Public Speakers & Leaders
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Sharpen storytelling, cadence, and extempore thinking for keynote talks, debate competitions, and corporate team leadership.
              </p>
            </div>
            <div className="pt-2 border-t border-white/20 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-bold text-violet-600 dark:text-violet-400">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Executive Presence</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: DAILY ENGLISH SPEAKING PRACTICE & IMPROMPTU ROADMAP (NEW)      */}
      {/* ========================================================================= */}
      <section aria-labelledby="speaking-roadmap-heading" className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-pressed text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Fluency & Impromptu Guide</span>
          </div>
          <h2
            id="speaking-roadmap-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Daily English Speaking Practice with AI: Your Roadmap to Confident Speech
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Whether you want daily spoken English practice, job interview preparation, or spontaneous impromptu speech mastery, SpeakWise AI provides an end-to-end framework to practice English speaking online free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Daily English Speaking Practice
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Overcome the habit of translating in your mind. Practice continuous speaking out loud on 30s–3 min timers with real-time AI speech evaluation and pacing scores.
            </p>
          </div>

          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Impromptu & Extempore Drills
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Train your ability to speak without preparation. Learn structured thinking models (PREP & STAR) to organize arguments rapidly under pressure.
            </p>
          </div>

          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-emerald-500">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              English Conversation Practice
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Simulate campus placement interviews, workplace elevator pitches, and group discussion (GD) scenarios with personalized grammar feedback.
            </p>
          </div>

          <div className="neu-flat p-6 rounded-3xl space-y-3.5 border border-white/20 dark:border-white/5 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl neu-button flex items-center justify-center text-cyan-500">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Best Free App to Practice Speaking
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Accessible directly in your browser without installs or credit card barriers. Receive comprehensive speech scorecards and actionable drills completely free.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/impromptu-speaking-practice"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl neu-flat text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors border border-white/20 dark:border-white/5"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Master Impromptu Speaking & Extempore →</span>
          </Link>
          <Link
            to="/best-english-speaking-practice-app"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl neu-flat text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors border border-white/20 dark:border-white/5"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Explore the Best English Practice App Guide →</span>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: FREQUENTLY ASKED QUESTIONS (Interactive Accordion)             */}
      {/* ========================================================================= */}
      <section aria-labelledby="faq-heading" className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-pressed text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Common Queries & Answers</span>
          </div>
          <h2
            id="faq-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Frequently Asked Questions About AI English Speaking Practice
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Everything you need to know about practicing English speaking online free, impromptu extempore training, and AI speech evaluation.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="neu-flat rounded-2xl border border-white/20 dark:border-white/5 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {item.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full neu-button flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                <div
                  hidden={!isOpen}
                  className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in"
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
