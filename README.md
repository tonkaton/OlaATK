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
|   |-- uploads
|   |   |-- 1773924836155-9qffdqbsukp.pdf
|   |   |-- 1773932718950-85jmrhwn3dk.pdf
|   |-- .dockerignore
|   |-- .env
|   |-- .env.example
|   |-- Dockerfile
|   |-- nodemon.json
|   |-- package-lock.json
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
|   |   |-- package-lock.json
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
|   |   |   |   |-- AdminDashboard.jsx
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
|   |   |-- package-lock.json
|   |   |-- postcss.config.cjs
|   |   |-- README.md
|   |   |-- tailwind.config.cjs
|   |   |-- vite.config.mjs
|   |-- .env
|   |-- .env.example
|   |-- package-lock.json
|   |-- package.json
|-- README.md
```

## Nyalakan project manual

Sebelum memulai, pastikan MySQL sudah berjalan !

### Run Backend

1. Siapkan konfigurasi backend di `backend/.env`, contoh bisa dicopy dari `backend/.env.example`

2. Masuk ke folder backend
```sh
cd backend
```

3. Install dependencies
```sh
npm install
```

4. Generate struktur prisma
```sh
npx prisma generate
```

5. (Pertama kali saja) Reset database agar tidak ada data tersisa
```sh
npm run db:reset
```

6. (Pertama kali saja) Seed database dengan data default
```sh
npm run seed
```

7. Start backend server
```sh
npm run start:dev
```

### Run Frontend

1. Masuk ke folder frontend
```sh
cd frontend/
```

2. Siapkan konfigurasi frontend di `frontend/.env`, contoh bisa dicopy dari `frontend/.env.example`

3. Install dependencies (sekali untuk semua app)
```sh
npm install
```

4. Jalankan semua frontend sekaligus
```sh
npm run dev:all
```

Atau jalankan secara terpisah:
```sh
npm run dev:user   # user app → http://localhost:5173
npm run dev:admin  # admin app → http://localhost:5173/admin
```
```