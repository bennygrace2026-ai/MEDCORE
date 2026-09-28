import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const JWT_SECRET = process.env.JWT_SECRET || 'medcore-jwt-secret-key-2026';
const KNOWN_SECRETS = [
  JWT_SECRET,
  'medcore-jwt-secret-key-2026',
  'chimuanya2001',
  'medcore-academy-secret-key-2025-secure'
];

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    studentId?: string;
    name?: string;
    email?: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  let verified: any = null;
  for (const secret of KNOWN_SECRETS) {
    try {
      verified = jwt.verify(token, secret);
      if (verified) break;
    } catch {
      // Try next secret
    }
  }

  if (!verified) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return;
  }

  req.user = verified;
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Access denied. Not authenticated.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
};
