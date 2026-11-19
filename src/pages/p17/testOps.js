// Pengujian sistem penglihatan: rekam beberapa detik, hitung metrik, nilai lulus atau gagal.

export const REC_MS = 3000
export const SAMPLE_MS = 100
export const PASS_PRESENT = 0.8 // kubus ada: terdeteksi pada >= 80% cuplikan
export const PASS_ABSENT = 0.1 // kubus tidak ada: terdeteksi pada <= 10% cuplikan
export const FRAME_BUDGET_MS = 33 // satu frame kamera 30 FPS berlangsung sekitar 33 ms

export function median(arr) {
  if (!arr.length) return null
  const s = arr.slice().sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export const TESTS = [
  { id: 't1', label: 'Jarak dekat', present: true, how: 'Letakkan kubus target sekitar 15 cm dari kamera, di tengah gambar.' },
  { id: 't2', label: 'Jarak sedang', present: true, how: 'Letakkan kubus target sekitar 30 cm dari kamera, di tengah gambar.' },
  { id: 't3', label: 'Jarak jauh', present: true, how: 'Letakkan kubus target sekitar 60 cm dari kamera.' },
  { id: 't4', label: 'Cahaya redup', present: true, how: 'Redupkan lampu atau tutupi sebagian cahaya. Kubus target di jarak sedang.' },
  { id: 't7', label: 'Cahaya terang', present: true, how: 'Arahkan lampu atau senter ke alas sampai terang atau agak silau. Kubus target di jarak sedang.' },
  { id: 't5', label: 'Tanpa kubus', present: false, how: 'Singkirkan semua kubus. Hanya alas kosong yang terlihat.' },
  { id: 't6', label: 'Pengecoh warna lain', present: false, how: 'Singkirkan kubus target. Letakkan kubus warna lain di depan kamera.' },
]

// samples: [{ found: boolean, cx: number|null, cy: number|null, h: number|null, ms: number }]
// cx dan cy adalah centroid target. ms adalah waktu pemrosesan satu frame (milidetik).
export function summarize(samples) {
  const n = samples.length
  const found = samples.filter((s) => s.found)
  const rate = n ? found.length / n : 0
  let jitter = null
  let h = null
  let x = null
  let y = null
  if (found.length >= 2) {
    const mean = found.reduce((a, s) => a + s.cx, 0) / found.length
    jitter = Math.sqrt(found.reduce((a, s) => a + (s.cx - mean) ** 2, 0) / found.length)
    h = found.reduce((a, s) => a + s.h, 0) / found.length
  } else if (found.length === 1) {
    h = found[0].h
  }
  if (found.length) {
    x = found.reduce((a, s) => a + s.cx, 0) / found.length
    const ys = found.filter((s) => s.cy != null)
    y = ys.length ? ys.reduce((a, s) => a + s.cy, 0) / ys.length : null
  }
  const ms = median(samples.filter((s) => typeof s.ms === 'number').map((s) => s.ms))
  return { n, rate, jitter, h, x, y, ms }
}

export function isPass(test, rate) {
  return test.present ? rate >= PASS_PRESENT : rate <= PASS_ABSENT
}

// Peluang keputusan benar: bila kubus ada = tingkat deteksi, bila tidak ada = 1 - tingkat deteksi.
export function correctness(test, rate) {
  return test.present ? rate : 1 - rate
}

export function overall(results) {
  const rows = TESTS.filter((t) => results[t.id])
  if (!rows.length) return null
  const present = rows.filter((t) => t.present)
  const absent = rows.filter((t) => !t.present)
  const mean = (arr, f) => (arr.length ? arr.reduce((a, t) => a + f(t), 0) / arr.length : null)
  const withMs = rows.filter((t) => results[t.id].ms != null)
  const weakest = rows.slice().sort((a, b) => correctness(a, results[a.id].rate) - correctness(b, results[b.id].rate))[0]
  return {
    passed: rows.filter((t) => isPass(t, results[t.id].rate)).length,
    total: rows.length,
    detection: mean(present, (t) => results[t.id].rate),
    falseAlarm: mean(absent, (t) => results[t.id].rate),
    accuracy: mean(rows, (t) => correctness(t, results[t.id].rate)),
    ms: withMs.length ? mean(withMs, (t) => results[t.id].ms) : null,
    weakest,
  }
}
