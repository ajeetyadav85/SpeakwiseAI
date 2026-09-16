import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { UserRole, UserModel } from '../models/User.model.js';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication required'));
    }

    let role = req.user.role;
    if (req.user.id) {
      try {
        const dbUser = await UserModel.findById(req.user.id);
        if (dbUser) {
          const now = Date.now();
          const hasActiveSub = Boolean(
            dbUser.subscriptionExpiresAt && new Date(dbUser.subscriptionExpiresAt).getTime() > now
          );
          const hasActiveTrial = Boolean(
            dbUser.trialEndsAt && new Date(dbUser.trialEndsAt).getTime() > now
          );
          if (dbUser.role === 'SUPER_ADMIN' || dbUser.role === 'ORG_ADMIN') {
            role = dbUser.role;
          } else if (hasActiveSub || hasActiveTrial) {
            role = 'PRO_USER';
          } else {
            role = 'FREE_USER';
          }
        }
      } catch (e) {}
    }

    if (!allowedRoles.includes(role)) {
      return next(new ForbiddenError(`Access restricted to roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
};
