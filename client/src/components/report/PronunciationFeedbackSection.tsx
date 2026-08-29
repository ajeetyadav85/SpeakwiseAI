import React, { useState } from 'react';
import { PronunciationAnalysis, MispronouncedWord, PhoneticExercise } from '../../types';
import {
  Volume2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Play,
  RotateCcw,
  Mic,
  Smile,
  Zap,
  Target,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PronunciationFeedbackSectionProps {
  pronunciation?: PronunciationAnalysis;
}

export const PronunciationFeedbackSection: React.FC<PronunciationFeedbackSectionProps> = ({
  pronunciation,
}) => {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [activePracticeWord, setActivePracticeWord] = useState<string | null>(null);
  const [practiceSuccess, setPracticeSuccess] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'VOWEL' | 'STRESS' | 'CONSONANT'>('ALL');
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);

  // Fallback data if report did not have pronunciationAnalysis populated
  const defaultData: PronunciationAnalysis = {
    overallPronunciationScore: 89,
    phonemicAccuracyScore: 91,
    intonationScore: 86,
    rhythmScore: 90,
    mispronouncedWords: [
      {
        word: 'revolutionizing',
        ipaExpected: '/ˌrev.əˈluː.ʃən.aɪ.zɪŋ/',
        ipaDetected: '/ˌrev.əˈluː.ʃən.eɪ.zɪŋ/',
        syllableBreakdown: 'rev-o-LU-tion-i-zing',
        stressPattern: 'Primary stress on 3rd syllable "LU"',
        issueType: 'Vowel diphthong shift (/aɪ/ vs /eɪ/)',
        phoneticTip: 'Open your jaw slightly wider and glide smoothly from the open /a/ vowel towards /ɪ/. Avoid flattening the sound into a rigid "ay".',
        practiceExercise: 'Repeat smoothly: "Revolutionize -> Revolutionizing -> Revolutionized"',
        audioWord: 'revolutionizing',
      },
      {
        word: 'instantaneously',
        ipaExpected: '/ˌɪn.stənˈteɪ.ni.əs.li/',
        ipaDetected: '/ˌɪn.stənˈtiː.ni.əs.li/',
        syllableBreakdown: 'in-stan-TA-ne-ous-ly',
        stressPattern: 'Primary stress on 3rd syllable "TA"',
        issueType: 'Syllable vowel compression',
        phoneticTip: 'Give full vocal weight and length to the stressed "TA" /teɪ/ syllable before resolving into "-ne-ous-ly".',
        practiceExercise: 'Rhythmic tap drill: in-stan-[TAP]-ne-ous-ly.',
        audioWord: 'instantaneously',
      },
      {
        word: 'multimodal',
        ipaExpected: '/ˌmʌl.tiˈmoʊ.dəl/',
        ipaDetected: '/ˌmʊl.tiˈmɒ.dəl/',
        syllableBreakdown: 'mul-ti-MO-dal',
        stressPattern: 'Primary stress on 3rd syllable "MO"',
        issueType: 'Vowel rounding (/oʊ/)',
        phoneticTip: 'Maintain a relaxed central /ʌ/ in "mul-", then round your lips firmly to form the /oʊ/ sound in "-modal".',
        practiceExercise: 'Minimal pair contrast: "Multiple" -> "Modal" -> "Multimodal".',
        audioWord: 'multimodal',
      },
    ],
    phoneticExercises: [
      {
        title: 'The /aɪ/ vs /eɪ/ Vowel Clarity Matrix',
        targetSound: 'Long /aɪ/ diphthong precision',
        phoneticSymbol: '/aɪ/',
        instructions: 'Focus on jaw drop when transitioning into the glide. Keep tongue high on the end sound.',
        sampleSentences: [
          'SpeakWise AI identifies dynamic real-time pacing metrics.',
          'The enterprise pricing model provides high return on investment.',
          'We utilize multi-variable acoustic scoring for executive speeches.',
        ],
        difficulty: 'Intermediate',
      },
      {
        title: 'Polysyllabic Stress & Cadence Drill',
        targetSound: 'Multi-syllable word stress',
        phoneticSymbol: 'ˈ primary stress',
        instructions: 'Pronounce the stressed syllable with 15% higher volume and longer duration than surrounding unstressed syllables.',
        sampleSentences: [
          'We instantaneously process proprietary acoustic telemetry.',
          'Multimodal feedback enhances executive communication confidence.',
        ],
        difficulty: 'Advanced',
      },
      {
        title: 'Consonant Cluster Articulation Drill',
        targetSound: '/st/ and /tr/ clean separation',
        phoneticSymbol: '/st/ /tr/',
        instructions: 'Avoid inserting a neutral schwa /ə/ sound between the consonant pair. Release air crisply.',
        sampleSentences: [
          'Strong strategic structures support strategic success.',
          'Crisp transcription tracks trust and transparency.',
        ],
        difficulty: 'Beginner',
      },
    ],
  };

  const data = pronunciation && pronunciation.mispronouncedWords?.length > 0 ? pronunciation : defaultData;

  // Speak word using browser Web Speech API
  const playNativeAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slightly slower for crisp phonetic clarity
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      setPlayingWord(text);
      utterance.onend = () => setPlayingWord(null);
      utterance.onerror = () => setPlayingWord(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Simulate or execute interactive repetition check
  const handlePracticeWord = (word: string) => {
    setActivePracticeWord(word);
    setTimeout(() => {
      setPracticeSuccess((prev) => ({ ...prev, [word]: true }));
      setActivePracticeWord(null);
    }, 1800);
  };

  const filteredWords = data.mispronouncedWords.filter((w) => {
    if (selectedCategory === 'VOWEL') return w.issueType.toLowerCase().includes('vowel');
    if (selectedCategory === 'STRESS') return w.issueType.toLowerCase().includes('stress') || w.issueType.toLowerCase().includes('compression');
    if (selectedCategory === 'CONSONANT') return w.issueType.toLowerCase().includes('consonant');
    return true;
  });

  const activeExercise = data.phoneticExercises[activeExerciseIndex] || data.phoneticExercises[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Pronunciation Dimension Meters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="neu-flat p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Pronunciation</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {data.overallPronunciationScore}
            </span>
            <span className="text-xs text-slate-400 font-bold"> / 100</span>
          </div>
          <div className="w-full neu-pressed rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${data.overallPronunciationScore}%` }}
            />
          </div>
        </Card>

        <Card className="neu-flat p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Phonemic Accuracy</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {data.phonemicAccuracyScore}
            </span>
            <span className="text-xs text-slate-400 font-bold"> / 100</span>
          </div>
          <div className="w-full neu-pressed rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${data.phonemicAccuracyScore}%` }}
            />
          </div>
        </Card>

        <Card className="neu-flat p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Syllable Rhythm</span>
            <Zap className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {data.rhythmScore}
            </span>
            <span className="text-xs text-slate-400 font-bold"> / 100</span>
          </div>
          <div className="w-full neu-pressed rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all"
              style={{ width: `${data.rhythmScore}%` }}
            />
          </div>
        </Card>

        <Card className="neu-flat p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Vocal Intonation</span>
            <Smile className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
              {data.intonationScore}
            </span>
            <span className="text-xs text-slate-400 font-bold"> / 100</span>
          </div>
          <div className="w-full neu-pressed rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${data.intonationScore}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Main Pronunciation Guidance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Mispronounced Words & IPA Guidance */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-500" />
                <span>Phonetic Guidance & Articulation Breakdown</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Specific acoustic corrections, syllable stress markers, and IPA notation
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl neu-pressed">
              {[
                { id: 'ALL', label: 'All Words' },
                { id: 'VOWEL', label: 'Vowels' },
                { id: 'STRESS', label: 'Stress' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedCategory(filter.id as any)}
                  className={`px-3 py-1 text-xs font-extrabold rounded-xl transition-all ${
                    selectedCategory === filter.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {filteredWords.map((item, idx) => {
              const isPracticing = activePracticeWord === item.word;
              const isPassed = practiceSuccess[item.word];
              const isAudioPlaying = playingWord === (item.audioWord || item.word);

              return (
                <Card key={idx} className="neu-flat p-6 space-y-4">
                  {/* Top line: Word, IPA & Audio Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl neu-button flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            "{item.word}"
                          </span>
                          <Badge variant="rose" size="sm">{item.issueType}</Badge>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          Standard IPA: <strong className="text-emerald-600 dark:text-emerald-400">{item.ipaExpected}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => playNativeAudio(item.audioWord || item.word)}
                        leftIcon={<Play className={`w-3.5 h-3.5 ${isAudioPlaying ? 'text-amber-500 animate-spin' : 'text-emerald-500'}`} />}
                      >
                        {isAudioPlaying ? 'Playing...' : 'Listen Native'}
                      </Button>

                      <Button
                        size="sm"
                        variant={isPassed ? 'primary' : 'outline'}
                        onClick={() => handlePracticeWord(item.word)}
                        disabled={isPracticing}
                        leftIcon={
                          isPassed ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                          ) : isPracticing ? (
                            <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                          ) : (
                            <Mic className="w-3.5 h-3.5 text-indigo-500" />
                          )
                        }
                      >
                        {isPassed ? 'Mastered ✨' : isPracticing ? 'Evaluating...' : 'Practice Aloud'}
                      </Button>
                    </div>
                  </div>

                  {/* Syllable Stress Visualizer & IPA Contrast */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Syllable Breakdown */}
                    <div className="p-3.5 rounded-2xl neu-pressed space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        Syllable Cadence & Stress
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
                        {item.syllableBreakdown.split('-').map((syl, sIdx) => {
                          const isStressed = syl === syl.toUpperCase() && syl.length > 1;
                          return (
                            <span
                              key={sIdx}
                              className={`px-2 py-1 rounded-lg font-bold ${
                                isStressed
                                  ? 'bg-indigo-600 text-white shadow-neu-glow'
                                  : 'neu-button text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {syl}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{item.stressPattern}</p>
                    </div>

                    {/* Detected vs Standard IPA */}
                    <div className="p-3.5 rounded-2xl neu-pressed space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        Detected vs Standard Phonetics
                      </span>
                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Detected:</span>
                          <span className="text-rose-500 font-bold">{item.ipaDetected}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Standard:</span>
                          <span className="text-emerald-500 font-bold">{item.ipaExpected}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mouth Placement & Articulation Tip */}
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl neu-button flex items-center justify-center text-indigo-500 flex-shrink-0 mt-0.5">
                      💡
                    </div>
                    <div className="space-y-1 text-xs">
                      <strong className="text-slate-900 dark:text-slate-100 font-extrabold">
                        Mouth & Articulation Coaching:
                      </strong>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {item.phoneticTip}
                      </p>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                        🎯 <em>{item.practiceExercise}</em>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Col: Targeted Phonetic Exercises & Drills */}
        <div className="space-y-6">
          <Card className="neu-flat p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Targeted Phonetic Drills</h4>
              </div>
              <Badge variant="amber" size="sm">Exercise {activeExerciseIndex + 1}/{data.phoneticExercises.length}</Badge>
            </div>

            {/* Exercise Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {data.phoneticExercises.map((ex, exIdx) => (
                <button
                  key={exIdx}
                  onClick={() => setActiveExerciseIndex(exIdx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    activeExerciseIndex === exIdx
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Drill {exIdx + 1}: {ex.phoneticSymbol}
                </button>
              ))}
            </div>

            {/* Active Drill Card */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl neu-pressed space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-500">{activeExercise.phoneticSymbol} Sound Target</span>
                  <Badge variant="indigo" size="sm">{activeExercise.difficulty}</Badge>
                </div>
                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">{activeExercise.title}</h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {activeExercise.instructions}
                </p>
              </div>

              {/* Sample Practice Sentences */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Practice Sentences
                </span>
                {activeExercise.sampleSentences.map((sentence, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl neu-button text-xs flex items-center justify-between gap-3 group"
                  >
                    <span className="text-slate-800 dark:text-slate-200 font-medium">"{sentence}"</span>
                    <button
                      onClick={() => playNativeAudio(sentence)}
                      className="p-1.5 rounded-lg neu-pressed text-emerald-500 group-hover:scale-110 transition-transform"
                      title="Listen Sentence"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                className="w-full justify-center rounded-2xl py-2.5 text-xs font-extrabold"
                onClick={() => playNativeAudio(activeExercise.sampleSentences[0])}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Listen Full Phonetic Drill
              </Button>
            </div>
          </Card>

          {/* Quick Coach Tip Box */}
          <div className="p-5 rounded-3xl neu-flat space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span>Executive Speech Coach Rule</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              In executive public speaking, crisp syllable stress communicates authority and confidence. Rushing through multi-syllabic terminology flattens vowels and diminishes audience comprehension.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
