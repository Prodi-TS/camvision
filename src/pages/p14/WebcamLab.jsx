import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import CaptureButton from '../../components/CaptureButton.jsx'
import CameraPicker, { cameraStream, savedCameraId, saveCameraId, useExternalConfirm } from '../../components/CameraPicker.jsx'
import PreflightPanel from '../../components/PreflightPanel.jsx'

// Lab P14: pra-pengolahan citra dari webcam USB asli.
// Semua pemrosesan terjadi di browser. Tidak ada gambar yang dikirim ke mana pun.

const W = 320
const H = 240
const MARK = '#0d7a94'

// ---------- Operasi citra (bekerja pada ImageData) ----------
function toGray(data, gray) {
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000
  }
}

function putGray(data, gray) {
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    data[i] = data[i + 1] = data[i + 2] = gray[p]
    data[i + 3] = 255
  }
}

function threshold(data, gray, t) {
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const v = gray[p] >= t ? 255 : 0
    data[i] = data[i + 1] = data[i + 2] = v
    data[i + 3] = 255
  }
}

function sobel(data, gray, out) {
  out.fill(0)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x
      const gx =
        -gray[p - W - 1] + gray[p - W + 1] - 2 * gray[p - 1] + 2 * gray[p + 1] - gray[p + W - 1] + gray[p + W + 1]
      const gy =
        -gray[p - W - 1] - 2 * gray[p - W] - gray[p - W + 1] + gray[p + W - 1] + 2 * gray[p + W] + gray[p + W + 1]
      out[p] = Math.min(255, (Math.abs(gx) + Math.abs(gy)) / 2)
    }
  }
  putGray(data, out)
}

// Hue dalam derajat 0-360 (lingkaran warna). Merah ada di ujung: 350 sampai 10 melewati 0.
// S dan V 0-255. (OpenCV memakai H 0-179, yaitu derajat dibagi 2.)
function blur3(data, tmp) {
  // Rata-rata 3x3 per kanal: menghaluskan bintik kecil.
  const src = tmp.rgb || (tmp.rgb = new Uint8ClampedArray(data.length))
  src.set(data)
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += src[i + (dy * W + dx) * 4 + c]
        data[i + c] = sum / 9
      }
    }
  }
}

function morph(mask, tmp, erode) {
  const out = tmp.m2 || (tmp.m2 = new Uint8Array(W * H))
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let keep = erode ? 1 : 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          const yy = y + dy
          const v = xx < 0 || yy < 0 || xx >= W || yy >= H ? 0 : mask[yy * W + xx]
          if (erode) { if (!v) keep = 0 } else if (v) keep = 1
        }
      }
      out[y * W + x] = keep
    }
  }
  mask.set(out)
}

function hsvMask(data, p, tmp) {
  if (p.blur) blur3(data, tmp)
  const mask = tmp.mask || (tmp.mask = new Uint8Array(W * H))
  for (let i = 0, k = 0; i < data.length; i += 4, k++) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
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
    const s = max === 0 ? 0 : (255 * d) / max
    const inH = p.hMin <= p.hMax ? h >= p.hMin && h <= p.hMax : h >= p.hMin || h <= p.hMax
    mask[k] = inH && s >= p.sMin && max >= p.vMin ? 1 : 0
  }
  if (p.clean) {
    morph(mask, tmp, true) // erode: bintik kecil hilang
    morph(mask, tmp, false) // dilate: kubus kembali ke ukuran semula
  }
  let count = 0
  let minX = W
  let minY = H
  let maxX = -1
  let maxY = -1
  for (let k = 0, i = 0; k < W * H; k++, i += 4) {
    const v = mask[k] ? 255 : 0
    data[i] = data[i + 1] = data[i + 2] = v
    data[i + 3] = 255
    if (mask[k]) {
      count++
      const x = k % W
      const y = (k / W) | 0
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return { count, box: maxX >= 0 ? { minX, minY, maxX, maxY } : null }
}

// ---------- Pengaturan ----------
const MODES = [
  { id: 'asli', label: 'Asli' },
  { id: 'gray', label: 'Grayscale' },
  { id: 'thresh', label: 'Threshold' },
  { id: 'edge', label: 'Edge (Sobel)' },
  { id: 'hsv', label: 'Filter warna (HSV)' },
]

// Titik awal saja. Siswa menyesuaikan dengan kubus dan cahaya di tempatnya.
const COLOR_PRESETS = [
  { id: 'merah', label: 'Merah', hMin: 340, hMax: 10, sMin: 120, vMin: 70 },
  { id: 'kuning', label: 'Kuning', hMin: 40, hMax: 70, sMin: 100, vMin: 100 },
  { id: 'hijau', label: 'Hijau', hMin: 80, hMax: 160, sMin: 80, vMin: 60 },
  { id: 'biru', label: 'Biru', hMin: 190, hMax: 260, sMin: 100, vMin: 50 },
]

const btn = (active) => ({
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  border: `1px solid ${MARK}`,
  background: active ? MARK : 'transparent',
  color: active ? '#ffffff' : 'inherit',
  font: 'inherit',
  fontSize: 14,
  fontWeight: 600,
})

function Slider({ id, label, min, max, value, onChange, hint }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <label htmlFor={id} style={{ fontSize: 14 }}>
        {label}: <strong>{value}</strong>
        {hint && <span style={{ opacity: 0.7 }}> ({hint})</span>}
      </label>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

const canvasStyle = {
  width: '100%',
  height: 'auto',
  aspectRatio: `${W} / ${H}`,
  background: '#000000',
  borderRadius: 8,
  display: 'block',
}

export default function WebcamLab({ done, onDone }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(0)
  const origRef = useRef(null)
  const outRef = useRef(null)
  const workRef = useRef(null)
  const bufRef = useRef({ gray: new Float32Array(W * H), tmp: new Float32Array(W * H) })
  const frameRef = useRef(0)

  const [external, setExternal] = useExternalConfirm()
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [deviceId, setDeviceId] = useState(savedCameraId)
  const [deviceLabel, setDeviceLabel] = useState('')
  const [mode, setMode] = useState('asli')
  const [visited, setVisited] = useState({ hsv: false })
  const [t, setT] = useState(128)
  const [hsv, setHsv] = useState({ ...COLOR_PRESETS[0], blur: false, clean: false })
  const [stats, setStats] = useState({ count: 0, box: null })

  // Pengaturan terbaru dibaca lewat ref supaya loop gambar tidak dibuat ulang.
  const cfg = useRef({})
  cfg.current = { mode, t, hsv }

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
    setRunning(false)
  }, [])

  useEffect(() => stop, [stop])

  const draw = useCallback(() => {
    const video = videoRef.current
    const orig = origRef.current
    const out = outRef.current
    if (!video || !orig || !out || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(draw)
      return
    }
    if (!workRef.current) workRef.current = document.createElement('canvas')
    const work = workRef.current
    work.width = W
    work.height = H
    const wctx = work.getContext('2d', { willReadFrequently: true })
    wctx.drawImage(video, 0, 0, W, H)
    orig.getContext('2d').drawImage(work, 0, 0)

    const { mode: m, t: th, hsv: p } = cfg.current
    const img = wctx.getImageData(0, 0, W, H)
    const { gray, tmp } = bufRef.current
    let box = null
    let count = 0

    if (m === 'gray') {
      toGray(img.data, gray)
      putGray(img.data, gray)
    } else if (m === 'thresh') {
      toGray(img.data, gray)
      threshold(img.data, gray, th)
    } else if (m === 'edge') {
      toGray(img.data, gray)
      sobel(img.data, gray, tmp)
    } else if (m === 'hsv') {
      const r = hsvMask(img.data, p, bufRef.current)
      count = r.count
      box = r.box
    }

    const octx = out.getContext('2d')
    octx.putImageData(img, 0, 0)
    if (m === 'hsv' && box && count > W * H * 0.003) {
      octx.strokeStyle = '#ff3b30'
      octx.lineWidth = 2
      octx.strokeRect(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY)
    }

    frameRef.current++
    if (m === 'hsv' && frameRef.current % 8 === 0) setStats({ count, box })
    rafRef.current = requestAnimationFrame(draw)
  }, [])

  async function start(idArg) {
    const id = typeof idArg === 'string' ? idArg : deviceId
    setError('')
    stop()
    try {
      const stream = await cameraStream(id)
      streamRef.current = stream
      const track = stream.getVideoTracks()[0]
      setDeviceLabel(track?.label || '')
      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      setRunning(true)
      rafRef.current = requestAnimationFrame(draw)
    } catch (e) {
      stop()
      if (!navigator.mediaDevices) {
        setError('Kamera hanya bisa dipakai lewat http://localhost atau HTTPS. Buka lewat alamat localhost, bukan alamat IP.')
      } else if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
        setError('Izin kamera ditolak. Klik ikon gembok di address bar, izinkan kamera, lalu coba lagi.')
      } else if (e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError')) {
        setError('Kamera tidak ditemukan. Pastikan webcam USB tercolok, lalu coba lagi.')
      } else if (e && e.name === 'NotReadableError') {
        setError('Kamera sedang dipakai aplikasi atau tab lain. Tutup yang lain, lalu coba lagi.')
      } else {
        setError('Kamera tidak bisa dinyalakan. Coba cabut dan colok lagi webcam-nya.')
      }
    }
  }

  function chooseMode(id) {
    setMode(id)
    if (id === 'hsv') setVisited((v) => ({ ...v, hsv: true }))
  }

  const pct = ((stats.count / (W * H)) * 100).toFixed(1)
  const canConfirm = running && visited.hsv

  return (
    <div>
      <div className="note-box">
        <strong>Misi:</strong> pakai filter warna sampai <strong>hanya kubus target yang tampak putih</strong>,
        sedangkan latar dan benda lain hitam. Siapkan satu kubus kertas berwarna di depan webcam.
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={external}
            onChange={(e) => setExternal(e.target.checked)}
            disabled={running}
            style={{ marginTop: 4 }}
          />
          <span>Saya memakai webcam USB eksternal, bukan kamera bawaan laptop.</span>
        </label>

        <PreflightPanel />
        <CameraPicker
          deviceId={deviceId}
          running={running}
          onChange={(id) => {
            setDeviceId(id)
            saveCameraId(id)
            if (running) start(id)
          }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!running ? (
            <Button onClick={() => start(deviceId)} disabled={!external}>
              Nyalakan kamera
            </Button>
          ) : (
            <Button variant="secondary" onClick={stop}>
              Matikan kamera
            </Button>
          )}
        </div>
        {running && deviceLabel && <p className="hint">Kamera aktif: {deviceLabel}</p>}
        {!external && !running && <p className="hint">Centang dulu pernyataan di atas untuk menyalakan kamera.</p>}
        {error && (
          <p role="alert" style={{ margin: 0, padding: '10px 14px', borderRadius: 8, color: '#991b1b', background: '#fee2e2' }}>
            {error}
          </p>
        )}
      </div>

      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <figure style={{ margin: 0 }}>
          <canvas ref={origRef} width={W} height={H} style={canvasStyle} />
          <figcaption style={{ fontSize: 13, marginTop: 4 }}>Gambar asli dari kamera</figcaption>
        </figure>
        <figure style={{ margin: 0 }}>
          <canvas ref={outRef} width={W} height={H} style={canvasStyle} />
          <figcaption style={{ fontSize: 13, marginTop: 4 }}>
            Hasil: {MODES.find((m) => m.id === mode).label}
          </figcaption>
        </figure>
      </div>

      {mode === 'asli' ? (
        <p className="hint">Pilih salah satu filter di bawah, lalu ambil gambar hasilnya untuk portofolio.</p>
      ) : (
        <CaptureButton
          slot={`filter-${mode}`}
          enabled={running}
          getSource={() => [origRef.current, outRef.current]}
          note={`Filter: ${MODES.find((m) => m.id === mode).label}`}
        />
      )}

      <div role="group" aria-label="Pilih filter" style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {MODES.map((m) => (
          <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => chooseMode(m.id)} style={btn(mode === m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'thresh' && (
        <div style={{ marginTop: 14, maxWidth: 420 }}>
          <Slider id="p14-t" label="Ambang" min={0} max={255} value={t} onChange={setT} hint="piksel di atas ambang jadi putih" />
        </div>
      )}

      {mode === 'hsv' && (
        <div style={{ marginTop: 14, display: 'grid', gap: 12, maxWidth: 520 }}>
          <div role="group" aria-label="Warna target" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setHsv({ ...c, blur: hsv.blur, clean: hsv.clean })}
                aria-pressed={hsv.id === c.id}
                style={btn(hsv.id === c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Slider id="p14-hmin" label="H min" min={0} max={360} value={hsv.hMin} onChange={(v) => setHsv({ ...hsv, hMin: v })} hint="jenis warna" />
          <Slider id="p14-hmax" label="H max" min={0} max={360} value={hsv.hMax} onChange={(v) => setHsv({ ...hsv, hMax: v })} hint="jenis warna" />
          <Slider id="p14-smin" label="S min" min={0} max={255} value={hsv.sMin} onChange={(v) => setHsv({ ...hsv, sMin: v })} hint="kepekatan warna" />
          <Slider id="p14-vmin" label="V min" min={0} max={255} value={hsv.vMin} onChange={(v) => setHsv({ ...hsv, vMin: v })} hint="terang gelap" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" aria-pressed={hsv.blur} onClick={() => setHsv({ ...hsv, blur: !hsv.blur })} style={btn(hsv.blur)}>
              Haluskan gambar (blur)
            </button>
            <button type="button" aria-pressed={hsv.clean} onClick={() => setHsv({ ...hsv, clean: !hsv.clean })} style={btn(hsv.clean)}>
              Bersihkan bintik (erode lalu dilate)
            </button>
          </div>
          <p className="hint">
            Piksel terdeteksi: <strong>{stats.count}</strong> ({pct}% gambar)
            {stats.box ? ' · kotak merah menandai area terdeteksi' : ''}
          </p>
          <p className="hint">Pilihan warna hanya titik awal. Geser slider sampai cocok dengan kubusmu. Hue dalam derajat 0–360 pada lingkaran warna. Merah memakai H min lebih besar dari H max karena rentangnya melewati titik 0° (misalnya 340° sampai 10°). Kalau banyak bintik putih kecil di latar, coba Haluskan gambar atau Bersihkan bintik.</p>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {done ? (
          <span className="hint hint--ok">Misi ditandai selesai.</span>
        ) : (
          <>
            <Button onClick={onDone} disabled={!canConfirm}>
              Hanya kubus target yang tampak putih
            </Button>
            {!canConfirm && (
              <p className="hint">Nyalakan kamera dan coba mode Filter warna (HSV) dulu untuk membuka tombol ini.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
