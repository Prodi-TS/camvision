// Konten P13 — Camera. Sumber: kegiatan dan tujuan pembelajaran P13 pada Modul Ajar AMR.
// Angka pada Datasheet Challenge dan Camera Explorer adalah DATA SIMULASI. Aktivitas Webcam-mu memakai kamera siswa yang sebenarnya.

import { ownCamDone } from './ownCamOps.js'

export const TP_CODE = '3.1.1'

export const TUJUAN =
  'Memahami konsep dasar computer vision, fungsi, prinsip kerja, spesifikasi (datasheet), serta karakteristik kamera dan sensor visual yang digunakan pada sistem robotika.'

export const PERTANYAAN_PEMANTIK =
  'Jika LiDAR dapat membaca lingkungan, mengapa AMR masih membutuhkan kamera?'

export const KESIMPULAN =
  'Kamera merupakan salah satu sensor persepsi pada AMR yang memberikan informasi visual dari lingkungan. Pemahaman terhadap karakteristik dan spesifikasi kamera diperlukan agar kamera dapat digunakan sesuai kebutuhan sistem.'

// ---------- Materi singkat ----------
export const CHARACTERISTICS = [
  {
    term: 'Resolution',
    text: 'Ukuran citra yang dihasilkan kamera, dinyatakan dalam piksel (lebar × tinggi).',
  },
  {
    term: 'FPS',
    text: 'Jumlah gambar (frame) yang dihasilkan kamera setiap detik.',
  },
  {
    term: 'Field of View (FOV)',
    text: 'Seberapa luas sudut pandang yang dapat ditangkap kamera, dinyatakan dalam derajat.',
  },
  {
    term: 'Interface',
    text: 'Cara kamera terhubung ke perangkat pengolah. Pada praktik ini kamera yang dipakai adalah webcam USB.',
  },
]

// ---------- Camera Explorer ----------
export const CAMERA_PARTS = [
  {
    id: 'lens',
    name: 'Lens',
    fungsi: 'Mengumpulkan cahaya dari lingkungan dan mengarahkannya ke image sensor.',
    peran:
      'Menentukan pemandangan apa yang masuk ke kamera. Luas pandang kamera (FOV) berkaitan dengan bagian ini.',
  },
  {
    id: 'sensor',
    name: 'Image Sensor',
    fungsi: 'Mengubah cahaya yang masuk menjadi data citra digital.',
    peran:
      'Bagian yang benar-benar menghasilkan citra. Ukuran citra dalam piksel (resolution) berkaitan dengan bagian ini.',
  },
  {
    id: 'interface',
    name: 'Interface',
    fungsi: 'Menghubungkan kamera ke perangkat pengolah dan membawa data citra ke sana.',
    peran:
      'Tanpa koneksi ini, citra dari kamera tidak sampai ke sistem. Pada praktik ini, koneksinya memakai USB.',
  },
  {
    id: 'mounting',
    name: 'Mounting',
    fungsi: 'Menahan kamera pada posisi tertentu, misalnya pada dudukan atau bodi robot.',
    peran:
      'Posisi dan arah pemasangan menentukan bagian lingkungan mana yang terlihat oleh kamera.',
  },
]

// ---------- Datasheet Challenge (DATA SIMULASI) ----------
export const TERMS = ['Resolution', 'FPS', 'FOV', 'Interface']

export const DATASHEET_ITEMS = [
  {
    id: 'fov',
    value: '78°',
    answer: 'FOV',
    why: '78° adalah besar sudut pandang kamera, jadi ini FOV.',
  },
  {
    id: 'res',
    value: '1920 × 1080',
    answer: 'Resolution',
    why: '1920 × 1080 adalah ukuran citra dalam piksel, jadi ini Resolution.',
  },
  {
    id: 'iface',
    value: 'USB',
    answer: 'Interface',
    why: 'USB adalah cara kamera terhubung ke perangkat, jadi ini Interface.',
  },
  {
    id: 'fps',
    value: '30 FPS',
    answer: 'FPS',
    why: '30 FPS berarti 30 gambar per detik, jadi ini FPS.',
  },
]

// ---------- Kamera atau LiDAR? ----------
export const SCENARIOS = [
  {
    id: 's1',
    prompt: 'Robot perlu memperoleh informasi visual berupa warna objek.',
    answer: 'Kamera',
    explanation:
      'Kamera menghasilkan citra sehingga tampilan visual seperti warna objek dapat diamati. LiDAR dipakai untuk membaca lingkungan sebagai informasi jarak, bukan warna.',
  },
  {
    id: 's2',
    prompt: 'Robot perlu memperoleh informasi jarak terhadap objek.',
    answer: 'LiDAR',
    explanation:
      'LiDAR adalah sensor navigasi yang membaca lingkungan, termasuk jarak ke objek. Informasi utama yang dihasilkan kamera adalah citra visual.',
  },
  {
    id: 's3',
    prompt: 'Robot perlu melihat tampilan atau bentuk visual sebuah objek sebagai gambar.',
    answer: 'Kamera',
    explanation:
      'Gambar atau citra adalah hasil kerja kamera. Informasi visual seperti ini adalah alasan AMR memiliki kamera.',
  },
  {
    id: 's4',
    prompt: 'Robot perlu mengetahui seberapa jauh dinding di depannya.',
    answer: 'LiDAR',
    explanation:
      'Ini kebutuhan informasi jarak, yang dibaca oleh sensor navigasi seperti LiDAR.',
  },
]

export const LIDAR_CLOSING =
  'Kamera dan LiDAR memberikan jenis informasi yang berbeda. Tidak ada yang selalu lebih baik: masing-masing punya fungsi dan keterbatasan sendiri.'

// ---------- Refleksi ----------
export const REFLECTION_QUESTIONS = [
  { id: 'r1', text: 'Apa fungsi kamera pada AMR?' },
  { id: 'r2', text: 'Mengapa spesifikasi kamera perlu diperhatikan?' },
  { id: 'r3', text: 'Apa perbedaan informasi yang diperoleh kamera dan LiDAR?' },
  { id: 'r4', text: 'Apa keterbatasan kamera sebagai sensor visual?' },
  { id: 'r5', text: 'Apakah webcam yang kamu pakai cocok untuk misi AMR? Jelaskan alasanmu berdasarkan datasheet dan hasil pengukurannya.' },
]

// ---------- Progress ----------
export function getActivities(state) {
  const datasheetDone = DATASHEET_ITEMS.every(
    (item) => state.datasheet[item.id] === item.answer
  )
  const lidarDone = SCENARIOS.every((s) => Boolean(state.lidar[s.id]))
  const reflectionDone =
    state.reflectionSaved &&
    REFLECTION_QUESTIONS.every((q) => (state.reflection[q.id] || '').trim().length > 0)

  return [
    { id: 'materi', label: 'Materi', done: state.materiDone },
    {
      id: 'explorer',
      label: 'Camera Explorer',
      done: CAMERA_PARTS.every((p) => state.explorerSeen.includes(p.id)),
    },
    { id: 'datasheet', label: 'Datasheet Challenge', done: datasheetDone },
    { id: 'lidar', label: 'Camera vs LiDAR', done: lidarDone },
    { id: 'owncam', label: 'Webcam-mu', done: ownCamDone(state.ownCam) },
    { id: 'refleksi', label: 'Refleksi', done: reflectionDone },
  ]
}
