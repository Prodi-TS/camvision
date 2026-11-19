// Daftar akun yang sudah ditentukan.
// camera00          -> Admin (password khusus)
// camera01-camera40 -> Siswa (password yang sama)
// cameradummy       -> Tamu (akun contoh untuk pengunjung; ditampilkan di halaman login)
//
// CATATAN: karena belum ada backend, password ini tersimpan di dalam kode
// website dan bisa dilihat oleh siapa pun yang membuka developer tools browser.
// Ini hanya pembatas akses sederhana, bukan keamanan sungguhan.

const STUDENT_PASSWORD = 'otakjosjis'
const ADMIN_PASSWORD = 'Tjktjosj1s'

// Akun contoh untuk pengunjung. Sengaja ditampilkan di halaman login, jadi jangan dipakai untuk data penting.
export const DEMO_ACCOUNT = { username: 'cameradummy', password: 'dummy123' }

function pad(n) {
  return String(n).padStart(2, '0')
}

const accounts = [
  { username: 'camera00', role: 'Admin', password: ADMIN_PASSWORD },
  { username: DEMO_ACCOUNT.username, role: 'Tamu', password: DEMO_ACCOUNT.password },
  ...Array.from({ length: 40 }, (_, i) => ({
    username: `camera${pad(i + 1)}`,
    role: 'Siswa',
    password: STUDENT_PASSWORD,
  })),
]

function normalize(username) {
  return String(username || '').trim().toLowerCase()
}

// Dipakai untuk memulihkan sesi (hanya cek username, tanpa password).
export function findAccount(username) {
  const acc = accounts.find((a) => a.username === normalize(username))
  return acc ? { username: acc.username, role: acc.role } : null
}

// Dipakai saat login: username tidak membedakan huruf besar/kecil,
// password membedakan huruf besar/kecil.
export function checkCredentials(username, password) {
  const acc = accounts.find((a) => a.username === normalize(username))
  if (!acc || acc.password !== password) return null
  return { username: acc.username, role: acc.role }
}
