import type { RouteDefinitions } from "../../types/index.js";
import { authenticateAdmin, authenticateUser } from "../../auth/index.js";
import { validateDto } from "../../utils/validation.js";
import { LoginDto } from "./dto/login.dto.js";

const authRoutes: RouteDefinitions = {
	"/auth/login": {
		post: async (req) => {
			const { dto, errors } = await validateDto(LoginDto, req.body);
			if (errors) return errors;

			if (!dto.username) {
				return {
					success: false,
					statusCode: 400,
					message: "Username, email, or phone number is required",
				};
			}

			// Try user authentication first (email or phone)
			const userResult = await authenticateUser(dto.username, dto.password);
			if (userResult) {
				return {
					success: true,
					statusCode: 201,
					data: { 
						token: userResult.token, 
						userId: userResult.userId,
						userType: 'user'
					},
				};
			}

			// If user auth fails, try admin authentication
			const adminToken = await authenticateAdmin(dto.username, dto.password);
			if (adminToken) {
				return {
					success: true,
					statusCode: 201,
					data: { token: adminToken, userType: 'admin' },
				};
			}

			// Both failed
			return {
				success: false,
				statusCode: 401,
				message: "Invalid credentials",
			};
		},
	},

	"/auth/logout": {
		post: (req) => {
			const token = req.headers.authorization?.replace('Bearer ', '');
			if (token) {
				// Implement logout logic if needed
			}

			return {
				success: true,
				data: { message: "Logged out successfully" },
			};
		},
	},

	"/auth/me": {
		get: (req) => {
			if (!req.authStatus?.isAuthenticated) {
				return {
					success: false,
					statusCode: 401,
					message: "Not authenticated",
				};
			}

			return {
				success: true,
				data: {
					isAuthenticated: req.authStatus.isAuthenticated,
					userType: req.authStatus.userType,
					userId: req.authStatus.userId,
				},
			};
		},
	},
};

export default authRoutes;
