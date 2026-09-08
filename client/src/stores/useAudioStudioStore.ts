import { create } from 'zustand';
import { PracticeMode, Topic, SpeechReport } from '../types';
import { SpeechEvaluatorService } from '../services/speechEvaluator.service';
import { useReportStore } from './useReportStore';

export type RecordingStatus = 'IDLE' | 'CALIBRATING' | 'RECORDING' | 'PAUSED' | 'PROCESSING' | 'COMPLETED';

interface AudioStudioState {
  status: RecordingStatus;
  selectedMode: PracticeMode;
  activeTopic: Topic | null;
  durationSeconds: number;
  currentWpm: number;
  fillerCount: number;
  liveTranscript: { text: string; isFiller?: boolean; timestamp: number }[];
  teleprompterText: string;
  teleprompterSpeed: number; // 1-5
  teleprompterEnabled: boolean;
  isMuted: boolean;
  selectedMicId: string;
  latestReportId: string | null;

  // Actions
  setMode: (mode: PracticeMode) => void;
  setTopic: (topic: Topic | null) => void;
  setTeleprompterText: (text: string) => void;
  setTeleprompterSpeed: (speed: number) => void;
  setTeleprompterEnabled: (enabled: boolean) => void;
  setSelectedMic: (micId: string) => void;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<string>;
  resetStudio: () => void;
  addTranscriptChunk: (chunk: { text: string; isFiller?: boolean; timestamp: number }) => void;
  updateStats: (wpm: number, fillers: number) => void;
}

const defaultTopic: Topic = {
  id: 'top_01',
  title: 'Navigating Pitch Deck Objections in High-Stakes Fundraising',
  category: 'Business',
  difficulty: 'Advanced',
  suggestedDurationSeconds: 180,
  bulletPoints: [
    'Articulate unit economics and CAC payback period clearly',
    'Demonstrate defensible moat against incumbent competitors',
    'Maintain a calm, measured pace during intense Q&A',
  ],
};

export const useAudioStudioStore = create<AudioStudioState>((set, get) => ({
  status: 'IDLE',
  selectedMode: 'ELEVATOR_PITCH',
  activeTopic: defaultTopic,
  durationSeconds: 0,
  currentWpm: 140,
  fillerCount: 0,
  liveTranscript: [],
  teleprompterText: `Good morning everyone. Today, I'm thrilled to introduce SpeakWise AI—our real-time AI communication coach designed to transform public speaking confidence.

Over 70% of executives report anxiety before high-stakes keynotes. SpeakWise solves this by delivering real-time acoustic feedback on pitch variety, pace modulation, and disfluency patterns.

Notice how maintaining an optimal pace between 130 and 150 words per minute allows your audience to digest complex strategic points without losing engagement.`,
  teleprompterSpeed: 2,
  teleprompterEnabled: true,
  isMuted: false,
  selectedMicId: 'default',
  latestReportId: null,

  setMode: (mode) => set({ selectedMode: mode }),
  setTopic: (topic) => set({ activeTopic: topic }),
  setTeleprompterText: (text) => set({ teleprompterText: text }),
  setTeleprompterSpeed: (speed) => set({ teleprompterSpeed: speed }),
  setTeleprompterEnabled: (enabled) => set({ teleprompterEnabled: enabled }),
  setSelectedMic: (micId) => set({ selectedMicId: micId }),

  startRecording: () => {
    set({
      status: 'RECORDING',
      durationSeconds: 0,
      fillerCount: 0,
      liveTranscript: [
        { text: 'Starting session calibration...', timestamp: 0 },
      ],
    });
  },

  pauseRecording: () => set({ status: 'PAUSED' }),
  resumeRecording: () => set({ status: 'RECORDING' }),

  stopRecording: async () => {
    set({ status: 'PROCESSING' });

    const state = get();
    const fullTranscript = state.liveTranscript.map((c) => c.text).join(' ').trim();
    const duration = Math.max(1, state.durationSeconds);

    const evalResult = await SpeechEvaluatorService.evaluateSpeech({
      topicTitle: state.activeTopic ? state.activeTopic.title : 'Free Speech Rehearsal',
      topicCategory: state.activeTopic?.category || 'General',
      transcript: fullTranscript,
      durationSeconds: duration,
    });

    const report = SpeechEvaluatorService.createSpeechReport(
      evalResult,
      state.activeTopic ? state.activeTopic.title : 'Free Speech Rehearsal',
      fullTranscript,
      duration
    );

    // Save report into useReportStore
    useReportStore.getState().saveReport(report);

    set({ status: 'COMPLETED', latestReportId: report.id });
    return report.id;
  },

  resetStudio: () =>
    set({
      status: 'IDLE',
      durationSeconds: 0,
      fillerCount: 0,
      liveTranscript: [],
      latestReportId: null,
    }),

  addTranscriptChunk: (chunk) =>
    set((state) => ({
      liveTranscript: [...state.liveTranscript, chunk],
      fillerCount: chunk.isFiller ? state.fillerCount + 1 : state.fillerCount,
    })),

  updateStats: (wpm, fillers) => set({ currentWpm: wpm, fillerCount: fillers }),
}));
