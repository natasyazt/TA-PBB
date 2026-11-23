# 🍬 GulaMate (Monitoring Asupan Gula Harian untuk Mencegah Diabetes)

**GulaMate** adalah aplikasi mobile berbasis React Native (Expo) yang dirancang untuk membantu pengguna memantau asupan gula harian dengan pendekatan visual yang terinspirasi dari estetika modern aplikasi **Flo**: **sangat imut, pastel elegan, clean, playful, dan ramah pengguna**. Seluruh teks di dalam aplikasi menggunakan **Bahasa Indonesia**.

Aplikasi ini ditujukan sebagai solusi preventif dini diabetes melitus dengan menghitung batas konsumsi gula harian yang dipersonalisasi berdasarkan riwayat keluarga, indeks massa tubuh (BMI), kebiasaan konsumsi manis, program diet, dan frekuensi olahraga.

---

## 📋 Pemenuhan Ketentuan Tugas Akhir (TA PBB)

| No | Ketentuan Praktikum | Status | Implementasi pada GulaMate |
|:---:|---|:---:|---|
| **1** | **Menggunakan API (Web Service) yang dibuat sendiri sesuai dengan Modul 1** | ✅ **TERPENUHI** | Terdapat backend RESTful API berbasis **Node.js, Express.js, dan Supabase** di folder `backend/` dengan arsitektur **Model-Controller-Router (MVC)** sesuai modul 1 (`/api/categories`, `/api/foods`, `/api/logs`). |
| **2** | **Memiliki Bottom Navigation Bar** | ✅ **TERPENUHI** | Memiliki Bottom Navigation Bar custom 5 slot (Hari Ini, Riwayat, Tombol (+) Tambah Asupan, Kalender, Profil) dengan transisi animasi halus antar tab. |
| **3** | **Memiliki minimal 5 halaman** | ✅ **TERPENUHI** | Memiliki **6 halaman utama**: <br>1. `AuthScreen` (Login & Registrasi)<br>2. `OnboardingScreen` (Kuesioner Profil Kesehatan 4-Step)<br>3. `HomeScreen` (Dashboard Utama & Ringkasan Harian)<br>4. `StatsScreen` (Riwayat & Bar Chart 7 Hari)<br>5. `CalendarScreen` (Kalender Asupan Interaktif)<br>6. `ProfileScreen` (Profil Pengguna & About Aplikasi) |
| **4** | **Minimal terdapat 2 halaman utama yang memiliki list dan setiap item pada list dapat diklik untuk menampilkan halaman detail** | ✅ **TERPENUHI** | **Halaman 1 (HomeScreen / CalendarScreen):** Menampilkan list asupan hari ini, ketika diklik akan membuka **FoodDetailModal** (menampilkan gram gula, visualisasi sendok teh 🥄, persentase batas harian, kalori, dan tips olahraga pembakaran).<br>**Halaman 2 (StatsScreen):** Menampilkan list Katalog Gizi Pangan Populer, ketika diklik akan membuka **KatalogFoodDetailModal** (menampilkan takaran saji, gram gula, beban glikemik, kalori, dan tips konsumsi bijak). |
| **5** | **Memiliki 1 halaman Profile/About aplikasi** | ✅ **TERPENUHI** | Halaman `ProfileScreen` memiliki kartu identitas **"Tentang Aplikasi / About GulaMate"** yang memuat versi (v1.0.0), nama pengembang (Natasya Zahra), info mata kuliah Praktikum PBB, arsitektur API Modul 1, dan database Supabase. |
| **6** | **Praktikan wajib mengunggah source code Tugas Akhir ke platform GitHub** | ✅ **TERPENUHI** | Seluruh source code tersinkronisasi di GitHub: `https://github.com/natasyazt/TA-PBB` (branch `main`). |
| **7** | **Judul Tugas Akhir tidak boleh sama dengan praktikan lain** | ✅ **TERPENUHI** | Judul unik: *"GulaMate: Monitoring Asupan Gula Harian untuk Mencegah Diabetes"*. |

---

## 🎨 1. Tampilan & Desain Terinspirasi Aplikasi Flo
- **Tipografi Halus & Membulat (*Rounded*):** Menggunakan keluarga font **Nunito** yang lembut, bersih, dan modern.
- **Palet Warna Pastel:**
  - Background Utama: Cream & Off-White lembut (`#FCFBF7` & `#F8F4EC`)
  - Aksen Flo Signature: Soft Rose Coral (`#FF758F` / `#E05370`), Sage Mint (`#70D6B2`), dan Pastel Peach (`#FFB38A`).
  - Status Gula Harian:
    - 🟡 **"Tidak Cukup Gula" (< 10g):** Pastel Yellow (`#FFFBEA`)
    - 🟢 **"Gula Cukup" (10g s/d Batas Maksimal):** Mint Green (`#EBFBF5` / `#70D6B2`)
    - 🔴 **"Gula Berlebih" (> Batas Maksimal):** Pastel Soft Coral (`#FFF0F0` / `#FFAAA5`)
- **Tanpa Emoji Basic — Ikon Vektor Grafis Elegan:**
  - Navigation bar menggunakan graphic vector icons (`Ionicons`) dengan *pill highlight capsule* khas Flo.
  - Streaks menggunakan ikon api menyala grafis (vector flame glow).
  - Kategori makanan & tindakan menggunakan ikon grafis berkualitas tinggi (`MaterialCommunityIcons` & `Ionicons`).
- **Maskot Hidup yang Bergerak (*Living Animated Mascot*):**
  - Mengambang naik-turun secara halus dan berkesinambungan (*continuous gentle floating/breathing animation*).
  - Mata berkedip secara alami secara berkala.
  - Reaktif dan membal (*spring bounce*) saat disentuh/ditekan.
  - Ekspresi wajah berubah dinamis sesuai status gula:
    - *Kurang Gula:* Mata mengantuk layu, menguap, balon Zzz mengambang.
    - *Gula Cukup:* Mata anime berbinar, senyum manis berenergi, pipi merona, taburan bintang bersinar.
    - *Gula Berlebih:* Mata spiral pusing, mulut kaget O, tetesan keringat dingin biru di dahi.

---

## 🚀 2. Fitur-Fitur Utama

### A. Autentikasi Pengguna (Masuk & Daftar Akun)
- Pilihan tab **Masuk** (*Log In*) dan **Daftar Akun** (*Sign Up*).
- Terintegrasi dengan **Supabase Auth** (`auth.users`) dan penyimpanan lokal session.
- Dilengkapi tombol cepat **"Mode Tamu / Demo TA"** untuk kemudahan demonstrasi tanpa harus registrasi ulang.

### B. Kuesioner Kesehatan Komprehensif (Flo-Style 7 Langkah)
Dijalankan saat mendaftar akun atau dapat diedit ulang kapan saja:
1. **Identitas & Demografi:** Nama panggilan, Usia, dan Jenis Kelamin dengan kartu ilustrasi grafis.
2. **Antropometri & Kalkulator BMI Otomatis:** Input Tinggi Badan (cm) & Berat Badan (kg) dengan kalkulasi real-time nilai BMI serta status gizi (Normal, Overweight, Obesitas).
3. **Riwayat Kesehatan & Genetik:** Riwayat keluarga diabetes melitus (Orang Tua / Saudara) & riwayat gula darah tinggi pribadi.
4. **Kebiasaan Minuman Manis:** Frekuensi konsumsi minuman kekinian (Boba, kopi susu aren, soda: Setiap Hari / 3-4x Seminggu / Jarang).
5. **Aktivitas Fisik & Diet:** Tingkat aktivitas olahraga mingguan & status diet defisit kalori/gula.
6. **Target Kesehatan Pribadi (*Health Goals*):** Mencegah diabetes, mengontrol berat badan, menjaga energi stabil, dan mengurangi kecanduan rasa manis.
7. **Hasil Analisis & Personalisasi Batas Gula:** Ringkasan klinis personal, kategori risiko, dan batas konsumsi harian aman.

**Logika Perhitungan Batas Gula Harian:**
- Batas dasar: **50 gram/hari** (Standar Kemenkes RI & WHO).
- Punya keturunan diabetes = Ya $\rightarrow$ **kurangi 15 gram**.
- Sedang diet = Ya $\rightarrow$ **kurangi 10 gram**.
- Rajin olahraga = Sangat Rajin $\rightarrow$ **tambah toleransi 5 gram**.
- Batas minimal aman tidak kurang dari **25 gram/hari**.

---

### C. Home Dashboard
- Header sapaan hangat (*"Halo, [Nama]!"*), tanggal aktif, dan badge Streaks api menyala 🔥.
- Kartu Status Utama dengan maskot bergerak, balon saran, progress bar gram vs batas aman, serta mini badges status.
- Log Makanan Hari Ini dengan ikon vektor per kategori dan konfirmasi hapus.
- Floating Action Button (+) bergaya Flo.

---

### D. Input Makanan & Minuman
- **Tab 1: Katalog Populer Indonesia (22+ Item):**
  - Es Teh Manis (20g), Kopi Susu Gula Aren (25g), Boba Brown Sugar (38g), Teh Tarik (22g), Soda Kaleng (39g), Es Cendol (30g), Jus Alpukat (24g), Yoghurt Buah (15g), Air Mineral (0g), Donat Cokelat (16g), Martabak Manis (19g), Roti Manis (15g), Cokelat Batang (24g), Kue Cubit (17g), Klepon (14g), Kolak Pisang (26g), Nasi Putih (0.5g), Pisang Cavendish (12g), Apel Fuji (10g), dll.
  - Pencarian instan dan pemilih porsi (0.5x, 1x, 1.5x, 2x).
- **Tab 2: Input Manual:** Form input nama makanan, gram gula (dengan chip jalan pintas: +5g, +10g, +15g, +20g, +25g), kategori, dan catatan.

---

### E. Kalender Interaktif & Log Harian
- Kalender bulanan interaktif dengan navigasi bulan.
- Titik indikator status berwarna:
  - 🟢 Hijau: Gula Cukup
  - 🟡 Kuning: Tidak Cukup Gula
  - 🔴 Coral: Gula Berlebih
  - ⚪ Abu-abu: Belum ada data
- Mengetuk tanggal manapun akan memuat ringkasan dan daftar log makanan spesifik pada hari tersebut.

---

### F. Riwayat & Grafik Batang 7 Hari (Bar Chart)
- Visualisasi batang asupan gula 7 hari terakhir berwarna pastel dengan garis batas aman (*dashed line*).
- Rata-rata asupan gula per hari dan panduan edukasi Kemenkes RI.

---

### G. Mode Simulasi Demo (Tugas Akhir)
Disediakan di tab **Profil**:
- **Kontrol Tanggal Simulasi:** Tombol `Mundur 1 Hari`, `Maju 1 Hari`, dan `Reset ke Tanggal Hari Ini` untuk mendemokan streaks dan kalender lintas hari.
- **✨ Isi Data Simulasi 7 Hari:** Sekali klik untuk memasukkan data log makanan realistis 7 hari terakhir agar grafik dan kalender langsung penuh warna saat presentasi.
- **🗑️ Reset Seluruh Data & Keluar Akun**.

---

### H. Backend Supabase & Vercel Ready
- **Supabase Cloud Sync:** Skema tabel SQL siap pakai di [supabase_schema.sql](file:///c:/Users/Yoga/OneDrive/TA%20PBB/supabase_schema.sql) untuk tabel `profiles` dan `sugar_logs`.
- **Deploy ke Vercel:** File konfigurasi [vercel.json](file:///c:/Users/Yoga/OneDrive/TA%20PBB/vercel.json) dan perintah `npm run build` (`expo export -p web`) sudah siap pakai.

---

## 💻 3. Cara Menjalankan & Membuka Aplikasi

1. **Jalankan Aplikasi:**
   ```bash
   npx expo start
   ```
2. **Buka di Perangkat Anda:**
   - **Di Web Browser:** Tekan tombol `w` di terminal.
   - **Di Ponsel Android / iOS:** Pindai kode QR menggunakan aplikasi **Expo Go**.
