import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import CaptureButton from '../../components/CaptureButton.jsx'
import CameraPicker, { cameraStream, savedCameraId, saveCameraId, useExternalConfirm } from '../../components/CameraPicker.jsx'
import PreflightPanel from '../../components/PreflightPanel.jsx'
import { W, H, segment, findBlobs } from '../p15/blobOps.js'
import { COLORS, pickTarget } from '../p16/missionOps.js'
import { TESTS, REC_MS, SAMPLE_MS, PASS_PRESENT, PASS_ABSENT, FRAME_BUDGET_MS, summarize, isPass, correctness, overall } from './testOps.js'

const pct = (x) => (x == null ? '-' : `${Math.round(x * 100)}%`)
const msText = (x) => (x == null ? '-' : `${x.toFixed(1)} ms`)

export default function VisionTestLab({ results, setResult, clearResults, done, onDone }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(0)
  const canvasRef = useRef(null)
  const workRef = useRef(null)
  const recRef = useRef(null) // { id, start, last, samples }
  const liveRef = useRef(false)

  const [external, setExternal] = useExternalConfirm()
  const [deviceId, setDeviceId] = useState(savedCameraId)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [color, setColor] = useState('merah')
  const [sMin, setSMin] = useState(110)
  const [selected, setSelected] = useState('t1')
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [live, setLive] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const cfg = useRef({})
  cfg.current = { color, sMin }
  const cbRef = useRef({})
  cbRef.current = { setResult }

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
    const mask = segment(img.data, c.sMin, 60)
    const blobs = findBlobs(img.data, mask, 300)
    const target = pickTarget(blobs, c.color)
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
        cbRef.current.setResult(rec.id, summarize(rec.samples))
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
    const now = performance.now()
    recRef.current = { id: selected, start: now, last: 0, samples: [] }
    setRecording(true)
    setProgress(0)
  }

  const test = TESTS.find((t) => t.id === selected)
  const doneCount = TESTS.filter((t) => results[t.id]).length
  const all = doneCount === TESTS.length
  const sum = overall(results)

  return (
    <div>
      <p>
        <strong>Misi:</strong> uji detektor kubus pada tujuh kondisi. Untuk tiap kondisi, siapkan adegan
        sesuai petunjuk, lalu rekam {REC_MS / 1000} detik. Sistem menghitung hasilnya sendiri, termasuk posisi rata-rata
        target (centroid) dan waktu pemrosesan per frame.
      </p>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
        <input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} />
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
          <div role="group" aria-label="Warna target" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {Object.entries(COLORS).map(([k, v]) => (
              <button
                key={k}
                type="button"
                aria-pressed={color === k}
                onClick={() => setColor(k)}
                disabled={recording}
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
          <label htmlFor="t-s" style={{ fontSize: 14 }}>
            Kepekatan warna minimum: <strong>{sMin}</strong>
          </label>
          <input id="t-s" type="range" min={40} max={220} step={5} value={sMin} disabled={recording} onChange={(e) => setSMin(Number(e.target.value))} style={{ width: '100%' }} />
          <p className="hint">Atur satu kali, lalu jangan diubah selama pengujian agar hasil bisa dibandingkan.</p>
        </div>
      </div>

      <h3 style={{ marginTop: 20 }}>Daftar Uji</h3>
      <div role="group" aria-label="Pilih kondisi uji" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TESTS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={selected === t.id}
            onClick={() => setSelected(t.id)}
            disabled={recording}
            style={{
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer', font: 'inherit', fontSize: 14,
              border: '1px solid #0d7a94', color: 'inherit',
              background: selected === t.id ? 'rgba(13,122,148,0.15)' : 'transparent',
            }}
          >
            {i + 1}. {t.label} {results[t.id] ? '✓' : ''}
          </button>
        ))}
      </div>
      <div className="note-box" style={{ display: 'block' }}>
        <p style={{ margin: 0 }}>
          <strong>{test.label}.</strong> {test.how}{' '}
          Hasil diharapkan: {test.present ? `target terdeteksi di ≥ ${PASS_PRESENT * 100}% cuplikan` : `target terdeteksi di ≤ ${PASS_ABSENT * 100}% cuplikan`}.
        </p>
        <p style={{ margin: '8px 0 0' }}>
          <Button onClick={record} disabled={!running || recording}>
            {recording ? `Merekam… ${Math.round(progress * 100)}%` : `Rekam ${REC_MS / 1000} detik`}
          </Button>
        </p>
        <CaptureButton slot={`uji-${selected}`} enabled={running} getSource={() => canvasRef.current} note={test.label} />
      </div>

      <h3>Hasil Uji ({doneCount}/{TESTS.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #9ca3af' }}>
              <th style={{ padding: 6 }}>Kondisi</th>
              <th style={{ padding: 6 }}>Kubus</th>
              <th style={{ padding: 6 }}>Tingkat deteksi</th>
              <th style={{ padding: 6 }}>Kestabilan posisi</th>
              <th style={{ padding: 6 }}>Tinggi kotak</th>
              <th style={{ padding: 6 }}>Posisi (x, y)</th>
              <th style={{ padding: 6 }}>Waktu proses</th>
              <th style={{ padding: 6 }}>Hasil</th>
            </tr>
          </thead>
          <tbody>
            {TESTS.map((t, i) => {
              const r = results[t.id]
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 6 }}>{i + 1}. {t.label}</td>
                  <td style={{ padding: 6 }}>{t.present ? 'ada' : 'tidak ada'}</td>
                  <td style={{ padding: 6 }}>{r ? pct(r.rate) : '-'}</td>
                  <td style={{ padding: 6 }}>{r && r.jitter != null ? `±${r.jitter.toFixed(1)} px` : '-'}</td>
                  <td style={{ padding: 6 }}>{r && r.h != null ? `${Math.round(r.h)} px` : '-'}</td>
                  <td style={{ padding: 6 }}>{r && r.x != null ? `(${Math.round(r.x)}, ${r.y != null ? Math.round(r.y) : '-'})` : '-'}</td>
                  <td style={{ padding: 6 }}>{r ? msText(r.ms) : '-'}</td>
                  <td style={{ padding: 6 }}>{r ? (isPass(t, r.rate) ? '✓ Lulus' : '✗ Gagal') : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {doneCount > 0 && (
        <p>
          <button type="button" onClick={clearResults} disabled={recording} style={{ background: 'none', border: 0, padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
            Hapus semua hasil
          </button>
        </p>
      )}

      {sum && (
        <div className="note-box" style={{ display: 'block' }}>
          <p style={{ margin: 0 }}><strong>Ringkasan ({sum.total} uji):</strong></p>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            <li>Lulus: {sum.passed} dari {sum.total} uji</li>
            <li>Tingkat deteksi rata-rata saat kubus ada: {pct(sum.detection)}</li>
            <li>Alarm palsu rata-rata saat kubus tidak ada: {pct(sum.falseAlarm)}</li>
            <li>Ketepatan keputusan keseluruhan: {pct(sum.accuracy)}</li>
            {sum.ms != null && (
              <li>
                Waktu pemrosesan rata-rata: {msText(sum.ms)} per frame.{' '}
                {sum.ms <= FRAME_BUDGET_MS
                  ? `Masih di bawah ${FRAME_BUDGET_MS} ms, jadi cukup cepat untuk kamera 30 FPS.`
                  : `Melebihi ${FRAME_BUDGET_MS} ms, jadi tidak mengejar kamera 30 FPS.`}
              </li>
            )}
            <li>Kondisi paling lemah: <strong>{sum.weakest.label}</strong> ({pct(correctness(sum.weakest, results[sum.weakest.id].rate))} keputusan benar)</li>
          </ul>
        </div>
      )}

      {done ? (
        <p className="hint hint--ok">Pengujian sudah ditandai selesai.</p>
      ) : (
        <div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={!all} />
            <span>Ketujuh uji sudah saya rekam dan saya sudah melihat kondisi yang paling lemah.</span>
          </label>
          <Button onClick={onDone} disabled={!all || !confirmed}>Selesaikan pengujian</Button>
          {!all && <p className="hint">Syarat: rekam ketujuh kondisi uji.</p>}
        </div>
      )}
    </div>
  )
}
