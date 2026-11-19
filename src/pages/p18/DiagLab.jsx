import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import CaptureButton from '../../components/CaptureButton.jsx'
import CameraPicker, { cameraStream, savedCameraId, saveCameraId, useExternalConfirm } from '../../components/CameraPicker.jsx'
import PreflightPanel from '../../components/PreflightPanel.jsx'
import { W, H, segment, findBlobs } from '../p15/blobOps.js'
import { COLORS } from '../p16/missionOps.js'
import { TESTS, REC_MS, SAMPLE_MS, PASS_PRESENT, PASS_ABSENT } from '../p17/testOps.js'
import { MIN_AREA, TINY_AREA, HYPOTHESES, FACTOR_CHOICES, summarizeDiag, inferCauses, verdict, strongestFactor } from './analysisOps.js'

const pct = (x) => (x == null ? '-' : `${Math.round(x * 100)}%`)
const num = (x) => (x == null ? '-' : String(Math.round(x)))
const msText = (x) => (x == null ? '-' : `${x.toFixed(1)} ms`)
const pts = (x) => `${Math.round(x * 100)} poin`

const COMPARE_ROWS = [
  { group: 'Jarak', label: 'Dekat (15 cm)', id: 't1' },
  { group: 'Jarak', label: 'Sedang (30 cm)', id: 't2' },
  { group: 'Jarak', label: 'Jauh (60 cm)', id: 't3' },
  { group: 'Cahaya', label: 'Normal (jarak sedang)', id: 't2' },
  { group: 'Cahaya', label: 'Redup (jarak sedang)', id: 't4' },
  { group: 'Cahaya', label: 'Terang (jarak sedang)', id: 't7' },
]

export default function DiagLab({ p17Results, analysis, setAnalysis, done, onDone, needed = 2 }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(0)
  const canvasRef = useRef(null)
  const workRef = useRef(null)
  const recRef = useRef(null)
  const viewRef = useRef('asli')

  const [external, setExternal] = useExternalConfirm()
  const [deviceId, setDeviceId] = useState(savedCameraId)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [color, setColor] = useState('merah')
  const [sMin, setSMin] = useState(110)
  const [view, setView] = useState('asli')
  const [selected, setSelected] = useState(() => {
    const failed = TESTS.find((t) => p17Results[t.id] && !(t.present ? p17Results[t.id].rate >= PASS_PRESENT : p17Results[t.id].rate <= PASS_ABSENT))
    return (failed || TESTS[0]).id
  })
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [confirmed, setConfirmed] = useState(false)

  const cfg = useRef({})
  cfg.current = { color, sMin }
  viewRef.current = view
  const cbRef = useRef({})
  cbRef.current = { setAnalysis }

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    recRef.current = null
    setRecording(false)
    setRunning(false)
  }, [])
  useEffect(() => stop, [stop])

  const render = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(render)
      return
    }
    const c = cfg.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!workRef.current) workRef.current = document.createElement('canvas')
    const work = workRef.current
    work.width = W
    work.height = H
    const wctx = work.getContext('2d', { willReadFrequently: true })
    wctx.drawImage(video, 0, 0, W, H)
    const t0 = performance.now() // waktu pemrosesan: dari gambar diterima sampai target ditentukan
    const img = wctx.getImageData(0, 0, W, H)
    const data = img.data
    const mask = segment(data, c.sMin, 60)
    const all = findBlobs(data, mask, TINY_AREA)
    const hueOk = COLORS[c.color].test
    const targets = all.filter((b) => hueOk(b.hue))
    const top = targets[0] || null
    const found = !!top && top.area >= MIN_AREA
    const tiny = !!top && top.area < MIN_AREA
    const decoy = all.some((b) => !hueOk(b.hue) && b.area >= MIN_AREA)
    const procMs = performance.now() - t0

    // Tampilan tahap: gambar asli atau mask (hasil pemisahan warna)
    if (viewRef.current === 'mask') {
      const out = ctx.createImageData(W, H)
      for (let p = 0, i = 0; p < W * H; p++, i += 4) {
        const v = mask[p] ? 255 : 0
        out.data[i] = v
        out.data[i + 1] = v
        out.data[i + 2] = v
        out.data[i + 3] = 255
      }
      ctx.putImageData(out, 0, 0)
    } else {
      ctx.putImageData(img, 0, 0)
    }
    all.forEach((b) => {
      const ok = hueOk(b.hue)
      ctx.lineWidth = 2
      ctx.strokeStyle = !ok ? '#f59e0b' : b.area >= MIN_AREA ? '#16a34a' : '#dc2626'
      ctx.strokeRect(b.box.x, b.box.y, b.box.w, b.box.h)
    })

    const rec = recRef.current
    const now = performance.now()
    if (rec) {
      if (now - rec.last >= SAMPLE_MS) {
        rec.last = now
        let sat = null
        if (top) {
          let sum = 0
          let cnt = 0
          for (let y = top.box.y; y < top.box.y + top.box.h; y++) {
            for (let x = top.box.x; x < top.box.x + top.box.w; x++) {
              const p = y * W + x
              if (!mask[p]) continue
              const i = p * 4
              const mx = Math.max(data[i], data[i + 1], data[i + 2])
              const mn = Math.min(data[i], data[i + 1], data[i + 2])
              sum += mx ? (255 * (mx - mn)) / mx : 0
              cnt++
            }
          }
          sat = cnt ? sum / cnt : null
        }
        let bsum = 0
        let bcnt = 0
        for (let i = 0; i < data.length; i += 16) {
          bsum += Math.max(data[i], data[i + 1], data[i + 2])
          bcnt++
        }
        rec.samples.push({ found, tiny, decoy, area: top ? top.area : 0, sat, bright: bsum / bcnt, ms: procMs })
        setProgress(Math.min(1, (now - rec.start) / REC_MS))
      }
      ctx.fillStyle = '#dc2626'
      ctx.beginPath()
      ctx.arc(W - 14, 14, 6, 0, Math.PI * 2)
      ctx.fill()
      if (now - rec.start >= REC_MS) {
        recRef.current = null
        setRecording(false)
        setProgress(0)
        cbRef.current.setAnalysis(rec.id, { metrics: summarizeDiag(rec.samples), sMin: c.sMin })
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

  function record() {
    recRef.current = { id: selected, start: performance.now(), last: 0, samples: [] }
    setRecording(true)
    setProgress(0)
  }

  const test = TESTS.find((t) => t.id === selected)
  const entry = analysis[selected] || {}
  const m = entry.metrics
  const causes = m ? inferCauses(test, m, entry.sMin ?? sMin) : null
  const v = m && entry.hypothesis ? verdict(entry.hypothesis, causes) : null
  const analyzed = TESTS.filter((t) => analysis[t.id] && analysis[t.id].metrics && analysis[t.id].hypothesis).length
  const strongest = strongestFactor(p17Results)
  const factorChoice = analysis._factor && analysis._factor.choice
  const ready = analyzed >= needed && (!strongest || !!factorChoice)
  const msVals = ['t1', 't2', 't3', 't4', 't7']
    .filter((id) => p17Results[id] && p17Results[id].ms != null)
    .map((id) => ({ id, ms: p17Results[id].ms, label: TESTS.find((t) => t.id === id).label }))
  const msMin = msVals.length ? msVals.reduce((a, b) => (b.ms < a.ms ? b : a)) : null
  const msMax = msVals.length ? msVals.reduce((a, b) => (b.ms > a.ms ? b : a)) : null

  const p17Of = (t) => p17Results[t.id]
  const p17Pass = (t) => {
    const r = p17Of(t)
    return r ? (t.present ? r.rate >= PASS_PRESENT : r.rate <= PASS_ABSENT) : null
  }

  return (
    <div>
      <p>
        <strong>Misi:</strong> pilih kondisi uji, rekam datanya, lalu tentukan penyebab hasilnya. Setiap dugaan
        diperiksa dengan bukti dari data. Analisis minimal {needed} kondisi, mulai dari yang gagal saat pengujian.
      </p>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
        <input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} disabled={running} />
        <span>Saya memakai webcam USB eksternal, bukan kamera bawaan laptop.</span>
      </label>
      <PreflightPanel />
      <CameraPicker
        deviceId={deviceId}
        running={running}
        disabled={recording}
        onChange={(id) => {
          setDeviceId(id)
          saveCameraId(id)
          if (running) {
            stop()
            start(id)
          }
        }}
      />
      <div style={{ margin: '8px 0 12px' }}>
        {!running ? (
          <Button onClick={start} disabled={!external}>Nyalakan kamera</Button>
        ) : (
          <Button onClick={stop} variant="secondary">Matikan kamera</Button>
        )}
      </div>
      {error && <p role="alert" className="hint" style={{ color: '#991b1b' }}>{error}</p>}
      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: '100%', maxWidth: 480, aspectRatio: `${W}/${H}`, background: '#111', borderRadius: 8 }}
            aria-label="Gambar dari webcam dengan kotak deteksi"
          />
          <p className="hint">
            Kotak hijau: target terdeteksi. Merah: warna target tetapi terlalu kecil. Kuning: warna lain.
          </p>
        </div>
        <div>
          <div role="group" aria-label="Tampilan tahap" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {[['asli', 'Gambar asli'], ['mask', 'Hasil pemisahan warna']].map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={view === k}
                onClick={() => setView(k)}
                style={{
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', font: 'inherit', fontSize: 14,
                  border: '1px solid #0d7a94', color: 'inherit',
                  background: view === k ? 'rgba(13,122,148,0.15)' : 'transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Warna target" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {Object.entries(COLORS).map(([k, c]) => (
              <button
                key={k}
                type="button"
                aria-pressed={color === k}
                disabled={recording}
                onClick={() => setColor(k)}
                style={{
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', font: 'inherit', fontSize: 14,
                  border: '1px solid #0d7a94', color: 'inherit',
                  background: color === k ? 'rgba(13,122,148,0.15)' : 'transparent',
                }}
              >
                Target: {c.label}
              </button>
            ))}
          </div>
          <label htmlFor="a-s" style={{ fontSize: 14 }}>
            Kepekatan warna minimum: <strong>{sMin}</strong>
          </label>
          <input id="a-s" type="range" min={40} max={220} step={5} value={sMin} disabled={recording} onChange={(e) => setSMin(Number(e.target.value))} style={{ width: '100%' }} />
          <p className="hint">Pakai pengaturan yang sama dengan saat pengujian.</p>
        </div>
      </div>

      <h3 style={{ marginTop: 20 }}>Bandingkan Hasil Pengujian</h3>
      {Object.keys(p17Results).length === 0 ? (
        <p className="hint">Belum ada hasil pengujian di akun ini. Rekam dulu ketujuh kondisi pada tahap Vision Testing agar bisa dibandingkan.</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #9ca3af' }}>
                  <th style={{ padding: 6 }}>Faktor</th>
                  <th style={{ padding: 6 }}>Kondisi</th>
                  <th style={{ padding: 6 }}>Tingkat deteksi</th>
                  <th style={{ padding: 6 }}>Waktu proses</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => {
                  const r = p17Results[row.id]
                  return (
                    <tr key={`${row.group}-${row.label}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 6 }}>{row.group}</td>
                      <td style={{ padding: 6 }}>{row.label}</td>
                      <td style={{ padding: 6 }}>{r ? pct(r.rate) : '-'}</td>
                      <td style={{ padding: 6 }}>{r ? msText(r.ms) : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {strongest ? (
            <>
              <p style={{ margin: '10px 0 0' }}>
                Menurutmu, faktor mana yang paling memengaruhi keberhasilan deteksi?
              </p>
              <div role="radiogroup" aria-label="Faktor paling berpengaruh" style={{ display: 'grid', gap: 6, margin: '8px 0' }}>
                {FACTOR_CHOICES.map((f) => (
                  <label key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="faktor"
                      checked={factorChoice === f.id}
                      onChange={() => setAnalysis('_factor', { choice: f.id })}
                    />
                    <span>{f.text}</span>
                  </label>
                ))}
              </div>
              {factorChoice && (
                <div className="note-box" style={{ display: 'block' }}>
                  <p style={{ margin: 0 }}>
                    <strong>Periksa dengan data:</strong> selisih tingkat deteksi karena jarak {pts(strongest.d)}, karena cahaya {pts(strongest.c)}.{' '}
                    {factorChoice === strongest.id
                      ? 'Data mendukung jawabanmu.'
                      : strongest.id === 'sama'
                        ? 'Data menunjukkan pengaruh keduanya hampir sama.'
                        : `Data lebih menunjuk ke ${FACTOR_CHOICES.find((f) => f.id === strongest.id).text.toLowerCase()}.`}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="hint">Perbandingan faktor muncul setelah uji jarak dekat, sedang, jauh, cahaya redup, dan cahaya terang sudah direkam.</p>
          )}

          {msMin && msMax && msVals.length >= 2 && (
            <p style={{ margin: '8px 0 0' }}>
              <strong>Waktu pemrosesan:</strong> berkisar {msText(msMin.ms)} ({msMin.label.toLowerCase()}) sampai {msText(msMax.ms)} ({msMax.label.toLowerCase()}).{' '}
              {msMax.ms <= msMin.ms * 1.5
                ? 'Waktunya relatif stabil di berbagai kondisi, jadi kegagalan deteksi bukan disebabkan oleh kecepatan.'
                : 'Waktunya berbeda cukup jauh antar kondisi. Penyebab umumnya jumlah objek atau bercak warna di gambar berbeda.'}
            </p>
          )}
        </>
      )}

      <h3 style={{ marginTop: 20 }}>1. Pilih Kondisi</h3>
      <div role="group" aria-label="Pilih kondisi" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TESTS.map((t, i) => {
          const pass = p17Pass(t)
          const a = analysis[t.id]
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={selected === t.id}
              disabled={recording}
              onClick={() => setSelected(t.id)}
              style={{
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer', font: 'inherit', fontSize: 14,
                border: '1px solid #0d7a94', color: 'inherit',
                background: selected === t.id ? 'rgba(13,122,148,0.15)' : 'transparent',
              }}
            >
              {i + 1}. {t.label} {pass === false ? '⚠' : ''} {a && a.metrics && a.hypothesis ? '✓' : ''}
            </button>
          )
        })}
      </div>
      <p className="hint">
        {Object.keys(p17Results).length
          ? '⚠ menandai kondisi yang gagal saat pengujian. ✓ menandai kondisi yang sudah dianalisis.'
          : 'Belum ada hasil pengujian di akun ini. Kamu tetap bisa menganalisis kondisi mana pun.'}
      </p>

      <div className="note-box" style={{ display: 'block' }}>
        <p style={{ margin: 0 }}>
          <strong>{test.label}.</strong> {test.how}
          {p17Of(test) && <> Saat pengujian: tingkat deteksi {pct(p17Of(test).rate)} ({p17Pass(test) ? 'lulus' : 'gagal'}).</>}
        </p>
        <p style={{ margin: '8px 0 0' }}>
          <Button onClick={record} disabled={!running || recording}>
            {recording ? `Merekam… ${Math.round(progress * 100)}%` : `Rekam ${REC_MS / 1000} detik`}
          </Button>
        </p>
        <CaptureButton
          slot={`analisis-${selected}`}
          enabled={running}
          getSource={() => canvasRef.current}
          note={`${test.label}. Tampilan: ${view === 'mask' ? 'hasil pemisahan warna' : 'gambar asli'}`}
        />
      </div>

      {m && (
        <>
          <h3>2. Data</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
              <tbody>
                {[
                  ['Tingkat deteksi (luas ≥ ' + MIN_AREA + ')', pct(m.rate)],
                  ['Terlihat tetapi terlalu kecil (luas < ' + MIN_AREA + ')', pct(m.tinyRate)],
                  ['Luas kotak target (tengah)', m.medArea == null ? '-' : `${num(m.medArea)} piksel`],
                  ['Kecerahan gambar (0 sampai 255)', num(m.bright)],
                  ['Kepekatan warna target (0 sampai 255)', num(m.sat)],
                  ['Waktu pemrosesan (median per frame)', msText(m.ms)],
                  ['Benda warna lain terdeteksi', pct(m.decoyRate)],
                ].map(([k, val]) => (
                  <tr key={k} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 6 }}>{k}</td>
                    <td style={{ padding: 6 }}><strong>{val}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>3. Dugaanmu</h3>
          <p style={{ margin: 0 }}>Menurutmu, apa penyebab utama hasil pada kondisi ini?</p>
          <div role="radiogroup" style={{ display: 'grid', gap: 6, margin: '8px 0' }}>
            {HYPOTHESES.map((h) => (
              <label key={h.id} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hipotesis"
                  checked={entry.hypothesis === h.id}
                  onChange={() => setAnalysis(selected, { ...entry, hypothesis: h.id })}
                />
                <span>{h.text}</span>
              </label>
            ))}
          </div>

          {v && (
            <div className="note-box" style={{ display: 'block' }}>
              <p style={{ margin: 0 }}>
                <strong>4. Periksa dengan bukti:</strong> {v.text}
              </p>
            </div>
          )}
        </>
      )}

      <p className="hint">Kondisi dianalisis: {analyzed}/{TESTS.length} (minimal {needed}).</p>

      {done ? (
        <p className="hint hint--ok">Analisis sudah ditandai selesai.</p>
      ) : (
        <div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={!ready} />
            <span>Aku sudah memeriksa dugaanku dengan data, dan siap memperbaiki penyebabnya pada tahap Vision Optimization.</span>
          </label>
          <Button onClick={onDone} disabled={!ready || !confirmed}>Selesaikan analisis</Button>
          {!ready && (
            <p className="hint">
              Syarat: rekam data dan pilih dugaan untuk minimal {needed} kondisi
              {strongest ? ', lalu jawab faktor yang paling berpengaruh pada bagian perbandingan' : ''}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
