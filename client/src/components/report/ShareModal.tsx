import React, { useState } from 'react';
import { SpeechReport } from '../../types';
import {
  X,
  Copy,
  Check,
  Share2,
  Send,
  Linkedin,
  Twitter,
  Globe,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ShareModalProps {
  report: SpeechReport;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ report, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = window.location.href;
  const shareTitle = `My SpeakWise AI Speech Report: ${report.sessionTitle} (Score: ${report.overallScore}/100)`;
  const shareText = `I scored ${report.overallScore}/100 on my public speaking rehearsal with SpeakWise AI! Check out the detailed speech analysis report:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Native share error or dismissed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const shareWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
  const shareLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const shareX = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-500" />
            <span>Share Speech Report</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Share your performance score and AI analysis with mentors, team, or social channels.</p>
        </div>

        {/* Report Summary Card */}
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">{report.sessionTitle}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Date: {report.date}</div>
          </div>
          <div className="px-3 py-1 rounded-full bg-indigo-600 text-white font-mono font-bold text-sm">
            {report.overallScore}/100
          </div>
        </div>

        {/* Copy Link Row */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Report Web Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none"
            />
            <Button size="sm" variant="primary" onClick={handleCopyLink} leftIcon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Social Sharing Buttons */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Share Directly To:</span>
          <div className="grid grid-cols-3 gap-3">
            <a
              href={shareWhatsApp}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs gap-1.5 transition-all"
            >
              <Send className="w-5 h-5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={shareLinkedIn}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-xs gap-1.5 transition-all"
            >
              <Linkedin className="w-5 h-5" />
              <span>LinkedIn</span>
            </a>

            <a
              href={shareX}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/30 text-slate-800 dark:text-slate-200 font-bold text-xs gap-1.5 transition-all"
            >
              <Twitter className="w-5 h-5" />
              <span>X (Twitter)</span>
            </a>
          </div>
        </div>

        {/* Native Web Share API Trigger */}
        {'share' in navigator && (
          <Button variant="outline" className="w-full" onClick={handleNativeShare} leftIcon={<Globe className="w-4 h-4 text-cyan-400" />}>
            Use System Share Menu
          </Button>
        )}
      </Card>
    </div>
  );
};
