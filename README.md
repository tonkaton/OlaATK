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

2. Siapkan konfigurasi frontend di `frontend/.env`, contoh bisa dicopy dari `frontend/.example.env`

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