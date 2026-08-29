import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../stores/useThemeStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useAuthStore } from '../stores/useAuthStore';
import {
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Moon,
  Sun,
  Lock,
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  Crown,
  LogIn,
  UserPlus,
  Volume2,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Footer } from '../components/layout/Footer';


interface PromptItem {
  id: string;
  category: string;
  prompt: string;
  hint: string;
}

const SAMPLE_PROMPTS: PromptItem[] = [
  {
    id: 'p1',
    category: 'AI & Tech',
    prompt: 'Will Artificial Intelligence replace traditional education in the next decade?',
    hint: 'State your thesis, present 2 contrasting examples, and conclude on human-AI synergy.',
  },
  {
    id: 'p2',
    category: 'Startup & VC',
    prompt: 'Pitching a high-growth SaaS startup to tier-1 venture capital partners',
    hint: 'Highlight ARR growth rate, customer retention Cohort, and the unfair moat.',
  },
  {
    id: 'p3',
    category: 'Leadership',
    prompt: 'Overcoming imposter syndrome and owning your authentic executive voice',
    hint: 'Share a personal inflection moment and provide 2 tactical leadership habits.',
  },
  {
    id: 'p4',
    category: 'Current Affairs',
    prompt: 'How circular economy principles will eliminate global industrial waste',
    hint: 'Discuss cradle-to-cradle design, supply chain incentives, and consumer behavior.',
  },
  {
    id: 'p5',
    category: 'Public Speaking',
    prompt: 'The psychology of peak vocal performance during high-stakes keynote speeches',
    hint: 'Focus on diaphragmatic breathing, strategic pause control, and eye engagement.',
  },
];

const DURATION_OPTIONS = [
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2 Mins', seconds: 120 },
  { label: '3 Mins', seconds: 180 },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated } = useAuthStore();
  const { openSubscriptionModal } = useSubscriptionStore();

  // Selected duration (default 60 seconds)
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);

  // In-Page Live Practice State
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  // Web Audio & Speech Recognition Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const activePrompt = SAMPLE_PROMPTS[currentPromptIndex];

  // Spin to next prompt
  const handleNextPrompt = () => {
    if (isPracticing) return;
    setCurrentPromptIndex((prev) => (prev + 1) % SAMPLE_PROMPTS.length);
  };

  // Start in-page practice (No navigation!)
  const handleStartInPagePractice = async () => {
    setIsPracticing(true);
    setIsPaused(false);
    setTimeLeft(selectedDuration);
    setElapsedSeconds(0);
    setLiveTranscript('');
    setShowCompletionModal(false);

    // Initialize Web Audio API Microphone Volume meter
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMicLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setMicVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateMicLevel);
      };
      updateMicLevel();
    } catch (err) {
      console.warn('Microphone permission denied or not supported:', err);
    }

    // Initialize Web Speech Recognition if available in browser
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTrans = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTrans += event.results[i][0].transcript + ' ';
          }
          setLiveTranscript(currentTrans.trim());
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error', e);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Could not start speech recognition', e);
      }
    }
  };

  // Timer countdown effect during practice
  useEffect(() => {
    let timer: any;
    if (isPracticing && !isPaused) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleStopInPagePractice();
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPracticing, isPaused]);

  // Clean up audio & speech recognition
  const stopAudioStreams = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setMicVolume(0);
  };

  // Stop in-page practice
  const handleStopInPagePractice = () => {
    stopAudioStreams();
    setIsPracticing(false);
    setIsPaused(false);
    setShowCompletionModal(true);
  };

  // Reset practice
  const handleResetPractice = () => {
    stopAudioStreams();
    setIsPracticing(false);
    setIsPaused(false);
    setTimeLeft(selectedDuration);
    setElapsedSeconds(0);
    setLiveTranscript('');
    setShowCompletionModal(false);
  };

  useEffect(() => {
    return () => {
      stopAudioStreams();
    };
  }, []);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.min(
    100,
    Math.round(((selectedDuration - timeLeft) / selectedDuration) * 100)
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200 relative overflow-hidden flex flex-col justify-between p-4 sm:p-6">
      {/* Background Soft Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-cyan-500/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Main Single-Screen Hero Section */}
      <div className="max-w-7xl mx-auto w-full my-auto py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neu-pressed text-indigo-700 dark:text-indigo-400 text-xs font-extrabold"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Free Instant Public Speaking Practice</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]"
            >
              Impromptu Speaking
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg"
            >
              Select your speaking timer, generate a prompt, and speak live directly on this page. Practice freely without logging in! 🎙️
            </motion.p>

            {/* Feature Badges */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-button text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>⏱️ Custom Timers</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-button text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>🎙️ Live Mic Detection</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-button text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>⚡ AI Analysis</span>
              </div>
            </motion.div>
          </div>


          {/* Right Column: In-Page Speaking Card */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="p-6 sm:p-8 rounded-3xl neu-flat text-center relative overflow-hidden flex flex-col justify-between min-h-[420px]">
                {/* State A: Idle Selection Mode */}
                {!isPracticing ? (
                  <div className="flex flex-col justify-between h-full space-y-6">
                    {/* Header: Category & Spin Button */}
                    <div className="flex items-center justify-between text-xs font-semibold border-b border-white/20 dark:border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="indigo">{activePrompt.category}</Badge>
                        <span className="text-[11px] font-bold text-slate-500 font-mono">PROMPT #{currentPromptIndex + 1}</span>
                      </div>
                      <button
                        onClick={handleNextPrompt}
                        className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Spin Next Topic</span>
                      </button>
                    </div>

                    {/* Active Prompt Text */}
                    <div className="py-2 my-auto">
                      <h3 className="text-xl sm:text-2xl font-serif italic text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                        "{activePrompt.prompt}"
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium bg-slate-100 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                        💡 <strong className="text-slate-800 dark:text-slate-200">Coach Hint:</strong> {activePrompt.hint}
                      </p>
                    </div>

                    {/* Duration Selector & Start Button */}
                    <div className="space-y-4 pt-3 border-t border-white/20 dark:border-white/5">
                      {/* Duration Pills */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Select Speaking Duration:</span>
                          </span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedDuration}s</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl neu-pressed">
                          {DURATION_OPTIONS.map((opt) => (
                            <button
                              key={opt.seconds}
                              onClick={() => {
                                setSelectedDuration(opt.seconds);
                                setTimeLeft(opt.seconds);
                              }}
                              className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                                selectedDuration === opt.seconds
                                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Big Start Practice Button */}
                      <Button
                        size="lg"
                        variant="primary"
                        className="rounded-full px-8 py-3.5 text-xs font-extrabold shadow-neu-glow w-full justify-center flex items-center gap-2"
                        onClick={handleStartInPagePractice}
                        leftIcon={<Mic className="w-4 h-4 text-emerald-300" />}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Start {formatSeconds(selectedDuration)} Speaking Practice
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* State B: Active In-Page Recording HUD */
                  <div className="flex flex-col justify-between h-full space-y-5 animate-in fade-in">
                    {/* Live Recording Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 tracking-wider">
                          LIVE SPEAKING SESSION
                        </span>
                      </div>
                      <Badge variant="indigo">{activePrompt.category}</Badge>
                    </div>

                    {/* Active Prompt Reminder */}
                    <div className="p-3 rounded-2xl neu-pressed text-xs font-serif italic text-slate-800 dark:text-slate-200">
                      "{activePrompt.prompt}"
                    </div>

                    {/* Center Big Countdown Timer */}
                    <div className="flex flex-col items-center justify-center my-auto space-y-3">
                      <div className="w-32 h-32 rounded-full neu-button flex flex-col items-center justify-center relative shadow-neu-glow border-4 border-indigo-500/30">
                        <span className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                          {formatSeconds(timeLeft)}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-indigo-500">Remaining</span>
                      </div>

                      {/* Live Audio Visualizer Volume Meter */}
                      <div className="w-full max-w-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Volume2 className="w-3 h-3 text-emerald-500" />
                            <span>Mic Input Level</span>
                          </span>
                          <span>{micVolume}%</span>
                        </div>
                        <div className="w-full neu-pressed rounded-full h-2 overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-75"
                            style={{ width: `${Math.max(8, micVolume)}%` }}
                          />
                        </div>
                      </div>

                      {/* Live Speech Recognition Transcript Preview */}
                      {liveTranscript && (
                        <div className="w-full max-w-md p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-16 overflow-y-auto text-left">
                          <span className="text-slate-400 font-bold">Transcribing: </span>
                          <span>{liveTranscript}</span>
                        </div>
                      )}
                    </div>

                    {/* Active Recording Controls */}
                    <div className="pt-3 border-t border-white/20 dark:border-white/5 flex items-center justify-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full px-4 text-xs font-bold"
                        onClick={() => setIsPaused(!isPaused)}
                        leftIcon={isPaused ? <Play className="w-3.5 h-3.5 text-emerald-500" /> : <Pause className="w-3.5 h-3.5 text-amber-500" />}
                      >
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        className="rounded-full px-6 text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30"
                        onClick={handleStopInPagePractice}
                        leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
                      >
                        Stop Session
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-xs font-bold"
                        onClick={handleResetPractice}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Left Theme Controls */}

      {/* Post-Session Analysis & Login/Upgrade Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card className="p-6 sm:p-8 space-y-6 neu-flat rounded-3xl text-center relative border border-indigo-500/30 shadow-2xl">
                <div className="w-16 h-16 rounded-3xl neu-button text-emerald-500 mx-auto flex items-center justify-center shadow-neu-glow">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-2">
                  <Badge variant="emerald">Session Complete</Badge>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Great Speaking Practice!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    You practiced for <strong className="text-slate-900 dark:text-white font-bold">{elapsedSeconds} seconds</strong> on <em>"{activePrompt.prompt}"</em>.
                  </p>
                </div>

                {/* Upsell / Login Requirement Box */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Unlock Full AI Speech Analysis</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    To generate your comprehensive AI speech report (Pacing WPM, Filler Word breakdown, Pronunciation & Phonetics, Vocal Variety, and Executive Grammar rewrites), please sign in or register and choose a plan.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 pt-1">
                  {!isAuthenticated ? (
                    <>
                      <Link to="/register" className="block w-full">
                        <Button
                          size="lg"
                          variant="primary"
                          className="w-full rounded-full py-3.5 text-xs font-extrabold shadow-lg shadow-indigo-600/30 justify-center"
                          leftIcon={<UserPlus className="w-4 h-4" />}
                        >
                          Sign Up Free (Unlock AI Reports)
                        </Button>
                      </Link>

                      <div className="grid grid-cols-2 gap-2">
                        <Link to="/login" className="w-full">
                          <Button
                            variant="outline"
                            className="w-full rounded-full text-xs font-bold py-2.5 justify-center"
                            leftIcon={<LogIn className="w-4 h-4 text-indigo-500" />}
                          >
                            Log In
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCompletionModal(false);
                            openSubscriptionModal();
                          }}
                          className="w-full rounded-full text-xs font-bold py-2.5 justify-center"
                          leftIcon={<Crown className="w-4 h-4 text-amber-500" />}
                        >
                          View Plans
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      size="lg"
                      variant="primary"
                      onClick={() => {
                        setShowCompletionModal(false);
                        openSubscriptionModal();
                      }}
                      className="w-full rounded-full py-3.5 text-xs font-extrabold justify-center"
                      leftIcon={<Crown className="w-4 h-4 text-amber-300" />}
                    >
                      Unlock Pro Pass (Starting ₹9)
                    </Button>
                  )}



                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      handleResetPractice();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold underline pt-2 block mx-auto"
                  >
                    Practice another topic on Homepage
                  </button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Homepage Footer with Compliance & Payment Links */}
      <div className="w-full -mx-4 sm:-mx-6 mt-16">
        <Footer />
      </div>
    </div>
  );
};

