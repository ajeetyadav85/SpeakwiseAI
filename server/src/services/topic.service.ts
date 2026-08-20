export class TopicService {
  static getTopics() {
    return [
      {
        id: 'top_101',
        title: 'The Role of Artificial Intelligence in Modern Healthcare',
        category: 'Tech',
        difficulty: 'Intermediate',
        suggestedDurationSeconds: 120,
        bulletPoints: [
          'Highlight AI diagnostic accuracy versus traditional methods',
          'Address patient privacy and HIPAA compliance concerns',
          'Conclude with a visionary statement on future longevity',
        ],
      },
      {
        id: 'top_102',
        title: 'Pitching a Series A Tech Startup to Top VC Partners',
        category: 'Business',
        difficulty: 'Advanced',
        suggestedDurationSeconds: 180,
        bulletPoints: [
          'Present explosive MOM ARR growth figures clearly',
          'Explain customer retention cohort retention strength',
          'Outline capital deployment strategy for global scaling',
        ],
      },
    ];
  }

  static generateAITopic(prompt: string) {
    return {
      id: 'top_ai_' + Date.now(),
      title: `AI Topic: ${prompt}`,
      category: 'Tech',
      difficulty: 'Advanced',
      suggestedDurationSeconds: 150,
      bulletPoints: [
        `Opening hook framing the thesis on ${prompt}`,
        'Present 2 supporting data points with steady pace (140 WPM)',
        'End with an engaging call to action',
      ],
    };
  }
}
