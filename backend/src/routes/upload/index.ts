import type { RouteDefinitions } from "../../types/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function generateRandomFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  return `${timestamp}-${random}${ext}`;
}

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const uploadRoutes: RouteDefinitions = {
  "/upload/file": {
    post: async (req) => {
      try {
        const { fileName, fileData, mimeType } = req.body;

        if (!fileName || !fileData) {
          return { success: false, statusCode: 400, message: "File name and data are required" };
        }

        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
          return { success: false, statusCode: 400, message: "Tipe file tidak diizinkan. Hanya PDF, JPG, PNG." };
        }

        const base64Data = fileData.replace(/^data:([A-Za-z-+\/]+);base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        if (buffer.length > MAX_FILE_SIZE_BYTES) {
          return { success: false, statusCode: 400, message: "Ukuran file maksimal 15MB" };
        }

        const randomFileName = generateRandomFilename(fileName);
        const filePath = path.join(uploadsDir, randomFileName);
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
        return { success: false, statusCode: 500, message: "Failed to upload file" };
      }
    },
  },
};

export default uploadRoutes;