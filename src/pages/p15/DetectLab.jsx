import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import CaptureButton from '../../components/CaptureButton.jsx'
import CameraPicker, { cameraStream, savedCameraId, saveCameraId, useExternalConfirm } from '../../components/CameraPicker.jsx'
import PreflightPanel from '../../components/PreflightPanel.jsx'
import { colorClass } from '../p16/missionOps.js'
import { W, H, segment, findBlobs, features, FEATURE_NAMES, knnPredict } from './blobOps.js'

// Lab P15: deteksi objek dari webcam, lalu ajari model k-NN dari contoh berlabel.

const MARK = '#0d7a94'
const MIN_PER_LABEL = 3
const MIN_PREDICTION_FRAMES = 20
const LABELS = {
  target: { text: 'Kubus target', color: '#16a34a' },
  bukan: { text: 'Bukan target', color: '#dc2626' },
}

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

export default function DetectLab({ samples, setSamples, done, onDone }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(0)
  const canvasRef = useRef(null)
  const workRef = useRef(null)
  const frameRef = useRef(0)
  const blobsRef = useRef([])
  const frozenRef = useRef(false)
  const dataRef = useRef(null)
  const predFramesRef = useRef(0)

  const [external, setExternal] = useExternalConfirm()
  const [deviceId, setDeviceId] = useState(savedCameraId)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [sMin, setSMin] = useState(110)
  const [minArea, setMinArea] = useState(300)
  const [mode, setMode] = useState('ajari') // 'ajari' | 'uji'
  const [frozen, setFrozen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [blobCount, setBlobCount] = useState(0)
  const [predFrames, setPredFrames] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
  const [showBox, setShowBox] = useState(true)
  const [showContour, setShowContour] = useState(false)
  const [showCentroid, setShowCentroid] = useState(true)
  const [centroids, setCentroids] = useState([])

  const cfg = useRef({})
  cfg.current = { sMin, minArea, mode, samples, selected, showBox, showContour, showCentroid }

  const counts = {
    target: samples.filter((s) => s.label === 'target').length,
    bukan: samples.filter((s) => s.label === 'bukan').length,
  }
  const trained = counts.target >= MIN_PER_LABEL && counts.bukan >= MIN_PER_LABEL
  const tested = predFrames >= MIN_PREDICTION_FRAMES

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setRunning(false)
    setFrozen(false)
    frozenRef.current = false
  }, [])
  useEffect(() => stop, [stop])

  const render = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const c = cfg.current

    if (!frozenRef.current) {
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(render)
        return
      }
      if (!workRef.current) workRef.current = document.createElement('canvas')
      const work = workRef.current
      work.width = W
      work.height = H
      const wctx = work.getContext('2d', { willReadFrequently: true })
      wctx.drawImage(video, 0, 0, W, H)
      const img = wctx.getImageData(0, 0, W, H)
      dataRef.current = img
      const mask = segment(img.data, c.sMin, 60)
      blobsRef.current = findBlobs(img.data, mask, c.minArea, true)
    }

    if (dataRef.current) ctx.putImageData(dataRef.current, 0, 0)
    const blobs = blobsRef.current
    let predicted = 0
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.textBaseline = 'top'
    for (const b of blobs) {
      const { x, y, w, h } = b.box
      let color = '#2563eb'
      let text = `#${b.id} ${colorClass(b.hue)}`
      if (c.mode === 'uji') {
        const p = knnPredict(c.samples, features(b), 3)
        if (p) {
          predicted++
          color = LABELS[p.label].color
          text = `${LABELS[p.label].text} ${Math.round(p.confidence * 100)}%`
        }
      }
      ctx.lineWidth = b.id === c.selected ? 4 : 2
      ctx.strokeStyle = b.id === c.selected ? '#facc15' : color
      if (c.showBox) ctx.strokeRect(x, y, w, h)
      if (c.showContour && b.contour) {
        // kontur: piksel tepi objek (digambar di atas kotak agar tetap terlihat)
        ctx.fillStyle = '#22d3ee'
        const cn = b.contour
        for (let k = 0; k < cn.length; k++) ctx.fillRect(cn[k] % W, (cn[k] / W) | 0, 1, 1)
      }
      const tw = ctx.measureText(text).width + 8
      const ty = y > 18 ? y - 18 : y + h + 2
      ctx.fillStyle = b.id === c.selected ? '#facc15' : color
      ctx.fillRect(x, ty, tw, 16)
      ctx.fillStyle = b.id === c.selected ? '#000000' : '#ffffff'
      ctx.fillText(text, x + 4, ty + 2)
      if (c.showCentroid) {
        // centroid: titik pusat objek
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#111827'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(b.cx, b.cy, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
    }

    frameRef.current++
    if (!frozenRef.current) {
      if (c.mode === 'uji' && predicted > 0) predFramesRef.current++
      if (frameRef.current % 8 === 0) {
        setBlobCount(blobs.length)
        setPredFrames(predFramesRef.current)
        setCentroids(blobs.slice(0, 4).map((b) => ({ id: b.id, cx: Math.round(b.cx), cy: Math.round(b.cy), cls: colorClass(b.hue) })))
      }
    }
    rafRef.current = requestAnimationFrame(render)
  }, [])

  async function start(idArg) {
    const id = typeof idArg === 'string' ? idArg : deviceId
    setError('')
    try {
      const stream = await cameraStream(id)
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setRunning(true)
      rafRef.current = requestAnimationFrame(render)
    } catch (e) {
      stop()
      if (!navigator.mediaDevices) {
        setError('Kamera hanya bisa dipakai lewat http://localhost atau HTTPS. Buka lewat alamat localhost, bukan alamat IP.')
      } else if (e && e.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Klik ikon gembok di address bar, izinkan kamera, lalu coba lagi.')
      } else if (e && e.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan. Pastikan webcam USB tercolok, lalu coba lagi.')
      } else if (e && e.name === 'NotReadableError') {
        setError('Kamera sedang dipakai aplikasi atau tab lain. Tutup yang lain, lalu coba lagi.')
      } else {
        setError('Kamera tidak bisa dinyalakan. Coba cabut dan colok lagi webcam-nya.')
      }
    }
  }

  function toggleFreeze() {
    const next = !frozenRef.current
    frozenRef.current = next
    setFrozen(next)
    if (!next) setSelected(null)
    else setBlobCount(blobsRef.current.length)
  }

  function onCanvasClick(e) {
    if (!frozenRef.current) return
    const r = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    const y = ((e.clientY - r.top) / r.height) * H
    const hit = blobsRef.current
      .filter((b) => x >= b.box.x && x <= b.box.x + b.box.w && y >= b.box.y && y <= b.box.y + b.box.h)
      .sort((a, b) => a.area - b.area)[0]
    setSelected(hit ? hit.id : null)
  }

  const selBlob = frozen && selected ? blobsRef.current.find((b) => b.id === selected) : null
  const selFeat = selBlob ? features(selBlob) : null

  function addSample(label) {
    if (!selBlob) return
    setSamples((prev) => [...prev, { label, f: features(selBlob) }])
  }

  return (
    <div>
      <div className="note-box">
        <strong>Misi:</strong> ajari model mengenali <strong>kubus target</strong> dan membedakannya dari objek lain.
        Siapkan kubus target dan beberapa benda berwarna lain (misalnya kubus warna lain atau benda berukuran berbeda) di depan webcam.
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} disabled={running} style={{ marginTop: 4 }} />
          <span>Saya memakai webcam USB eksternal, bukan kamera bawaan laptop.</span>
        </label>
      <PreflightPanel />
      <CameraPicker
        deviceId={deviceId}
        running={running}
        disabled={frozen}
        onChange={(id) => {
          setDeviceId(id)
          saveCameraId(id)
          if (running) {
            stop()
            start(id)
          }
        }}
      />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!running ? (
            <Button onClick={start} disabled={!external}>Nyalakan kamera</Button>
          ) : (
            <Button variant="secondary" onClick={stop}>Matikan kamera</Button>
          )}
        </div>
        {!external && !running && <p className="hint">Centang dulu pernyataan di atas untuk menyalakan kamera.</p>}
        {error && (
          <p role="alert" style={{ margin: 0, padding: '10px 14px', borderRadius: 8, color: '#991b1b', background: '#fee2e2' }}>
            {error}
          </p>
        )}
      </div>

      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={onCanvasClick}
            style={{ width: '100%', height: 'auto', aspectRatio: `${W} / ${H}`, background: '#000000', borderRadius: 8, display: 'block', cursor: frozen ? 'pointer' : 'default' }}
          />
          <p className="hint">
            Objek terdeteksi: <strong>{blobCount}</strong>. {frozen ? 'Gambar dibekukan. Klik sebuah kotak untuk memilihnya.' : 'Gambar langsung dari kamera.'}
          </p>
          <p className="hint" style={{ marginTop: 0 }}>
            Kelas warna (Merah, Kuning, Hijau, Biru, Lain) ditentukan dari hue objek: ini klasifikasi berdasarkan karakteristik warna. Titik pusat (centroid), x dari 0 (kiri) sampai {W - 1} (kanan), y dari 0 (atas) sampai {H - 1} (bawah). Titik tengah gambar: ({W / 2}, {H / 2}).
          </p>
          <p style={{ margin: 0, fontSize: 14 }} aria-live="off">
            {centroids.length === 0
              ? 'Belum ada objek.'
              : centroids.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 ? ' · ' : ''}#{c.id} ({c.cx}, {c.cy}) {c.cls}
                  </span>
                ))}
          </p>
          <CaptureButton
            slot={mode === 'uji' ? 'deteksi-uji' : 'deteksi-ajari'}
            enabled={running}
            getSource={() => canvasRef.current}
            note={mode === 'uji' ? 'Mode uji model' : 'Mode ajari model'}
          />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div role="group" aria-label="Mode" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={btn(mode === 'ajari')} aria-pressed={mode === 'ajari'} onClick={() => setMode('ajari')}>
              1. Ajari model
            </button>
            <button type="button" style={btn(mode === 'uji')} aria-pressed={mode === 'uji'} onClick={() => setMode('uji')} disabled={!trained}>
              2. Uji model
            </button>
          </div>
          {!trained && <p className="hint">Mode uji terbuka setelah kamu memberi minimal {MIN_PER_LABEL} contoh untuk tiap label.</p>}

          <div role="group" aria-label="Tampilan pada gambar" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={showBox} onChange={(e) => setShowBox(e.target.checked)} />
              Kotak (bounding box)
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={showContour} onChange={(e) => setShowContour(e.target.checked)} />
              Kontur
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={showCentroid} onChange={(e) => setShowCentroid(e.target.checked)} />
              Titik pusat (centroid)
            </label>
          </div>

          <Slider id="p15-s" label="Kepekatan warna minimum" min={40} max={220} value={sMin} onChange={setSMin} hint="makin tinggi, makin banyak latar tidak ikut" />
          <Slider id="p15-a" label="Ukuran objek minimum" min={50} max={2000} value={minArea} onChange={setMinArea} hint="piksel, membuang bintik kecil" />

          {mode === 'ajari' && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <Button variant="secondary" onClick={toggleFreeze} disabled={!running}>
                  {frozen ? 'Lanjutkan gambar langsung' : 'Bekukan gambar'}
                </Button>
              </div>
              {frozen && selBlob && (
                <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(128,128,128,0.35)', fontSize: 14 }}>
                  <strong>Objek #{selBlob.id}</strong> · luas {selBlob.area} piksel · rasio {selBlob.aspect.toFixed(2)} · kepadatan {selBlob.fill.toFixed(2)} · hue {Math.round(selBlob.hue)}° · titik pusat ({Math.round(selBlob.cx)}, {Math.round(selBlob.cy)})
                  <div style={{ opacity: 0.75, fontSize: 12, marginTop: 4 }}>
                    Fitur: {FEATURE_NAMES.map((n, i) => `${n} ${selFeat[i].toFixed(2)}`).join(' · ')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <Button onClick={() => addSample('target')}>Ini kubus target</Button>
                    <Button variant="secondary" onClick={() => addSample('bukan')}>Bukan target</Button>
                  </div>
                </div>
              )}
              {frozen && !selBlob && <p className="hint">Klik salah satu kotak di gambar untuk memilih objek yang mau diberi label.</p>}
              {!frozen && running && <p className="hint">Letakkan objek di depan kamera, lalu bekukan gambar untuk memberi label.</p>}
            </div>
          )}

          <p className="hint">
            Contoh terkumpul: kubus target <strong>{counts.target}</strong>, bukan target <strong>{counts.bukan}</strong>
            {` (minimal ${MIN_PER_LABEL} masing-masing)`}.{' '}
            {samples.length > 0 && (
              <button type="button" onClick={() => setSamples([])} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 0 }}>
                Hapus semua contoh
              </button>
            )}
          </p>
          <p className="hint">Beri contoh yang beragam: posisi, jarak, dan cahaya yang berbeda. Model hanya sebaik contoh yang kamu berikan.</p>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {done ? (
          <span className="hint hint--ok">Misi ditandai selesai.</span>
        ) : (
          <>
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={!(trained && tested)} style={{ marginTop: 4 }} />
              <span>Pada mode uji, model memberi label yang benar untuk kubus target dan objek lain.</span>
            </label>
            <Button onClick={onDone} disabled={!(trained && tested && confirmed)}>
              Selesaikan misi
            </Button>
            {!(trained && tested) && (
              <p className="hint">
                Syarat: minimal {MIN_PER_LABEL} contoh tiap label, lalu jalankan mode uji dengan objek terlihat kamera
                {trained ? ` (${Math.min(predFrames, MIN_PREDICTION_FRAMES)}/${MIN_PREDICTION_FRAMES} frame diuji)` : ''}.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
