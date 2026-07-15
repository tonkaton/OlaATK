# REVISI PROJEK OLA ATK — Final Breakdown

Berdasarkan diskusi dengan dosen dan analisis codebase (backend + frontend).

---

## 👤 DUA PERSONA UTAMA

### Rina — Online User
| Atribut | |
|---------|-|
| Usia | 19-35 tahun |
| Profil | Mahasiswi / Karyawan |
| Perilaku | Males datang toko, ga punya waktu, butuh cetak skripsi/laporan |
| Device | Smartphone + laptop, familiar WA + e-commerce |
| Akses | Website OLA ATK (port 5173) — Order online via browser |

### Pak Budi — Walk-In Customer
| Atribut | |
|---------|-|
| Usia | 25-60 tahun |
| Profil | Guru / Tukang / Ibu-ibu / Pelajar |
| Perilaku | Lewat toko, mampir langsung: "Mbak fotokopi 50 lembar" |
| Device | HP biasa (mungkin kurang familiar web) |
| Akses | Langsung ke toko — dilayani admin via Kasir POS (port 5174) |

---

## 📋 5 REQUEST DOSEN

---

### R1 — VALIDASI NOMOR VIA WA OTP + RATE LIMIT

#### Masalah
- Nomor HP di form tidak divalidasi sama sekali
- Siapa pun bisa isi "123" atau "test" lalu order
- Admin kena spam order palsu

#### Solusi Final
OTP dikirim ke WA user di **setiap order** (guest) dan **setiap registrasi**.
+ Rate limit untuk blokir spam.

#### Flow OTP (Guest Order — Rina)

```
Step 1: Rina isi form (nama, WA, alamat, upload file, spek)
Step 2: Klik "Kirim OTP"
Step 3: POST /otp/request { nomor_telepon }
          ├── Cek rate limit per nomor: max 3x/jam
          ├── Cek rate limit per IP: max 5x/jam
          ├── Generate kode 6 digit random
          ├── Simpan ke tabel kode_otp { nomor, kode, expires_at: +5min }
          └── Kirim WA via API (Fonnte gratis):
              "Kode OTP Anda: 482910. Berlaku 5 menit."
Step 4: Rina buka WA di HP → liat kode
Step 5: Rina input 6 digit di form web:
          [_][_][_][_][_][_] [Verifikasi]
Step 6: POST /otp/verify { nomor_telepon, kode }
          ├── Kode cocok & belum expired? ✅ → Lanjut
          ├── Kode salah? ❌ → "Kode salah"
          └── Kode expired? ❌ → "Minta OTP baru"
Step 7: ✅ Terverifikasi → [Lanjutkan ke Pembayaran]
```

#### Flow OTP (Registrasi Akun — Rina)

```
Step 1: Rina isi: Nama, WA, Email, Alamat, Password
Step 2: Klik "Daftar" → Kirim OTP dulu (sama kaya di atas)
Step 3: √ kalo OTP valid → create Pelanggan + AkunPelanggan
Step 4: ✅ Akun terbuat → Redirect login
```

#### Darimana Rina tau kode OTP?
Dari **WA di HP-nya**. Dia baca kodenya, lalu input ke form web.
**BUKAN** Rina yang kirim OTP ke admin — admin yang kirim OTP ke Rina.

#### Kenapa pake rate limit juga?
- OTP doang tanpa rate limit → spammer bisa request OTP 1000x ke nomor real → user real kebanjiran OTP
- Rate limit 3x/jam per nomor + 5x/jam per IP = spammer gabisa apa-apa
- Kalo nomor real kena spam? Limit 3x/jam, besok bisa lagi

#### Siapa Kena Dampak?

| Siapa | Dampak |
|-------|--------|
| **Rina (Online - Guest)** | Wajib OTP sebelum bayar. Friction dikit (input 6 digit) tapi aman |
| **Rina (Online - Registered)** | Wajib OTP pas daftar. Begitu terdaftar, login pake email/pass tanpa OTP |
| **Pak Budi (Walk-In)** | ❌ Tidak kena dampak. Admin input langsung tanpa OTP |

#### Perubahan di Codebase

| File | Perubahan |
|------|-----------|
| `backend/src/prisma/schema/schema.prisma` | Tambah model `KodeOtp` |
| `backend/src/routes/otp/index.ts` | Route baru: `POST /otp/request`, `POST /otp/verify` |
| `backend/src/routes/otp/dto/otp.dto.ts` | DTO baru: RequestOtpDto, VerifyOtpDto |
| `backend/src/routes/akun-pelanggan/index.ts` | Integrasi OTP — cek verifikasi sebelum create akun |
| `backend/src/routes/payment/index.ts` | Integrasi OTP — cek verifikasi sebelum create token |
| `backend/src/seed.ts` | Seed data OTP ga perlu (transient) |
| `frontend/user/src/pages/Order.jsx` | Tambah step OTP antara form dan pembayaran |
| `frontend/user/src/pages/Auth.jsx` | Tambah step OTP antara form register dan submit |
| `frontend/user/src/services/api.js` | Tambah fungsi `otpAPI.request()`, `otpAPI.verify()` |

---

### R2 — CETAK BOLAK-BALIK (Dua Sisi)

#### Masalah
- Tidak ada opsi satu sisi / dua sisi
- Semua cetak dianggap satu sisi — padahal di fotokopian standar bolak-balik

#### Solusi
- Toggle di form: "Satu Sisi" / "Dua Sisi (Bolak-Balik)"
- Harga **sama** (Approach C — paling simpel), yang beda cuma nama item di BarangTerbeli
- Key konfigurasi baru opsional untuk Approach B nanti

#### Form — Yang Berubah

**Order.jsx (Rina):**
```
Mode Cetak:
  [●] Satu Sisi
  [○] Dua Sisi (Bolak-Balik)
```

**Pesanan.jsx (Admin Kasir — Pak Budi):**
```
Mode Cetak:
  [●] Satu Sisi
  [○] Dua Sisi (Bolak-Balik)
```

#### Contoh Nama Item di BarangTerbeli
```
Satu Sisi:  "Cetak A4 (Hitam Putih) × 10 × 1 rangkap"
Bolak-Balik: "Cetak A4 (Hitam Putih) Bolak-Balik × 10 × 1 rangkap"
```

#### Siapa Kena Dampak?

| Siapa | Dampak |
|-------|--------|
| **Rina (Online)** | Toggle baru di form order |
| **Pak Budi (Walk-In)** | Toggle baru di form Kasir |
| **Admin (Pengaturan)** | ❌ Tidak ada perubahan |

#### Perubahan di Codebase

| File | Perubahan |
|------|-----------|
| `frontend/user/src/pages/Order.jsx` | Tambah toggle satu/dua sisi di step spesifikasi |
| `frontend/admin/src/pages/Pesanan.jsx` | Tambah toggle satu/dua sisi di tab Kasir |
| `backend/src/routes/payment/index.ts` | Tambah `sisi_cetak` di spec + generate item name |
| `backend/src/routes/pesanan/index.ts` | Tambah `sisi_cetak` di public endpoint (optional) |

#### Prioritas: 🥇 1 (termudah, impact tinggi, standar fotokopian)

---

### R3 — DELIVERY / AMBIL DI TOKO

#### Masalah
- Alamat dikumpulin tapi ga jelas: buat antar atau jemput?
- Admin ga punya cara filter order yang perlu dikirim

#### Solusi
Field baru `metode_pengiriman` di tabel Pesanan: `"AMBIL"` | `"DIANTAR"`
+ Field `ongkir` (opsional, diisi admin manual)

#### Form Order (Online — Rina)

```
Identitas & Pengiriman:
  
  Metode Pengiriman:
    [🏪 Ambil di Toko]    [🚚 Diantar]
    
    ┌─ Kalo ambil: Alamat jadi HIDDEN / opsional (tidak wajib)
    └─ Kalo diantar: Alamat TETAP WAJIB (kaya sekarang)
```

#### Admin Dashboard (Pesanan.jsx)

```
Daftar Pesanan:
  
  Filter baru: [Semua] [🏪 Ambil] [🚚 Diantar]
  
  Tabel:
  ID │ Pelanggan │ Layanan │ Pengiriman │ Total │ Status │ Aksi
  #1 │ Rina      │ Cetak   │ 🚚 DIANTAR │ Rp 15k│ MENUNGGU │ Ubah
  #2 │ Pak Budi  │ Fotokopi│ 🏪 AMBIL   │ Rp 3k │ SELESAI  │ Ubah
```

**Alur Admin ngurus delivery:**

```
Admin buka → filter 🚚 DIANTAR
  ──> Liat order Rina
  ──> Chat WA: "Kak Rina, ini ongkir Rp 10.000 via GoSend ya"
  ──> Rina oke → Admin edit order:
        └── isi ongkir: 10000 → nilai_pesanan auto update
  ──> Ubah status → DIPROSES
  ──> Pesen GoSend
  ──> Barang sampe → status SELESAI
```

**Alur Riwayat (dilihat Rina):**

```
#123 — Cetak Dokumen
Status: ✅ SELESAI
Pengiriman: 🚚 DIANTAR
Alamat: Jl. Merdeka No. 10
Total: Rp 15.000 + Ongkir Rp 10.000 = Rp 25.000
```

#### Siapa Kena Dampak?

| Siapa | Dampak |
|-------|--------|
| **Rina (Online)** | Form bertambah: pilih ambil/antar. Kalo antar, alamat wajib |
| **Pak Budi (Walk-In)** | ❌ Tidak kena dampak. Tetap lewat Kasir (otomatis AMBIL) |
| **Admin** | Filter + badge baru di daftar pesanan. Bisa edit nilai ongkir |

#### Perubahan di Codebase

| File | Perubahan |
|------|-----------|
| `backend/src/prisma/schema/pesanan.prisma` | Tambah field `metode_pengiriman` + `ongkir` |
| `backend/src/routes/pesanan/dto/pesanan.dto.ts` | Tambah field di DTO |
| `backend/src/routes/pesanan/index.ts` | Update create/update handler |
| `backend/src/routes/payment/index.ts` | Kirim `metode_pengiriman` dari specs |
| `frontend/user/src/pages/Order.jsx` | Toggle ambil/antar + conditional alamat |
| `frontend/admin/src/pages/Pesanan.jsx` | Filter + badge + edit ongkir di modal |
| `frontend/user/src/pages/Riwayat.jsx` | Tampilkan metode_pengiriman + ongkir |
| `frontend/user/src/services/api.js` | ❌ Mungkin ga perlu, data udah include |

#### Prioritas: 🥇 2

---

### R4 — GRAMASI KERTAS

#### Masalah
- Harga cetak/fotokopi cuma dibedain per ukuran kertas (A4/F4) dan warna (BW/Color)
- Kertas 70gr vs 80gr beda harga di toko tapi sistem ga bedain

#### Solusi
Tambah key konfigurasi baru per gramasi + dropdown di form.

#### Key Konfigurasi Baru (di seed.ts & Pengaturan)

```
# CETAK
harga_cetak_a4_70gr_bw: 500
harga_cetak_a4_70gr_color: 1500
harga_cetak_a4_80gr_bw: 700
harga_cetak_a4_80gr_color: 2000
harga_cetak_f4_70gr_bw: 600
harga_cetak_f4_70gr_color: 2000
harga_cetak_f4_80gr_bw: 800
harga_cetak_f4_80gr_color: 2500

# FOTOKOPI
harga_fotokopi_a4_70gr: 300
harga_fotokopi_a4_80gr: 500
harga_fotokopi_f4_70gr: 500
harga_fotokopi_f4_80gr: 700
harga_fotokopi_a4_70gr_color: 2000
harga_fotokopi_a4_80gr_color: 2500
harga_fotokopi_f4_70gr_color: 2500
harga_fotokopi_f4_80gr_color: 3000
```

#### Form — Yang Berubah

**Order.jsx (Rina):**
```
Ukuran Kertas: [A4] [F4]
Gramasi:       [70gr] [80gr]
Mode Warna:    [Hitam Putih] [Berwarna] [Campur]
```

**Pesanan.jsx (Admin Kasir):**
```
Ukuran Kertas: [A4] [F4]
Gramasi:       [70gr] [80gr]
```

**Pengaturan.jsx (Admin Setting):**
```
Matriks Harga → Cetak → expand:
  Cetak A4 70gr Hitam Putih: [Rp 500]
  Cetak A4 80gr Hitam Putih: [Rp 700]
  Cetak A4 70gr Berwarna:    [Rp 1500]
  Cetak A4 80gr Berwarna:    [Rp 2000]
  ...
```

#### Formula Harga
```typescript
// KEY LOOKUP:
const key = `harga_cetak_${kertas}_${gramasi}_${colorMode}`;
// contoh: "harga_cetak_a4_70gr_bw"
// contoh: "harga_cetak_f4_80gr_color"

// BACKEND: priceMap[key] || fallback ke key lama (backward compatible)
const harga = priceMap[key] || priceMap[`harga_cetak_${kertas}_bw`] || 0;
```

#### Siapa Kena Dampak?

| Siapa | Dampak |
|-------|--------|
| **Rina (Online)** | Form tambah dropdown gramasi |
| **Pak Budi (Walk-In)** | Kasir tambah dropdown gramasi |
| **Admin (Pengaturan)** | Matriks harga tambah field 70gr & 80gr per layanan |
| **Admin (seed)** | Key konfigurasi baru — perlu update isi DB existing |

#### Perubahan di Codebase

| File | Perubahan |
|------|-----------|
| `backend/src/seed.ts` | Tambah key konfigurasi gramasi |
| `backend/src/routes/konfigurasi/index.ts` | ❌ Mungkin ga perlu (key baru auto kebaca) |
| `backend/src/routes/payment/index.ts` | Tambah gramasi di specs lookup |
| `frontend/user/src/pages/Order.jsx` | Tambah dropdown gramasi |
| `frontend/admin/src/pages/Pesanan.jsx` | Tambah dropdown gramasi di Kasir |
| `frontend/admin/src/pages/Pengaturan.jsx` | Tambah field gramasi di Matriks Harga |

#### Prioritas: 🟡 4

---

### R5 — AUTO-DETECT B&W / COLOR DARI FILE

#### Masalah
- Rina pilih "Hitam Putih" tapi file full color → harga kurang, admin tekor
- Manual pilih mode warna rawan human error

#### Solusi (Versi Ringan — Warning, Bukan Auto-Switch)
Pas upload PDF, scan tiap halaman: kalo terdeteksi warna → tampilkan warning.

#### Flow

```
Upload PDF → pdf.js render tiap halaman ke canvas
  → Scan pixel: cek apakah ada pixel non-grayscale
  → Hasil: { bwPages: 10, colorPages: 2 }
  
  Kalo colorPages > 0 TAPI user pilih "Hitam Putih":
    ┌─────────────────────────────────────────────┐
    │ ⚠️  File terdeteksi mengandung               │
    │    2 halaman BERWARNA.                        │
    │                                               │
    │ [Tetap Hitam Putih] [Ganti ke Campur]         │
    └─────────────────────────────────────────────┘
  
  Kalo user pilih "Campur" → auto-fill bwPages & colorPages
    ┌─────────────────────────────────────────────┐
    │ ✅ Terdeteksi: 10 HP, 2 warna               │
    │                                               │
    │ Jml Halaman Hitam Putih: [10]                 │
    │ Jml Halaman Berwarna:    [2]                  │
    └─────────────────────────────────────────────┘
```

#### Teknis — 2 Opsi

| Opsi | Cara Kerja | Pro | Kontra |
|------|-----------|-----|--------|
| **Frontend** (pdf.js + canvas) | Render halaman ke canvas, scan pixel color | Realtime, ga perlu server | Berat di browser, PDF banyak halaman bisa lemot |
| **Backend** (sharp/pdf-lib) | Scan pas upload file di `/upload/file` | Ringan di client | Butuh store hasil scan, kompleks |

**Rekomendasi:** Frontend dulu (warning doang, akurasi 80% cukup).

#### Siapa Kena Dampak?

| Siapa | Dampak |
|-------|--------|
| **Rina (Online)** | Warning kalo file color tapi pilih BW. Auto-fill kalo mode Campur |
| **Pak Budi (Walk-In)** | ❌ Tidak kena dampak (ga upload file di Kasir) |
| **Admin** | ❌ Tidak kena dampak (ga upload file) |

#### Perubahan di Codebase

| File | Perubahan |
|------|-----------|
| `frontend/user/src/pages/Order.jsx` | Tambah fungsi detectColor() + warning UI |
| `frontend/user/src/components/ColorDetectModal.jsx` | Komponen modal warning baru |

#### Prioritas: 🔴 5 (paling complex, effort tinggi)

---

## 📊 PRIORITAS FINAL (Berdasarkan Effort vs Impact)

| Rank | Fitur | Effort | Impact | Risiko |
|------|-------|--------|--------|--------|
| **1** | 🔄 **Bolak-Balik** | 🟢 1-2 jam | Tinggi | Rendah |
| **2** | 🚚 **Delivery Flag** | 🟢 2-3 jam | Sedang | Rendah |
| **3** | 📱 **WA OTP + Rate Limit** | 🟡 5-7 jam | Tinggi | Sedang (butuh WA API) |
| **4** | 📄 **Gramasi Kertas** | 🟡 3-4 jam | Sedang | Sedang (restruktur key) |
| **5** | 🎨 **Color Auto-Detect** | 🔴 8+ jam | Rendah | Tinggi (PDF parsing) |

**Rekomendasi Pengerjaan:**
1. Kerjakan bolak-balik dulu (1-2 jam)
2. Kerjakan delivery flag (2-3 jam) — biar dosen liat progress
3. OTP + rate limit (5-7 jam) — ini butuh setup WA API
4. Gramasi (3-4 jam)
5. Color detect (8+ jam) — kalo masih ada waktu

---

## 🗂️ DATABASE CHANGES

### Model Baru: KodeOtp
```prisma
model KodeOtp {
  id             Int      @id @default(autoincrement())
  nomor_telepon  String
  kode           String
  expires_at     DateTime
  used           Boolean  @default(false)
  created_at     DateTime @default(now())

  @@index([nomor_telepon, created_at])
  @@map("kode_otp")
}
```

### Field Baru di Pesanan
```prisma
model Pesanan {
  // ... existing fields
  
  metode_pengiriman  String   @default("AMBIL")
  ongkir             Float?
  
  // ... existing fields
}
```

---

## 🔌 WA API (Gratisan)

**Fonnte** (rekomendasi): https://fonnte.com
- Gratis 100 message/hari untuk testing
- Daftar → dapet API key
- Kirim OTP: `POST https://api.fonnte.com/send`
  ```json
  {
    "target": "081234567890",
    "message": "Kode OTP Anda: 482910. Berlaku 5 menit.",
    "countryCode": "62"
  }
  ```
- Header: `Authorization: {API_KEY}`

**Fallback:** Kalo Fonnte ga cocok, ada `whatsapp-web.js` (gratis, tapi rawan banned di server).

---

## 📐 ALUR ARSITEKTUR (Setelah Revisi)

```
┌──────────────────────────────────────────────────────────┐
│                     USER (Rina)                          │
│  [Order.jsx] ── OTP ── Bayar ── Riwayat                 │
│  [Auth.jsx]   ── OTP ── Register ── Login               │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│                   BACKEND (Express 5)                     │
│                                                           │
│  POST /otp/request     ─── generate + kirim OTP          │
│  POST /otp/verify      ─── cek kode + rate limit         │
│  POST /payment/create-token ─── cek OTP verified dulu    │
│  POST /akun-pelanggan  ─── cek OTP verified dulu         │
│  POST /pesanan/public  ─── create with delivery flag     │
│  PUT /pesanan/:id      ─── update ongkir                 │
│                                                           │
│  ┌────────────────────────────────────────┐              │
│  │  WA API (Fonnte) — kirim OTP ke user    │             │
│  └────────────────────────────────────────┘              │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│               ADMIN (Pak Budi — via Kasir)                │
│  [Pesanan.jsx] — Kasir — tanpa OTP                       │
│  [Pesanan.jsx] — Daftar — filter AMBIL/DIANTAR           │
│  [Pengaturan.jsx] — Edit harga gramasi                   │
└──────────────────────────────────────────────────────────┘
```

---

## 🔗 REFERENSI FILE YANG KENA UBAH (Complete)

| No | Fitur | File | Perubahan |
|----|-------|------|-----------|
| 1 | OTP | `backend/src/prisma/schema/schema.prisma` | Tambah model KodeOtp |
| 2 | OTP | `backend/src/routes/otp/index.ts` | NEW — POST /otp/request, /otp/verify |
| 3 | OTP | `backend/src/routes/otp/dto/otp.dto.ts` | NEW — RequestOtpDto, VerifyOtpDto |
| 4 | OTP | `backend/src/routes/akun-pelanggan/index.ts` | Integrasi OTP sebelum create |
| 5 | OTP | `backend/src/routes/payment/index.ts` | Integrasi OTP sebelum create token |
| 6 | OTP | `frontend/user/src/pages/Order.jsx` | Tambah step OTP di flow order |
| 7 | OTP | `frontend/user/src/pages/Auth.jsx` | Tambah step OTP di flow register |
| 8 | OTP | `frontend/user/src/services/api.js` | Tambah otpAPI |
| 9 | OTP | `backend/.env` | Tambah FONNTE_API_KEY |
| 10 | Bolak-Balik | `frontend/user/src/pages/Order.jsx` | Toggle satu/dua sisi |
| 11 | Bolak-Balik | `frontend/admin/src/pages/Pesanan.jsx` | Toggle satu/dua sisi |
| 12 | Bolak-Balik | `backend/src/routes/payment/index.ts` | Tambah sisi_cetak di item name |
| 13 | Delivery | `backend/src/prisma/schema/pesanan.prisma` | Tambah metode_pengiriman, ongkir |
| 14 | Delivery | `backend/src/routes/pesanan/dto/pesanan.dto.ts` | Tambah field DTO |
| 15 | Delivery | `backend/src/routes/pesanan/index.ts` | Tambah filter metode_pengiriman |
| 16 | Delivery | `backend/src/routes/payment/index.ts` | Kirim metode_pengiriman |
| 17 | Delivery | `frontend/user/src/pages/Order.jsx` | Toggle ambil/antar |
| 18 | Delivery | `frontend/admin/src/pages/Pesanan.jsx` | Filter + badge + ongkir edit |
| 19 | Delivery | `frontend/user/src/pages/Riwayat.jsx` | Tampilkan metode_pengiriman |
| 20 | Gramasi | `backend/src/seed.ts` | Tambah key konfigurasi 70gr/80gr |
| 21 | Gramasi | `backend/src/routes/payment/index.ts` | Tambah gramasi di lookup |
| 22 | Gramasi | `frontend/user/src/pages/Order.jsx` | Tambah dropdown gramasi |
| 23 | Gramasi | `frontend/admin/src/pages/Pesanan.jsx` | Tambah dropdown gramasi |
| 24 | Gramasi | `frontend/admin/src/pages/Pengaturan.jsx` | Tambah field gramasi di matriks harga |
| 25 | Color Detect | `frontend/user/src/pages/Order.jsx` | Tambah fungsi detectColor + warning |
| 26 | Color Detect | `frontend/user/src/components/ColorDetectModal.jsx` | NEW — modal warning |
| 27 | All | `backend/src/prisma/index.ts` | Generate prisma client baru |
