import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'STUDENT' | 'TECHNICIAN' | 'ADMIN';
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Decoding our "mock" token: userId:role (base64)
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, role] = decoded.split(':');

    if (!id || !role) {
      throw new Error('Invalid token');
    }

    req.user = { 
      id, 
      role: role as 'STUDENT' | 'TECHNICIAN' | 'ADMIN' 
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Access denied for role ${req.user.role}` });
    }

    next();
  };
};
