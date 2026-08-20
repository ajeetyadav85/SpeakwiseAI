import { logger } from '../../../utils/logger.js';

export class ElevenLabsService {
  public static async generateVoiceFeedback(text: string): Promise<{ audioUrl: string }> {
    logger.info(`Synthesizing ElevenLabs AI Coach voice feedback for: "${text.substring(0, 30)}..."`);
    return {
      audioUrl: 'https://storage.speakwise.ai/coach-feedback-voice.mp3',
    };
  }
}
