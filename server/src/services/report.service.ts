export class ReportService {
  static async getReportById(reportId: string) {
    return {
      id: reportId || 'rep_88491',
      sessionId: 'sess_1001',
      sessionTitle: 'Series A Investor Pitch Rehearsal',
      date: '2026-08-03',
      durationSeconds: 145,
      overallScore: 89,
      scoreBreakdown: {
        pacingScore: 92,
        clarityScore: 88,
        pitchVarietyScore: 84,
        fillerScore: 95,
        persuasivenessScore: 87,
      },
      acousticMetrics: {
        averageWpm: 142,
        wpmVariance: 14.2,
        pitchMinHz: 110,
        pitchMaxHz: 245,
        pitchMeanHz: 168,
        pauseCount: 6,
        totalPauseDurationSeconds: 8.4,
        averageVolumeDecibels: -18.5,
      },
      fillerWords: [
        { word: 'um', timestampStart: 12.4, timestampEnd: 12.9 },
        { word: 'like', timestampStart: 45.1, timestampEnd: 45.6 },
        { word: 'you know', timestampStart: 92.0, timestampEnd: 92.8 },
      ],
      transcript: `Good afternoon partners. I'm thrilled to present SpeakWise AI—the enterprise intelligence platform revolutionizing executive communication. Over the past quarter, we grew monthly active users by 340% while maintaining a 94% net revenue retention. Um, notice how our dual-track audio engine processes real-time acoustic modulation while running LLM structural evaluation under 300 milliseconds. Like, this enables actionable pacing cues directly during live practice. You know, with this round of Series A funding, we will expand our enterprise sales team and roll out multimodal camera posture coaching.`,
      llmAnalysis: {
        executiveSummary:
          'Outstanding overall executive delivery! Your pacing was exceptionally steady at 142 WPM, within the gold standard range (130-150 WPM). Filler word usage was minimal (3 disfluencies across 145 seconds). Vocal variety could be heightened during financial metrics emphasis.',
        strengths: [
          'Superb pacing control without rushing through complex technical definitions.',
          'Extremely crisp diction and clear articulation on high-value terms (ARR, Retention, Dual-track).',
          'Effective strategic pauses before opening key thesis statements.',
        ],
        areasForImprovement: [
          'Incorporate pitch modulation when announcing the 340% growth metric to convey high enthusiasm.',
          'Eliminate conversational qualifiers ("like", "you know") during transition sentences.',
          'Extend final call to action by 3 seconds for powerful emotional resonance.',
        ],
        rephrasedSuggestions: [
          {
            originalText: 'Um, notice how our dual-track audio engine processes real-time acoustic modulation.',
            improvedText: 'Notice how our proprietary dual-track audio engine processes real-time acoustic modulation instantaneously.',
            reasoning: 'Removes the disfluency "Um" and introduces strong action verbs ("proprietary", "instantaneously").',
          },
          {
            originalText: 'Like, this enables actionable pacing cues directly during live practice.',
            improvedText: 'This delivers real-time, actionable pacing cues directly to the speaker in live practice.',
            reasoning: 'Replaces colloquial "Like" with authoritative pitch delivery.',
          },
        ],
        actionableExercises: [
          {
            title: 'Pitch Peak Dynamic Drill',
            instructions: 'Practice repeating your financial metric slide while raising vocal pitch by 15% on key numbers.',
            category: 'Vocal Variety',
          },
          {
            title: '2-Second Pause Mastery',
            instructions: 'Insert a deliberate 2-second silent breath every time you transition between slides or major ideas.',
            category: 'Pause Control',
          },
        ],
      },
    };
  }
}
