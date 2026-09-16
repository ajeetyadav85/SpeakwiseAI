import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import { UserRole } from '../models/User.model.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
}


declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      // In dev fallback, allow demo user header if token missing
      if (req.headers['x-demo-user-id']) {
        req.user = {
          id: req.headers['x-demo-user-id'] as string,
          email: 'demo@speakwise.ai',
          role: 'FREE_USER',
        };
        return next();
      }
      throw new UnauthorizedError('Access token required');
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUser;
      req.user = payload;
      return next();
    } catch (jwtErr: any) {
      const isExpired = jwtErr.name === 'TokenExpiredError';
      res.status(401).json({
        success: false,
        error: isExpired ? 'Token expired' : 'Invalid token',
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: jwtErr.message,
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================================
 * CRITICAL AUTH REFRESH & GUEST DISTINCTION (REGRESSION GUARD):
 * 1. If NO token is provided: genuine anonymous guest -> proceeds via next()
 * 2. If token IS provided but EXPIRED/INVALID: signals frontend with 401
 *    (code: TOKEN_EXPIRED) so the Axios response interceptor can automatically
 *    renew the access token via /auth/refresh and transparently retry without
 *    forcing user re-login or erroneously degrading to GUEST status.
 * =========================================================================
 */
export const optionalJWT = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUser;
        req.user = payload;
        logger.info(`[optionalJWT] ✅ Token verified for: ${payload.email} (${payload.id}) on ${req.method} ${req.originalUrl}`);
        return next();
      } catch (jwtErr: any) {
        logger.warn(`[optionalJWT] ⚠️ Token present but VERIFICATION FAILED: "${jwtErr.message}" on ${req.method} ${req.originalUrl}. Signaling frontend to refresh.`);
        const isExpired = jwtErr.name === 'TokenExpiredError';
        res.status(401).json({
          success: false,
          error: isExpired ? 'Token expired' : 'Invalid token',
          code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
          message: jwtErr.message,
        });
        return;
      }
    } else if (req.headers['x-demo-user-id']) {
      req.user = {
        id: req.headers['x-demo-user-id'] as string,
        email: 'demo@speakwise.ai',
        role: (req.headers['x-demo-user-role'] as UserRole) || 'FREE_USER',
      };
      logger.info(`[optionalJWT] Demo user header used: ${req.user.id}`);
      return next();
    } else {
      logger.info(`[optionalJWT] No auth token provided on ${req.method} ${req.originalUrl}, treating as guest`);
      return next();
    }

  } catch (e: any) {
    logger.warn(`[optionalJWT] Unexpected error in middleware: ${e.message}`);
    next();
  }
};

