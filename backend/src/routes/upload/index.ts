import type { RouteDefinitions } from "../../types/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate random filename
function generateRandomFilename(originalName: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 15);
	const ext = path.extname(originalName);
	return `${timestamp}-${random}${ext}`;
}

const uploadRoutes: RouteDefinitions = {
	"/upload/file": {
		post: async (req) => {
			try {
				// Check if file data exists in request body
				const { fileName, fileData, mimeType } = req.body;

				if (!fileName || !fileData) {
					return {
						success: false,
						statusCode: 400,
						message: "File name and data are required",
					};
				}

				// Decode base64 file data
				const base64Data = fileData.replace(/^data:([A-Za-z-+\/]+);base64,/, "");
				const buffer = Buffer.from(base64Data, "base64");

				// Generate random filename
				const randomFileName = generateRandomFilename(fileName);
				const filePath = path.join(uploadsDir, randomFileName);

				// Save file
				fs.writeFileSync(filePath, buffer);

				return {
					success: true,
					statusCode: 201,
					data: {
						fileName: randomFileName,
						originalName: fileName,
						size: buffer.length,
						path: `/uploads/${randomFileName}`,
					},
				};
			} catch (error) {
				console.error("Error uploading file:", error);
				return {
					success: false,
					statusCode: 500,
					message: "Failed to upload file",
				};
			}
		},
	},
};

export default uploadRoutes;
