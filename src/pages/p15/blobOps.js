// Operasi deteksi objek sederhana untuk P15: mask warna -> blob -> fitur -> k-NN.
// Semua berjalan di browser. Tidak memakai pustaka AI dari luar.

export const W = 320
export const H = 240
export const MAX_BLOBS = 12

// Mask: piksel berwarna cukup pekat dan cukup terang. Membuang latar yang abu-abu atau gelap.
export function segment(data, sMin, vMin) {
  const mask = new Uint8Array(W * H)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const max = Math.max(r, g, b)
    if (max < vMin) continue
    const min = Math.min(r, g, b)
    if ((255 * (max - min)) / max >= sMin) mask[p] = 1
  }
  return mask
}

function hueDeg(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let h
  if (max === r) h = (60 * (g - b)) / d
  else if (max === g) h = 120 + (60 * (b - r)) / d
  else h = 240 + (60 * (r - g)) / d
  return h < 0 ? h + 360 : h
}

// Pelabelan komponen terhubung (4 tetangga). Mengembalikan blob dengan area >= minArea.
// Setiap blob punya: area, box (bounding box), cx dan cy (centroid = rata-rata koordinat piksel objek),
// hue, fill, aspect. Bila withContour true, blob juga punya contour: daftar indeks piksel tepi objek
// (piksel objek yang bersebelahan dengan latar atau tepi gambar).
const edgeBuf = new Int32Array(W * H)

export function findBlobs(data, mask, minArea, withContour = false) {
  const seen = new Uint8Array(W * H)
  const stack = new Int32Array(W * H)
  const blobs = []
  for (let start = 0; start < W * H; start++) {
    if (!mask[start] || seen[start]) continue
    let sp = 0
    stack[sp++] = start
    seen[start] = 1
    let area = 0
    let minX = W
    let minY = H
    let maxX = 0
    let maxY = 0
    let cs = 0
    let sn = 0
    let sx = 0
    let sy = 0
    let ec = 0
    while (sp > 0) {
      const p = stack[--sp]
      const x = p % W
      const y = (p / W) | 0
      area++
      sx += x
      sy += y
      if (withContour && (x === 0 || x === W - 1 || y === 0 || y === H - 1 || !mask[p - 1] || !mask[p + 1] || !mask[p - W] || !mask[p + W])) {
        edgeBuf[ec++] = p
      }
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      const i = p * 4
      const hr = (hueDeg(data[i], data[i + 1], data[i + 2]) * Math.PI) / 180
      cs += Math.cos(hr)
      sn += Math.sin(hr)
      if (x > 0 && mask[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack[sp++] = p - 1 }
      if (x < W - 1 && mask[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack[sp++] = p + 1 }
      if (y > 0 && mask[p - W] && !seen[p - W]) { seen[p - W] = 1; stack[sp++] = p - W }
      if (y < H - 1 && mask[p + W] && !seen[p + W]) { seen[p + W] = 1; stack[sp++] = p + W }
    }
    if (area < minArea) continue
    const bw = maxX - minX + 1
    const bh = maxY - minY + 1
    let hue = (Math.atan2(sn, cs) * 180) / Math.PI
    if (hue < 0) hue += 360
    blobs.push({
      area,
      box: { x: minX, y: minY, w: bw, h: bh },
      cx: sx / area, // centroid, dalam piksel gambar (0-319)
      cy: sy / area, // centroid, dalam piksel gambar (0-239)
      contour: withContour ? edgeBuf.slice(0, ec) : null,
      hue, // derajat 0-360
      fill: area / (bw * bh),
      aspect: bw / bh,
    })
  }
  blobs.sort((a, b) => b.area - a.area)
  const top = blobs.slice(0, MAX_BLOBS)
  top.forEach((b, i) => { b.id = i + 1 })
  return top
}

// Blur 3 x 3 (rata-rata tetangga) pada gambar RGBA, langsung di tempat. Menghaluskan derau kecil
// sebelum pemisahan warna, tetapi menambah waktu pemrosesan.
const blurBuf = new Uint8ClampedArray(W * H * 4)

export function blur3(data) {
  blurBuf.set(data)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4
      for (let c = 0; c < 3; c++) {
        const j = i + c
        data[j] =
          (blurBuf[j - W * 4 - 4] + blurBuf[j - W * 4] + blurBuf[j - W * 4 + 4] +
            blurBuf[j - 4] + blurBuf[j] + blurBuf[j + 4] +
            blurBuf[j + W * 4 - 4] + blurBuf[j + W * 4] + blurBuf[j + W * 4 + 4]) / 9
      }
    }
  }
}

// Vektor fitur 5 angka, semuanya kira-kira dalam rentang -1 sampai 1.
//  0,1: warna (hue sebagai titik di lingkaran, supaya merah dekat dengan merah)
//  2  : ukuran (akar luas relatif terhadap gambar)
//  3  : bentuk (rasio lebar/tinggi, skala log)
//  4  : kepadatan (seberapa penuh kotak oleh objek)
export function features(b) {
  const th = (b.hue * Math.PI) / 180
  const size = Math.min(1.5, Math.sqrt(b.area / (W * H)) * 3)
  const shape = Math.max(-1, Math.min(1, Math.log2(b.aspect)))
  const dense = Math.max(-1, Math.min(1, (b.fill - 0.75) * 4))
  return [Math.cos(th), Math.sin(th), size, shape, dense]
}

export const FEATURE_NAMES = ['Warna (x)', 'Warna (y)', 'Ukuran', 'Bentuk', 'Kepadatan']

function dist(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) * (a[i] - b[i])
  return Math.sqrt(s)
}

// k-NN berbobot jarak: k contoh terdekat memberi suara, dan contoh yang lebih mirip
// punya suara lebih besar. Kepercayaan = porsi bobot untuk label pemenang.
export function knnPredict(samples, f, k = 3) {
  if (samples.length === 0) return null
  const nearest = samples
    .map((s) => ({ label: s.label, d: dist(s.f, f) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.min(k, samples.length))
  const votes = {}
  let total = 0
  nearest.forEach((s) => {
    const w = 1 / (s.d + 0.05)
    votes[s.label] = (votes[s.label] || 0) + w
    total += w
  })
  let best = null
  for (const [label, w] of Object.entries(votes)) {
    if (!best || w > best.w) best = { label, w }
  }
  return { label: best.label, confidence: best.w / total }
}
