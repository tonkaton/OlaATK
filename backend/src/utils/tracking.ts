import { randomInt } from "node:crypto";

// 32 char tanpa ambigu (0/O, 1/I, L? L dipakai — tanpa 0/O/1/I aja)
const POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Format: OLA-XXXXXX (6 char acak, 32^6 = 1 miliar kombinasi)
export function generateTrackingCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += POOL[randomInt(POOL.length)];
  return `OLA-${code}`;
}

// Normalisasi input user: uppercase + buang semua non-alfanumerik (spasi, dash, dll)
export function normalizeTrackingCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

// Cari kode di DB: user boleh ketik dengan atau tanpa prefix OLA
// DB selalu nyimpen format OLA-XXXXXX, jadi sisipkan dash biar exact match
export function toSearchCode(normalized: string): string {
  const withPrefix = normalized.startsWith("OLA") ? normalized : `OLA${normalized}`;
  return `${withPrefix.slice(0, 3)}-${withPrefix.slice(3)}`;
}
