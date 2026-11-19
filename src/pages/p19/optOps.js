// Pengaturan detektor yang bisa dioptimalkan, dan cara membandingkan hasilnya.

export const COLOR_CENTER = {
  merah: { label: 'Merah', hue: 0, tol: 20 },
  kuning: { label: 'Kuning', hue: 60, tol: 20 },
  hijau: { label: 'Hijau', hue: 125, tol: 35 },
  biru: { label: 'Biru', hue: 230, tol: 30 },
}

export const DEFAULTS = { sMin: 110, vMin: 60, minArea: 300, tol: null, blur: false } // tol null = bawaan warna

export function hueTolOf(color, tol) {
  return tol == null ? COLOR_CENTER[color].tol : tol
}

export function hueMatch(h, color, tol) {
  const c = COLOR_CENTER[color]
  const dist = Math.abs(((h - c.hue + 540) % 360) - 180) // jarak melingkar 0-180 derajat
  return dist <= hueTolOf(color, tol)
}

export function paramsKey(p) {
  return `${p.color}|${p.sMin}|${p.vMin}|${p.minArea}|${hueTolOf(p.color, p.tol)}|${p.blur ? 1 : 0}`
}

// Daftar pengaturan yang berbeda dari bawaan, untuk ditampilkan sebagai "yang kamu ubah".
export function changes(p) {
  const out = []
  if (p.sMin !== DEFAULTS.sMin) out.push(`kepekatan warna minimum ${DEFAULTS.sMin} → ${p.sMin}`)
  if (p.vMin !== DEFAULTS.vMin) out.push(`kecerahan minimum ${DEFAULTS.vMin} → ${p.vMin}`)
  if (p.minArea !== DEFAULTS.minArea) out.push(`luas minimum ${DEFAULTS.minArea} → ${p.minArea}`)
  const def = COLOR_CENTER[p.color].tol
  if (hueTolOf(p.color, p.tol) !== def) out.push(`rentang warna ±${def} → ±${hueTolOf(p.color, p.tol)}`)
  if (!!p.blur !== DEFAULTS.blur) out.push(`haluskan gambar (blur) ${DEFAULTS.blur ? 'hidup' : 'mati'} → ${p.blur ? 'hidup' : 'mati'}`)
  return out
}

// Saran berdasarkan dugaan penyebab dari P18, lengkap dengan risikonya.
export const ADVICE = {
  ukuran: { fix: 'Turunkan luas minimum agar kotak kecil tetap dihitung.', risk: 'Bintik kecil bisa ikut terhitung sebagai objek (alarm palsu naik).' },
  cahaya: { fix: 'Turunkan kecerahan minimum dan kepekatan warna minimum agar warna yang gelap tetap lolos.', risk: 'Bayangan atau benda lain bisa ikut lolos.' },
  warna: { fix: 'Perlebar rentang warna, atau turunkan kepekatan warna minimum.', risk: 'Benda berwarna mirip bisa ikut terdeteksi.' },
  pengecoh: { fix: 'Persempit rentang warna, naikkan kepekatan warna minimum, atau naikkan luas minimum.', risk: 'Kubus yang pudar atau jauh bisa gagal terdeteksi.' },
}
