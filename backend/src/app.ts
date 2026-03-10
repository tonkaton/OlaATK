import { config } from "dotenv";

import { getPrismaClient, routes, type ErrorResponse, type Method } from "./index.js";
import { authMiddleware } from "./auth/index.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class OlaATKBackendApp {
	private app!: express.Express;
	private prisma = getPrismaClient();

	constructor() {
		this.setupExpress();
	}

	private setupExpress() {
		this.app = express();

		// Enable CORS for frontend
		this.app.use(cors({
			origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost', 'http://127.0.0.1'],
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization']
		}));

		// Add JSON body parser middleware
		this.app.use((req, res, next) => {
			express.json({ strict: true, limit: '20mb' })(req, res, (err) => {
				if (err) {
					res.status(400).json({
						success: false,
						message: "Invalid JSON body",
						cause: err.message,
					} satisfies ErrorResponse);
					res.end();
				}

				next();
			});
		});

		// Serve uploads folder as static files
		const uploadsPath = path.join(__dirname, '../uploads');
		this.app.use('/uploads', express.static(uploadsPath));

		if (!process.env['PORT']) {
			throw new Error("PORT environment variable is not set.");
		}

		const port = parseInt(process.env['PORT']);
		if (isNaN(port) || port <= 0 || port > 65535) {
			throw new Error("PORT environment variable is not a valid port number.");
		}

		// Register routes for all methods from static definitions
		Object.entries(routes).forEach(([path, methods]) => {
			Object.entries(methods).forEach(([uncastedMethod, handler]) => {
				const method = uncastedMethod as Method;

				this.app[method](path, async (req: express.Request, res: express.Response) => {
					try {
						// Apply auth middleware
						authMiddleware(req);
						
						const result = await handler(req);
						const status = result.statusCode ?? (result.success ? 200 : 500);
						delete result.statusCode;

						res.status(status).json(result);
					} catch (err) {
						console.error("Error handling request:", err);

						if (!(err instanceof Error)) {
							err = new Error("Unknown error occurred.");
						}

						const castedErr = err as Error;
						res.status(500).json({
							success: false,
							message: castedErr.message,
						} satisfies ErrorResponse);
					}
				});
			});
		});

		this.app.listen(port, () => {
			console.log(`Ola ATK Backend App is listening on port ${port}`);
		});
	}
}

// Load environment variables from .env file
config({
	path: [".env"]
});

new OlaATKBackendApp();