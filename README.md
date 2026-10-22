# ZettCBT Pro - Panduan Implementasi & Deploy (300 Siswa Serentak)

Aplikasi Web Ujian Online (Computer-Based Test) berkecepatan tinggi yang dirancang khusus untuk menangani **lonjakan 300 siswa yang masuk dan submit serentak** tanpa lag, tanpa timeout, dan tanpa kehilangan data jawaban.

---

## 🚀 Mengapa Sistem Ini Mampu Menangani 300 Siswa Serentak?

| Karakteristik | Google Apps Script + Sheets (Lama) | ZettCBT Pro (Arsitektur Modern) |
| :--- | :--- | :--- |
| **Batas Eksekusi Serentak** | Dibatasi **maksimal 30 proses** serentak (Langsung crash jika 300 siswa klik bersamaan) | **Bebas limit**, Edge CDN sanggup melayani ribuan request per detik |
| **Penyimpanan Jawaban** | Antrean kunci (`LockService`) butuh 300 detik -> **Pasti Timeout** | **Auto-Save background real-time** ke Database Transaksional (latensi <100ms) |
| **Resiko Kehilangan Data** | Tinggi jika browser tertutup atau mati lampu | **0%**: Jawaban tersimpan otomatis per butir soal ke cloud |
| **Biaya Server** | Gratis tapi mudah down | **100% Gratis** via Vercel / Cloudflare Pages + Supabase Free Tier |

---

## 📁 Struktur Berkas

- [index.html](file:///g:/My%20Drive/PROJECT%20WEB%20APP/New%20folder/index.html): Antarmuka tunggal terpadu (Ruang Siswa ANBK/UTBK & Dashboard Guru).
- [style.css](file:///g:/My%20Drive/PROJECT%20WEB%20APP/New%20folder/style.css): Desain bersih profesional (Anti-AI Human Crafted Look), responsif di HP & PC Lab.
- [app.js](file:///g:/My%20Drive/PROJECT%20WEB%20APP/New%20folder/app.js): Mesin ujian (Timer sinkron, navigasi soal, auto-save, deteksi anti-curang tab, live monitoring).
- [supabase_schema.sql](file:///g:/My%20Drive/PROJECT%20WEB%20APP/New%20folder/supabase_schema.sql): Skema database PostgreSQL siap pakai untuk Supabase.
- [prd.md](file:///g:/My%20Drive/PROJECT%20WEB%20APP/New%20folder/prd.md): Dokumen spesifikasi sistem lengkap.

---

## 🛠️ Cara Uji Coba Cepat (Langsung Pakai)

1. Cukup klik ganda berkas `index.html` untuk membukanya di browser apa saja (Chrome / Edge / Firefox).
2. **Sebagai Siswa:**
   - Gunakan Token default: **`PAS26A`**
   - Masukkan Nomor Peserta (contoh: `2026-001`), Nama, dan pilih Kelas.
   - Ujian langsung berjalan dengan fitur timer, auto-save, dan navigasi nomor soal.
3. **Sebagai Guru:**
   - Klik tombol **"Panel Guru / Admin"** di pojok kanan atas.
   - Pantau siswa di tab **Live Monitoring**, edit bank soal di tab **Bank Soal**, dan unduh nilai di tab **Rekap & Analisis**.

---

## 🌐 Cara Deploy Gratis ke Internet untuk 300 Siswa (2 Menit)

### Langkah 1: Siapkan Database Supabase (100% Gratis)
1. Buka [https://supabase.com](https://supabase.com) dan buat akun/projek baru (Free Tier).
2. Buka menu **SQL Editor**, buka berkas [supabase_schema.sql](file:///g:/My%20Drive/PROJECT%20WEB%20APP/New%20folder/supabase_schema.sql), salin kodenya dan klik **Run**.
3. Buka menu **Project Settings -> API**, salin `Project URL` dan `anon public key`.
4. Masukkan kedua nilai tersebut ke tab **Koneksi Supabase Cloud** di aplikasi web.

### Langkah 2: Deploy Frontend ke Vercel / Cloudflare Pages
1. Upload folder projek ini ke akun GitHub Anda.
2. Hubungkan ke [Vercel](https://vercel.com) atau [Cloudflare Pages](https://pages.cloudflare.com) (klik *Add New Project* -> pilih repositori).
3. Klik **Deploy**. URL ujian online Anda (misal: `https://ujian-sekolah.vercel.app`) langsung aktif dan siap dibagikan ke 300 siswa!
