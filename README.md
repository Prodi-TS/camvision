# Computer Vision AMR Learning Lab

Website pembelajaran Computer Vision untuk Autonomous Mobile Robot (AMR), SMK Telkom Jakarta, mata pelajaran Teknisi AMR.
Tujuh pertemuan: Camera, Image Processing, Object Detection, AMR Vision Mission, Vision Testing, Vision Analysis, Vision Optimization.

Semua pemrosesan gambar berjalan di browser siswa. Tidak ada server dan tidak ada gambar yang dikirim ke mana pun.
Data belajar (progres, jawaban, refleksi, gambar kamera) tersimpan di `localStorage` browser, terpisah untuk tiap akun.

## Menjalankan di komputer sendiri

Perlu Node.js 18 atau lebih baru.

```bash
npm install
npm run dev
```

Buka alamat yang tampil (biasanya http://localhost:5173). Kamera hanya bisa dipakai di `localhost` atau alamat `https`.

## Membuat versi siap pakai

```bash
npm run build     # hasil di folder dist
npm run preview   # mencoba hasil build
```

## Deploy ke GitHub Pages

1. Di GitHub: Settings > Pages > Source: **GitHub Actions**.
2. Push ke branch `main`. Workflow `.github/workflows/deploy.yml` membangun dan menerbitkan situs.
3. Alamatnya `https://<akun>.github.io/<nama-repo>/`. Kamera berfungsi karena Pages memakai https.

## Akun

`camera00` (admin) dan `camera01` sampai `camera40` (siswa). Daftarnya ada di `src/data/accounts.js`.

> **Penting:** karena tidak ada server, kata sandi tersimpan di kode dan bisa dibaca siapa pun yang membuka
> developer tools. Ini hanya pembatas akses sederhana. Gunakan repositori **Private**, atau ganti kata sandi
> sebelum membuat repositori publik.

## Struktur

- `src/pages/p13` sampai `p19`: halaman pembelajaran tiap pertemuan.
- `src/pages/labs`: Virtual Lab (Camera Explorer, Vision Pipeline, Vision Test and Analysis, Vision Optimization).
- `src/pages/portfolio`, `src/data/portfolioData.js`: pembuat portofolio (dicetak ke PDF lewat browser).
- `src/data/photoStore.js`: gambar kamera yang diambil siswa untuk portofolio.
- `assets/`: berkas sumber untuk dicetak (pola kubus target ukuran A4).
