import type { ErrorResponse, AuthStatus } from "../types/index.js";
import { getPrismaClient } from "../prisma/index.js";
import type { Request } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const getJwtSecret = (): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET not set in environment');
  return secret;
};

/**
 * Hash password dengan bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Generate JWT token
 */
function generateToken(payload: AuthStatus, expiresIn: string): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
function verifyToken(token: string): AuthStatus | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded as AuthStatus;
  } catch {
    return null;
  }
}

/**
 * Authenticate admin
 */
export async function authenticateAdmin(username: string, password: string): Promise<string | null> {
  const ADMIN_USERNAME = process.env['ADMIN_USERNAME'];
  const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'];

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error('FATAL: ADMIN_USERNAME or ADMIN_PASSWORD not set in environment');
    return null;
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return null;

  return generateToken(
    { isAuthenticated: true, userType: 'admin' },
    '24h'
  );
}

/**
 * Authenticate user dengan bcrypt
 */
export async function authenticateUser(
  emailOrPhone: string,
  password: string
): Promise<{ token: string; userId: number } | null> {
  try {
    const prisma = await getPrismaClient();

    const akunPelanggan = await prisma.akunPelanggan.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { nomor_telepon: emailOrPhone }
        ]
      },
    });

    if (!akunPelanggan) return null;

    const isPasswordValid = await bcrypt.compare(password, akunPelanggan.hashed_password);
    if (!isPasswordValid) return null;

    const token = generateToken(
      { isAuthenticated: true, userType: 'user', userId: akunPelanggan.id_pelanggan },
      '7d'
    );

    return { token, userId: akunPelanggan.id_pelanggan };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

/**
 * Auth middleware
 */
export function authMiddleware(req: Request): void {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    req.authStatus = { isAuthenticated: false };
    return;
  }

  const authStatus = verifyToken(token);
  if (authStatus) {
    req.authStatus = authStatus;
    return;
  }

  req.authStatus = { isAuthenticated: false };
}

/**
 * Require authentication
 */
export function requireAuth(req: Request): ErrorResponse | null {
  if (!req.authStatus?.isAuthenticated) {
    return { success: false, statusCode: 401, message: 'Authentication required' };
  }
  return null;
}

/**
 * Require admin authentication
 */
export function requireAdmin(req: Request): ErrorResponse | null {
  const authError = requireAuth(req);
  if (authError) return authError;

  if (req.authStatus?.userType !== 'admin') {
    return { success: false, statusCode: 403, message: 'Anda tidak memiliki akses admin' };
  }
  return null;
}

/**
 * Require user authentication
 */
export function requireUser(req: Request): ErrorResponse | null {
  const authError = requireAuth(req);
  if (authError) return authError;

  if (req.authStatus?.userType !== 'user') {
    return { success: false, statusCode: 403, message: 'User access required' };
  }
  return null;
}