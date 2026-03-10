import type { ErrorResponse, AuthStatus } from "../types/index.js";
import { getPrismaClient } from "../prisma/index.js";
import type { Request } from "express";

// Hardcoded admin credentials
const ADMIN_USERNAME = process.env['ADMIN_USERNAME'] || 'bidi@admin.com';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] || 'admin321bidi';

/**
 * Simple session store for authentication tokens
 * In production, use Redis or a proper session store
 */
const sessionStore = new Map<string, AuthStatus>();

/**
 * Generate a simple session token
 */
export function generateSessionToken(): string {
	return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
}

/**
 * Authenticate admin with hardcoded credentials
 */
export async function authenticateAdmin(username: string, password: string): Promise<string | null> {
	if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
		const token = generateSessionToken();
		sessionStore.set(token, {
			isAuthenticated: true,
			userType: 'admin',
		});
		return token;
	}
	return null;
}

/**
 * Authenticate user with database credentials
 * Supports login with either email or phone number
 */
export async function authenticateUser(emailOrPhone: string, password: string): Promise<{ token: string; userId: number } | null> {
	try {
		const prisma = await getPrismaClient();
		
		// Try to find by email or phone number
		const akunPelanggan = await prisma.akunPelanggan.findFirst({
			where: {
				OR: [
					{ email: emailOrPhone },
					{ nomor_telepon: emailOrPhone }
				]
			},
		});

		// In production, use bcrypt to compare hashed passwords
		// For now, comparing directly (assuming password is stored as hash)
		if (akunPelanggan && akunPelanggan.hashed_password === password) {
			const token = generateSessionToken();
			sessionStore.set(token, {
				isAuthenticated: true,
				userType: 'user',
				userId: akunPelanggan.id_pelanggan,
			});
			return { token, userId: akunPelanggan.id_pelanggan };
		}
		return null;
	} catch (error) {
		console.error('Error authenticating user:', error);
		return null;
	}
}

/**
 * Get auth status from token
 */
export function getAuthStatus(token: string): AuthStatus | null {
	return sessionStore.get(token) || null;
}

/**
 * Logout and remove session
 */
export function logout(token: string): void {
	sessionStore.delete(token);
}

/**
 * Auth middleware - attaches authStatus to request
 */
export function authMiddleware(req: Request): void {
	const token = req.headers.authorization?.replace('Bearer ', '');
	
	if (!token) {
		req.authStatus = {
			isAuthenticated: false,
		};
		return;
	}

	const authStatus = getAuthStatus(token);
	if (authStatus) {
		req.authStatus = authStatus;
		return;
	}
}

/**
 * Require authentication
 */
export function requireAuth(req: Request): ErrorResponse | null {
	if (!req.authStatus?.isAuthenticated) {
		return {
			success: false,
			statusCode: 401,
			message: 'Authentication required',
		};
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
		return {
			success: false,
			statusCode: 403,
			message: 'Anda tidak memiliki akses admin',
		};
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
		return {
			success: false,
			statusCode: 403,
			message: 'User access required',
		};
	}
	return null;
}
