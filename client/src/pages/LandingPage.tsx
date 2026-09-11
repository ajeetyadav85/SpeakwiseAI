import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../stores/useThemeStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useReportStore } from '../stores/useReportStore';
import { SpeechReport } from '../types';
import { SpeechEvaluatorService } from '../services/speechEvaluator.service';
import {
  GOAL_CATEGORIES,
  GoalTopicItem,
  createCustomPrompt,
} from '../data/goalTopicsData';
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
  AlertCircle,
  Crown,
  LogIn,
  UserPlus,
  Volume2,
  Clock,
  Target,
  PenTool,
  Check,
  BookOpen,
  TrendingUp,
  BarChart3,
  Share2,
  Download,
  Activity,
  Flame,
  Layers,
  Award,
  FileText,
  AudioWaveform,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Footer } from '../components/layout/Footer';

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
  const { isPro, openSubscriptionModal } = useSubscriptionStore();

  const isUserAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN';
  const hasProAccess = isPro || isUserAdmin;

  // Selected duration (default 60 seconds)
  const [selectedDuration, setSelectedDuration] = useState<number>(60);

  // Goal-oriented topics state
  const [selectedGoalId, setSelectedGoalId] = useState<string>('everyday-english');
  const [customInput, setCustomInput] = useState<string>('');
  const [customItems, setCustomItems] = useState<GoalTopicItem[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number>(0);

  // In-Page Live Practice State
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [analysisReport, setAnalysisReport] = useState<SpeechReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Web Audio & Speech Recognition Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Transcript & Timing Refs to prevent stale closure during auto-submission
  const liveTranscriptRef = useRef<string>('');
  const elapsedSecondsRef = useRef<number>(0);
  const handleStopRef = useRef<() => void>(() => {});

  // Reference to scroll to practice card if needed
  const practiceCardRef = useRef<HTMLDivElement>(null);

  // Determine current active goal and prompt list
  const activeGoal = GOAL_CATEGORIES.find((g) => g.id === selectedGoalId) || GOAL_CATEGORIES[0];
  const activePromptsList: GoalTopicItem[] =
    selectedGoalId === 'custom'
      ? customItems.length > 0
        ? customItems
        : activeGoal.prompts
      : activeGoal.prompts;

  const safePromptIndex = currentPromptIndex % activePromptsList.length;
  const activePrompt: GoalTopicItem = activePromptsList[safePromptIndex] || activeGoal.prompts[0];

  // Spin to next prompt in current goal
  const handleNextPrompt = () => {
    if (isPracticing) return;
    setCurrentPromptIndex((prev) => (prev + 1) % activePromptsList.length);
  };

  // Select a Goal Category
  const handleSelectGoal = (goalId: string) => {
    if (isPracticing) return;
    setSelectedGoalId(goalId);
    setCurrentPromptIndex(0);
  };

  // Add custom user-written topic or word
  const handleAddCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isPracticing) return;

    const newItem = createCustomPrompt(customInput);
    setCustomItems((prev) => [newItem, ...prev]);
    setSelectedGoalId('custom');
    setCurrentPromptIndex(0);
    setCustomInput('');

    // Smooth scroll down to practice card
    practiceCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleSelectCustomItem = (item: GoalTopicItem) => {
    if (isPracticing) return;
    const idx = customItems.findIndex((c) => c.id === item.id);
    setSelectedGoalId('custom');
    setCurrentPromptIndex(idx >= 0 ? idx : 0);
  };

  // Keep handleStopRef updated to always point to latest closure
  useEffect(() => {
    handleStopRef.current = handleStopInPagePractice;
  });

  // Start in-page practice
  const handleStartInPagePractice = async () => {
    setIsPracticing(true);
    setIsPaused(false);
    setTimeLeft(selectedDuration);
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setShowCompletionModal(false);
    setAnalysisReport(null);

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

    // Initialize Web Speech Recognition for Real-Time Text Transcription
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
          const trimmed = currentTrans.trim();
          liveTranscriptRef.current = trimmed;
          setLiveTranscript(trimmed);
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
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          elapsedSecondsRef.current = next;
          return next;
        });

        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Safely invoke the latest handleStop via ref to eliminate stale closure
            setTimeout(() => {
              handleStopRef.current?.();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
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
  const handleStopInPagePractice = async () => {
    stopAudioStreams();
    setIsPracticing(false);
    setIsPaused(false);
    setShowCompletionModal(true);

    const actualDuration = Math.max(1, elapsedSecondsRef.current || elapsedSeconds);
    const spokenTranscript = (liveTranscriptRef.current || liveTranscript).trim();

    if (!hasProAccess) {
      // Free/Guest users see the Pro pass upgrade prompt directly
      return;
    }

    // Pro users receive real-time speech evaluation based strictly on what was spoken
    setIsAnalyzing(true);
    try {
      const evalResult = await SpeechEvaluatorService.evaluateSpeech({
        topicTitle: activePrompt.word ? `Practice Word: ${activePrompt.word} - ${activePrompt.prompt}` : activePrompt.prompt,
        topicCategory: activePrompt.category,
        transcript: spokenTranscript,
        durationSeconds: actualDuration,
      });

      const report = SpeechEvaluatorService.createSpeechReport(
        evalResult,
        activePrompt.word ? `Word - ${activePrompt.word}` : activePrompt.prompt,
        spokenTranscript,
        actualDuration
      );

      setAnalysisReport(report);
      useReportStore.getState().saveReport(report);
    } catch (err) {
      console.error('Speech evaluation failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset practice
  const handleResetPractice = () => {
    stopAudioStreams();
    setIsPracticing(false);
    setIsPaused(false);
    setTimeLeft(selectedDuration);
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    liveTranscriptRef.current = '';
    setLiveTranscript('');
    setShowCompletionModal(false);
    setAnalysisReport(null);
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200 relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Ambient Background Soft Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-cyan-500/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[160px] pointer-events-none rounded-full" />

      {/* ========================================================================= */}
      {/* SCREEN 1: WHAT DO YOU WANT TO IMPROVE? (LEFT) & START SPEAKING (RIGHT)    */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto w-full my-auto pt-2 pb-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT SIDE: "What do you want to improve?" + 3 boxes per row + custom input */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-4 text-left">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-pressed text-indigo-700 dark:text-indigo-400 text-xs font-extrabold">
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Goal-Oriented AI Practice</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                What do you want to improve?
              </h1>
            </div>

            {/* 3 Boxes Each Row on Both Mobile and PC (10 categories + 1 box spanning 2 columns = 12 slots = perfect 3x4 grid) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {GOAL_CATEGORIES.map((goal) => {
                const isSelected = selectedGoalId === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => handleSelectGoal(goal.id)}
                    className={`p-2.5 sm:p-3 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-1.5 border group relative ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-sm text-indigo-900 dark:text-white ring-2 ring-indigo-500/30'
                        : 'neu-button border-transparent hover:border-indigo-500/30 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                    {/* Icon Top Inside Box */}
                    <span className="text-2xl sm:text-3xl transition-transform group-hover:scale-110">
                      {goal.emoji}
                    </span>
                    {/* Below Only Title */}
                    <span className="text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 text-center">
                      {goal.name}
                    </span>
                  </button>
                );
              })}

              {/* WRITE YOUR OWN TOPIC: SPANS TWO BOXES RIGHT AFTER PUBLIC SPEAKING */}
              <div className="col-span-2 p-2.5 sm:p-3 rounded-2xl neu-flat border border-indigo-500/25 flex flex-col justify-between gap-1.5 group hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between px-0.5">
                  <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white">
                    <PenTool className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span>Write your own topic:</span>
                  </span>
                  <span className="text-[10px] text-indigo-500 font-semibold hidden sm:inline">
                    Instant AI Practice
                  </span>
                </div>

                <form onSubmit={handleAddCustomPrompt} className="flex items-center gap-1.5 w-full">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Type custom topic or word..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl neu-pressed text-[11px] sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="rounded-xl px-3 py-1.5 font-bold text-xs whitespace-nowrap shadow-neu-glow flex-shrink-0 h-auto"
                    disabled={!customInput.trim()}
                  >
                    Add
                  </Button>
                </form>
              </div>
            </div>

            {/* Custom Topics Pill list if user has created any */}
            {customItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-1">
                <span className="text-[10px] font-bold text-slate-400">Your Topics:</span>
                {customItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectCustomItem(item)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      activePrompt.id === item.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'neu-pressed text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.word ? item.word : item.prompt.slice(0, 18) + '...'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE: START SPEAKING PRACTICE CARD */}
          <div ref={practiceCardRef} className="lg:col-span-6 xl:col-span-6 w-full">
            <Card className="p-5 sm:p-7 rounded-3xl neu-flat relative overflow-hidden flex flex-col justify-between min-h-[440px] border border-indigo-500/20 shadow-2xl">
              {/* State A: Idle Selection Mode */}
              {!isPracticing ? (
                <div className="flex flex-col justify-between h-full space-y-5">
                  {/* Header: Category Badge & Spin Next Topic */}
                  <div className="flex items-center justify-between text-xs font-semibold border-b border-white/20 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="indigo">
                        {activePrompt.categoryEmoji} {activePrompt.category}
                      </Badge>
                      <Badge variant={activePrompt.type === 'WORD' ? 'amber' : 'violet'}>
                        {activePrompt.type === 'WORD' ? 'Vocabulary Word' : 'Speech Topic'}
                      </Badge>
                    </div>
                    <button
                      onClick={handleNextPrompt}
                      className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline"
                      title="Spin to next prompt in this category"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Spin Next Topic</span>
                    </button>
                  </div>

                  {/* Active Prompt Text / Word */}
                  <div className="py-2 my-auto text-left space-y-2.5">
                    {activePrompt.word ? (
                      <div className="space-y-1">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-500">
                          Practice Word of the Day:
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-wide font-mono">
                          "{activePrompt.word}"
                        </h3>
                        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          {activePrompt.prompt}
                        </p>
                      </div>
                    ) : (
                      <h3 className="text-lg sm:text-2xl font-serif italic text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                        "{activePrompt.prompt}"
                      </h3>
                    )}

                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      💡 <strong className="text-slate-800 dark:text-slate-200">Coach Hint:</strong> {activePrompt.hint}
                    </div>
                  </div>

                  {/* Duration Selector & Big CTA */}
                  <div className="space-y-3.5 pt-3 border-t border-white/20 dark:border-white/5">
                    {/* Duration Pills */}
                    <div className="space-y-1">
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

                    {/* Start Speaking Practice Button */}
                    <Button
                      size="lg"
                      variant="primary"
                      className="rounded-full px-6 py-3.5 text-xs sm:text-sm font-extrabold shadow-neu-glow w-full justify-center flex items-center gap-2"
                      onClick={handleStartInPagePractice}
                      leftIcon={<Mic className="w-4 h-4 text-emerald-300 animate-pulse" />}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Start {formatSeconds(selectedDuration)} Speaking Practice
                    </Button>
                  </div>
                </div>
              ) : (
                /* State B: Active In-Page Recording HUD */
                <div className="flex flex-col justify-between h-full space-y-4 animate-in fade-in">
                  {/* Live Recording Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400 tracking-wider">
                        LIVE SPEAKING SESSION
                      </span>
                    </div>
                    <Badge variant="indigo">
                      {activePrompt.categoryEmoji} {activePrompt.category}
                    </Badge>
                  </div>

                  {/* Active Prompt Reminder */}
                  <div className="p-3 rounded-2xl neu-pressed text-xs font-serif italic text-slate-800 dark:text-slate-200 text-left">
                    "{activePrompt.word ? `Word: ${activePrompt.word} - ${activePrompt.prompt}` : activePrompt.prompt}"
                  </div>

                  {/* Center Countdown Timer & Mic Level */}
                  <div className="flex flex-col items-center justify-center my-auto space-y-2.5">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full neu-button flex flex-col items-center justify-center relative shadow-neu-glow border-4 border-indigo-500/30">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                        {formatSeconds(timeLeft)}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-indigo-500">Remaining</span>
                    </div>

                    {/* Live Mic Volume Meter */}
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

                    {/* Real-time Speech Transcription Box with Word Count */}
                    <div className="w-full p-3 rounded-2xl neu-pressed text-left space-y-1 border border-indigo-500/20">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Live Real-Time Transcription:</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {liveTranscript ? `${liveTranscript.trim().split(/\s+/).filter(Boolean).length} words` : 'Listening...'}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200 min-h-[44px] max-h-20 overflow-y-auto leading-relaxed">
                        {liveTranscript ? (
                          <span className="animate-in fade-in">{liveTranscript}</span>
                        ) : (
                          <span className="text-slate-400 italic">Start speaking into your mic to see your words transcribed live in real time...</span>
                        )}
                      </div>
                    </div>
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
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 2 (SCROLL DOWN): MASTER ENGLISH FOR YOUR CAREER GOALS & FEATURES   */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto w-full py-16 relative z-10 space-y-16 border-t border-slate-200/60 dark:border-slate-800/80 mt-12">
        {/* Section Heading */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neu-pressed text-indigo-700 dark:text-indigo-400 text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>All-In-One AI Communication Intelligence</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Master English for Your Career Goals
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            SpeakWise AI analyzes your voice through acoustic neural signals and linguistic models. Explore the features that help professionals, job seekers, and students speak with clarity and executive confidence.
          </p>
        </div>

        {/* Feature Showcase Grid with Realistic UI Screenshots & Previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Feature 1: AI Executive Re-writer & Drills */}
          <Card className="p-6 rounded-3xl neu-flat space-y-4 flex flex-col justify-between border border-indigo-500/15 group hover:border-indigo-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl neu-pressed text-violet-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                AI Executive Re-Writer & Drills
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Transforms conversational filler phrases into authoritative, executive-ready pitch statements with clear reasoning.
              </p>
            </div>

            {/* Visual UI Preview Mockup */}
            <div className="p-3.5 rounded-2xl neu-pressed space-y-2 text-left border border-indigo-500/10 text-xs">
              <div className="line-through text-rose-500 font-mono text-[11px] opacity-80">
                "Um, I think maybe our tool can help users..."
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-start gap-1.5 text-xs">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>"Our platform drives measurable workflow efficiency for engineering teams."</span>
              </div>
              <div className="text-[10px] text-slate-500 bg-slate-200/60 dark:bg-slate-900/80 p-2 rounded-xl">
                💡 <strong>Coaching Rationale:</strong> Eliminates hedging words and projects ownership.
              </div>
            </div>
          </Card>

          {/* Feature 2: AI Pronunciation & Phonetics */}
          <Card className="p-6 rounded-3xl neu-flat space-y-4 flex flex-col justify-between border border-indigo-500/15 group hover:border-indigo-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl neu-pressed text-cyan-500 flex items-center justify-center">
                <AudioWaveform className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                AI Pronunciation & Phonetics
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Detects phonetic vowel elongation, syllable stress patterns, and accent clarity with international IPA phonetic benchmarks.
              </p>
            </div>

            {/* Visual UI Preview Mockup */}
            <div className="p-3.5 rounded-2xl neu-pressed space-y-2.5 text-left border border-cyan-500/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">Methodology</span>
                <Badge variant="emerald">94% Accuracy</Badge>
              </div>
              <div className="text-[11px] font-mono text-indigo-500">
                IPA: /ˌmeθ.əˈdɒl.ə.dʒi/
              </div>
              <div className="flex gap-1 text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600">ME</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">thuh</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-600">DOL</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">uh-jee</span>
              </div>
              <p className="text-[10px] text-slate-500">Target primary stress on the 3rd syllable.</p>
            </div>
          </Card>

          {/* Feature 3: Detailed Metric Breakdown Scorecard */}
          <Card className="p-6 rounded-3xl neu-flat space-y-4 flex flex-col justify-between border border-indigo-500/15 group hover:border-indigo-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl neu-pressed text-indigo-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Detailed Metric Breakdown
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Simplified, high-impact scorecard evaluating your Overall %, Grammar %, Fluency %, Vocabulary %, and Confidence %.
              </p>
            </div>

            {/* Visual UI Preview Mockup */}
            <div className="p-3.5 rounded-2xl neu-pressed space-y-2 text-left border border-indigo-500/10 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-slate-800 dark:text-slate-200">Overall Score</span>
                <span className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400">88% (Excellent)</span>
              </div>
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex justify-between font-medium"><span>Grammar</span><span className="font-mono text-emerald-500 font-bold">86%</span></div>
                <div className="flex justify-between font-medium"><span>Fluency</span><span className="font-mono text-blue-500 font-bold">90%</span></div>
                <div className="flex justify-between font-medium"><span>Vocabulary</span><span className="font-mono text-violet-500 font-bold">84%</span></div>
                <div className="flex justify-between font-medium"><span>Confidence</span><span className="font-mono text-amber-500 font-bold">92%</span></div>
              </div>
            </div>
          </Card>

          {/* Feature 4: Timestamped Transcript & Filler Tracking */}
          <Card className="p-6 rounded-3xl neu-flat space-y-4 flex flex-col justify-between border border-indigo-500/15 group hover:border-indigo-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl neu-pressed text-rose-500 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Timestamped Transcript
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Word-by-word synced audio transcript that flags filler words ("um", "uh", "like") and speaking cadence shifts.
              </p>
            </div>

            {/* Visual UI Preview Mockup */}
            <div className="p-3.5 rounded-2xl neu-pressed space-y-2 text-left border border-rose-500/10 text-xs font-mono">
              <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="text-indigo-500 font-bold">[00:04]</span> Good morning everyone.{' '}
                <span className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-500 font-extrabold">Um</span>, today our focus is on{' '}
                <span className="text-emerald-500 font-bold">strategic execution</span>.
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-white/10 flex justify-between font-sans">
                <span>Fillers Detected: <strong>1</strong></span>
                <span className="text-emerald-500">Pace: 142 WPM</span>
              </div>
            </div>
          </Card>

          {/* Feature 5: Acoustic Signal Graphs */}
          <Card className="p-6 rounded-3xl neu-flat space-y-4 flex flex-col justify-between border border-indigo-500/15 group hover:border-indigo-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl neu-pressed text-amber-500 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Acoustic Signal Graphs
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Visualizes vocal dynamics, pitch modulation range, audio volume stability, and natural pause ratios across your talk.
              </p>
            </div>

            {/* Visual UI Preview Mockup */}
            <div className="p-3.5 rounded-2xl neu-pressed space-y-2 text-left border border-amber-500/10 text-xs">
              <div className="flex justify-between text-[11px] font-bold">
                <span>Vocal Pitch & Pacing Curve</span>
                <span className="text-amber-500 font-mono">165 Hz avg</span>
              </div>
              {/* Mini wave graph representation */}
              <div className="h-10 flex items-end gap-1.5 px-1 py-1 bg-slate-200/50 dark:bg-slate-900/80 rounded-xl overflow-hidden">
                <div className="flex-1 bg-indigo-500 rounded-t h-[40%]" />
                <div className="flex-1 bg-indigo-500 rounded-t h-[65%]" />
                <div className="flex-1 bg-violet-500 rounded-t h-[90%]" />
                <div className="flex-1 bg-indigo-500 rounded-t h-[60%]" />
                <div className="flex-1 bg-amber-500 rounded-t h-[80%]" />
                <div className="flex-1 bg-emerald-500 rounded-t h-[55%]" />
                <div className="flex-1 bg-indigo-500 rounded-t h-[75%]" />
                <div className="flex-1 bg-violet-500 rounded-t h-[85%]" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0s</span>
                <span>30s</span>
                <span>60s</span>
              </div>
            </div>
          </Card>

          {/* Feature 6: Share & Export Executive Reports */}
          <Card className="p-6 rounded-3xl neu-flat space-y-4 flex flex-col justify-between border border-indigo-500/15 group hover:border-indigo-500/40 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl neu-pressed text-emerald-500 flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Share & Export Reports
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Share reports directly with recruiters, college mentors, or interview coaches with downloadable PDF summaries and password-protected links.
              </p>
            </div>

            {/* Visual UI Preview Mockup */}
            <div className="p-3.5 rounded-2xl neu-pressed space-y-2 text-left border border-emerald-500/10 text-xs">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Executive PDF / CSV Export Ready</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-900/80 font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate">
                https://speakwise.ai/reports/rep_88491
              </div>
              <Badge variant="emerald">Passcode Protected</Badge>
            </div>
          </Card>
        </div>

        {/* Bottom Call to Action Banner */}
        <div className="p-8 sm:p-12 rounded-3xl neu-flat border border-indigo-500/30 text-center space-y-6 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Ready to Transform Your English Communication?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              Start practicing with our goal-based prompts above, or unlock unlimited AI evaluations with the SpeakWise Pro Pass.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                practiceCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-8 py-3.5 rounded-full neu-button text-xs font-black text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all shadow-neu-glow flex items-center gap-2"
            >
              <Mic className="w-4 h-4 text-emerald-500" />
              <span>Practice Free on Screen 1</span>
            </button>

            <Button
              variant="primary"
              size="lg"
              className="rounded-full px-8 py-3.5 text-xs font-black shadow-lg shadow-indigo-600/30"
              onClick={openSubscriptionModal}
              leftIcon={<Crown className="w-4 h-4 text-amber-300" />}
            >
              Unlock Pro Pass (Starting ₹9)
            </Button>
          </div>
        </div>
      </div>

      {/* Post-Session Analysis & Pro Gating Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in overflow-y-auto"
            onClick={() => {
              setShowCompletionModal(false);
              handleResetPractice();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-6 sm:p-8 space-y-5 neu-flat rounded-3xl text-center relative border border-indigo-500/30 shadow-2xl">
                {/* Close (X) Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCompletionModal(false);
                    handleResetPractice();
                  }}
                  className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-14 h-14 rounded-2xl neu-button text-emerald-500 mx-auto flex items-center justify-center shadow-neu-glow">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <Badge variant="emerald">Session Complete</Badge>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Great Speaking Practice!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    You spoke for <strong className="text-slate-900 dark:text-white font-bold">{elapsedSeconds} seconds</strong> on{' '}
                    <em>"{activePrompt.word ? activePrompt.word : activePrompt.prompt.slice(0, 50)}..."</em>
                  </p>
                </div>

                {/* Case 1: USER IS PRO -> SHOW REAL SPEECH ANALYSIS OR ANALYZING STATE */}
                {hasProAccess ? (
                  isAnalyzing ? (
                    <div className="py-8 space-y-4 text-center">
                      <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto shadow-neu-glow" />
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                          <span>Evaluating Your Spoken Speech with Gemini AI...</span>
                        </h4>
                        <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                          Analyzing your spoken words, grammar, fluency, vocabulary, and confidence against the topic.
                        </p>
                      </div>
                    </div>
                  ) : analysisReport?.overallScore === 0 ? (
                    /* Zero Speech Detected State */
                    <div className="space-y-4 text-left">
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400 uppercase">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span>No Spoken Speech Detected</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          We did not detect any spoken words during this {elapsedSeconds}-second recording.
                          Please ensure your microphone is enabled in your browser, unmuted, and speak audibly.
                        </p>
                      </div>

                      {/* Zero Score Breakdown */}
                      <div className="p-4 rounded-2xl neu-pressed border border-indigo-500/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                            Speech Scorecard
                          </span>
                          <Badge variant="amber">No Speech Detected</Badge>
                        </div>
                        <div className="flex items-baseline justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Overall:</span>
                          <span className="text-2xl font-black font-mono text-slate-400">0%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 pt-1">
                          <div className="flex justify-between"><span>Grammar:</span><span className="font-mono text-slate-400">0%</span></div>
                          <div className="flex justify-between"><span>Fluency:</span><span className="font-mono text-slate-400">0%</span></div>
                          <div className="flex justify-between"><span>Vocabulary:</span><span className="font-mono text-slate-400">0%</span></div>
                          <div className="flex justify-between"><span>Confidence:</span><span className="font-mono text-slate-400">0%</span></div>
                        </div>
                      </div>

                      {/* Microphone Help Drill */}
                      <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Recommended Action
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          Click below to start again. Speak 2-3 full sentences out loud while watching the Live Transcription text box in the recording card to confirm your words appear live.
                        </p>
                      </div>

                      <Button
                        size="md"
                        variant="primary"
                        className="w-full rounded-full py-3 text-xs font-extrabold shadow-lg shadow-indigo-600/30 justify-center"
                        onClick={() => {
                          setShowCompletionModal(false);
                          handleResetPractice();
                        }}
                      >
                        Try Again (Speak into Mic)
                      </Button>
                    </div>
                  ) : analysisReport ? (
                    /* Real Speech Evaluated by Gemini AI */
                    <div className="space-y-4 text-left">
                      <div className="p-4 rounded-2xl neu-pressed border border-indigo-500/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>AI Speech Analysis</span>
                          </span>
                          <Badge variant={analysisReport.overallScore >= 80 ? 'emerald' : analysisReport.overallScore >= 70 ? 'indigo' : 'amber'}>
                            {analysisReport.overallScore >= 85 ? 'Excellent' : analysisReport.overallScore >= 75 ? 'Good' : analysisReport.overallScore >= 60 ? 'Average' : 'Needs Practice'}
                          </Badge>
                        </div>

                        {/* Overall % and Rating */}
                        <div className="flex items-baseline justify-between pt-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Overall:</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                              {analysisReport.overallScore}%
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              ({analysisReport.overallScore >= 85 ? 'Excellent' : analysisReport.overallScore >= 75 ? 'Good' : analysisReport.overallScore >= 60 ? 'Average' : 'Needs Work'})
                            </span>
                          </div>
                        </div>

                        {/* 4 Core Metrics */}
                        <div className="space-y-2.5 pt-1">
                          {/* Grammar */}
                          <div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                              <span>Grammar:</span>
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                                {analysisReport.scoreBreakdown?.grammar || 0}%
                              </span>
                            </div>
                            <div className="w-full neu-pressed rounded-full h-1.5 overflow-hidden p-0.5 mt-1">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${analysisReport.scoreBreakdown?.grammar || 0}%` }} />
                            </div>
                          </div>

                          {/* Fluency */}
                          <div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                              <span>Fluency:</span>
                              <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">
                                {analysisReport.scoreBreakdown?.fluency || 0}%
                              </span>
                            </div>
                            <div className="w-full neu-pressed rounded-full h-1.5 overflow-hidden p-0.5 mt-1">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${analysisReport.scoreBreakdown?.fluency || 0}%` }} />
                            </div>
                          </div>

                          {/* Vocabulary */}
                          <div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                              <span>Vocabulary:</span>
                              <span className="font-mono text-violet-600 dark:text-violet-400 font-extrabold">
                                {analysisReport.scoreBreakdown?.vocabulary || 0}%
                              </span>
                            </div>
                            <div className="w-full neu-pressed rounded-full h-1.5 overflow-hidden p-0.5 mt-1">
                              <div className="h-full rounded-full bg-violet-500" style={{ width: `${analysisReport.scoreBreakdown?.vocabulary || 0}%` }} />
                            </div>
                          </div>

                          {/* Confidence */}
                          <div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                              <span>Confidence:</span>
                              <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">
                                {analysisReport.scoreBreakdown?.confidence || 0}%
                              </span>
                            </div>
                            <div className="w-full neu-pressed rounded-full h-1.5 overflow-hidden p-0.5 mt-1">
                              <div className="h-full rounded-full bg-amber-500" style={{ width: `${analysisReport.scoreBreakdown?.confidence || 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Area for Improvement */}
                      {analysisReport.llmAnalysis?.areasForImprovement?.[0] && (
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Area for Improvement
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                            {analysisReport.llmAnalysis.areasForImprovement[0]}
                          </p>
                        </div>
                      )}

                      {/* Suggested Practice Drill */}
                      {analysisReport.llmAnalysis?.actionableExercises?.[0] && (
                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Suggested Drill: {analysisReport.llmAnalysis.actionableExercises[0].title}
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                            {analysisReport.llmAnalysis.actionableExercises[0].instructions}
                          </p>
                        </div>
                      )}

                      {/* Actions for Pro User */}
                      <div className="space-y-2 pt-2">
                        <Link to={`/reports/${analysisReport.id}`} className="block w-full">
                          <Button
                            size="md"
                            variant="primary"
                            className="w-full rounded-full py-3 text-xs font-extrabold shadow-lg shadow-indigo-600/30 justify-center"
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                          >
                            Open Detailed Report Page
                          </Button>
                        </Link>
                        <button
                          onClick={() => {
                            setShowCompletionModal(false);
                            handleResetPractice();
                          }}
                          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold underline block mx-auto py-1"
                        >
                          Practice another topic on Homepage
                        </button>
                      </div>
                    </div>
                  ) : null
                ) : (
                  /* Case 2: USER IS NOT PRO -> TELL TO MAKE PRO */
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-left space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>Make Pro to Unlock Speech Analysis</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        Upgrade to Pro to view your instant AI speech scorecard (Overall %, Grammar %, Fluency %, Vocabulary %, Confidence %), plus detailed areas for improvement and actionable practice drills!
                      </p>
                    </div>

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
                              Sign Up Free (Unlock Pro Pass)
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
                          Make Pro (Starting ₹9 Flash Pass)
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
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Homepage Footer with Compliance & Payment Links */}
      <div className="w-full -mx-4 sm:-mx-6 lg:-mx-8 mt-16">
        <Footer />
      </div>
    </div>
  );
};
