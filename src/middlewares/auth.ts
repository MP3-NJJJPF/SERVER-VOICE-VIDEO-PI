import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/firebase';

/**
 * Extended Express Request interface with authenticated user information
 * @interface AuthRequest
 * @extends {Request}
 */
export interface AuthRequest extends Request {
  /**
   * Authenticated user information
   * @property {string} uid - User's unique identifier
   * @property {string} [email] - User's email address (optional)
   * @property {string} [name] - User's display name (optional)
   */
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

/**
 * Middleware to verify Firebase JWT token
 * 
 * @description
 * Verifies the Firebase authentication token from the Authorization header.
 * If Firebase is not configured, it uses a mock user for development purposes.
 * 
 * @param {AuthRequest} req - Express request object with potential user data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<void>}
 * 
 * @throws {401} When token is not provided or is invalid/expired
 * 
 * @example
 * // Apply to a route
 * router.get('/protected', authMiddleware, (req, res) => {
 *   console.log(req.user.uid);
 * });
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // If Firebase is not configured, create mock user for development
    if (!firebaseAuth) {
      console.warn('Authentication disabled - using mock user');
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
      res.status(401).json({ error: 'Token not provided' });
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
    console.error('Error authenticating token:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to validate that the user is authenticated
 * 
 * @description
 * Checks if the user object exists in the request. Must be used after authMiddleware.
 * Returns 401 if no user is found in the request object.
 * 
 * @param {AuthRequest} req - Express request object that should contain user data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * 
 * @throws {401} When user is not authenticated
 * 
 * @example
 * // Chain with authMiddleware
 * router.post('/api/data', authMiddleware, requireAuth, (req, res) => {
 *   // req.user is guaranteed to exist here
 *   console.log(req.user.uid);
 * });
 */
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
};
