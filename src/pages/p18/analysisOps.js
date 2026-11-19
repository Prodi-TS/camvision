// Analisis penyebab: dari data rekaman ke dugaan, lalu cek dugaan dengan bukti.
import { PASS_PRESENT, PASS_ABSENT, median as medianOf } from '../p17/testOps.js'

export const MIN_AREA = 300 // luas minimum kotak yang dihitung sebagai deteksi (sama dengan pengujian)
export const TINY_AREA = 30 // di bawah ini dianggap bintik, bukan objek

export const HYPOTHESES = [
  { id: 'ukuran', text: 'Objek terlalu kecil di gambar' },
  { id: 'cahaya', text: 'Cahaya terlalu gelap' },
  { id: 'silau', text: 'Cahaya terlalu terang atau silau' },
  { id: 'warna', text: 'Warna kubus pudar atau batas warna kurang cocok' },
  { id: 'pengecoh', text: 'Benda lain berwarna mirip ikut terdeteksi' },
  { id: 'baik', text: 'Tidak ada masalah, detektor sudah baik' },
]

// samples: [{ found, tiny, decoy, area, sat, bright, ms }]
export function summarizeDiag(samples) {
  const n = samples.length
  const mean = (arr) => (arr.length ? arr.reduce((a, v) => a + v, 0) / arr.length : null)
  const median = (arr) => {
    if (!arr.length) return null
    const s = arr.slice().sort((a, b) => a - b)
    return s[Math.floor(s.length / 2)]
  }
  return {
    n,
    rate: n ? samples.filter((s) => s.found).length / n : 0,
    tinyRate: n ? samples.filter((s) => s.tiny).length / n : 0,
    decoyRate: n ? samples.filter((s) => s.decoy).length / n : 0,
    medArea: median(samples.filter((s) => s.area > 0).map((s) => s.area)),
    sat: mean(samples.filter((s) => s.sat != null).map((s) => s.sat)),
    bright: mean(samples.map((s) => s.bright)),
    ms: medianOf(samples.filter((s) => typeof s.ms === 'number').map((s) => s.ms)),
  }
}

// Mengembalikan daftar penyebab yang didukung data.
export function inferCauses(test, m, sMin) {
  if (test.present) {
    if (m.rate >= PASS_PRESENT) return ['baik']
    const c = []
    if (m.tinyRate >= 0.3 || (m.medArea != null && m.medArea < 600)) c.push('ukuran')
    if (m.bright != null && m.bright < 90) c.push('cahaya')
    if (m.bright != null && m.bright > 215) c.push('silau')
    if (m.sat != null && m.sat < sMin + 40) c.push('warna')
    return c.length ? c : ['belum-jelas']
  }
  return m.rate > PASS_ABSENT ? ['pengecoh'] : ['baik']
}

export function verdict(hypothesisId, causes) {
  if (causes.includes('belum-jelas')) {
    return { ok: null, text: 'Data belum menunjuk satu penyebab yang jelas. Ulangi rekaman, atau ubah kondisi lalu bandingkan.' }
  }
  if (causes.includes(hypothesisId)) return { ok: true, text: 'Data mendukung dugaanmu.' }
  const names = causes.map((id) => HYPOTHESES.find((h) => h.id === id).text.toLowerCase()).join(' dan ')
  return { ok: false, text: `Data belum mendukung dugaanmu. Data lebih menunjuk ke: ${names}.` }
}

// ---------- Perbandingan hasil pengujian menurut faktor ----------
// Jarak: uji 1, 2, 3 (cahaya normal). Cahaya: uji 2 (normal) dibandingkan uji redup (t4) dan terang (t7), jarak sedang.
export const FACTORS = [
  { id: 'jarak', label: 'Jarak kubus dari kamera', ids: ['t1', 't2', 't3'] },
  { id: 'cahaya', label: 'Cahaya ruangan', ids: ['t2', 't4', 't7'] },
]

export const FACTOR_CHOICES = [
  ...FACTORS.map((f) => ({ id: f.id, text: f.label })),
  { id: 'sama', text: 'Pengaruhnya hampir sama' },
]

// Selisih terbesar tingkat deteksi antar kondisi dalam satu faktor (0-1). null bila datanya belum lengkap.
export function factorSpread(results, ids) {
  const rates = ids.map((id) => results[id] && results[id].rate)
  if (rates.some((r) => r == null)) return null
  return Math.max(...rates) - Math.min(...rates)
}

// Faktor yang paling memengaruhi: 'jarak', 'cahaya', atau 'sama' bila selisihnya kurang dari 10 poin.
export function strongestFactor(results) {
  const d = factorSpread(results, FACTORS[0].ids)
  const c = factorSpread(results, FACTORS[1].ids)
  if (d == null || c == null) return null
  if (Math.abs(d - c) < 0.1) return { id: 'sama', d, c }
  return { id: d > c ? 'jarak' : 'cahaya', d, c }
}
