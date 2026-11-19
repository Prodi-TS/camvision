import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import CaptureButton from '../../components/CaptureButton.jsx'
import CameraPicker, { cameraStream, savedCameraId, saveCameraId, useExternalConfirm } from '../../components/CameraPicker.jsx'
import PreflightPanel from '../../components/PreflightPanel.jsx'
import { W, H, segment, findBlobs, blur3 } from '../p15/blobOps.js'
import { TESTS, REC_MS, SAMPLE_MS, FRAME_BUDGET_MS, summarize, isPass, correctness, overall } from '../p17/testOps.js'
import { COLOR_CENTER, DEFAULTS, hueMatch, hueTolOf, paramsKey, changes, ADVICE } from './optOps.js'

const pct = (x) => (x == null ? '-' : `${Math.round(x * 100)}%`)
const msText = (x) => (x == null ? '-' : `${x.toFixed(1)} ms`)

function Slider({ id, label, value, min, max, step = 1, hint, disabled, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 4, margin: '10px 0' }}>
      <label htmlFor={id} style={{ fontSize: 14 }}>
        {label}: <strong>{value}</strong>
        {hint && <span style={{ opacity: 0.7 }}> ({hint})</span>}
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

export default function TuneLab({ before = {}, hypotheses = {}, after = {}, setAfter, clearAfter, done, onDone }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(0)
  const canvasRef = useRef(null)
  const workRef = useRef(null)
  const recRef = useRef(null)

  const [external, setExternal] = useExternalConfirm()
  const [deviceId, setDeviceId] = useState(savedCameraId)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [color, setColor] = useState('merah')
  const [sMin, setSMin] = useState(DEFAULTS.sMin)
  const [vMin, setVMin] = useState(DEFAULTS.vMin)
  const [minArea, setMinArea] = useState(DEFAULTS.minArea)
  const [tol, setTol] = useState(null)
  const [blur, setBlur] = useState(DEFAULTS.blur)
  const [selected, setSelected] = useState('t1')
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [live, setLive] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const liveRef = useRef(false)

  const params = { color, sMin, vMin, minArea, tol, blur }
  const cfg = useRef({})
  cfg.current = params
  const cbRef = useRef({})
  cbRef.current = { setAfter }

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
    if (c.blur) blur3(img.data)
    const mask = segment(img.data, c.sMin, c.vMin)
    const blobs = findBlobs(img.data, mask, c.minArea)
    const target = blobs.find((b) => hueMatch(b.hue, c.color, c.tol)) || null
    const procMs = performance.now() - t0

    ctx.putImageData(img, 0, 0)
    if (target) {
      const { x, y, w, h } = target.box
      ctx.lineWidth = 3
      ctx.strokeStyle = '#16a34a'
      ctx.strokeRect(x, y, w, h)
    }
    if (liveRef.current !== !!target) {
      liveRef.current = !!target
      setLive(!!target)
    }

    const rec = recRef.current
    const now = performance.now()
    if (rec) {
      if (now - rec.last >= SAMPLE_MS) {
        rec.last = now
        rec.samples.push(target ? { found: true, cx: target.cx, cy: target.cy, h: target.box.h, ms: procMs } : { found: false, cx: null, cy: null, h: null, ms: procMs })
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
        cbRef.current.setAfter(rec.id, { ...summarize(rec.samples), params: { ...c, tol: hueTolOf(c.color, c.tol) } })
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

  function resetDefaults() {
    setSMin(DEFAULTS.sMin)
    setVMin(DEFAULTS.vMin)
    setMinArea(DEFAULTS.minArea)
    setTol(null)
    setBlur(DEFAULTS.blur)
  }

  const key = paramsKey(params)
  const test = TESTS.find((t) => t.id === selected)
  const doneCount = TESTS.filter((t) => after[t.id]).length
  const sameKey = TESTS.every((t) => after[t.id] && paramsKey(after[t.id].params) === paramsKey(after[TESTS[0].id].params))
  const all = doneCount === TESTS.length
  const ready = all && sameKey
  const stale = TESTS.filter((t) => after[t.id] && paramsKey(after[t.id].params) !== key).length
  const ch = changes(params)

  const sumAfter = overall(after)
  const sumBefore = overall(Object.fromEntries(TESTS.filter((t) => before[t.id] && after[t.id]).map((t) => [t.id, before[t.id]])))
  const sumAfterMatched = overall(Object.fromEntries(TESTS.filter((t) => before[t.id] && after[t.id]).map((t) => [t.id, after[t.id]])))

  const hyp = hypotheses[selected]
  const advice = hyp ? ADVICE[hyp] : null

  return (
    <div>
      <p>
        <strong>Misi:</strong> perbaiki detektor tanpa merusak kondisi lain. Ubah <strong>satu pengaturan</strong>,
        rekam ulang, lalu bandingkan. Pada akhirnya, ketujuh kondisi harus direkam dengan pengaturan yang sama.
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
            aria-label="Gambar dari webcam dengan kotak target"
          />
          <p className="hint">
            Saat ini: <strong>{running ? (live ? 'target terdeteksi' : 'target tidak terdeteksi') : 'kamera mati'}</strong>
          </p>
        </div>

        <div>
          <div role="group" aria-label="Warna target" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            {Object.entries(COLOR_CENTER).map(([k, v]) => (
              <button
                key={k}
                type="button"
                aria-pressed={color === k}
                disabled={recording}
                onClick={() => { setColor(k); setTol(null) }}
                style={{
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', font: 'inherit', fontSize: 14,
                  border: '1px solid #0d7a94', color: 'inherit',
                  background: color === k ? 'rgba(13,122,148,0.15)' : 'transparent',
                }}
              >
                Target: {v.label}
              </button>
            ))}
          </div>
          <Slider id="o-s" label="Kepekatan warna minimum" value={sMin} min={40} max={220} step={5} hint="makin kecil makin longgar" disabled={recording} onChange={setSMin} />
          <Slider id="o-v" label="Kecerahan minimum" value={vMin} min={10} max={160} step={5} hint="makin kecil, area gelap ikut" disabled={recording} onChange={setVMin} />
          <Slider id="o-a" label="Luas minimum" value={minArea} min={30} max={1200} step={10} hint="piksel, makin kecil objek kecil ikut" disabled={recording} onChange={setMinArea} />
          <Slider id="o-t" label="Rentang warna" value={hueTolOf(color, tol)} min={5} max={70} step={5} hint="± derajat, makin lebar warna mirip ikut" disabled={recording} onChange={setTol} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0', fontSize: 14 }}>
            <input type="checkbox" checked={blur} disabled={recording} onChange={(e) => setBlur(e.target.checked)} />
            <span>Haluskan gambar (blur) <span style={{ opacity: 0.7 }}>(mengurangi derau, tetapi memperlambat pemrosesan)</span></span>
          </label>
          <p className="hint" style={{ margin: 0 }}>
            {ch.length ? `Yang kamu ubah dari bawaan: ${ch.join('; ')}.` : 'Pengaturan masih sama dengan bawaan.'}{' '}
            <button type="button" onClick={resetDefaults} disabled={recording} style={{ background: 'none', border: 0, padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
              Kembalikan ke bawaan
            </button>
          </p>
        </div>
      </div>

      <h3 style={{ marginTop: 20 }}>Rekam Ulang per Kondisi</h3>
      <div role="group" aria-label="Pilih kondisi" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TESTS.map((t, i) => {
          const b = before[t.id]
          const bad = b && !isPass(t, b.rate)
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
              {i + 1}. {t.label} {bad ? '⚠' : ''} {after[t.id] ? '✓' : ''}
            </button>
          )
        })}
      </div>
      <p className="hint">⚠ gagal saat pengujian. ✓ sudah direkam ulang.</p>

      <div className="note-box" style={{ display: 'block' }}>
        <p style={{ margin: 0 }}>
          <strong>{test.label}.</strong> {test.how}
        </p>
        {advice && (
          <p style={{ margin: '8px 0 0' }}>
            <strong>Dugaanmu saat analisis:</strong> {advice.fix} <em>Risiko:</em> {advice.risk}
          </p>
        )}
        <p style={{ margin: '8px 0 0' }}>
          <Button onClick={record} disabled={!running || recording}>
            {recording ? `Merekam… ${Math.round(progress * 100)}%` : `Rekam ${REC_MS / 1000} detik`}
          </Button>
        </p>
        <CaptureButton slot={`optimasi-${selected}`} enabled={running} getSource={() => canvasRef.current} note={`${test.label}, sesudah penyetelan`} />
      </div>
      {stale > 0 && (
        <p className="hint" style={{ color: '#92400e' }}>
          {stale} hasil direkam dengan pengaturan yang berbeda dari sekarang. Rekam ulang agar semuanya sebanding.
        </p>
      )}

      <h3>Sebelum dan Sesudah ({doneCount}/{TESTS.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #9ca3af' }}>
              <th style={{ padding: 6 }}>Kondisi</th>
              <th style={{ padding: 6 }}>Sebelum (pengujian)</th>
              <th style={{ padding: 6 }}>Sesudah</th>
              <th style={{ padding: 6 }}>Perubahan</th>
              <th style={{ padding: 6 }}>Waktu proses (sebelum → sesudah)</th>
              <th style={{ padding: 6 }}>Hasil</th>
            </tr>
          </thead>
          <tbody>
            {TESTS.map((t, i) => {
              const b = before[t.id]
              const a = after[t.id]
              let delta = '-'
              if (a && b) {
                const d = correctness(t, a.rate) - correctness(t, b.rate)
                delta = Math.abs(d) < 0.05 ? 'sama' : d > 0 ? `membaik (+${Math.round(d * 100)}%)` : `memburuk (${Math.round(d * 100)}%)`
              }
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 6 }}>{i + 1}. {t.label}</td>
                  <td style={{ padding: 6 }}>{b ? pct(b.rate) : '-'}</td>
                  <td style={{ padding: 6 }}>{a ? pct(a.rate) : '-'}</td>
                  <td style={{ padding: 6 }}>{delta}</td>
                  <td style={{ padding: 6 }}>{b && b.ms != null ? msText(b.ms) : '-'} → {a ? msText(a.ms) : '-'}</td>
                  <td style={{ padding: 6 }}>{a ? (isPass(t, a.rate) ? '✓ Lulus' : '✗ Gagal') : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">Angka pada kolom sebelum dan sesudah adalah tingkat deteksi. Pada kondisi tanpa kubus, makin rendah makin baik. Waktu proses adalah waktu yang dibutuhkan untuk memproses satu frame.</p>
      {doneCount > 0 && (
        <p>
          <button type="button" onClick={clearAfter} disabled={recording} style={{ background: 'none', border: 0, padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
            Hapus semua hasil sesudah
          </button>
        </p>
      )}

      {sumAfter && (
        <div className="note-box" style={{ display: 'block' }}>
          <p style={{ margin: 0 }}><strong>Ringkasan sesudah perbaikan:</strong></p>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            <li>Lulus: {sumAfter.passed} dari {sumAfter.total} uji</li>
            <li>Ketepatan keputusan: {pct(sumAfter.accuracy)}{sumBefore && sumBefore.accuracy != null ? ` (sebelum: ${pct(sumBefore.accuracy)} pada kondisi yang sama)` : ''}</li>
            <li>Alarm palsu rata-rata: {pct(sumAfter.falseAlarm)}</li>
            {sumAfter.ms != null && (
              <li>
                Waktu pemrosesan rata-rata: {msText(sumAfter.ms)} per frame
                {sumBefore && sumBefore.ms != null ? ` (sebelum: ${msText(sumBefore.ms)})` : ''}.{' '}
                {sumAfter.ms <= FRAME_BUDGET_MS
                  ? `Masih di bawah ${FRAME_BUDGET_MS} ms, jadi cukup cepat untuk kamera 30 FPS.`
                  : `Melebihi ${FRAME_BUDGET_MS} ms, jadi tidak mengejar kamera 30 FPS.`}
              </li>
            )}
          </ul>
          {sumBefore && sumBefore.ms != null && sumAfter.ms != null && sumAfter.ms > sumBefore.ms * 1.3 && (
            <p style={{ margin: '8px 0 0' }}>
              Waktu pemrosesan naik lebih dari 30%. Langkah tambahan seperti blur memperlambat sistem, jadi
              pertimbangkan apakah peningkatan ketepatannya sepadan.
            </p>
          )}
          {sumBefore && sumAfterMatched && (
            <p style={{ margin: '8px 0 0' }}>
              {sumAfterMatched.accuracy > sumBefore.accuracy + 0.02
                ? 'Secara keseluruhan perbaikanmu menaikkan ketepatan.'
                : sumAfterMatched.accuracy < sumBefore.accuracy - 0.02
                  ? 'Secara keseluruhan ketepatan turun. Ada perubahan yang merugikan kondisi lain. Cek baris yang memburuk.'
                  : 'Secara keseluruhan ketepatan hampir sama. Periksa apakah ada kondisi yang membaik sementara yang lain memburuk.'}
            </p>
          )}
        </div>
      )}

      {done ? (
        <p className="hint hint--ok">Optimasi sudah ditandai selesai.</p>
      ) : (
        <div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={!ready} />
            <span>Ketujuh kondisi sudah direkam dengan pengaturan yang sama, dan aku sudah memeriksa kondisi yang memburuk.</span>
          </label>
          <Button onClick={onDone} disabled={!ready || !confirmed}>Selesaikan optimasi</Button>
          {!ready && <p className="hint">Syarat: rekam ketujuh kondisi dengan pengaturan yang sama persis.</p>}
        </div>
      )}
    </div>
  )
}
