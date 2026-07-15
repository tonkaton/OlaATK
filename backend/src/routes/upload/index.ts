import type { RouteDefinitions } from "../../types/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import CloudConvert from "cloudconvert";

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

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

function getCloudConvertClient(): CloudConvert {
  const apiKey = process.env['CLOUDCONVERT_API_KEY'] || '';
  return new CloudConvert(apiKey);
}

const uploadRoutes: RouteDefinitions = {
  "/upload/file": {
    post: async (req) => {
      try {
        const { fileName, fileData, mimeType } = req.body;

        if (!fileName || !fileData) {
          return { success: false, statusCode: 400, message: "File name and data are required" };
        }

        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
          return { success: false, statusCode: 400, message: "Tipe file tidak diizinkan. Hanya PDF, DOC, DOCX, JPG, dan PNG." };
        }

        const cleanData = fileData.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(cleanData, "base64");

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

  "/upload/scan-docx": {
    post: async (req) => {
      try {
        const { fileName, fileData } = req.body;

        if (!fileName || !fileData) {
          return { success: false, statusCode: 400, message: "File name and data are required" };
        }

        const isDocx = fileName.toLowerCase().endsWith('.docx');
        if (!isDocx) {
          return { success: false, statusCode: 400, message: "Hanya file DOCX yang didukung" };
        }

        const cleanData = fileData.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(cleanData, "base64");
        if (buffer.length > MAX_FILE_SIZE_BYTES) {
          return { success: false, statusCode: 400, message: "Ukuran file maksimal 15MB" };
        }

        // Simpan sementara
        const tempFilename = `temp_${generateRandomFilename(fileName)}`;
        const tempPath = path.join(uploadsDir, tempFilename);
        fs.writeFileSync(tempPath, buffer);

        try {
          const cloudConvert = getCloudConvertClient();

          // Buat job
          let job = await cloudConvert.jobs.create({
            tasks: {
              "import-it": { operation: "import/upload" },
              "convert-it": {
                operation: "convert",
                input: "import-it",
                input_format: "docx",
                output_format: "pdf",
              },
              "export-it": {
                operation: "export/url",
                input: "convert-it",
              },
            },
          });

          // Upload file ke CloudConvert
          const uploadTask = job.tasks.find((t: any) => t.name === "import-it");
          if (!uploadTask) throw new Error("Gagal mendapat upload task");

          await cloudConvert.tasks.upload(uploadTask, buffer, fileName);

          // Tunggu job selesai
          job = await cloudConvert.jobs.wait(job.id);

          // Cek apakah ada task yang gagal
          const tasksList = Array.isArray(job.tasks) ? job.tasks : Object.values(job.tasks || {});
          const failedTask = tasksList.find((t: any) => t.status === "error");
          if (failedTask) {
            throw new Error(`CloudConvert: ${(failedTask as any).message || "Gagal memproses file"} (${(failedTask as any).code || ""})`);
          }

          // Dapat URL hasil PDF dari job
          const files = cloudConvert.jobs.getExportUrls(job);
          if (!files?.[0]?.url) throw new Error("Gagal mendapat URL hasil PDF");

          const pdfResponse = await fetch(files[0].url);
          if (!pdfResponse.ok) throw new Error("Gagal download PDF dari CloudConvert");
          const pdfArrayBuffer = await pdfResponse.arrayBuffer();
          const pdfBuffer = Buffer.from(pdfArrayBuffer);

          return {
            success: true,
            statusCode: 200,
            data: {
              pdfBase64: pdfBuffer.toString("base64"),
            },
          };
        } finally {
          // Hapus file sementara
          try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
        }
      } catch (error: any) {
        console.error("Error scanning DOCX:", error);
        return { success: false, message: "Gagal memproses DOCX: " + (error.message || "Unknown error") };
      }
    },
  },
};

export default uploadRoutes;