import React, { useState } from 'react';
import { SpeechReport } from '../../types';
import {
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Code,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ExportModalProps {
  report: SpeechReport;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ report, isOpen, onClose }) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Export as JSON
  const handleExportJSON = () => {
    setDownloadingFormat('JSON');
    setTimeout(() => {
      triggerDownload(
        JSON.stringify(report, null, 2),
        `SpeakWise_Report_${report.id}.json`,
        'application/json'
      );
      setDownloadingFormat(null);
    }, 400);
  };

  // 2. Export as CSV
  const handleExportCSV = () => {
    setDownloadingFormat('CSV');
    setTimeout(() => {
      const csvRows = [
        ['Report ID', report.id],
        ['Session Title', `"${report.sessionTitle}"`],
        ['Date', report.date],
        ['Duration (Seconds)', report.durationSeconds],
        ['Overall Score', report.overallScore],
        ['Pacing Score', report.scoreBreakdown?.pacingScore || 85],
        ['Clarity Score', report.scoreBreakdown?.clarityScore || 85],
        ['Filler Control Score', report.scoreBreakdown?.fillerScore || 85],
        ['Persuasiveness Score', report.scoreBreakdown?.persuasivenessScore || 85],
        ['Average WPM', report.acousticMetrics?.averageWpm || 140],
        ['Filler Words Count', report.fillerWords?.length || 0],
        ['Executive Summary', `"${report.llmAnalysis?.executiveSummary.replace(/"/g, '""')}"`],
      ];

      const csvContent = csvRows.map((e) => e.join(',')).join('\n');
      triggerDownload(
        csvContent,
        `SpeakWise_Report_${report.id}.csv`,
        'text/csv;charset=utf-8;'
      );
      setDownloadingFormat(null);
    }, 400);
  };

  // 3. Export as PDF (Printable HTML Document Window / Download)
  const handleExportPDF = () => {
    setDownloadingFormat('PDF');
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>SpeakWise AI Speech Report - ${report.sessionTitle}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; }
                .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
                .title { font-size: 24px; font-weight: 800; color: #0f172a; }
                .meta { font-size: 13px; color: #64748b; margin-top: 5px; }
                .score-box { background: #f0f4ff; border: 2px solid #6366f1; padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 30px; }
                .score-val { font-size: 42px; font-weight: 900; color: #4f46e5; }
                .section { margin-bottom: 25px; }
                .section-title { font-size: 16px; font-weight: 700; color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
                ul { padding-left: 20px; }
                li { margin-bottom: 6px; font-size: 14px; }
                .transcript { background: #f8fafc; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="title">SpeakWise AI — Executive Speech Analysis Report</div>
                <div class="meta">Session Title: ${report.sessionTitle} | Date: ${report.date} | Report ID: ${report.id}</div>
              </div>

              <div class="score-box">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #4338ca;">Overall Score</div>
                <div class="score-val">${report.overallScore} / 100</div>
              </div>

              <div class="section">
                <div class="section-title">AI Executive Summary</div>
                <p style="font-size: 14px; line-height: 1.6;">${report.llmAnalysis?.executiveSummary}</p>
              </div>

              <div class="section">
                <div class="section-title">Key Strengths</div>
                <ul>
                  ${report.llmAnalysis?.strengths.map((s) => `<li>${s}</li>`).join('')}
                </ul>
              </div>

              <div class="section">
                <div class="section-title">Areas for Improvement</div>
                <ul>
                  ${report.llmAnalysis?.areasForImprovement.map((a) => `<li>${a}</li>`).join('')}
                </ul>
              </div>

              <div class="section">
                <div class="section-title">Session Transcript</div>
                <div class="transcript">${report.transcript}</div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
      setDownloadingFormat(null);
    }, 400);
  };

  // 4. Export as PNG (Canvas Graphics Download)
  const handleExportPNG = () => {
    setDownloadingFormat('PNG');
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw background
        const grad = ctx.createLinearGradient(0, 0, 800, 500);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 500);

        // Header Title
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('SpeakWise AI Performance Card', 40, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(report.sessionTitle, 40, 90);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Date: ${report.date}  |  Duration: ${report.durationSeconds}s`, 40, 115);

        // Score Badge Circle
        ctx.beginPath();
        ctx.arc(680, 100, 55, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#6366f1';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${report.overallScore}`, 680, 105);

        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('/ 100 SCORE', 680, 125);

        // Summary Text
        ctx.textAlign = 'left';
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '14px sans-serif';
        const text = report.llmAnalysis?.executiveSummary || 'Executive Speech Rehearsal';
        ctx.fillText(text.slice(0, 85) + '...', 40, 180);

        // Metrics Table
        const metrics = [
          { label: 'Pacing / WPM', val: `${report.acousticMetrics?.averageWpm || 140} WPM` },
          { label: 'Filler Words', val: `${report.fillerWords?.length || 0} Detected` },
          { label: 'Confidence Score', val: `${report.scoreBreakdown?.persuasivenessScore || 85}/100` },
        ];

        metrics.forEach((m, idx) => {
          const y = 240 + idx * 60;
          ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
          ctx.fillRect(40, y, 720, 45);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(m.label, 60, y + 28);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(m.val, 650, y + 28);
        });

        triggerDownload(
          canvas.toDataURL('image/png'),
          `SpeakWise_Card_${report.id}.png`,
          'image/png'
        );
      }
      setDownloadingFormat(null);
    }, 400);
  };

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
            <Download className="w-5 h-5 text-indigo-500" />
            <span>Export Speech Analytics</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select your preferred export document format below.</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportPDF}
            className="p-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-left space-y-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">PDF Executive Report</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Printable document format</div>
          </button>

          <button
            onClick={handleExportPNG}
            className="p-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-left space-y-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">PNG Summary Card</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">High-res image graphic</div>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left space-y-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">CSV Data Spreadsheet</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Raw tabular dataset</div>
          </button>

          <button
            onClick={handleExportJSON}
            className="p-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left space-y-2 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Code className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">JSON Payload</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Structured API data</div>
          </button>
        </div>

        {downloadingFormat && (
          <div className="text-center py-2 text-xs text-indigo-500 font-semibold animate-pulse flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Generating {downloadingFormat} export...</span>
          </div>
        )}
      </Card>
    </div>
  );
};
