import { create } from 'zustand';
import { SpeechReport } from '../types';
import { mockSampleReport } from '../services/api';

interface ReportStoreState {
  reports: Record<string, SpeechReport>;
  saveReport: (report: SpeechReport) => void;
  getReportById: (id: string) => SpeechReport;
}

// Initial mock report seed
const initialReports: Record<string, SpeechReport> = {
  [mockSampleReport.id]: mockSampleReport,
};

export const useReportStore = create<ReportStoreState>((set, get) => ({
  reports: initialReports,
  saveReport: (report) => {
    set((state) => {
      const updated = { ...state.reports, [report.id]: report };
      try {
        localStorage.setItem('speakwise_reports', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save report to localStorage', e);
      }
      return { reports: updated };
    });
  },
  getReportById: (id) => {
    const state = get();
    if (state.reports[id]) {
      return state.reports[id];
    }
    // Try reading from localStorage
    try {
      const saved = localStorage.getItem('speakwise_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[id]) return parsed[id];
      }
    } catch (e) {}

    // Fallback to sample report with provided ID
    return { ...mockSampleReport, id };
  },
}));
