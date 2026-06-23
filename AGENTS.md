# Ola ATK — Panduan Agent

**Project:** Aplikasi Manajemen Percetakan & ATK (Stationery & Printing)
**Arsitektur:** Express 5 REST API (port 8080) + dua Vite + React 18 SPA (admin di `/admin`, user di `/`)

---

## Perintah Penting

| Aksi | Perintah | Direktori |
|------|----------|-----------|
| Jalankan backend | `npm run start:dev` (nodemon + compile TS) | `backend/` |
| Jalankan semua frontend | `npm run dev:all` (admin + user barengan) | `frontend/` |
| Jalankan admin saja | `npm run dev:admin` | `frontend/` |
| Jalankan user saja | `npm run dev:user` | `frontend/` |
| Generate Prisma client | `npx prisma generate` | `backend/` |
| Reset database (drop+migrate+seed) | `npm run db:reset` | `backend/` |
| Seed data awal | `npm run seed` | `backend/` |
| Compile backend TS | `npm run compile` (output ke `dist/`) | `backend/` |

**Tidak ada automated tests, linter, atau formatter** yang terkonfigurasi.

---

## Struktur Monorepo

```
OlaATK-main/
  backend/         # Express 5 + Prisma — BUKAN npm workspace (package.json sendiri)
  frontend/        # Root npm workspace — workspaces: ["admin", "user"]
    admin/         # "olaatk_frontend_admin_v2" — Vite base "/admin", port 5173
    user/          # "olaatk-frontend-fullspa-energetic" — Vite port 5173
```

> `backend/` tidak termasuk npm workspaces. `node_modules`-nya sendiri.

---

## Arsitektur & Konvensi

- **Entry backend:** `backend/src/app.ts` → class `OlaATKBackendApp` auto-register routes dari `routes/index.ts`
- **Pola route:** `Record<string, Record<string, handler>>` — tiap handler return `{ success, data?, message? }`, **jangan panggil `res.json()` langsung**
- **Auth:** Admin kredensial di `.env` (`ADMIN_USERNAME`/`ADMIN_PASSWORD`). User akun di DB pake bcrypt. JWT expiry: 24h admin, 7d user.
- **Middleware:** `authMiddleware` jalan di tiap request → handler panggil `requireAuth()`, `requireAdmin()`, atau `requireUser()`
- **Base URL API:** `http://127.0.0.1:8080` (set via `VITE_API_URL` di `frontend/.env`)
- **Bahasa:** Indonesia untuk semua string UI, dokumentasi, komentar
- **CSS:** Admin pake shadcn CSS variables + Tailwind; User pake Tailwind kustom
- **Prisma:** Pakai `@prisma/adapter-mariadb` tapi target MySQL (works karena MariaDB fork dari MySQL)
- **TypeScript ESM:** `"type": "module"` + `"module": "nodenext"` → **wajib pake ekstensi `.js`** di import lokal; `verbatimModuleSyntax` → pake `import type` untuk type-only

---

## Database (MySQL via Laragon)

7 model: `Pelanggan`, `AkunPelanggan`, `Pesanan`, `BarangTerbeli`, `StokBarang`, `DataLayanan`, `Konfigurasi`
- Enum: `StatusPesanan` (MENUNGGU/DIPROSES/SELESAI/BATAL), `ModePesanan` (ONLINE/OFFLINE)
- Migrasi di: `backend/src/prisma/migrations/`

---

## Hal-Hal yang Gampang Kelewatan

- **Express 5** — bukan Express 4; penanganan error `express.json()` manual
- **CORS** cuma ngizinin `localhost:5173` dan `localhost:5174`
- **Upload file:** base64 POST ke `/upload/file`, max 15MB, tipe: PDF/DOC/DOCX/JPG/PNG
- **Payment webhook:** butuh ngrok buat testing Midtrans notification lokal
- **localStorage admin vs user beda key:** `olaatk_admin_token` vs `ola_auth_token` (biar gak tabrakan kalo dibuka di browser yang sama)
- **Order `BATAL` rollback stok:** increment `stok_barang.stok`
- **Vite `envDir: '../'`** → `frontend/.env` dipake bareng admin dan user
- **Decorators aktif** (`experimentalDecorators` + `emitDecoratorMetadata`) untuk `class-validator`/`class-transformer`
- **Setup awal backend:** `cp .env.example .env` → isi `JWT_SECRET` (generate pake `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) → `npm install` → `npx prisma generate` → `npm run db:reset`
