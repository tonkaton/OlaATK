import { randomInt, timingSafeEqual } from "node:crypto";
import type { RouteDefinitions } from "../../types/index.js";
import { sendEmail } from "../../utils/mailer.js";

interface OtpEntry { code: string; expiresAt: number; attempts: number; }
// ponytail: in-memory store, resets on restart — use Redis if persistence needed
const otpStore = new Map<string, OtpEntry>();
// ponytail: in-memory send log, resets on restart — use Redis if persistence needed
const sendLog = new Map<string, number[]>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_SENDS_PER_HOUR = 10;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 detik
const MAX_ATTEMPTS = 5;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// Cek & catat rate limit kirim OTP per email (10x/jam + cooldown 60 detik)
function checkSendLimit(email: string): { ok: false; message: string } | { ok: true } {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  const history = sendLog.get(email) ?? [];
  const lastSend = history[history.length - 1];
  if (lastSend && now - lastSend < RESEND_COOLDOWN_MS) {
    return { ok: false, message: "Tunggu 60 detik sebelum kirim ulang OTP" };
  }

  const recent = history.filter((t) => t > hourAgo);
  if (recent.length >= MAX_SENDS_PER_HOUR) {
    return { ok: false, message: "Terlalu banyak permintaan OTP untuk email ini. Coba lagi nanti." };
  }

  recent.push(now);
  sendLog.set(email, recent);
  return { ok: true };
}

const otpRoutes: RouteDefinitions = {
  "/otp/send": {
    post: async (req) => {
      const rawEmail = (req.body as { email?: string })?.email;
      if (!rawEmail) return { success: false, statusCode: 400, message: "Email wajib diisi" };
      const email = normalizeEmail(rawEmail);

      const limit = checkSendLimit(email);
      if (!limit.ok) return { success: false, statusCode: 429, message: limit.message };

      const code = generateOtp();
      otpStore.set(email, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

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
      const rawBody = req.body as { email?: string; code?: string };
      if (!rawBody.email || !rawBody.code) return { success: false, statusCode: 400, message: "Email dan kode OTP wajib diisi" };
      const email = normalizeEmail(rawBody.email);

      const entry = otpStore.get(email);
      if (!entry) return { success: false, statusCode: 400, message: "OTP tidak ditemukan atau sudah kedaluwarsa" };
      if (Date.now() > entry.expiresAt) {
        otpStore.delete(email);
        return { success: false, statusCode: 400, message: "OTP sudah kedaluwarsa" };
      }
      if (entry.attempts >= MAX_ATTEMPTS) {
        otpStore.delete(email);
        return { success: false, statusCode: 429, message: "Terlalu banyak percobaan. Kirim ulang OTP." };
      }

      const submitted = Buffer.from(rawBody.code);
      const expected = Buffer.from(entry.code);
      const matches = submitted.length === expected.length && timingSafeEqual(submitted, expected);

      if (!matches) {
        entry.attempts += 1;
        return { success: false, statusCode: 400, message: "Kode OTP salah" };
      }

      otpStore.delete(email);
      return { success: true, data: { message: "OTP valid" } };
    },
  },
};

export default otpRoutes;
