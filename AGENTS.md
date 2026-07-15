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
  REVISI-FINAL.md  # Dokumentasi lengkap 5 request dosen + payment refactor
  AGENTS.md        # File ini
  backend/         # Express 5 + Prisma — BUKAN npm workspace (package.json sendiri)
    src/
      routes/
        auth/
        akun-pelanggan/
        barang-terbeli/
        data-layanan/
        konfigurasi/
        payment/   # [UBAH] createToken (no DB) + confirmPayment (DB after pay) + notification
        pelanggan/
        pesanan/   # [UBAH] Filter mode/pengiriman/payment_status/jenis
        stats/
        stok-barang/
        upload/    # [UBAH] +scan-docx endpoint (CloudConvert DOCX→PDF)
      prisma/
        schema/
          pesanan.prisma    # [UBAH] +metode_pengiriman, ongkir, alamat_pengiriman, payment_status, dll
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
- **OTP:** WA OTP dikirim via **Fonnte** (free 100 msg/hari) ke nomor WA user. User input kode di form web. **BUKAN** user yang kirim pesan ke admin. **Belum implementasi — nunggu API key.**
- **Middleware:** `authMiddleware` jalan di tiap request → handler panggil `requireAuth()`, `requireAdmin()`, atau `requireUser()`
- **Base URL API:** `http://127.0.0.1:8080` (set via `VITE_API_URL` di `frontend/.env`)
- **Bahasa:** Indonesia untuk semua string UI, dokumentasi, komentar
- **CSS:** Admin pake shadcn CSS variables + Tailwind; User pake Tailwind kustom
- **Prisma:** Pakai `@prisma/adapter-mariadb` tapi target MySQL (works karena MariaDB fork dari MySQL)
- **TypeScript ESM:** `"type": "module"` + `"module": "nodenext"` → **wajib pake ekstensi `.js`** di import lokal; `verbatimModuleSyntax` → pake `import type` untuk type-only

---

## Database (MySQL via Laragon)

### 7 Model

| Model | Keterangan |
|-------|-----------|
| `Pelanggan` | Identitas customer (nama, WA unique, alamat) |
| `AkunPelanggan` | Akun login (email, WA unique, password bcrypt) — 1-to-1 dg Pelanggan |
| `Pesanan` | Order header — field: `sisi_cetak`, `gramasi`, `metode_pengiriman`, `ongkir`, `alamat_pengiriman`, `midtrans_order_id`, `payment_status`, `snap_token` |
| `BarangTerbeli` | Line items tiap pesanan |
| `StokBarang` | Produk ATK (nama, harga, stok, satuan) |
| `DataLayanan` | Jasa layanan (Print, Fotokopi, Jilid, dll) |
| `Konfigurasi` | Key-value store untuk harga & seting toko — **+8 key gramasi cetak** |

### Field Baru di `Pesanan` (Dari Revisi)
```
sisi_cetak          String    @default("SATU_SISI")   // SATU_SISI | DUA_SISI
gramasi             String    @default("80gr")         // 70gr | 80gr
metode_pengiriman   String    @default("AMBIL")        // AMBIL | DIANTAR
ongkir              Float?
alamat_pengiriman   String?
midtrans_order_id   String?                          // Dari Midtrans
payment_status      String?                          // pending | settlement | cancel | expire
snap_token          String?                          // Midtrans Snap token
```

### Enum
- `StatusPesanan`: MENUNGGU / DIPROSES / SELESAI / BATAL
- `ModePesanan`: ONLINE / OFFLINE

### Migration Timeline (12 total — 4 baru dari revisi)
```
20260715074126_add_sisi_cetak/           → R2 (Bolak-Balik)
20260715074706_add_metode_pengiriman_ongkir/ → R3 (Delivery)
20260715075219_add_gramasi/              → R4 (Gramasi)
20260715082039_add_alamat_pengiriman/    → R3 (Alamat)
```

---

## Fitur Revisi — 5 Request Dosen

### R1 — WA OTP + Rate Limit | **BLOCKED**
- OTP dikirim ke WA **user** via Fonnte, user input kode di **form web**
- Rate limit: max 3x request/jam per nomor, max 5x/jam per IP
- Pak Budi (walk-in) **tidak kena OTP**
- **Blocked:** Nunggu Fonnte API key — **backend route & tabel KodeOtp BELUM dibuat**

### R2 — Cetak Bolak-Balik | **SELESAI**
- Toggle: "Satu Sisi" / "Dua Sisi (Bolak-Balik)"
- Harga **sama** (Approach C), beda nama item doang
- Harga per-page (**bukan** per-sheet — sheet pricing dibatalkan)
- File: `Order.jsx`, `Pesanan.jsx`, `payment/index.ts`

### R3 — Delivery / Ambil di Toko | **SELESAI**
- Toggle: "Ambil di Toko" / "Diantar"
- Alamat pake radio: "Alamat Saya" / "Alamat Lain"
- Filter tunggal 15 pilihan di admin (mode + status + payment + jenis)
- Ongkir diisi admin manual via edit pesanan
- Pak Budi otomatis AMBIL
- File: `pesanan.prisma`, `pesanan/index.ts`, `payment/index.ts`, `Order.jsx`, `Pesanan.jsx`, `Riwayat.jsx`, DTO

### R4 — Gramasi Kertas | **SELESAI**
- 8 key cetak gramasi baru + 4 legacy fallback (fotokopi tidak pakai gramasi)
- Dropdown gramasi (70gr/80gr) di form user + admin Kasir
- Backward compatible: fallback ke key tanpa gramasi
- File: `seed.ts`, `payment/index.ts`, `Order.jsx`, `Pesanan.jsx`, `Pengaturan.jsx`

### R5 — Auto-Detect B&W / Color | **SELESAI**
- Scan PDF via pdf.js di frontend: render tiap halaman ke canvas, deteksi pixel
- Warning 3 tombol kalo BW tapi ada warna
- Auto-fill jumlah halaman kalo mode Campur
- **DOCX:** Convert ke PDF via CloudConvert API dulu, baru scan
- Pak Budi TIDAK kena (ga upload file)
- File: `Order.jsx`, `ColorDetectModal.jsx`, `upload/index.ts` (scan-docx endpoint), `api.js`

---

## Payment Refactor (createToken + confirmPayment)

### Arsitektur Baru

| Endpoint | DB Writes | Kegunaan |
|----------|-----------|----------|
| `POST /payment/create-token` | **NONE** | Hitung harga → generate Midtrans token → return |
| `POST /payment/confirm` | YES | Cek order_id → hitung ulang → create Pelanggan + Pesanan + BarangTerbeli → verifikasi Midtrans |

### Flow
```
1. User klik Bayar → createToken (no DB) → dapet snap_token
2. Midtrans Snap popup → user bayar
3. onSuccess/onPending → confirmPayment → create DB record
4. confirmPayment juga panggil transaction.status(order_id) ke Midtrans
   → settlement → set payment_status='settlement' + status='DIPROSES'
5. Webhook (/payment/notification) jalan sebagai backup
```

### Admin Override
- Admin bisa ubah `payment_status` langsung dari detail card pesanan
- `UpdateStatusPesananDto` punya field `payment_status` opsional

---

## Rute API (Update)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/payment/create-token` | Generate Midtrans token — **NO DB** |
| POST | `/payment/confirm` | **[BARU]** Create DB records setelah bayar + verifikasi Midtrans |
| POST | `/payment/notification` | Webhook Midtrans |
| POST | `/akun-pelanggan` | **[NANTI]** Cek OTP verified |
| POST | `/pesanan/public` | Terima `metode_pengiriman`, `alamat_pengiriman`, `sisi_cetak`, `gramasi` |
| PUT | `/pesanan/:id` | Update `ongkir`, `metode_pengiriman`, `alamat_pengiriman` |
| PUT | `/pesanan/:id/status` | **[UBAH]** Update `status` + `payment_status` |
| GET | `/pesanan` | **[UBAH]** Filter: `mode`, `pengiriman`, `payment_status`, `jenis` (produk/layanan), `status`, `search` |
| POST | `/upload/scan-docx` | **[BARU]** DOCX → CloudConvert → PDF → return PDF binary buat color scan |

---

## CloudConvert API (DOCX→PDF)

| Detail | |
|--------|-|
| Platform | [CloudConvert](https://cloudconvert.com) |
| Kegunaan | Convert DOCX ke PDF biar bisa di-scan pixelnya |
| Free tier | 25 credits/hari (~5-12 file DOCX) |
| SDK | `cloudconvert` npm package v3 |
| Endpoint backend | `POST /upload/scan-docx` |
| Env var | `CLOUDCONVERT_API_KEY` di `backend/.env` |
| Sandbox | Hanya file whitelisted (MD5 hash) — testing doang |
| Flow | Backend: import/upload → convert (docx→pdf) → export/url → download → return base64 |

---

## Filter Admin (Single Dropdown — 15 Pilihan)

```
∅ Semua
🏪 Ambil di Toko       → pengiriman=AMBIL
🚚 Diantar             → pengiriman=DIANTAR
🌐 Online              → mode=ONLINE
🏭 Offline             → mode=OFFLINE
⏳ Menunggu            → status=MENUNGGU
🔧 Diproses            → status=DIPROSES
✅ Selesai              → status=SELESAI
❌ Batal                → status=BATAL
💳 Payment: Pending    → payment_status=pending
💳 Payment: Lunas      → payment_status=settlement
💳 Payment: Ditolak    → payment_status=cancel
💳 Payment: Expire     → payment_status=expire
📦 Produk              → jenis=produk
🖨️ Layanan             → jenis=layanan
```

Backend handle di `GET /pesanan` — tiap filter value mapping ke param yang sesuai.

---

## WA API (Fonnte) — Belum Aktif

| Detail | |
|--------|-|
| Platform | [Fonnte](https://fonnte.com) — gratis 100 msg/hari |
| Endpoint | `POST https://api.fonnte.com/send` |
| Payload | `{ target: "08xxx", message: "Kode OTP: 482910", countryCode: "62" }` |
| Header | `Authorization: {FONNTE_API_KEY}` |
| Env var | `FONNTE_API_KEY` di `backend/.env` |

---

## Hal-Hal yang Gampang Kelewatan

- **Express 5** — bukan Express 4; penanganan error `express.json()` manual
- **CORS** cuma ngizinin `localhost:5173` dan `localhost:5174`
- **Upload file:** base64 POST ke `/upload/file`, max 15MB, tipe: PDF/DOC/DOCX/JPG/PNG
- **Base64 regex:** MIME type DOCX mengandung titik (`wordprocessingml.document`) — regex harus `^data:[^;]+;base64,` bukan `^data:([A-Za-z-+\/]+);base64,`
- **Payment webhook:** butuh ngrok buat testing Midtrans notification lokal
- **localStorage admin vs user beda key:** `olaatk_admin_token` vs `ola_auth_token` (biar gak tabrakan kalo dibuka di browser yang sama)
- **Order `BATAL` rollback stok:** increment `stok_barang.stok`
- **Guest checkout tetap bisa** — (OTP belum aktif, nunggu Fonnte API key)
- **Payment createToken = zero DB writes:** Kalo user tutup browser, gak ada data sampah. DB cuma di-create pas confirmPayment.
- **confirmPayment verifikasi Midtrans:** Langsung panggil `transaction.status(order_id)` — kalo settlement auto-set `status: 'DIPROSES'`
- **Harga per-page (bukan per-sheet):** Sheet pricing udah diretik. Bolak-balik 2 halaman = 2 × harga.
- **Vite `envDir: '../'`** → `frontend/.env` dipake bareng admin dan user
- **Decorators aktif** (`experimentalDecorators` + `emitDecoratorMetadata`) untuk `class-validator`/`class-transformer`
- **Setup awal backend:** `cp .env.example .env` → isi `JWT_SECRET` (generate pake `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) → isi `CLOUDCONVERT_API_KEY` → `npm install` → `npx prisma generate` → `npm run db:reset`
