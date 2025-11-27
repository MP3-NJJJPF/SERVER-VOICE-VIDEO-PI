import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

/**
 * Middleware para verificar token JWT de Firebase
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Si Firebase no está configurado, crear usuario mock para desarrollo
    if (!firebaseAuth) {
      console.warn('⚠️  Autenticación deshabilitada - usando usuario mock');
      req.user = {
        uid: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Dev User',
      };
      next();
      return;
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const decodedToken = await firebaseAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };

    next();
  } catch (error) {
    console.error('❌ Error autenticando token:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * Middleware para validar que el usuario esté autenticado
 */
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Autenticación requerida' });
    return;
  }
  next();
};
