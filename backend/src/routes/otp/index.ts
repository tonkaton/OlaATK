import type { RouteDefinitions } from "../../types/index.js";
import { sendEmail } from "../../utils/mailer.js";

interface OtpEntry { code: string; expiresAt: number; }
// ponytail: in-memory store, resets on restart — use Redis if persistence needed
const otpStore = new Map<string, OtpEntry>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const otpRoutes: RouteDefinitions = {
  "/otp/send": {
    post: async (req) => {
      const { email } = req.body as { email?: string };
      if (!email) return { success: false, statusCode: 400, message: "Email wajib diisi" };

      const code = generateOtp();
      otpStore.set(email, { code, expiresAt: Date.now() + OTP_TTL_MS });

      const { ok, reason } = await sendEmail(
        email,
        'Kode OTP Ola ATK',
        `Kode OTP kamu: ${code}\n\nBerlaku 5 menit. Jangan bagikan ke siapapun.`
      );

      if (!ok) return { success: false, statusCode: 502, message: reason ?? "Gagal mengirim OTP via email" };

      return { success: true, data: { message: "OTP berhasil dikirim ke email" } };
    },
  },

  "/otp/verify": {
    post: (req) => {
      const { email, code } = req.body as { email?: string; code?: string };
      if (!email || !code) return { success: false, statusCode: 400, message: "Email dan kode OTP wajib diisi" };

      const entry = otpStore.get(email);
      if (!entry) return { success: false, statusCode: 400, message: "OTP tidak ditemukan atau sudah kedaluwarsa" };
      if (Date.now() > entry.expiresAt) {
        otpStore.delete(email);
        return { success: false, statusCode: 400, message: "OTP sudah kedaluwarsa" };
      }
      if (entry.code !== code) return { success: false, statusCode: 400, message: "Kode OTP salah" };

      otpStore.delete(email);
      return { success: true, data: { message: "OTP valid" } };
    },
  },
};

export default otpRoutes;
