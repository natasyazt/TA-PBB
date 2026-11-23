# 🍬 GulaMate RESTful API Backend
**Modul 1: Application Programming Interface (API) — Praktikum Pemrograman Bergerak**
**Pengembang:** Natasya Zahirah

Backend API ini dibangun sesuai dengan pedoman dan arsitektur **Modul 1 Praktikum Pemrograman Bergerak**, menggunakan **Node.js, Express.js, dan Supabase Database** dengan pola arsitektur **Model-Controller-Router (MVC)**.

---

## 🏗️ Struktur Arsitektur (Sesuai Modul 1)

```
backend/
├── package.json               # Konfigurasi dependensi (express, @supabase/supabase-js, dotenv)
├── vercel.json                # Konfigurasi deployment serverless Vercel
├── .env.example               # Template environment variables
├── src/
│   ├── config/
│   │   └── supabaseClient.js  # Inisialisasi klien Supabase
│   ├── models/                # Akses data & query ke database Supabase
│   │   ├── categoryModel.js
│   │   ├── foodModel.js
│   │   └── logModel.js
│   ├── controllers/           # Logika pemrosesan request & response HTTP
│   │   ├── categoryController.js
│   │   ├── foodController.js
│   │   └── logController.js
│   ├── routes/                # Pemetaan URL endpoint ke Controller
│   │   ├── categoryRoutes.js
│   │   ├── foodRoutes.js
│   │   └── logRoutes.js
│   └── index.js               # Entry point Express Server
```

---

## 🚀 Daftar Endpoints API

### 1. Kategori Makanan (`/api/categories`)
- `GET /api/categories` : Mengambil seluruh daftar kategori.
- `GET /api/categories/:id` : Mengambil data satu kategori berdasarkan ID.
- `POST /api/categories` : Menambahkan kategori baru.
- `PUT /api/categories/:id` : Memperbarui data kategori.
- `DELETE /api/categories/:id` : Menghapus kategori.

### 2. Katalog Pangan & Nilai Gizi (`/api/foods`)
- `GET /api/foods` : Mengambil seluruh katalog makanan beserta gram gula, kalori, indeks glikemik, dan tips kesehatan.
- `GET /api/foods/:id` : Mengambil detail makanan berdasarkan ID.
- `POST /api/foods` : Menambahkan item pangan baru.
- `PUT /api/foods/:id` : Mengubah data item pangan.
- `DELETE /api/foods/:id` : Menghapus item pangan.

### 3. Log Riwayat Asupan (`/api/logs`)
- `GET /api/logs?userId=...&date=...` : Mengambil log asupan harian pengguna.
- `GET /api/logs/:id` : Mengambil detail satu log catatan asupan.
- `POST /api/logs` : Menyimpan catatan asupan gula baru.
- `PUT /api/logs/:id` : Mengubah catatan asupan.
- `DELETE /api/logs/:id` : Menghapus catatan asupan.

---

## 🛠️ Cara Menjalankan Secara Lokal
```bash
cd backend
npm install
npm run dev
```
Server akan aktif di `http://localhost:3000`.
