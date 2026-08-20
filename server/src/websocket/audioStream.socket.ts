import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';

export const registerAudioSocketHandlers = (io: SocketIOServer): void => {
  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    socket.on('INIT_STREAM', (data: { userId: string; sessionId: string; sampleRate: number }) => {
      logger.info(`Initialized audio stream for session ${data.sessionId} by user ${data.userId}`);
      socket.emit('STREAM_ACK', { status: 'READY', sessionId: data.sessionId });
    });

    socket.on('AUDIO_CHUNK', (chunk: Buffer) => {
      // Simulate real-time acoustic signal processing & live ASR feedback
      const currentWpm = Math.floor(Math.random() * 15) + 135;
      const isFiller = Math.random() > 0.85;

      socket.emit('LIVE_FEEDBACK', {
        timestampMs: Date.now(),
        currentWpm,
        wpmStatus: currentWpm >= 130 && currentWpm <= 150 ? 'OPTIMAL' : 'ADJUST',
        fillerDetected: isFiller,
        fillerWord: isFiller ? 'um' : undefined,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });
};
