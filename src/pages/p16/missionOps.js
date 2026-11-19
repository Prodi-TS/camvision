// Keputusan gerak AMR dari hasil deteksi: posisi centroid -> arah, ukuran kotak -> jarak.
import { W } from '../p15/blobOps.js'

// Rentang hue (derajat 0-360) untuk warna target.
export const COLORS = {
  merah: { label: 'Merah', test: (h) => h <= 20 || h >= 340 },
  kuning: { label: 'Kuning', test: (h) => h >= 40 && h <= 80 },
  hijau: { label: 'Hijau', test: (h) => h >= 90 && h <= 160 },
  biru: { label: 'Biru', test: (h) => h >= 200 && h <= 260 },
}

// Klasifikasi sederhana berdasarkan warna: nama kelas dari hue objek (0-360), 'Lain' bila di luar empat warna.
export function colorClass(hue) {
  if (hue == null) return 'Lain'
  const k = Object.keys(COLORS).find((key) => COLORS[key].test(hue))
  return k ? COLORS[k].label : 'Lain'
}

// Ambil blob terbesar yang warnanya sesuai.
export function pickTarget(blobs, colorKey) {
  const c = COLORS[colorKey]
  return blobs.filter((b) => c.test(b.hue)).sort((a, b) => b.area - a.area)[0] || null
}

export const STATES = {
  cari: { text: 'SEARCH', hint: 'Target belum terlihat, robot berputar pelan.' },
  belok: { text: 'TURN', hint: 'Target di luar zona tengah, robot berputar menghadapnya.' },
  maju: { text: 'MOVE FORWARD', hint: 'Target di tengah tetapi masih jauh, robot maju.' },
  berhenti: { text: 'STOP', hint: 'Target di tengah dan cukup dekat, robot berhenti.' },
}

export const LIN_SPEED = 0.2 // m/s
export const SEARCH_TURN = 0.4 // rad/s

// error: -1 (paling kiri) sampai 1 (paling kanan). deadzone: setengah lebar zona tengah (0-1).
// stopH: tinggi kotak (piksel, dari 240) yang dianggap sudah cukup dekat.
export function decide(blob, { deadzone, stopH }) {
  if (!blob) return { state: 'cari', linear: 0, angular: SEARCH_TURN, error: null }
  const cx = blob.cx != null ? blob.cx : blob.box.x + blob.box.w / 2 // centroid objek
  const error = (cx - W / 2) / (W / 2)
  if (Math.abs(error) > deadzone) {
    const turn = Math.max(-1, Math.min(1, error * 1.2))
    // Di ROS, angular.z positif = belok kiri. Target di kanan -> nilai negatif.
    return { state: 'belok', linear: 0, angular: -turn, error }
  }
  if (blob.box.h >= stopH) return { state: 'berhenti', linear: 0, angular: 0, error }
  return { state: 'maju', linear: LIN_SPEED, angular: 0, error }
}

// Posisi objek di gambar: LEFT, CENTER, atau RIGHT (dari error dan lebar zona tengah).
export function positionOf(error, deadzone) {
  if (error == null) return null
  if (error < -deadzone) return 'LEFT'
  if (error > deadzone) return 'RIGHT'
  return 'CENTER'
}

// ---------- Catatan Misi ----------
// Lima kondisi yang dicatat siswa di lab AMR Vision Mission.
export const CHECKS = [
  { id: 'c1', label: 'Tanpa kubus', how: 'Singkirkan kubus dari pandangan kamera.', expect: 'cari', expectText: 'SEARCH (berputar pelan)' },
  { id: 'c2', label: 'Kubus di kiri', how: 'Letakkan kubus di tepi kiri gambar, di luar area biru.', expect: 'belok_kiri', expectText: 'TURN LEFT' },
  { id: 'c3', label: 'Kubus di kanan', how: 'Letakkan kubus di tepi kanan gambar, di luar area biru.', expect: 'belok_kanan', expectText: 'TURN RIGHT' },
  { id: 'c4', label: 'Kubus di tengah, jauh', how: 'Kubus di area biru, lebih jauh dari jarak berhenti.', expect: 'maju', expectText: 'MOVE FORWARD' },
  { id: 'c5', label: 'Kubus di tengah, dekat', how: 'Kubus di area biru, dekatkan sampai sudah mencapai jarak berhenti.', expect: 'berhenti', expectText: 'STOP' },
]
export const ACTION_TEXT = {
  cari: 'SEARCH',
  belok_kiri: 'TURN LEFT',
  belok_kanan: 'TURN RIGHT',
  maju: 'MOVE FORWARD',
  berhenti: 'STOP',
}

// Membaca catatan misi satu siswa tanpa memakai React (untuk halaman rekap).
export function readChecks(username) {
  try {
    return JSON.parse(localStorage.getItem(`cv-amr-p16-checks:${username}`) || '{}')
  } catch {
    return {}
  }
}
