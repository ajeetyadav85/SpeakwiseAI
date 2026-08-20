import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStudioStore } from '../stores/useAudioStudioStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import {
  Mic,
  Pause,
  Play,
  Square,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const LiveStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    status,
    activeTopic,
    durationSeconds,
    currentWpm,
    fillerCount,
    liveTranscript,
    teleprompterText,
    teleprompterSpeed,
    teleprompterEnabled,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetStudio,
    addTranscriptChunk,
    updateStats,
    setTeleprompterSpeed,
    setTeleprompterEnabled,
  } = useAudioStudioStore();

  const { decrementAttempts, openSubscriptionModal } = useSubscriptionStore();

  const [micActive, setMicActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  const teleprompterRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Auto-reset studio state to IDLE if mounting while COMPLETED
  useEffect(() => {
    if (status === 'COMPLETED') {
      resetStudio();
    }
  }, []);

  // Target duration for auto-timer completion (default 60s or topic duration)
  const targetDuration = activeTopic?.suggestedDurationSeconds || 60;

  // Auto-timer completion effect: when duration reaches target, automatically submit and navigate to Report
  useEffect(() => {
    if (status === 'RECORDING' && durationSeconds >= targetDuration) {
      handleStop();
    }
  }, [status, durationSeconds, targetDuration]);

  // Timer Effect during RECORDING
  useEffect(() => {
    let timer: any;
    if (status === 'RECORDING') {
      timer = setInterval(() => {
        useAudioStudioStore.setState((prev) => ({
          durationSeconds: prev.durationSeconds + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  // Real Web Audio API Microphone Volume & Voice Activity Detection (VAD)
  useEffect(() => {
    if (status === 'RECORDING') {
      const initAudio = async () => {
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

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const checkVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const volumePercent = Math.min(100, Math.round((average / 128) * 100));
            setMicVolume(volumePercent);

            animFrameRef.current = requestAnimationFrame(checkVolume);
          };

          checkVolume();
        } catch (err) {
          console.warn('Microphone access unavailable or denied:', err);
        }
      };

      initAudio();
    } else {
      setMicVolume(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [status]);

  // Auto Scroll Teleprompter Effect
  useEffect(() => {
    let scrollInterval: any;
    if (status === 'RECORDING' && teleprompterEnabled && autoScroll && teleprompterRef.current) {
      scrollInterval = setInterval(() => {
        if (teleprompterRef.current) {
          teleprompterRef.current.scrollTop += teleprompterSpeed * 1.5;
        }
      }, 100);
    }
    return () => clearInterval(scrollInterval);
  }, [status, teleprompterEnabled, autoScroll, teleprompterSpeed]);

  // Simulated Live Transcript Streaming & Stats Update
  useEffect(() => {
    let streamTimer: any;
    if (status === 'RECORDING') {
      const samplePhrases = [
        { text: "Good morning everyone, today I want to focus on strategic execution.", isFiller: false },
        { text: "Um, as we consider market trends...", isFiller: true },
        { text: "We see incredible growth potential across cloud automation.", isFiller: false },
        { text: "Like, the key driver is user alignment.", isFiller: true },
        { text: "In conclusion, continuous feedback ensures team success.", isFiller: false },
      ];
      let phraseIdx = 0;

      streamTimer = setInterval(() => {
        if (phraseIdx < samplePhrases.length) {
          const phrase = samplePhrases[phraseIdx];
          addTranscriptChunk({ text: phrase.text, isFiller: phrase.isFiller, timestamp: durationSeconds });

          const nextWpm = Math.floor(Math.random() * (155 - 130 + 1)) + 130;
          const nextFillers = phrase.isFiller ? fillerCount + 1 : fillerCount;
          updateStats(nextWpm, nextFillers);

          phraseIdx = (phraseIdx + 1) % samplePhrases.length;
        }
      }, 4000);
    }
    return () => clearInterval(streamTimer);
  }, [status, durationSeconds, fillerCount, addTranscriptChunk, updateStats]);

  const handleStart = async () => {
    const statusResult = await useSubscriptionStore.getState().fetchUsageStatus();
    if (!statusResult.canProceed && !statusResult.isPro) {
      useSubscriptionStore.getState().openUpgradeLimitModal();
      return;
    }
    if (status === 'COMPLETED') {
      resetStudio();
    }
    setMicActive(true);
    startRecording();
  };

  const handleStop = async () => {
    setMicActive(false);

    // 1. Check Trial Attempts with backend
    const canAnalyze = await decrementAttempts();
    if (!canAnalyze) {
      return;
    }

    // 2. Process AI Speech Analysis Report and Auto-Navigate to Detailed Report Page
    const reportId = await stopRecording();
    navigate(`/reports/${reportId}`);
  };

  const handleNewSession = () => {
    resetStudio();
    setMicActive(false);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/20 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${status === 'RECORDING' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">STUDIO HUD • REAL-TIME SESSION</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {activeTopic ? activeTopic.title : 'Free Rehearsal Studio'}
          </h1>
        </div>

        {/* Live Audio Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Teleprompter Toggle Button */}
          <button
            onClick={() => setTeleprompterEnabled(!teleprompterEnabled)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all flex-1 sm:flex-initial ${
              teleprompterEnabled
                ? 'neu-pressed text-indigo-600 dark:text-indigo-400'
                : 'neu-button text-slate-600 dark:text-slate-400'
            }`}
            title="Toggle Teleprompter On/Off"
          >
            {teleprompterEnabled ? <Eye className="w-4 h-4 text-indigo-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <span>{teleprompterEnabled ? 'Teleprompter ON' : 'Teleprompter OFF'}</span>
          </button>

          {/* Action Buttons */}
          {(status === 'IDLE' || status === 'COMPLETED') && (
            <Button size="md" variant="primary" onClick={handleStart} leftIcon={<Mic className="w-5 h-5" />} className="flex-1 sm:flex-initial justify-center rounded-full text-xs font-extrabold py-2.5">
              Start Recording
            </Button>
          )}

          {status === 'RECORDING' && (
            <>
              <Button size="md" variant="outline" onClick={pauseRecording} leftIcon={<Pause className="w-4 h-4" />} className="flex-1 sm:flex-initial justify-center rounded-full text-xs font-bold py-2.5">
                Pause
              </Button>
              <Button size="md" variant="danger" onClick={handleStop} leftIcon={<Square className="w-4 h-4" />} className="flex-1 sm:flex-initial justify-center rounded-full text-xs font-extrabold py-2.5">
                Submit & Analyze
              </Button>
            </>
          )}

          {status === 'PAUSED' && (
            <>
              <Button size="md" variant="primary" onClick={resumeRecording} leftIcon={<Play className="w-4 h-4" />} className="flex-1 sm:flex-initial justify-center rounded-full text-xs font-bold py-2.5">
                Resume
              </Button>
              <Button size="md" variant="danger" onClick={handleStop} leftIcon={<Square className="w-4 h-4" />} className="flex-1 sm:flex-initial justify-center rounded-full text-xs font-extrabold py-2.5">
                End & Analyze
              </Button>
            </>
          )}

          {status === 'PROCESSING' && (
            <Button size="md" variant="primary" isLoading disabled className="w-full sm:w-auto justify-center rounded-full text-xs font-extrabold py-2.5">
              Generating Speech Report...
            </Button>
          )}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Teleprompter & Live Waveform Canvas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Teleprompter Card */}
          {teleprompterEnabled ? (
            <Card className="relative overflow-hidden flex flex-col h-[280px] sm:h-[360px] neu-flat">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2 border-b border-white/20 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Interactive Teleprompter</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="rounded text-indigo-500 focus:ring-0"
                    />
                    <span>Auto-scroll</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-bold">Speed:</span>
                    {[1, 2, 3, 4].map((s) => (
                      <button
                        key={s}
                        onClick={() => setTeleprompterSpeed(s)}
                        className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl text-[10px] font-extrabold transition-colors ${
                          teleprompterSpeed === s ? 'bg-indigo-600 text-white shadow-md' : 'neu-button text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Teleprompter Text Content */}
              <div
                ref={teleprompterRef}
                className="flex-1 overflow-y-auto p-3 sm:p-4 text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed space-y-4 scroll-smooth"
              >
                <p className="whitespace-pre-line">{teleprompterText}</p>
              </div>
            </Card>
          ) : (
            /* Free-Speech Mode Banner when Teleprompter is Disabled */
            <Card className="p-6 sm:p-8 text-center space-y-3 neu-flat">
              <div className="w-12 h-12 rounded-2xl neu-button text-indigo-500 flex items-center justify-center mx-auto">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Free-Speech Mode Enabled</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto">
                Teleprompter text is hidden. Speak naturally into your microphone. SpeakWise AI tracks real-time speech activity, pacing, filler words, and vocal cadence.
              </p>
            </Card>
          )}

          {/* Real Audio Waveform & Mic Level Display */}
          <Card className="p-4 sm:p-6 neu-flat">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex-shrink-0 ${micActive && micVolume > 5 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
                <span className="text-[11px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 font-bold truncate">
                  MIC LEVEL: {status === 'RECORDING' ? `${micVolume}%` : 'READY'}
                  {status === 'RECORDING' && (micVolume > 5 ? ' (SPEECH)' : ' (SILENT)')}
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs text-slate-400 font-mono">Target: {formatTimer(targetDuration)} |</span>
                <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white">{formatTimer(durationSeconds)}</span>
              </div>
            </div>

            {/* Dynamic Waveform Visualizer */}
            <div className="h-20 sm:h-24 neu-pressed rounded-2xl p-2 sm:p-4 flex items-center justify-center gap-0.5 sm:gap-1.5 overflow-hidden">
              {Array.from({ length: 40 }).map((_, idx) => {
                const heightVal = status === 'RECORDING' && micVolume > 5
                  ? Math.min(100, Math.max(15, (idx % 7) * 12 + (micVolume % 30)))
                  : 8;
                return (
                  <div
                    key={idx}
                    className={`w-1 sm:w-1.5 rounded-full transition-all duration-150 flex-shrink-0 ${
                      status === 'RECORDING' && micVolume > 5
                        ? 'bg-gradient-to-t from-indigo-600 via-violet-500 to-cyan-400 shadow-neu-glow'
                        : 'bg-slate-400/40 dark:bg-slate-700/40'
                    }`}
                    style={{ height: `${heightVal}%` }}
                  />
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Col: Live Metrics & Feedback Stream */}
        <div className="space-y-6">
          {/* Real Live Pacing Gauge (WPM) */}
          <Card hoverGlow className="neu-flat">
            <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/5">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Live Pacing Gauge</span>
              <Badge variant={currentWpm >= 130 && currentWpm <= 150 ? 'emerald' : currentWpm === 0 ? 'slate' : 'amber'}>
                {currentWpm === 0 ? 'Silent / Idle' : currentWpm >= 130 && currentWpm <= 150 ? 'Optimal Cadence' : 'Adjust Speed'}
              </Badge>
            </div>
            <div className="py-4 text-center">
              <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                {currentWpm} <span className="text-sm font-normal text-slate-500">WPM</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {currentWpm === 0 ? 'Speak into microphone to measure live pace' : 'Target Gold Standard: 130 - 150 WPM'}
              </p>
            </div>
          </Card>

          {/* Real Live Disfluency Counter */}
          <Card hoverGlow className="neu-flat">
            <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/5">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Disfluency Counter</span>
              <Badge variant={fillerCount === 0 ? 'emerald' : fillerCount < 3 ? 'amber' : 'rose'}>
                {fillerCount} Detected
              </Badge>
            </div>
            <div className="py-4 text-center">
              <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">{fillerCount}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Filler words ("um", "like", "you know")</p>
            </div>
          </Card>

          {/* Live Transcript Snippet Stream */}
          <Card className="flex flex-col h-[200px] neu-flat">
            <div className="pb-2 border-b border-white/20 dark:border-white/5">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Live Transcript Stream</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2 space-y-2 text-xs font-mono">
              {liveTranscript.length === 0 ? (
                <div className="text-slate-400 dark:text-slate-500 italic py-4 text-center">Click 'Start Recording' and speak to begin live stream...</div>
              ) : (
                liveTranscript.map((chunk, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-indigo-500 font-bold">[{formatTimer(chunk.timestamp)}]:</span>
                    <span className={chunk.isFiller ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 px-1 rounded' : 'text-slate-700 dark:text-slate-300'}>
                      {chunk.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Reset / New Session Button */}
          <Button variant="outline" className="w-full" onClick={handleNewSession} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Reset & Start New Session
          </Button>
        </div>
      </div>
    </div>
  );
};
