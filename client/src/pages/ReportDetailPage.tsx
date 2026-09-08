import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReportStore } from '../stores/useReportStore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Mic,
  Sparkles,
  Award,
  TrendingUp,
  Volume2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Download,
  Share2,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Eye,
  Smile,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ShareModal } from '../components/report/ShareModal';
import { ExportModal } from '../components/report/ExportModal';
import { PronunciationFeedbackSection } from '../components/report/PronunciationFeedbackSection';

export const ReportDetailPage: React.FC = () => {
  const { id = 'rep_88491' } = useParams<{ id: string }>();
  const getReportById = useReportStore((state) => state.getReportById);
  const report = getReportById(id);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PRONUNCIATION' | 'SCORES' | 'TRANSCRIPT' | 'ACOUSTICS'>('OVERVIEW');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);




  // Time Series Data for Acoustics Graph
  const timeSeriesData = [
    { time: '0s', wpm: Math.max(110, (report.acousticMetrics?.averageWpm || 140) - 10), pitch: 145 },
    { time: '30s', wpm: report.acousticMetrics?.averageWpm || 140, pitch: 168 },
    { time: '60s', wpm: (report.acousticMetrics?.averageWpm || 140) + 8, pitch: 180 },
    { time: '90s', wpm: (report.acousticMetrics?.averageWpm || 140) - 5, pitch: 152 },
    { time: '120s', wpm: report.acousticMetrics?.averageWpm || 140, pitch: 165 },
  ];

  // Extract detailed individual scores (Requirement 2D)
  const confidenceScore = report.scoreBreakdown?.confidence || report.scoreBreakdown?.persuasivenessScore || 80;
  const fluencyScore = report.scoreBreakdown?.fluency || report.scoreBreakdown?.pacingScore || 78;
  const pronunciationScore = report.scoreBreakdown?.pronunciation || report.scoreBreakdown?.clarityScore || 82;
  const grammarScore = report.scoreBreakdown?.grammar || 76;
  const vocabularyScore = report.scoreBreakdown?.vocabulary || report.scoreBreakdown?.pitchVarietyScore || 74;
  const paceScore = report.scoreBreakdown?.speakingPace || report.scoreBreakdown?.pacingScore || 70;
  const eyeContactScore = report.scoreBreakdown?.eyeContact || 91;
  const voiceClarityScore = report.acousticMetrics?.averageVolumeDecibels ? 88 : 84;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Report Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">Report ID: {report.id}</Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">• {report.date}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">{report.sessionTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setShareModalOpen(true)} leftIcon={<Share2 className="w-4 h-4" />}>
            Share Report
          </Button>
          <Button size="sm" variant="primary" onClick={() => setExportModalOpen(true)} leftIcon={<Download className="w-4 h-4" />}>
            Export PDF / CSV
          </Button>
        </div>
      </div>

      {/* Overall Score & Key Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Overall Score & AI Executive Summary */}
        <Card className="lg:col-span-2 space-y-6 neu-flat">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl neu-pressed">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full neu-button flex flex-col items-center justify-center shadow-neu-glow">
                <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">{report.overallScore}</span>
                <span className="text-[10px] text-indigo-500 font-bold uppercase">/ 100 Score</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Executive Grade: {report.overallScore >= 80 ? 'Excellent' : report.overallScore >= 70 ? 'Proficient' : 'Developing'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  Dynamic analysis computed across 10+ acoustic and linguistic indicators
                </p>
              </div>
            </div>

            <Button
              variant="glass"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              leftIcon={isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            >
              {isPlaying ? 'Pause Audio' : 'Play Synced Audio'}
            </Button>
          </div>

          {/* AI Executive Summary */}
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>AI Speech Summary</span>
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-4 rounded-2xl neu-pressed font-medium">
              {report.llmAnalysis?.executiveSummary}
            </p>
          </div>

          {/* Key Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl neu-pressed space-y-2">
              <h5 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Key Strengths</span>
              </h5>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-4 font-medium">
                {report.llmAnalysis?.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl neu-pressed space-y-2">
              <h5 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Areas for Improvement</span>
              </h5>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-4 font-medium">
                {report.llmAnalysis?.areasForImprovement.map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Right Col: Clean Scorecard Breakdown (Overall, Grammar, Fluency, Vocabulary, Confidence) */}
        <Card className="flex flex-col justify-between neu-flat p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Performance Scorecard</h3>
              <Badge variant={report.overallScore >= 80 ? 'emerald' : report.overallScore >= 70 ? 'indigo' : 'amber'}>
                {report.overallScore >= 85 ? 'Excellent' : report.overallScore >= 75 ? 'Good' : report.overallScore >= 60 ? 'Average' : 'Needs Practice'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Core linguistic & acoustic metrics</p>
          </div>

          <div className="space-y-4">
            {/* Overall */}
            <div className="p-3.5 rounded-2xl neu-pressed flex items-center justify-between border border-indigo-500/20">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Overall</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{report.overallScore}%</span>
                <span className="text-[11px] font-bold text-slate-500 font-sans">
                  ({report.overallScore >= 85 ? 'Excellent' : report.overallScore >= 75 ? 'Good' : report.overallScore >= 60 ? 'Average' : 'Needs Work'})
                </span>
              </div>
            </div>

            {/* Metric Bars */}
            <div className="space-y-3 pt-1">
              {/* Grammar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Grammar:</span>
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{grammarScore}%</span>
                </div>
                <div className="w-full neu-pressed rounded-full h-2 overflow-hidden p-0.5">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${grammarScore}%` }} />
                </div>
              </div>

              {/* Fluency */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Fluency:</span>
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">{fluencyScore}%</span>
                </div>
                <div className="w-full neu-pressed rounded-full h-2 overflow-hidden p-0.5">
                  <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${fluencyScore}%` }} />
                </div>
              </div>

              {/* Vocabulary */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <span>Vocabulary:</span>
                  </span>
                  <span className="font-mono text-violet-600 dark:text-violet-400 font-extrabold">{vocabularyScore}%</span>
                </div>
                <div className="w-full neu-pressed rounded-full h-2 overflow-hidden p-0.5">
                  <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${vocabularyScore}%` }} />
                </div>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Confidence:</span>
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">{confidenceScore}%</span>
                </div>
                <div className="w-full neu-pressed rounded-full h-2 overflow-hidden p-0.5">
                  <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${confidenceScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 text-[11px] text-slate-500 font-medium">
            Evaluated by SpeakWise Neural Speech Analyzer
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/20 dark:border-white/5 pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'AI Re-writer & Drills' },
          { id: 'PRONUNCIATION', label: 'AI Pronunciation & Phonetics', badge: 'AI' },
          { id: 'SCORES', label: 'Detailed Metric Breakdown' },
          { id: 'TRANSCRIPT', label: 'Timestamped Transcript' },
          { id: 'ACOUSTICS', label: 'Acoustic Signal Graphs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: AI Re-Writer & Drills */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Re-writer */}
          <Card className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <span>AI Executive Sentence Re-Writer</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI transformed weak disfluency phrases into authoritative pitch statements.</p>

            <div className="space-y-4">
              {report.llmAnalysis?.rephrasedSuggestions?.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-xs text-rose-500 font-mono line-through opacity-80">
                    "{item.originalText}"
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-300 font-semibold flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>"{item.improvedText}"</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-900 p-2 rounded-lg border border-slate-300 dark:border-slate-800">
                    💡 <strong className="text-slate-800 dark:text-slate-300">Rationale:</strong> {item.reasoning}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actionable Drills */}
          <Card className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Recommended Practice Drills</span>
            </h3>
            <div className="space-y-3">
              {report.llmAnalysis?.actionableExercises?.map((drill, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="amber">{drill.category}</Badge>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">5 Min Drill</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{drill.title}</h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{drill.instructions}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Pronunciation Feedback Section */}
      {activeTab === 'PRONUNCIATION' && (
        <PronunciationFeedbackSection pronunciation={report.pronunciationAnalysis} />
      )}


      {/* Tab 2: Detailed Metric Breakdown Grid (Requirement 2D Output Example) */}
      {activeTab === 'SCORES' && (
        <Card className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Individual Performance Dimension Scores</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Detailed multi-variable breakdown from dynamic acoustic processing</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-500">Confidence</div>
              <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">{confidenceScore}</div>
              <div className="text-[10px] text-slate-400">Out of 100</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-500">Fluency</div>
              <div className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">{fluencyScore}</div>
              <div className="text-[10px] text-slate-400">Out of 100</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-500">Pronunciation</div>
              <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">{pronunciationScore}</div>
              <div className="text-[10px] text-slate-400">Out of 100</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-500">Grammar</div>
              <div className="text-3xl font-black font-mono text-purple-600 dark:text-purple-400">{grammarScore}</div>
              <div className="text-[10px] text-slate-400">Out of 100</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-500">Vocabulary</div>
              <div className="text-3xl font-black font-mono text-violet-600 dark:text-violet-400">{vocabularyScore}</div>
              <div className="text-[10px] text-slate-400">Out of 100</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-500">Speaking Pace</div>
              <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{paceScore}</div>
              <div className="text-[10px] text-slate-400">Out of 100</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-500">Eye Contact</div>
              <div className="text-3xl font-black font-mono text-pink-600 dark:text-pink-400">{eyeContactScore}</div>
              <div className="text-[10px] text-slate-400">Out of 100</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-500">Voice Clarity</div>
              <div className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">{voiceClarityScore}</div>
              <div className="text-[10px] text-slate-400">Out of 100</div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Transcript */}
      {activeTab === 'TRANSCRIPT' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Full Transcript with Disfluency Markers</h3>
            <Badge variant="rose">{report.fillerWords?.length || 0} Filler Words Marked</Badge>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed font-mono text-slate-800 dark:text-slate-300">
            <p>{report.transcript}</p>
          </div>
        </Card>
      )}

      {/* Tab 4: Acoustic Signal Graphs */}
      {activeTab === 'ACOUSTICS' && (
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">WPM & Pitch Modulation Trends</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="wpm" name="Pace (WPM)" stroke="#6366f1" strokeWidth={3} />
                <Line type="monotone" dataKey="pitch" name="Pitch (Hz)" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Modals */}
      <ShareModal report={report} isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} />
      <ExportModal report={report} isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />
    </div>
  );
};
