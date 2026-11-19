// Operasi citra dan foto contoh untuk Image Processing Lab.
// Semua fungsi memakai array piksel biasa (RGBA) sehingga mudah diuji.
// Foto contoh dibuat lewat kode. Itu gambar buatan, bukan foto sungguhan.

export const W = 320
export const H = 240

// Syarat lulus per kondisi cahaya.
export const MIN_CAUGHT = 0.45 // minimal bagian kotak kubus yang tertangkap
export const MAX_WRONG = 0.03 // maksimal bagian di luar kotak yang ikut tertangkap

// ---------- Warna ----------
export function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = (60 * (g - b)) / d
    else if (max === g) h = 120 + (60 * (b - r)) / d
    else h = 240 + (60 * (r - g)) / d
    if (h < 0) h += 360
  }
  // Skala OpenCV: H 0-179, S 0-255, V 0-255.
  return { h: h / 2, s: max === 0 ? 0 : (255 * d) / max, v: max }
}

export function sampleTarget(data, x, y) {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const xx = Math.min(W - 1, Math.max(0, Math.round(x) + dx))
      const yy = Math.min(H - 1, Math.max(0, Math.round(y) + dy))
      const i = (yy * W + xx) * 4
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      n++
    }
  }
  r /= n
  g /= n
  b /= n
  return { r, g, b, ...rgbToHsv(r, g, b) }
}

// ---------- Pipeline ----------
function blur3(src) {
  const out = new Uint8ClampedArray(src.length)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let r = 0
      let g = 0
      let b = 0
      let n = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          const yy = y + dy
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
          const i = (yy * W + xx) * 4
          r += src[i]
          g += src[i + 1]
          b += src[i + 2]
          n++
        }
      }
      const o = (y * W + x) * 4
      out[o] = r / n
      out[o + 1] = g / n
      out[o + 2] = b / n
      out[o + 3] = 255
    }
  }
  return out
}

function erode(mask) {
  const out = new Uint8Array(mask.length)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x
      if (
        mask[p] &&
        mask[p - 1] &&
        mask[p + 1] &&
        mask[p - W] &&
        mask[p + W] &&
        mask[p - W - 1] &&
        mask[p - W + 1] &&
        mask[p + W - 1] &&
        mask[p + W + 1]
      ) {
        out[p] = 1
      }
    }
  }
  return out
}

function dilate(mask) {
  const out = new Uint8Array(mask.length)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x
      if (
        mask[p] ||
        mask[p - 1] ||
        mask[p + 1] ||
        mask[p - W] ||
        mask[p + W] ||
        mask[p - W - 1] ||
        mask[p - W + 1] ||
        mask[p + W - 1] ||
        mask[p + W + 1]
      ) {
        out[p] = 1
      }
    }
  }
  return out
}

// params: { blur, clean, method: 'rgb' | 'hsv', tol, hTol, sMin, vMin }
export function runPipeline(data, target, params) {
  const px = params.blur ? blur3(data) : data
  const mask = new Uint8Array(W * H)
  if (params.method === 'rgb') {
    const t2 = params.tol * params.tol
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const dr = px[i] - target.r
      const dg = px[i + 1] - target.g
      const db = px[i + 2] - target.b
      if (dr * dr + dg * dg + db * db <= t2) mask[p] = 1
    }
  } else {
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const c = rgbToHsv(px[i], px[i + 1], px[i + 2])
      let dh = Math.abs(c.h - target.h)
      if (dh > 90) dh = 180 - dh
      if (dh <= params.hTol && c.s >= params.sMin && c.v >= params.vMin) mask[p] = 1
    }
  }
  return params.clean ? dilate(erode(mask)) : mask
}

// box: { x, y, w, h } dalam piksel gambar 320 x 240.
export function evaluate(mask, box) {
  const x0 = Math.max(0, Math.round(box.x))
  const y0 = Math.max(0, Math.round(box.y))
  const x1 = Math.min(W, Math.round(box.x + box.w))
  const y1 = Math.min(H, Math.round(box.y + box.h))
  let inside = 0
  let outside = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue
      if (x >= x0 && x < x1 && y >= y0 && y < y1) inside++
      else outside++
    }
  }
  const boxArea = Math.max(1, (x1 - x0) * (y1 - y0))
  const rest = Math.max(1, W * H - boxArea)
  const caught = Math.min(1, inside / boxArea)
  const wrong = outside / rest
  return { caught, wrong, ok: caught >= MIN_CAUGHT && wrong <= MAX_WRONG }
}

// ---------- Foto contoh buatan ----------
function makeRng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function fillRect(d, x0, y0, x1, y1, c) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4
      d[i] = c[0]
      d[i + 1] = c[1]
      d[i + 2] = c[2]
    }
  }
}

function fillCircle(d, cx, cy, r, c) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > r * r) continue
      const i = (y * W + x) * 4
      d[i] = c[0]
      d[i + 1] = c[1]
      d[i + 2] = c[2]
    }
  }
}

function fillPoly(d, pts, c) {
  const ys = pts.map((p) => p[1])
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  for (let y = yMin; y <= yMax; y++) {
    const xs = []
    for (let k = 0; k < pts.length; k++) {
      const [ax, ay] = pts[k]
      const [bx, by] = pts[(k + 1) % pts.length]
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay))
      }
    }
    xs.sort((a, b) => a - b)
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.round(xs[k]); x <= Math.round(xs[k + 1]); x++) {
        const i = (y * W + x) * 4
        d[i] = c[0]
        d[i + 1] = c[1]
        d[i + 2] = c[2]
      }
    }
  }
}

export const CUBE_BOX = { x: 110, y: 92, w: 80, h: 78 }

function baseScene() {
  const d = new Uint8ClampedArray(W * H * 4)
  for (let y = 0; y < H; y++) {
    const k = 1 - (y / H) * 0.12
    fillRect(d, 0, y, W, y + 1, [190 * k, 160 * k, 120 * k])
  }
  fillRect(d, 220, 140, 270, 190, [40, 140, 70]) // kotak hijau
  fillCircle(d, 60, 170, 28, [40, 80, 190]) // bola biru
  fillRect(d, 240, 50, 275, 80, [225, 200, 40]) // kotak kuning
  fillRect(d, 110, 110, 170, 170, [200, 35, 40]) // kubus merah: sisi depan
  fillPoly(d, [[110, 110], [130, 92], [190, 92], [170, 110]], [225, 70, 70]) // sisi atas
  fillPoly(d, [[170, 110], [190, 92], [190, 152], [170, 170]], [150, 20, 28]) // sisi samping
  return d
}

function finish(d, seed, gain, shadow) {
  const rnd = makeRng(seed)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      let g0 = gain[0]
      let g1 = gain[1]
      let g2 = gain[2]
      if (shadow && x - 0.5 * y < 150) {
        g0 *= shadow
        g1 *= shadow
        g2 *= shadow
      }
      const n = (rnd() - 0.5) * 12
      d[i] = Math.max(0, Math.min(255, d[i] * g0 + n))
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] * g1 + n))
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] * g2 + n))
      d[i + 3] = 255
    }
  }
  return d
}

// Tiga kondisi cahaya dengan kubus di posisi yang sama.
export function makeSamplePhotos() {
  return {
    terang: { data: finish(baseScene(), 11, [1, 1, 1], 0), box: { ...CUBE_BOX } },
    redup: { data: finish(baseScene(), 22, [0.4, 0.42, 0.52], 0), box: { ...CUBE_BOX } },
    bayangan: { data: finish(baseScene(), 33, [1, 1, 1], 0.42), box: { ...CUBE_BOX } },
  }
}
