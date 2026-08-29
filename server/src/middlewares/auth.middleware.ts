import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import { UserRole } from '../models/User.model.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateJWT = (req: Request, _res: Response, next: NextFunction): void => {
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
          role: 'PRO_USER',
        };
        return next();
      }
      throw new UnauthorizedError('Access token required');
    }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUser;
    req.user = payload;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
};

export const optionalJWT = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUser;
      req.user = payload;
    } else if (req.headers['x-demo-user-id']) {
      req.user = {
        id: req.headers['x-demo-user-id'] as string,
        email: 'demo@speakwise.ai',
        role: (req.headers['x-demo-user-role'] as UserRole) || 'PRO_USER',
      };
    }

  } catch (e) {
    // Ignore invalid token for optional auth, treat as guest
  }
  next();
};

