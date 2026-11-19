import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Card from '../../../components/Card.jsx'
import Button from '../../../components/Button.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import ProgressBar from '../../../components/ProgressBar.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { useAuth } from '../../../auth.jsx'
import {
  W,
  H,
  MIN_CAUGHT,
  MAX_WRONG,
  makeSamplePhotos,
  sampleTarget,
  runPipeline,
  evaluate,
} from './labImageOps.js'

// Image Processing Lab: rakit pipeline filter dan uji pada tiga kondisi cahaya.
// Foto berasal dari webcam siswa sendiri atau dari foto contoh buatan.
// Foto hanya disimpan di memori halaman. Tidak dikirim ke mana pun.

const MARK = '#0d7a94'
const OK = { color: '#166534', background: '#dcfce7' }
const BAD = { color: '#991b1b', background: '#fee2e2' }

const CONDITIONS = [
  { id: 'terang', label: 'Cahaya terang', hint: 'Lampu atau cahaya ruangan penuh, kubus terlihat jelas.' },
  { id: 'redup', label: 'Cahaya redup', hint: 'Matikan sebagian lampu atau tutup tirai.' },
  { id: 'bayangan', label: 'Ada bayangan', hint: 'Halangi cahaya dengan tangan atau buku sehingga sebagian kubus tertutup bayangan.' },
]

const DEFAULT_PARAMS = { blur: true, clean: true, method: 'hsv', tol: 60, hTol: 12, sMin: 80, vMin: 50 }

const REFLECTION_QUESTIONS = [
  { id: 'r1', text: 'Pada kondisi cahaya mana filter RGB paling sering gagal, dan apa penyebabnya?' },
  { id: 'r2', text: 'Mengapa langkah membersihkan bintik (erode lalu dilate) berguna sebelum robot memakai hasilnya?' },
]

const INITIAL = {
  photosDone: false,
  rgbPasses: null,
  hsvPasses: null,
  missionDone: false,
  finding1: '',
  finding2: '',
  reflection: { r1: '', r2: '' },
  reflectionSaved: false,
}

const FINDING2_OPTIONS = [
  'HSV memakai lebih sedikit piksel daripada RGB.',
  'Hue memisahkan jenis warna dari tingkat terang-gelapnya, jadi lebih tahan perubahan cahaya.',
  'RGB tidak bisa dibaca oleh komputer.',
]
const FINDING2_ANSWER = FINDING2_OPTIONS[1]

function useLabState(username) {
  const key = `cv-amr-lab-image-processing:${username}`
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL
    } catch {
      return INITIAL
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* penyimpanan browser tidak tersedia */
    }
  }, [key, state])
  const update = useCallback(
    (patch) =>
      setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) })),
    []
  )
  return { state, update }
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

const canvasStyle = {
  width: '100%',
  height: 'auto',
  aspectRatio: `${W} / ${H}`,
  background: '#000000',
  borderRadius: 8,
  display: 'block',
}

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

function Check({ checked, onChange, children }) {
  return (
    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 4 }} />
      <span>{children}</span>
    </label>
  )
}

// Menggambar foto dengan kotak kubus. Bila editable, kotak digambar dengan menyeret.
function PhotoCanvas({ photo, box, editable, picking, onBox, onPick }) {
  const ref = useRef(null)
  const drag = useRef(null)
  const [live, setLive] = useState(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (photo) {
      ctx.putImageData(new ImageData(new Uint8ClampedArray(photo.data), W, H), 0, 0)
    } else {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, W, H)
    }
    const b = live || box
    if (b) {
      ctx.strokeStyle = '#ff3b30'
      ctx.lineWidth = 2
      ctx.strokeRect(b.x, b.y, b.w, b.h)
    }
  }, [photo, box, live])

  function pos(e) {
    const r = ref.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(W, ((e.clientX - r.left) / r.width) * W)),
      y: Math.max(0, Math.min(H, ((e.clientY - r.top) / r.height) * H)),
    }
  }

  function down(e) {
    if (!photo) return
    const p = pos(e)
    if (picking) {
      onPick(p)
      return
    }
    if (!editable) return
    ref.current.setPointerCapture(e.pointerId)
    drag.current = p
  }
  function move(e) {
    if (!drag.current) return
    const p = pos(e)
    const s = drag.current
    setLive({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) })
  }
  function up() {
    if (!drag.current) return
    const b = live
    drag.current = null
    setLive(null)
    if (b && b.w > 8 && b.h > 8) onBox(b)
  }

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      style={{ ...canvasStyle, cursor: picking ? 'crosshair' : editable ? 'crosshair' : 'default', touchAction: 'none' }}
    />
  )
}

function MaskCanvas({ mask }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    const img = ctx.createImageData(W, H)
    for (let p = 0; p < W * H; p++) {
      const v = mask && mask[p] ? 255 : 0
      img.data[p * 4] = img.data[p * 4 + 1] = img.data[p * 4 + 2] = v
      img.data[p * 4 + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }, [mask])
  return <canvas ref={ref} width={W} height={H} style={canvasStyle} />
}

export default function ImageProcessingLab({ lab }) {
  const { user } = useAuth()
  const { state, update } = useLabState(user?.username ?? 'tamu')

  // ---- Foto (hanya di memori) ----
  const [source, setSource] = useState('webcam')
  const [photos, setPhotos] = useState({ terang: null, redup: null, bayangan: null })
  const [boxes, setBoxes] = useState({ terang: null, redup: null, bayangan: null })
  const [target, setTarget] = useState(null)
  const [picking, setPicking] = useState(false)
  const [params, setParams] = useState(DEFAULT_PARAMS)

  // ---- Kamera ----
  const videoRef = useRef(null)
  const liveRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(0)
  const [external, setExternal] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const stopCam = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setRunning(false)
  }, [])
  useEffect(() => stopCam, [stopCam])

  const drawLive = useCallback(() => {
    const v = videoRef.current
    const c = liveRef.current
    if (v && c && v.readyState >= 2) c.getContext('2d').drawImage(v, 0, 0, W, H)
    rafRef.current = requestAnimationFrame(drawLive)
  }, [])

  async function startCam() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setRunning(true)
      rafRef.current = requestAnimationFrame(drawLive)
    } catch (e) {
      stopCam()
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

  function capture(id) {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(videoRef.current, 0, 0, W, H)
    const img = ctx.getImageData(0, 0, W, H)
    setPhotos((p) => ({ ...p, [id]: { data: img.data } }))
    setBoxes((b) => ({ ...b, [id]: null }))
  }

  function useSamples() {
    stopCam()
    const s = makeSamplePhotos()
    setSource('contoh')
    setPhotos({ terang: s.terang, redup: s.redup, bayangan: s.bayangan })
    setBoxes({ terang: s.terang.box, redup: s.redup.box, bayangan: s.bayangan.box })
    setTarget(sampleTarget(s.terang.data, 125, 140))
    setParams(DEFAULT_PARAMS)
  }

  function useWebcam() {
    setSource('webcam')
    setPhotos({ terang: null, redup: null, bayangan: null })
    setBoxes({ terang: null, redup: null, bayangan: null })
    setTarget(null)
  }

  function pickTarget(p) {
    const t = sampleTarget(photos.terang.data, p.x, p.y)
    setTarget(t)
    setPicking(false)
    setParams((prev) => ({
      ...prev,
      sMin: Math.round(t.s * 0.5),
      vMin: Math.round(t.v * 0.3),
    }))
  }

  const allPhotos = CONDITIONS.every((c) => photos[c.id])
  const allBoxes = CONDITIONS.every((c) => boxes[c.id])
  const ready = allPhotos && allBoxes

  useEffect(() => {
    if (ready && !state.photosDone) update({ photosDone: true })
  }, [ready, state.photosDone, update])

  // ---- Hasil pipeline langsung ----
  const results = useMemo(() => {
    if (!ready || !target) return null
    return CONDITIONS.map((c) => {
      const mask = runPipeline(photos[c.id].data, target, params)
      return { id: c.id, mask, ...evaluate(mask, boxes[c.id]) }
    })
  }, [ready, target, photos, boxes, params])

  const passes = results ? results.filter((r) => r.ok).length : 0
  const allPass = results ? passes === CONDITIONS.length : false

  function record() {
    const key = params.method === 'rgb' ? 'rgbPasses' : 'hsvPasses'
    update((prev) => ({
      [key]: passes,
      missionDone: prev.missionDone || allPass,
    }))
  }

  const bothTried = state.rgbPasses !== null && state.hsvPasses !== null
  const correctFinding1 = !bothTried
    ? null
    : state.hsvPasses > state.rgbPasses
      ? 'HSV'
      : state.rgbPasses > state.hsvPasses
        ? 'RGB'
        : 'Sama saja'
  const finding1Done = bothTried && state.finding1 === correctFinding1
  const finding2Done = state.finding2 === FINDING2_ANSWER
  const findingDone = finding1Done && finding2Done
  const reflectionAll = REFLECTION_QUESTIONS.every((q) => (state.reflection[q.id] || '').trim().length > 0)
  const reflectionDone = state.reflectionSaved && reflectionAll

  const tasks = [
    { id: 'foto', label: 'Foto tiga kondisi cahaya dan kotak kubus', done: state.photosDone },
    { id: 'misi', label: 'Pipeline lulus di ketiga kondisi', done: state.missionDone },
    { id: 'temuan', label: 'Temuan RGB dan HSV', done: findingDone },
    { id: 'refleksi', label: 'Refleksi', done: reflectionDone },
  ]
  const doneCount = tasks.filter((t) => t.done).length
  const percent = Math.round((doneCount / tasks.length) * 100)
  const status = doneCount === 0 ? 'Belum dimulai' : doneCount === tasks.length ? 'Selesai' : 'Sedang dipelajari'
  const [justSaved, setJustSaved] = useState(false)

  const setP = (patch) => setParams((p) => ({ ...p, ...patch }))

  return (
    <div className="page">
      <PageHeader
        title={lab?.title ?? 'Image Processing Lab'}
        description="Rakit pipeline filter, lalu uji pada tiga kondisi cahaya."
        icon={lab?.icon ?? 'sliders'}
        status={status}
      />

      <Card>
        <h2>Progress</h2>
        <ProgressBar value={percent} label="Progress lab" size="lg" />
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 8 }}>
          {tasks.map((t) => (
            <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span>{t.label}</span>
              <StatusBadge status={t.done ? 'Selesai' : 'Belum dimulai'} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2>Langkah 1. Misi</h2>
        <p>
          AMR harus menemukan kubus target walaupun cahaya berubah-ubah. Rakit satu pipeline
          filter yang berhasil di <strong>tiga kondisi cahaya</strong> sekaligus: terang, redup,
          dan ada bayangan.
        </p>
        <p>
          Pipeline dinilai pada tiap kondisi. Lulus bila minimal{' '}
          <strong>{Math.round(MIN_CAUGHT * 100)}%</strong> area kotak kubus tertangkap dan paling
          banyak <strong>{Math.round(MAX_WRONG * 100)}%</strong> area di luar kotak ikut tertangkap.
        </p>
      </Card>

      <Card>
        <h2>Langkah 2. Siapkan tiga foto</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-label="Sumber foto">
          <button type="button" style={btn(source === 'webcam')} aria-pressed={source === 'webcam'} onClick={useWebcam}>
            Webcam saya
          </button>
          <button type="button" style={btn(source === 'contoh')} aria-pressed={source === 'contoh'} onClick={useSamples}>
            Foto contoh
          </button>
        </div>

        {source === 'contoh' && (
          <p className="note-box">
            Foto contoh adalah gambar buatan (DATA SIMULASI) dengan kubus merah, lengkap dengan
            kotak kubusnya. Pakai ini bila webcam tidak tersedia.
          </p>
        )}

        {source === 'webcam' && (
          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            <p style={{ margin: 0 }}>
              Letakkan satu kubus kertas di depan webcam USB. Ambil satu foto untuk tiap kondisi
              cahaya, dengan kubus di posisi yang sama.
            </p>
            <Check checked={external} onChange={setExternal}>
              Saya memakai webcam USB eksternal, bukan kamera bawaan laptop.
            </Check>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!running ? (
                <Button onClick={startCam} disabled={!external}>
                  Nyalakan kamera
                </Button>
              ) : (
                <Button variant="secondary" onClick={stopCam}>
                  Matikan kamera
                </Button>
              )}
            </div>
            {error && (
              <p role="alert" style={{ margin: 0, padding: '10px 14px', borderRadius: 8, ...BAD }}>
                {error}
              </p>
            )}
            <video ref={videoRef} playsInline muted style={{ display: 'none' }} />
            <div style={{ maxWidth: 360 }}>
              <canvas ref={liveRef} width={W} height={H} style={canvasStyle} />
              <p className="hint">Tampilan langsung dari kamera</p>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {CONDITIONS.map((c) => (
            <figure key={c.id} style={{ margin: 0 }}>
              <PhotoCanvas
                photo={photos[c.id]}
                box={boxes[c.id]}
                editable={source === 'webcam'}
                picking={picking && c.id === 'terang'}
                onBox={(b) => setBoxes((x) => ({ ...x, [c.id]: b }))}
                onPick={pickTarget}
              />
              <figcaption style={{ fontSize: 14, marginTop: 6 }}>
                <strong>{c.label}</strong>
                <div style={{ opacity: 0.75, fontSize: 13 }}>{c.hint}</div>
                {source === 'webcam' && (
                  <div style={{ marginTop: 6 }}>
                    <Button variant="secondary" onClick={() => capture(c.id)} disabled={!running}>
                      {photos[c.id] ? 'Ambil ulang' : 'Ambil foto'}
                    </Button>
                  </div>
                )}
              </figcaption>
            </figure>
          ))}
        </div>

        {source === 'webcam' && allPhotos && !allBoxes && (
          <p className="hint">
            Sekarang tarik kotak merah di sekeliling kubus pada tiap foto (klik, seret, lepas).
          </p>
        )}
        {source === 'webcam' && !allPhotos && (
          <p className="hint">Foto hilang jika halaman dimuat ulang, jadi selesaikan lab ini dalam satu sesi.</p>
        )}
      </Card>

      <Card>
        <h2>Langkah 3. Rakit pipeline</h2>
        {!ready ? (
          <p className="hint">Selesaikan Langkah 2 (tiga foto dan tiga kotak kubus) untuk membuka langkah ini.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
            <div>
              <Button variant="secondary" onClick={() => setPicking((v) => !v)}>
                {picking ? 'Batal memilih' : target ? 'Pilih ulang warna kubus' : 'Pilih warna kubus'}
              </Button>
              <p className="hint">
                {picking
                  ? 'Klik pada kubus di foto "Cahaya terang".'
                  : target
                    ? `Warna target: RGB ${Math.round(target.r)}, ${Math.round(target.g)}, ${Math.round(target.b)}.`
                    : 'Klik kubus di foto "Cahaya terang" untuk mengambil warna targetnya.'}
              </p>
            </div>

            {target && (
              <>
                <Check checked={params.blur} onChange={(v) => setP({ blur: v })}>
                  <strong>Haluskan</strong> (blur 3×3) sebelum disaring, supaya bintik kecil berkurang.
                </Check>

                <div>
                  <p style={{ margin: '0 0 6px' }}>
                    <strong>Filter warna</strong>
                  </p>
                  <div role="group" aria-label="Metode filter warna" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" style={btn(params.method === 'rgb')} aria-pressed={params.method === 'rgb'} onClick={() => setP({ method: 'rgb' })}>
                      RGB (jarak warna)
                    </button>
                    <button type="button" style={btn(params.method === 'hsv')} aria-pressed={params.method === 'hsv'} onClick={() => setP({ method: 'hsv' })}>
                      HSV
                    </button>
                  </div>
                </div>

                {params.method === 'rgb' ? (
                  <Slider id="ip-tol" label="Toleransi" min={10} max={200} value={params.tol} onChange={(v) => setP({ tol: v })} hint="seberapa jauh warna boleh berbeda dari target" />
                ) : (
                  <>
                    <Slider id="ip-htol" label="Toleransi Hue" min={2} max={40} value={params.hTol} onChange={(v) => setP({ hTol: v })} hint="jenis warna" />
                    <Slider id="ip-smin" label="S min" min={0} max={255} value={params.sMin} onChange={(v) => setP({ sMin: v })} hint="kepekatan" />
                    <Slider id="ip-vmin" label="V min" min={0} max={255} value={params.vMin} onChange={(v) => setP({ vMin: v })} hint="terang gelap" />
                  </>
                )}

                <Check checked={params.clean} onChange={(v) => setP({ clean: v })}>
                  <strong>Bersihkan bintik</strong> (erode lalu dilate) setelah disaring.
                </Check>
              </>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h2>Langkah 4. Uji di tiga kondisi</h2>
        {!results ? (
          <p className="hint">Pilih warna kubus di Langkah 3 untuk melihat hasil uji.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {results.map((r, i) => (
                <figure key={r.id} style={{ margin: 0 }}>
                  <MaskCanvas mask={r.mask} />
                  <figcaption style={{ fontSize: 14, marginTop: 6 }}>
                    <strong>{CONDITIONS[i].label}</strong>
                    <div>Tertangkap: <strong>{Math.round(r.caught * 100)}%</strong> dari kotak</div>
                    <div>Salah tangkap: <strong>{(r.wrong * 100).toFixed(1)}%</strong> dari luar kotak</div>
                    <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 6, fontSize: 12, ...(r.ok ? OK : BAD) }}>
                      {r.ok ? 'Lulus' : 'Belum lulus'}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p role="status" style={{ margin: '14px 0 0', padding: '10px 14px', borderRadius: 8, ...(allPass ? OK : BAD) }}>
              {allPass
                ? 'Pipeline lulus di ketiga kondisi cahaya.'
                : `Lulus ${passes} dari ${CONDITIONS.length} kondisi. Ubah filter atau parameternya.`}
            </p>
            <div style={{ marginTop: 12 }}>
              <Button onClick={record}>Catat hasil metode {params.method === 'rgb' ? 'RGB' : 'HSV'}</Button>
              <p className="hint">
                Catat hasil untuk RGB dan juga HSV. Keduanya dipakai di Langkah 5.
                {state.rgbPasses !== null && ` RGB tercatat: lulus ${state.rgbPasses}/3.`}
                {state.hsvPasses !== null && ` HSV tercatat: lulus ${state.hsvPasses}/3.`}
              </p>
            </div>
          </>
        )}
      </Card>

      <Card>
        <h2>Langkah 5. Temuan</h2>
        {!bothTried ? (
          <p className="hint">Catat hasil untuk metode RGB dan metode HSV di Langkah 4 untuk membuka langkah ini.</p>
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <p style={{ margin: '0 0 8px' }}>
                <strong>1.</strong> Berdasarkan hasil yang kamu catat, metode mana yang lulus di lebih banyak kondisi cahaya?
              </p>
              <div role="group" aria-label="Metode paling stabil" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['RGB', 'HSV', 'Sama saja'].map((o) => (
                  <button key={o} type="button" style={btn(state.finding1 === o)} aria-pressed={state.finding1 === o} onClick={() => update({ finding1: o })}>
                    {o}
                  </button>
                ))}
              </div>
              {state.finding1 && (
                <p role="status" style={{ margin: '8px 0 0', padding: '8px 12px', borderRadius: 8, ...(finding1Done ? OK : BAD) }}>
                  {finding1Done
                    ? `Benar. Hasil yang kamu catat: RGB lulus ${state.rgbPasses}/3 dan HSV lulus ${state.hsvPasses}/3.`
                    : 'Belum tepat. Bandingkan jumlah kondisi yang lulus pada hasil RGB dan HSV yang tercatat di Langkah 4.'}
                </p>
              )}
            </div>
            <div>
              <p style={{ margin: '0 0 8px' }}>
                <strong>2.</strong> Mengapa filter HSV lebih tahan perubahan cahaya daripada RGB?
              </p>
              <div role="group" aria-label="Alasan HSV" style={{ display: 'grid', gap: 8 }}>
                {FINDING2_OPTIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={state.finding2 === o}
                    onClick={() => update({ finding2: o })}
                    style={{ ...btn(false), textAlign: 'left', fontWeight: 400, background: state.finding2 === o ? 'rgba(13,122,148,0.15)' : 'transparent' }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              {state.finding2 && (
                <p role="status" style={{ margin: '8px 0 0', padding: '8px 12px', borderRadius: 8, ...(finding2Done ? OK : BAD) }}>
                  {finding2Done
                    ? 'Benar. Saat cahaya berubah, Value berubah paling banyak sedangkan Hue relatif tetap.'
                    : 'Belum tepat. Pikirkan apa yang berubah pada warna kubus saat cahaya redup.'}
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2>Langkah 6. Refleksi</h2>
        <div className="reflection">
          {REFLECTION_QUESTIONS.map((q, i) => (
            <div key={q.id} className="reflection__item">
              <label htmlFor={`ip-${q.id}`}>
                {i + 1}. {q.text}
              </label>
              <textarea
                id={`ip-${q.id}`}
                rows={3}
                value={state.reflection[q.id] || ''}
                onChange={(e) => {
                  setJustSaved(false)
                  update((prev) => ({ reflection: { ...prev.reflection, [q.id]: e.target.value }, reflectionSaved: false }))
                }}
                placeholder="Tulis jawabanmu dengan kata-katamu sendiri."
              />
            </div>
          ))}
          <div className="reflection__actions">
            <Button
              onClick={() => {
                update({ reflectionSaved: true })
                setJustSaved(true)
              }}
              disabled={!reflectionAll}
            >
              Simpan Refleksi
            </Button>
            {!reflectionAll && <span className="hint">Isi kedua pertanyaan untuk menyimpan.</span>}
            {reflectionAll && (state.reflectionSaved || justSaved) && <span className="hint hint--ok">Refleksi tersimpan di browser ini.</span>}
          </div>
        </div>
      </Card>

      <div className="page-actions">
        <Button to="/virtual-lab" variant="secondary">
          Kembali ke Virtual Lab
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (window.confirm('Ulangi lab dari awal? Jawaban dan foto akan dihapus.')) {
              stopCam()
              setPhotos({ terang: null, redup: null, bayangan: null })
              setBoxes({ terang: null, redup: null, bayangan: null })
              setTarget(null)
              setParams(DEFAULT_PARAMS)
              setSource('webcam')
              update(INITIAL)
            }
          }}
        >
          Ulangi dari awal
        </Button>
      </div>
    </div>
  )
}
