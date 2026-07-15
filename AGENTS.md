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
| Buat migrasi baru | `npx prisma migrate dev --name <nama>` | `backend/` |
| Reset database (drop+migrate+seed) | `npm run db:reset` | `backend/` |
| Seed data awal | `npm run seed` | `backend/` |
| Compile backend TS | `npm run compile` (output ke `dist/`) | `backend/` |

**Tidak ada automated tests, linter, atau formatter** yang terkonfigurasi.

---

## Struktur Monorepo

```
OlaATK-main/
  REVISI-FINAL.md  # Dokumentasi lengkap 5 request dosen
  AGENTS.md        # File ini
  backend/         # Express 5 + Prisma — BUKAN npm workspace (package.json sendiri)
    src/
      routes/
        otp/       # [BARU] OTP request + verify + rate limit
        auth/
        akun-pelanggan/
        barang-terbeli/
        data-layanan/
        konfigurasi/
        payment/
        pelanggan/
        pesanan/
        stats/
        stok-barang/
        upload/
      prisma/
        schema/
          kode_otp.prisma   # [BARU] Model KodeOtp
          pesanan.prisma    # [UBAH] Tambah metode_pengiriman + ongkir
          akun_pelanggan.prisma
          barang_terbeli.prisma
          data_layanan.prisma
          konfigurasi.prisma
          pelanggan.prisma
          stok_barang.prisma
          schema.prisma
  frontend/        # Root npm workspace — workspaces: ["admin", "user"]
    admin/         # "olaatk_frontend_admin_v2" — Vite base "/admin", port 5173
    user/          # "olaatk-frontend-fullspa-energetic" — Vite port 5173
```

> `backend/` tidak termasuk npm workspaces. `node_modules`-nya sendiri.

---

## Dua Persona Utama

### Rina — Online User (19-35 thn)
Mahasiswi/karyawan. Males datang toko. Order via website. Punya smartphone + familiar WA.
- Akses: `frontend/user/` (port 5173)
- Flow: Landing → Order (isi WA + upload file + spek) → **OTP WA** → Bayar Midtrans → Riwayat
- Kena dampak fitur: OTP, bolak-balik, delivery, gramasi, color detect

### Pak Budi — Walk-In Customer (25-60 thn)
Guru/tukang/ibu-ibu. Datang langsung ke toko. Dilayani admin via POS.
- Akses: `frontend/admin/` — dilayani staf via Kasir/Jual Produk (port 5174)
- Flow: Datang → Admin input di Kasir → Bayar tunai → Bawa pulang
- Kena dampak fitur: bolak-balik, gramasi (via admin form)
- **TIDAK** kena OTP (admin input langsung, customer di depan mata)
- **TIDAK** kena delivery (otomatis AMBIL)
- **TIDAK** kena color detect (ga upload file di Kasir)

---

## Arsitektur & Konvensi

- **Entry backend:** `backend/src/app.ts` → class `OlaATKBackendApp` auto-register routes dari `routes/index.ts`
- **Pola route:** `Record<string, Record<string, handler>>` — tiap handler return `{ success, data?, message? }`, **jangan panggil `res.json()` langsung**
- **Auth:** Admin kredensial di `.env` (`ADMIN_USERNAME`/`ADMIN_PASSWORD`). User akun di DB pake bcrypt. JWT expiry: 24h admin, 7d user.
- **OTP:** WA OTP dikirim via **Fonnte** (free 100 msg/hari) ke nomor WA user. User input kode di form web. **BUKAN** user yang kirim pesan ke admin.
- **Middleware:** `authMiddleware` jalan di tiap request → handler panggil `requireAuth()`, `requireAdmin()`, atau `requireUser()`
- **Base URL API:** `http://127.0.0.1:8080` (set via `VITE_API_URL` di `frontend/.env`)
- **Bahasa:** Indonesia untuk semua string UI, dokumentasi, komentar
- **CSS:** Admin pake shadcn CSS variables + Tailwind; User pake Tailwind kustom
- **Prisma:** Pakai `@prisma/adapter-mariadb` tapi target MySQL (works karena MariaDB fork dari MySQL)
- **TypeScript ESM:** `"type": "module"` + `"module": "nodenext"` → **wajib pake ekstensi `.js`** di import lokal; `verbatimModuleSyntax` → pake `import type` untuk type-only

---

## Database (MySQL via Laragon)

### 8 Model (BARU: +KodeOtp)

| Model | Keterangan |
|-------|-----------|
| `Pelanggan` | Identitas customer (nama, WA unique, alamat) |
| `AkunPelanggan` | Akun login (email, WA unique, password bcrypt) — 1-to-1 dg Pelanggan |
| `Pesanan` | Order header — **BARU field:** `metode_pengiriman` (AMBIL/DIANTAR), `ongkir` |
| `BarangTerbeli` | Line items tiap pesanan |
| `StokBarang` | Produk ATK (nama, harga, stok, satuan) |
| `DataLayanan` | Jasa layanan (Print, Fotokopi, Jilid, dll) |
| `Konfigurasi` | Key-value store untuk harga & seting toko — **BARU key gramasi** |
| `KodeOtp` | **\[BARU\]** Kode OTP 6 digit, expired 5 menit, indexed by nomor+created_at buat rate limit |

### Field Baru di `Pesanan`
```
metode_pengiriman  String   @default("AMBIL")   // "AMBIL" | "DIANTAR"
ongkir             Float?                        // Biaya kirim, diisi admin manual via edit pesanan
```

### Model `KodeOtp` (Baru)
```prisma
model KodeOtp {
  id             Int      @id @default(autoincrement())
  nomor_telepon  String
  kode           String    // 6 digit
  expires_at     DateTime  // +5 menit dari created_at
  used           Boolean   @default(false)
  created_at     DateTime  @default(now())

  @@index([nomor_telepon, created_at])  // index buat rate limit query
  @@map("kode_otp")
}
```

### Enum
- `StatusPesanan`: MENUNGGU / DIPROSES / SELESAI / BATAL
- `ModePesanan`: ONLINE / OFFLINE

### Migrasi
- Migrasi di: `backend/src/prisma/migrations/`
- Ada 9 migration (termasuk 1 baru utk KodeOtp + field baru Pesanan)

---

## Fitur Revisi — 5 Request Dosen

### R1 — WA OTP + Rate Limit (Prioritas 3)
- OTP dikirim ke WA **user** via Fonnte, user input kode di **form web**
- **Wajib di semua order** (guest) dan **semua registrasi**
- Rate limit: max 3x request/jam per nomor, max 5x/jam per IP
- Pak Budi (walk-in) **tidak kena OTP** — admin input langsung
- Route baru: `POST /otp/request`, `POST /otp/verify`
- Tabel baru: `KodeOtp`
- File kena: `Order.jsx`, `Auth.jsx`, `payment/index.ts`, `akun-pelanggan/index.ts`, `api.js`

### R2 — Cetak Bolak-Balik (Prioritas 1)
- Toggle di form: "Satu Sisi" / "Dua Sisi (Bolak-Balik)"
- Harga **sama** (Approach C — termudah), beda nama item doang
- Kena: Rina (Online) + Pak Budi (Walk-In via Kasir)
- File kena: `Order.jsx`, `Pesanan.jsx`, `payment/index.ts`

### R3 — Delivery / Ambil di Toko (Prioritas 2)
- Toggle di form order: "Ambil di Toko" / "Diantar"
- Kalo ambil: alamat hidden. Kalo diantar: alamat wajib
- Admin filter + badge 🏪/🚚 di dashboard
- Ongkir diisi admin **manual** via edit pesanan — tanpa API delivery
- Pak Budi otomatis AMBIL (ga kena)
- File kena: `pesanan.prisma`, `pesanan/index.ts`, `payment/index.ts`, `Order.jsx`, `Pesanan.jsx`, `Riwayat.jsx`, DTO

### R4 — Gramasi Kertas (Prioritas 4)
- Key konfigurasi baru: `harga_cetak_a4_70gr_bw`, `harga_cetak_a4_80gr_color`, dll
- Dropdown gramasi (70gr/80gr) di form user + admin Kasir
- Admin setting: Matriks Harga tambah field 70gr & 80gr
- File kena: `seed.ts`, `payment/index.ts`, `Order.jsx`, `Pesanan.jsx`, `Pengaturan.jsx`

### R5 — Auto-Detect B&W / Color (Prioritas 5)
- Scan PDF via pdf.js di frontend: render tiap halaman ke canvas, deteksi pixel warna
- Warning kalo user pilih BW tapi file color: "File terdeteksi mengandung halaman berwarna"
- Auto-fill jumlah halaman kalo mode Campur
- Pak Budi TIDAK kena (ga upload file)
- File kena: `Order.jsx` + komponen `ColorDetectModal.jsx` baru

---

## WA API (Fonnte)

| Detail | |
|--------|-|
| Platform | [Fonnte](https://fonnte.com) — gratis 100 msg/hari |
| Endpoint | `POST https://api.fonnte.com/send` |
| Payload | `{ target: "08xxx", message: "Kode OTP: 482910", countryCode: "62" }` |
| Header | `Authorization: {FONNTE_API_KEY}` |
| Env var | `FONNTE_API_KEY` di `backend/.env` |

---

## Rute API (Update)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/otp/request` | Kirim OTP ke WA user, cek rate limit |
| POST | `/otp/verify` | Verifikasi kode OTP |
| POST | `/payment/create-token` | **[UBAH]** Cek OTP verified sebelum create token |
| POST | `/akun-pelanggan` | **[UBAH]** Cek OTP verified sebelum create akun |
| POST | `/pesanan/public` | **[UBAH]** Terima `metode_pengiriman` |
| PUT | `/pesanan/:id` | **[UBAH]** Update `ongkir` + `metode_pengiriman` |
| GET | `/pesanan` | **[UBAH]** Filter by `metode_pengiriman` |

---

## Hal-Hal yang Gampang Kelewatan

- **Express 5** — bukan Express 4; penanganan error `express.json()` manual
- **CORS** cuma ngizinin `localhost:5173` dan `localhost:5174`
- **Upload file:** base64 POST ke `/upload/file`, max 15MB, tipe: PDF/DOC/DOCX/JPG/PNG
- **Payment webhook:** butuh ngrok buat testing Midtrans notification lokal
- **localStorage admin vs user beda key:** `olaatk_admin_token` vs `ola_auth_token` (biar gak tabrakan kalo dibuka di browser yang sama)
- **Order `BATAL` rollback stok:** increment `stok_barang.stok`
- **Guest checkout tetap bisa** — tapi wajib OTP sebelum bayar (bukan registrasi)
- **Rate limit OTP:** 3x/jam per nomor + 5x/jam per IP — disimpan di tabel `KodeOtp` langsung (ga perlu Redis)
- **Vite `envDir: '../'`** → `frontend/.env` dipake bareng admin dan user
- **Decorators aktif** (`experimentalDecorators` + `emitDecoratorMetadata`) untuk `class-validator`/`class-transformer`
- **Setup awal backend:** `cp .env.example .env` → isi `JWT_SECRET` (generate pake `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) → isi `FONNTE_API_KEY` → `npm install` → `npx prisma generate` → `npm run db:reset`
