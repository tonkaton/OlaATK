import "express";
import { AuthStatus } from '../types/index.js';

declare global {
	namespace Express {
		interface Request {
			authStatus?: AuthStatus;
		}
	}
}