import multer from 'multer';
import path from 'path';
import { BadRequestError } from '../utils/errors.js';

const storage = multer.memoryStorage();

export const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.webm', '.wav', '.mp3', '.m4a', '.ogg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only audio files (.webm, .wav, .mp3, .m4a) are allowed'));
    }
  },
});
