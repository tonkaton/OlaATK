# REVISI PROJEK OLA ATK — Final Breakdown

Berdasarkan diskusi dengan dosen dan implementasi aktual pada codebase.

---

## DUA PERSONA UTAMA

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

## 5 REQUEST DOSEN — Status Implementasi

---

### R1 — VALIDASI NOMOR VIA WA OTP + RATE LIMIT | **BLOCKED**

#### Status: ❌ Belum bisa dikerjakan
Menunggu Fonnte API key. **Backend route & tabel KodeOtp belum dibuat** — seluruh implementasi R1 tertunda.

---

### R2 — CETAK BOLAK-BALIK (Dua Sisi) | **SELESAI**

#### Masalah
- Tidak ada opsi satu sisi / dua sisi
- Semua cetak dianggap satu sisi

#### Solusi
- Toggle di form: "Satu Sisi" / "Dua Sisi (Bolak-Balik)"
- Harga **sama** (Approach C), yang beda cuma nama item di BarangTerbeli
- Field `sisi_cetak` disimpan di tabel Pesanan

#### Flow Price (Per-Page — Sheet Pricing Dibatalkan)
```
Bolak-Balik:
  - 1 lembar = 2 halaman (depan + belakang)
  - Harga tetap per halaman (bukan per lembar)
  - Contoh: Cetak BW 10 halaman bolak-balik = 10 × Rp 500 = Rp 5.000
  - Nama item: "Cetak A4 (Hitam Putih) Bolak-Balik × 10 × 1 rangkap"
```

#### File Berubah
- `backend/src/routes/payment/index.ts` — generate item name dengan prefix "Bolak-Balik"
- `frontend/user/src/pages/Order.jsx` — toggle satu/dua sisi
- `frontend/admin/src/pages/Pesanan.jsx` — toggle satu/dua sisi di Kasir

---

### R3 — DELIVERY / AMBIL DI TOKO | **SELESAI**

#### Field Baru di Pesanan
```
metode_pengiriman  String   @default("AMBIL")   // "AMBIL" | "DIANTAR"
ongkir             Float?
alamat_pengiriman  String?   // Alamat tujuan pengiriman (bisa beda dari alamat pelanggan)
```

#### Form Order (Online — Rina)
```
Alamat:
  [●] Alamat Saya (Jl. Merdeka No. 10)
  [○] Alamat Lain:
      [____________________]  ← input manual

Metode Pengiriman:
  [🏪 Ambil di Toko]  [🚚 Diantar]
```

#### Admin Dashboard
```
Filter tunggal (1 dropdown — 15 pilihan):
  [Semua ▼]
  🏪 Ambil di Toko
  🚚 Diantar
  🌐 Online
  🏭 Offline
  ⏳ Menunggu
  🔧 Diproses
  ✅ Selesai
  ❌ Batal
  💳 Payment: Pending
  💳 Payment: Lunas
  💳 Payment: Ditolak
  💳 Payment: Expire
  📦 Produk
  🖨️ Layanan
```

#### File Berubah
- `backend/src/prisma/schema/pesanan.prisma` — tambah `metode_pengiriman`, `ongkir`, `alamat_pengiriman`
- `backend/src/routes/pesanan/dto/pesanan.dto.ts` — DTO update
- `backend/src/routes/pesanan/index.ts` — filter `mode`, `pengiriman`, `payment_status`, `jenis`
- `backend/src/routes/payment/index.ts` — terima `metode_pengiriman`, `alamat_pengiriman`
- `frontend/user/src/pages/Order.jsx` — toggle ambil/antar, alamat radio (saya/lain)
- `frontend/admin/src/pages/Pesanan.jsx` — filter tunggal, kolom alamat, edit ongkir, badge pengiriman
- `frontend/admin/src/services/api.js` — `getAll()` pake object params
- `frontend/user/src/pages/Riwayat.jsx` — tampilkan metode_pengiriman + ongkir

#### Migrasi
- `20260715074706_add_metode_pengiriman_ongkir/`
- `20260715082039_add_alamat_pengiriman/`

---

### R4 — GRAMASI KERTAS | **SELESAI**

#### Key Konfigurasi Baru (8 cetak gramasi + 4 legacy fallback)
```
# CETAK A4 — gramasi
harga_cetak_a4_70gr_bw    harga_cetak_a4_80gr_bw
harga_cetak_a4_70gr_color  harga_cetak_a4_80gr_color

# CETAK F4 — gramasi
harga_cetak_f4_70gr_bw    harga_cetak_f4_80gr_bw
harga_cetak_f4_70gr_color  harga_cetak_f4_80gr_color

# CETAK — legacy (fallback tanpa gramasi)
harga_cetak_a4_bw    harga_cetak_a4_color
harga_cetak_f4_bw    harga_cetak_f4_color

# FOTOKOPI — TIDAK pakai gramasi (harga flat)
harga_fotokopi_a4    harga_fotokopi_a4_color
harga_fotokopi_f4    harga_fotokopi_f4_color
```

#### Formula Harga (Backward Compatible)
```typescript
// Cari key dengan gramasi dulu, fallback ke key tanpa gramasi
const key = `harga_cetak_${kertas}_${gramasi}_${mode}`;
const fallback = `harga_cetak_${kertas}_${mode}`;
const harga = priceMap[key] || priceMap[fallback] || 0;
```

#### File Berubah
- `backend/src/seed.ts` — 8 key cetak gramasi + 4 legacy fallback
- `backend/src/routes/payment/index.ts` — gramasi-aware lookup
- `frontend/user/src/pages/Order.jsx` — dropdown gramasi
- `frontend/admin/src/pages/Pesanan.jsx` — dropdown gramasi di Kasir

#### Migrasi
- `20260715075219_add_gramasi/`

---

### R5 — AUTO-DETECT B&W / COLOR DARI FILE | **SELESAI**

#### Flow
```
Upload PDF/DOCX
  → render tiap halaman ke canvas (pdf.js)
  → scan pixel: deteksi non-grayscale
  → hasil: { bwPages, colorPages }

Kalo user pilih "Hitam Putih" tapi file mengandung warna:
  ┌─────────────────────────────────────────────────────┐
  │ ⚠️  Terdeteksi Halaman Berwarna                     │
  │ File mengandung 2 dari 10 halaman berwarna.         │
  │ Anda memilih mode Hitam Putih.                      │
  │                                                     │
  │ [Tetap Hitam Putih] [Ganti ke Berwarna]             │
  │ [Gunakan Campur (8 BW / 2 Warna)]                   │
  └─────────────────────────────────────────────────────┘

Kalo user pilih "Campur":
  ┌─────────────────────────────────────────────────────┐
  │ ✅ Halaman Terdeteksi                                │
  │ 8 halaman BW & 2 halaman berwarna terisi otomatis.  │
  │                                                     │
  │ [Lanjutkan]                                         │
  └─────────────────────────────────────────────────────┘
```

#### DOCX — CloudConvert Integration
DOCX tidak bisa di-scan pixel di browser. Solusi: convert DOCX → PDF via **CloudConvert API** dulu, scan hasil PDF-nya.

```
User pilih DOCX
  → backend upload ke CloudConvert (import/upload)
  → convert DOCX → PDF (convert)
  → download PDF (export/url)
  → balikin PDF binary ke frontend
  → frontend detectColors() sama persis kayak PDF native
```

- **Endpoint:** `POST /upload/scan-docx`
- **Library:** `cloudconvert` npm package (v3 SDK)
- **Gratis:** 25 credits/hari (1 DOCX = ~2-5 credits). Cukup untuk toko ATK.
- **Sandbox:** Hanya untuk testing (file whitelisted). Produksi pake Live API.

#### Fix: Base64 Regex
MIME type DOCX mengandung titik (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`). Regex lama `^data:([A-Za-z-+\/]+);base64,` gagal match karena titik tidak termasuk set karakter. Diubah ke `^data:[^;]+;base64,` yang lebih robust.

#### File Berubah
- `frontend/user/src/components/ColorDetectModal.jsx` — NEW: 3 tipe modal (scanning, warning-bw, campur-filled)
- `frontend/user/src/pages/Order.jsx` — detectColors(), handle DOCX via CloudConvert, reset bwPages/colorPages pas ganti file
- `frontend/user/src/services/api.js` — tambah `uploadAPI.scanDocx()`
- `backend/src/routes/upload/index.ts` — endpoint `/upload/scan-docx`
- `backend/package.json` — tambah `cloudconvert`

---

## PAYMENT REFACTOR (Di Luar 5 Request — Tapi Penting)

### Arsitektur Baru

#### Sebelum
```
POST /payment/create-token:
  1. Hitung harga
  2. CREATE Pelanggan (ke DB)
  3. CREATE Pesanan (ke DB)
  4. CREATE BarangTerbeli (ke DB)
  5. Generate Midtrans token
  6. Return token
  → Kalo user tutup browser (gajadi bayar) → data sampah di DB
```

#### Sesudah
```
POST /payment/create-token (NO DB):
  1. Hitung harga
  2. Generate Midtrans token + order_id
  3. Return token
  → ZERO database writes

POST /payment/confirm (DB AFTER PAYMENT):
  1. Terima order_id + snap_token + data pesanan
  2. Cek order_id belum ada (anti double)
  3. Hitung ulang harga
  4. CREATE Pelanggan + Pesanan + BarangTerbeli
  5. Verifikasi status ke Midtrans API langsung:
     - settlement/capture → payment_status: 'settlement', status: 'DIPROSES'
     - 404 (belum bayar) → tetap pending
  6. Return pesanan_id

Webhook (BACKUP):
  - Notifikasi Midtrans tetap di-handle
  - Aman kalo user nutup browser sebelum redirect
```

### Race Condition Fix
- `confirmPayment` langsung cek `transaction.status(order_id)` ke Midtrans
- Gak perlu nunggu webhook buat update status
- Admin bisa override `payment_status` manual dari detail card

---

## DATABASE CHANGES

### 7 Model (+4 migration baru dari revisi)

| Model | Keterangan |
|-------|-----------|
| `Pelanggan` | Identitas customer |
| `AkunPelanggan` | Login credentials |
| `Pesanan` | + `sisi_cetak`, `gramasi`, `metode_pengiriman`, `ongkir`, `alamat_pengiriman`, `midtrans_order_id`, `payment_status`, `snap_token` |
| `BarangTerbeli` | Line items |
| `StokBarang` | Produk ATK |
| `DataLayanan` | Jasa layanan |
| `Konfigurasi` | Key-value store — +8 key gramasi cetak |

### Migration Timeline

```
20260715074126_add_sisi_cetak/           → R2 (Bolak-Balik)
20260715074706_add_metode_pengiriman_ongkir/ → R3 (Delivery)
20260715075219_add_gramasi/              → R4 (Gramasi)
20260715082039_add_alamat_pengiriman/    → R3 (Alamat)
```

---

## CLOUDCONVERT API

| Detail | |
|--------|-|
| Platform | [CloudConvert](https://cloudconvert.com) |
| Free tier | 25 credits/hari |
| SDK | `cloudconvert` npm package v3 |
| Endpoint | `POST /upload/scan-docx` (backend), lalu detectColors di frontend |
| Setup | API Key di `backend/.env` → `CLOUDCONVERT_API_KEY` |
| Sandbox | Hanya file whitelisted (MD5 hash). Untuk testing doang. |

---

## FILE ARCHITECTURE (Update)

### Backend
```
backend/src/routes/
  upload/index.ts          — [UBAH] +scan-docx endpoint (CloudConvert DOCX→PDF)
  payment/index.ts         — [UBAH] Refactor: createToken (no DB) + confirmPayment (DB after pay)
  pesanan/index.ts         — [UBAH] Filter mode/pengiriman/payment_status/jenis
  pesanan/dto/pesanan.dto.ts — [UBAH] +payment_status di UpdateStatusPesananDto
  akun-pelanggan/index.ts  — [BELUM] Integrasi OTP
  seed.ts                  — [UBAH] +8 key cetak gramasi + 4 legacy fallback
```

### Frontend User
```
frontend/user/src/
  pages/Order.jsx                     — R2+R3+R4+R5: toggle bolak-balik, ambil/antar, gramasi, color detect
  components/ColorDetectModal.jsx     — [BARU] 3 tipe modal (scanning, warning-bw, campur-filled)
  pages/Riwayat.jsx                   — [UBAH] +metode_pengiriman, ongkir
  services/api.js                     — [UBAH] +scanDocx()
```

### Frontend Admin
```
frontend/admin/src/
  pages/Pesanan.jsx       — [UBAH] Filter tunggal 15 pilihan, +kolom alamat, +edit payment_status
  services/api.js         — [UBAH] getAll() pake object params
```

---

## STATUS BUILD (Semua Lolos)

| Build | Status |
|-------|--------|
| `npx tsc --noEmit` (backend) | ✅ |
| `npm run build` (admin) | ✅ |
| `npm run build` (user) | ✅ |

---

## SISA YANG BELUM

1. **R1 (OTP):** Blocked — butuh Fonnte API key. Backend route + tabel KodeOtp **belum dibuat**.
2. **OCS (Online Cetak Sendiri):** Dokumentasi internal, gak kena revisi.
3. **Grafik admin:** Bonus, bukan request dosen.
