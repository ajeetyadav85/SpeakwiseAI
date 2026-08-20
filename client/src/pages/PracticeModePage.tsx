import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAudioStudioStore } from '../stores/useAudioStudioStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { PRACTICE_PROMPTS_DATA, TOPIC_CATEGORIES_LIST, PracticePromptItem } from '../data/practicePromptsData';
import { ContentApiService } from '../services/contentApi.service';
import {
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
  HelpCircle,
  Lock,
  Target,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TopicCascadeAnimation } from '../components/practice/TopicCascadeAnimation';

export const PracticeModePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTopic, setTeleprompterText } = useAudioStudioStore();

  // Read active tab from URL query params
  const searchTab = new URLSearchParams(location.search).get('tab') || 'topics';
  const [activeTab, setActiveTab] = useState<string>(searchTab);

  useEffect(() => {
    const currentParam = new URLSearchParams(location.search).get('tab') || 'topics';
    setActiveTab(currentParam);
  }, [location.search]);

  // Dropdown states
  const [topicsCatFilter, setTopicsCatFilter] = useState<string>('General');
  const [questionsTypeFilter, setQuestionsTypeFilter] = useState<string>('Random');
  const [wordsTypeFilter, setWordsTypeFilter] = useState<string>('Random');
  const [corporateTypeFilter, setCorporateTypeFilter] = useState<string>('Random');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('Random');

  // Dynamic Categories state from backend
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(TOPIC_CATEGORIES_LIST);

  // Currently Selected Prompt (null by default until user clicks Start Selection)
  const [selectedPrompt, setSelectedPrompt] = useState<PracticePromptItem | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Map active tab to backend content type
  const activeType: 'TOPIC' | 'QUESTION' | 'WORD' | 'CORPORATE_TALK' = useMemo(() => {
    switch (activeTab) {
      case 'questions':
        return 'QUESTION';
      case 'words':
        return 'WORD';
      case 'corporate':
        return 'CORPORATE_TALK';
      default:
        return 'TOPIC';
    }
  }, [activeTab]);

  // Load dynamic categories from backend API when tab changes
  useEffect(() => {
    const loadCategories = async () => {
      const cats = await ContentApiService.getCategories(activeType);
      if (cats && cats.length > 0) {
        setDynamicCategories(cats);
        if (!cats.includes(topicsCatFilter)) {
          setTopicsCatFilter(cats[0]);
        }
      }
    };
    loadCategories();
  }, [activeType]);

  const activeCategory = useMemo(() => {
    if (activeTab === 'topics') return topicsCatFilter;
    if (activeTab === 'questions') return questionsTypeFilter;
    if (activeTab === 'words') return wordsTypeFilter;
    if (activeTab === 'corporate') return corporateTypeFilter;
    return 'General';
  }, [activeTab, topicsCatFilter, questionsTypeFilter, wordsTypeFilter, corporateTypeFilter]);

  // Reset selected prompt and hint on tab or filter change
  useEffect(() => {
    setSelectedPrompt(null);
    setShowHint(false);
  }, [activeTab, topicsCatFilter, questionsTypeFilter, wordsTypeFilter, corporateTypeFilter, difficultyFilter]);

  const handleLaunchStudio = async () => {
    if (!selectedPrompt && activeTab !== 'freestyle') return;

    const { canProceed, isPro, openUpgradeLimitModal, fetchUsageStatus } = useSubscriptionStore.getState();
    const statusResult = await fetchUsageStatus();
    if (!statusResult.canProceed && !statusResult.isPro) {
      openUpgradeLimitModal();
      return;
    }

    if (selectedPrompt) {
      setTopic({
        id: selectedPrompt.id,
        title: selectedPrompt.title,
        category: selectedPrompt.category,
        difficulty: selectedPrompt.difficulty === 'Hard' ? 'Advanced' : selectedPrompt.difficulty === 'Medium' ? 'Intermediate' : 'Beginner',
        suggestedDurationSeconds: selectedPrompt.suggestedDurationSeconds || 150,
        bulletPoints: [selectedPrompt.meaning, selectedPrompt.hint],
      });

      setTeleprompterText(
        `Title: ${selectedPrompt.title}\n\nExplanation:\n${selectedPrompt.meaning}\n\nContent Overview:\n${selectedPrompt.contentOverview}\n\nSpeaking Hint:\n${selectedPrompt.hint}`
      );
    }

    navigate('/practice/studio');
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'questions':
        return 'Questions Studio';
      case 'words':
        return 'Words & Idioms Studio';
      case 'freestyle':
        return 'Freestyle Practice Studio';
      case 'corporate':
        return 'Corporate Talks Studio';
      default:
        return 'Topics Practice Studio';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-h-[calc(100vh-4.5rem)] flex flex-col justify-between">
      {/* Studio Header & Filter Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/20 dark:border-white/5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {getTabTitle()}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            {activeTab === 'freestyle'
              ? 'Speak directly on any topic of your choice without constraints'
              : 'Select category & difficulty filters, then click Start Selection to generate via Gemini AI'}
          </p>
        </div>

        {/* Filter Dropdowns based on active tab */}
        {activeTab !== 'freestyle' && (
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Dropdown 1: Dynamic Categories for Topics */}
            {activeTab === 'topics' && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-xs font-extrabold text-slate-500">Category:</span>
                <select
                  value={topicsCatFilter}
                  onChange={(e) => setTopicsCatFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl sm:rounded-full text-xs font-bold focus:outline-none neu-button cursor-pointer flex-1 sm:flex-initial"
                >
                  {dynamicCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-xs font-extrabold text-slate-500">Type:</span>
                <select
                  value={questionsTypeFilter}
                  onChange={(e) => setQuestionsTypeFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl sm:rounded-full text-xs font-bold focus:outline-none neu-button cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="Random">Random</option>
                  <option value="General">General</option>
                  <option value="Interview">Interview</option>
                </select>
              </div>
            )}

            {activeTab === 'words' && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-xs font-extrabold text-slate-500">Type:</span>
                <select
                  value={wordsTypeFilter}
                  onChange={(e) => setWordsTypeFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl sm:rounded-full text-xs font-bold focus:outline-none neu-button cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="Random">Random</option>
                  <option value="Words">Words</option>
                  <option value="Idioms">Idioms</option>
                </select>
              </div>
            )}

            {activeTab === 'corporate' && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-xs font-extrabold text-slate-500">Talk Type:</span>
                <select
                  value={corporateTypeFilter}
                  onChange={(e) => setCorporateTypeFilter(e.target.value)}
                  className="px-3.5 py-2 rounded-xl sm:rounded-full text-xs font-bold focus:outline-none neu-button cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="Random">Random</option>
                  <option value="Executive Pitch">Executive Pitch</option>
                  <option value="Townhall Address">Townhall Address</option>
                  <option value="Product Launch">Product Launch</option>
                  <option value="Crisis Management">Crisis Management</option>
                  <option value="Meeting Talks">Meeting Talks</option>
                </select>
              </div>
            )}

            {/* Dropdown 2 (Difficulty) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xs font-extrabold text-slate-500">Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl sm:rounded-full text-xs font-bold focus:outline-none neu-button cursor-pointer flex-1 sm:flex-initial"
              >
                <option value="Random">Random</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Split Screen Layout (Responsive order: Start Selection TOP on Mobile, Left Card BELOW) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center flex-1 my-auto">
        {/* Topic Cascade & Start Selection Box (order-1 on mobile, order-2 on PC) */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex items-center justify-center p-3 sm:p-6 neu-flat rounded-3xl w-full">
          <TopicCascadeAnimation
            promptList={PRACTICE_PROMPTS_DATA}
            onSelectPrompt={(p) => setSelectedPrompt(p)}
            activeTabLabel={activeTab.toUpperCase()}
            categoryFilter={activeCategory}
            difficultyFilter={difficultyFilter}
            activeType={activeType}
          />
        </div>

        {/* Selected Title & Details / Proceed to Studio Button (order-2 on mobile, order-1 on PC) */}
        <div className="order-2 lg:order-1 lg:col-span-5 space-y-4 w-full">
          <Card className="p-4 sm:p-6 neu-flat space-y-4 rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/5">
              <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                {activeTab === 'freestyle' ? 'Freestyle Mode Active' : 'Selected Topic Prompt'}
              </span>
              {selectedPrompt && (
                <div className="flex items-center gap-2">
                  <Badge variant="indigo">{selectedPrompt.category}</Badge>
                  <Badge variant="emerald">{selectedPrompt.difficulty}</Badge>
                </div>
              )}
            </div>

            {/* Title Display or Initial Screen Placeholder */}
            {selectedPrompt ? (
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  "{selectedPrompt.title}"
                </h2>
              </div>
            ) : (
              <div className="p-5 sm:p-6 rounded-2xl neu-pressed text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl neu-button text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Choose {getTabTitle().replace(' Studio', '')} Filters
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Select your Category & Difficulty filters above, then click <strong className="text-indigo-600 dark:text-indigo-400">'Start Selection'</strong> to generate your topic prompt.
                </p>
              </div>
            )}

            {/* Hidden by default until "Show Hint" is toggled */}
            {activeTab !== 'freestyle' && selectedPrompt && (
              <>
                {!showHint ? (
                  /* Funky Teaser Placeholder when Hint is hidden */
                  <div className="p-4 rounded-2xl neu-pressed text-center space-y-2">
                    <div className="w-8 h-8 rounded-xl neu-button text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      ✨ Locked in Mystery!
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Click <strong>'Show Hint'</strong> below to unlock the explanation, background context, and speaking tips.
                    </p>
                  </div>
                ) : (
                  /* Full Meaning & Content Overview revealed on click */
                  <div className="space-y-3 animate-in fade-in">
                    <div className="space-y-1.5 p-4 rounded-2xl neu-pressed text-xs">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <span>Meaning & Explanation:</span>
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        {selectedPrompt.meaning}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">Content Overview:</span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        {selectedPrompt.contentOverview}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl neu-pressed text-amber-800 dark:text-amber-300 text-xs leading-relaxed font-medium">
                      💡 <strong>Pro Speaking Hint:</strong> {selectedPrompt.hint}
                    </div>
                  </div>
                )}

                {/* Show Hint Toggle Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="w-full py-3 px-4 rounded-2xl neu-button text-xs font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-500" />
                      <span>{showHint ? 'Hide Hint & Details' : 'Show Hint'}</span>
                    </span>
                    {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            {/* Action Trigger - Proceed to Recording Studio HUD */}
            <div className="pt-3 border-t border-white/20 dark:border-white/5">
              <Button
                size="lg"
                variant="primary"
                disabled={activeTab !== 'freestyle' && !selectedPrompt}
                className="w-full rounded-full py-3.5 font-bold text-xs"
                onClick={handleLaunchStudio}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Recording Studio HUD
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
