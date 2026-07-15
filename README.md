# OLA ATK — Aplikasi Manajemen Percetakan & ATK

Sistem manajemen percetakan dan ATK berbasis web dengan dua antarmuka: **User** (Rina — order online) dan **Admin** (Pak Budi — POS kasir).

---

## Fitur

| Fitur | Status | Keterangan |
|-------|--------|------------|
| Order online | ✅ | Upload file + spek cetak |
| Cetak Bolak-Balik | ✅ | Toggle satu/dua sisi |
| Delivery / Ambil | ✅ | Ongkir + alamat pengiriman |
| Gramasi Kertas | ✅ | 70gr / 80gr + 8 key gramasi cetak |
| Color Detect | ✅ | Scan pixel per-halaman, warning kalo BW tp file warna |
| DOCX Scan | ✅ | Convert DOCX→PDF via CloudConvert, scan warna per-page |
| Payment Midtrans | ✅ | createToken (no DB) + confirmPayment (DB after pay) |
| Filter Admin | ✅ | Single dropdown 15 pilihan |
| WA OTP | ❌ Blocked | Nunggu Fonnte API key |

---

## Arsitektur

```
backend/        — Express 5 REST API (port 8080) + Prisma (MySQL)
frontend/
  admin/        — Vite + React 18 (port 5174) — POS & Dashboard
  user/         — Vite + React 18 (port 5173) — Order Online
```

---

## Prasyarat

- [Node.js](https://nodejs.org/) v18+
- [Laragon](https://laragon.org/) (MySQL)
- [Midtrans Sandbox Account](https://dashboard.midtrans.com/)
- (Opsional) [CloudConvert Account](https://cloudconvert.com) — untuk DOCX scan

---

## Setup Pertama Kali

### 1. Clone & Masuk

```sh
git clone <repo-url>
cd OlaATK
```

### 2. Backend

```sh
cd backend
cp .env.example .env
```

Isi `.env`:

```env
PORT="8080"
DATABASE_HOST="127.0.0.1"
DATABASE_PORT="3306"
DATABASE_USER="root"
DATABASE_PASSWORD=""
DATABASE_NAME="ola_db"
DATABASE_URL="mysql://root:@127.0.0.1:3306/ola_db"
ADMIN_USERNAME="admin@email.com"
ADMIN_PASSWORD="password123"
JWT_SECRET="generate_dengan_perintah_di_bawah"
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxx"
MIDTRANS_IS_PRODUCTION="false"
CLOUDCONVERT_API_KEY="api_key_dari_cloudconvert"
```

Generate `JWT_SECRET`:

```sh
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Install & setup database:

```sh
npm install
npx prisma generate
```

### 3. Frontend

```sh
cd ../frontend
cp .env.example .env
```

Isi `.env`:

```env
VITE_API_URL=http://127.0.0.1:8080
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx
```

Install dependencies:

```sh
npm install
```

---

## Setup Database

Pastikan Laragon berjalan dan MySQL aktif.

**Fresh setup:**

```sh
cd backend
npm run db:reset
npm run seed
```

**Update skema (jika sudah pernah setup):**

```sh
cd backend
npx prisma migrate dev
npx prisma generate
```

---

## Menjalankan Project

### Backend

```sh
cd backend
npm run start:dev
```

`http://127.0.0.1:8080`

### Frontend

```sh
cd frontend
npm run dev:all        # Admin + User barengan
npm run dev:user       # http://localhost:5173
npm run dev:admin      # http://localhost:5173/admin
```

---

## Database Migrations

```
20260715074126_add_sisi_cetak/              → R2 (Bolak-Balik)
20260715074706_add_metode_pengiriman_ongkir/ → R3 (Delivery)
20260715075219_add_gramasi/                 → R4 (Gramasi)
20260715082039_add_alamat_pengiriman/       → R3 (Alamat Pengiriman)
```

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/payment/create-token` | Generate Midtrans token — NO DB writes |
| POST | `/payment/confirm` | Create records after payment + verify Midtrans |
| POST | `/payment/notification` | Webhook Midtrans |
| POST | `/pesanan/public` | Create pesanan (guest) |
| PUT | `/pesanan/:id` | Update ongkir/pengiriman/alamat |
| PUT | `/pesanan/:id/status` | Update status + payment_status |
| GET | `/pesanan` | Filter: mode, pengiriman, payment_status, jenis, status, search |
| POST | `/upload/file` | Upload file (base64) |
| POST | `/upload/scan-docx` | **[BARU]** DOCX → CloudConvert → PDF → scan warna |

---

## Testing Pembayaran (Midtrans Sandbox)

### Setup ngrok

```sh
winget install Ngrok.Ngrok
ngrok config add-authtoken <token>
ngrok http 8080
```

Set URL notifikasi di **Midtrans Dashboard → Settings → Configuration**:

```
https://xxxx.ngrok-free.dev/payment/notification
```

### Kartu Test

| Field | Value |
|-------|-------|
| Nomor kartu | `4811 1111 1111 1114` |
| Expiry | `01/28` |
| CVV | `123` |
| OTP | `112233` |

---

## Kredensial

| Role | Keterangan |
|------|-----------|
| Admin | sesuai `.env` `ADMIN_USERNAME` / `ADMIN_PASSWORD` |
| User | Daftar via halaman `/auth` |
