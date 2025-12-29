import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../config.js';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  email?: string;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export function jwtGuard(jwtSecret: string, allowedRoles: Role[] = ['user', 'admin']) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const queryToken = typeof req.query?.token === 'string' ? req.query.token : undefined;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
    const token = bearerToken ?? queryToken;
    if (!token) {
      return res.status(401).json({ message: 'Missing bearer token' });
    }

    try {
      const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      const userId = (payload.sub as string) ?? (payload.userId as string);
      const role = (payload.role as Role) ?? 'user';
      const email = (payload.email as string) ?? undefined;

      if (!userId) {
        return res.status(401).json({ message: 'Invalid token payload' });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: 'Insufficient role' });
      }

      if (email) {
        req.headers['x-user-email'] = email;
      }
      req.user = { id: userId, role, email };
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}
