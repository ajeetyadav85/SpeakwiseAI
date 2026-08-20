import { SpeechSessionModel, SessionMode } from '../models/SpeechSession.model.js';
import { SpeechReportModel } from '../models/SpeechReport.model.js';

export class SessionService {
  static async listUserSessions(userId: string) {
    const sessions = await SpeechSessionModel.find({ userId }).sort({ createdAt: -1 });
    if (!sessions || sessions.length === 0) {
      // Mock sessions for immediate frontend integration
      return [
        {
          id: 'sess_1001',
          userId,
          title: 'Series A Investor Pitch Rehearsal',
          mode: 'ELEVATOR_PITCH',
          date: '2026-08-03',
          durationSeconds: 145,
          overallScore: 89,
          status: 'COMPLETED',
          reportId: 'rep_88491',
        },
        {
          id: 'sess_1002',
          userId,
          title: 'Keynote Rehearsal: AI in Healthcare',
          mode: 'KEYNOTE_PREP',
          date: '2026-08-01',
          durationSeconds: 320,
          overallScore: 84,
          status: 'COMPLETED',
          reportId: 'rep_88491',
        },
      ];
    }
    return sessions;
  }

  static async createSession(userId: string, title: string, mode: SessionMode) {
    const session = await SpeechSessionModel.create({
      userId,
      title,
      mode,
      durationSeconds: 0,
      overallScore: 88,
      status: 'PROCESSING',
    });
    return session;
  }
}
