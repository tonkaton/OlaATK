```markdown
## Project Structure
```text
.
|-- backend
|   |-- src
|   |   |-- auth
|   |   |   |-- index.ts
|   |   |-- prisma
|   |   |   |-- migrations
|   |   |   |   |-- 0_initialize
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20260128050732_update_pesanan
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20260416000000_phase2_data_integrity
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- 20260416092600_add_midtrans_fields
|   |   |   |   |   |-- migration.sql
|   |   |   |   |-- migration_lock.toml
|   |   |   |-- schema
|   |   |   |   |-- akun_pelanggan.prisma
|   |   |   |   |-- barang_terbeli.prisma
|   |   |   |   |-- data_layanan.prisma
|   |   |   |   |-- konfigurasi.prisma
|   |   |   |   |-- pelanggan.prisma
|   |   |   |   |-- pesanan.prisma
|   |   |   |   |-- schema.prisma
|   |   |   |   |-- stok_barang.prisma
|   |   |   |-- index.ts
|   |   |-- routes
|   |   |   |-- akun-pelanggan
|   |   |   |   |-- dto
|   |   |   |   |   |-- akun-pelanggan.dto.ts
|   |   |   |   |-- index.ts
|   |   |   |-- auth
|   |   |   |   |-- dto
|   |   |   |   |   |-- login.dto.ts
|   |   |   |   |-- index.ts
|   |   |   |-- barang-terbeli
|   |   |   |   |-- dto
|   |   |   |   |   |-- barang-terbeli.dto.ts
|   |   |   |   |-- index.ts
|   |   |   |-- data-layanan
|   |   |   |   |-- dto
|   |   |   |   |   |-- data-layanan.dto.ts
|   |   |   |   |-- index.ts
|   |   |   |-- konfigurasi
|   |   |   |   |-- index.ts
|   |   |   |-- payment
|   |   |   |   |-- index.ts
|   |   |   |-- pelanggan
|   |   |   |   |-- dto
|   |   |   |   |   |-- pelanggan.dto.ts
|   |   |   |   |-- index.ts
|   |   |   |-- pesanan
|   |   |   |   |-- dto
|   |   |   |   |   |-- pesanan.dto.ts
|   |   |   |   |-- index.ts
|   |   |   |-- stats
|   |   |   |   |-- index.ts
|   |   |   |-- stok-barang
|   |   |   |   |-- dto
|   |   |   |   |   |-- stok-barang.dto.ts
|   |   |   |   |-- index.ts
|   |   |   |-- upload
|   |   |   |   |-- index.ts
|   |   |   |-- index.ts
|   |   |   |-- README.md
|   |   |   |-- root.ts
|   |   |-- types
|   |   |   |-- express.d.ts
|   |   |   |-- index.ts
|   |   |-- utils
|   |   |   |-- prisma.ts
|   |   |   |-- validation.ts
|   |   |-- app.ts
|   |   |-- index.ts
|   |   |-- seed.ts
|   |-- uploads/
|   |-- .dockerignore
|   |-- .env.example
|   |-- Dockerfile
|   |-- nodemon.json
|   |-- package.json
|   |-- prisma.config.ts
|   |-- README.md
|   |-- tsconfig.json
|-- frontend
|   |-- admin
|   |   |-- src
|   |   |   |-- components
|   |   |   |   |-- GlassTable.jsx
|   |   |   |   |-- Modal.jsx
|   |   |   |   |-- Pagination.jsx
|   |   |   |   |-- Section.jsx
|   |   |   |   |-- Sidebar.jsx
|   |   |   |   |-- StatCard.jsx
|   |   |   |   |-- Topbar.jsx
|   |   |   |-- config
|   |   |   |   |-- constants.js
|   |   |   |-- examples
|   |   |   |   |-- api-integration-examples.jsx
|   |   |   |   |-- ProdukWithAPI.example.jsx
|   |   |   |-- hooks
|   |   |   |   |-- useAuth.js
|   |   |   |   |-- useForm.js
|   |   |   |   |-- usePagination.js
|   |   |   |   |-- useTheme.js
|   |   |   |-- pages
|   |   |   |   |-- AdminDashboard.jsx
|   |   |   |   |-- AdminLogin.jsx
|   |   |   |   |-- AkunPelanggan.jsx
|   |   |   |   |-- Dashboard.jsx
|   |   |   |   |-- Layanan.jsx
|   |   |   |   |-- Pengaturan.jsx
|   |   |   |   |-- Pengguna.jsx
|   |   |   |   |-- Pesanan.jsx
|   |   |   |   |-- Produk.jsx
|   |   |   |-- services
|   |   |   |   |-- api.js
|   |   |   |-- App.jsx
|   |   |   |-- index.css
|   |   |   |-- main.jsx
|   |   |-- .dockerignore
|   |   |-- API_REFERENCE.md
|   |   |-- index.html
|   |   |-- package.json
|   |   |-- postcss.config.cjs
|   |   |-- tailwind.config.cjs
|   |   |-- TESTING_GUIDE.md
|   |   |-- vite.config.mjs
|   |-- user
|   |   |-- src
|   |   |   |-- components
|   |   |   |   |-- Button.jsx
|   |   |   |   |-- Card.jsx
|   |   |   |   |-- Input.jsx
|   |   |   |   |-- Navbar.jsx
|   |   |   |   |-- Select.jsx
|   |   |   |   |-- ServiceCard.jsx
|   |   |   |   |-- Textarea.jsx
|   |   |   |-- config
|   |   |   |   |-- constants.js
|   |   |   |-- contexts
|   |   |   |   |-- AuthContext.jsx
|   |   |   |   |-- ConfigContext.jsx
|   |   |   |-- hooks
|   |   |   |   |-- useAuth.js
|   |   |   |   |-- useForm.js
|   |   |   |-- pages
|   |   |   |   |-- Auth.jsx
|   |   |   |   |-- FloatingHistory.jsx
|   |   |   |   |-- Kontak.jsx
|   |   |   |   |-- LandingPage.jsx
|   |   |   |   |-- Order.jsx
|   |   |   |   |-- Riwayat.jsx
|   |   |   |   |-- Services.jsx
|   |   |   |-- services
|   |   |   |   |-- api.js
|   |   |   |-- App.jsx
|   |   |   |-- index.css
|   |   |   |-- main.jsx
|   |   |-- .dockerignore
|   |   |-- index.html
|   |   |-- package.json
|   |   |-- postcss.config.cjs
|   |   |-- README.md
|   |   |-- tailwind.config.cjs
|   |   |-- vite.config.mjs
|   |-- .env.example
|   |-- package.json
|-- README.md
```

## Prasyarat

Pastikan sudah terinstall:
- [Node.js](https://nodejs.org/) v18+
- [Laragon](https://laragon.org/) (untuk MySQL)

---

## Setup Pertama Kali

### 1. Clone Repository

```sh
git clone <repo-url>
cd OlaATK
```

### 2. Setup Backend

```sh
cd backend
```

Copy file konfigurasi:

```sh
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
ADMIN_USERNAME="isi_email_admin"
ADMIN_PASSWORD="isi_password_admin"
JWT_SECRET="generate_dengan_perintah_di_bawah"
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxx"
MIDTRANS_IS_PRODUCTION="false"
```

Generate `JWT_SECRET`:

```sh
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy output perintah tersebut dan paste sebagai nilai `JWT_SECRET` di `.env`.

Install dependencies dan generate Prisma client:

```sh
npm install
npx prisma generate
```

### 3. Setup Frontend

```sh
cd ../frontend
```

Copy file konfigurasi:

```sh
cp .env.example .env
```

Isi `.env`:

```env
VITE_API_URL=http://127.0.0.1:8080
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx
```

Install dependencies (sekali untuk semua app):

```sh
npm install
```

---

## Setup Database

Pastikan **Laragon sudah berjalan** dan MySQL aktif.

**Jika database BELUM ADA / mau reset bersih (fresh setup):**

```sh
cd backend
npm run db:reset
npm run seed
```

**Jika database SUDAH ADA dan mau ikut skema terbaru:**

> ⚠️ Lakukan ini jika sudah pernah setup sebelumnya dan ada perubahan skema baru.

```sh
cd backend
npx prisma migrate dev
npx prisma generate
```

---

## Menjalankan Project

### Jalankan Backend

```sh
cd backend
npm run start:dev
```

Backend berjalan di: `http://127.0.0.1:8080`

### Jalankan Frontend

```sh
cd frontend
npm run dev:all
```

Atau jalankan terpisah:

```sh
npm run dev:user   # http://localhost:5173
npm run dev:admin  # http://localhost:5173/admin
```

---

## Kredensial Default

| Role | Username/Email | Password |
| :--- | :--- | :--- |
| Admin | sesuai `.env` `ADMIN_USERNAME` | sesuai `.env` `ADMIN_PASSWORD` |
| User | daftar via halaman `/auth` | — |

---

## Testing Pembayaran (Sandbox)

Untuk testing integrasi Midtrans di local, backend perlu diexpose ke internet menggunakan ngrok.

### Setup ngrok

Install ngrok:

```sh
winget install Ngrok.Ngrok
```

Daftar di https://ngrok.com, lalu setup authtoken:

```sh
ngrok config add-authtoken <token_dari_dashboard_ngrok>
```

Jalankan ngrok di terminal terpisah (pastikan backend sudah jalan):

```sh
ngrok http 8080
```

Copy URL yang muncul (contoh: `https://xxxx.ngrok-free.dev`), lalu set di Midtrans Sandbox Dashboard:

**Settings → Configuration → URL notifikasi pembayaran:**

```
https://xxxx.ngrok-free.dev/payment/notification
```

> ⚠️ URL ngrok berubah setiap kali ngrok di-restart. Update URL notifikasi di Midtrans dashboard setiap kali ngrok dijalankan ulang.

### Kartu Test Sandbox

| Field | Value |
| :--- | :--- |
| Nomor kartu | 4811 1111 1111 1114 |
| Expiry | 01/25 |
| CVV | 123 |
| OTP | 112233 |
```