import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../config.js';

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export function jwtGuard(jwtSecret: string, allowedRoles: Role[] = ['user', 'admin']) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing bearer token' });
    }

    const token = authHeader.slice('Bearer '.length);

    try {
      const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      const userId = (payload.sub as string) ?? (payload.userId as string);
      const role = (payload.role as Role) ?? 'user';

      if (!userId) {
        return res.status(401).json({ message: 'Invalid token payload' });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: 'Insufficient role' });
      }

      req.user = { id: userId, role };
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}
