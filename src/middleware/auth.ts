import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
  };
}

export const authenticateAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const adminPassword = req.headers['x-admin-password'] as string;

    // Simple password check (for backward compatibility)
    if (adminPassword === process.env.ADMIN_PASSWORD) {
      req.admin = { id: 'admin', username: 'admin', role: 'admin' };
      return next();
    }

    // JWT token check
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      req.admin = decoded;
    }
    next();
  } catch (error) {
    next();
  }
};
