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

### Run frontend user

1. Masuk ke folder frontend
    ```sh
    cd frontend/
    ```

2. Siapkan konfigurasi frontend di `frontend/.env`, contoh bisa dicopy dari `frontend/.example.env`

3. Masuk ke folder user
    ```sh
    cd user/
    ```

4. Install dependencies
    ```sh
    npm install
    ```

5. Start frontend server
    ```sh
    npx dotenv -e ../.env -- npm run dev
    ```

### Run frontend admin

1. Masuk ke folder frontend
    ```sh
    cd frontend/
    ```

2. Siapkan konfigurasi frontend di `frontend/.env`, contoh bisa dicopy dari `frontend/.example.env`

3. Masuk ke folder admin
    ```sh
    cd admin/
    ```

4. Install dependencies
    ```sh
    npm install
    ```

5. Start frontend server
    ```sh
    npx dotenv -e ../.env -- npm run dev
    ```
