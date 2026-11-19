import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import CaptureButton from '../../components/CaptureButton.jsx'
import CameraPicker, { cameraStream, savedCameraId, saveCameraId, useExternalConfirm } from '../../components/CameraPicker.jsx'
import PreflightPanel from '../../components/PreflightPanel.jsx'
import { W, H, segment, findBlobs } from '../p15/blobOps.js'
import { useAuth } from '../../auth.jsx'
import { COLORS, STATES, pickTarget, decide, positionOf, CHECKS, ACTION_TEXT } from './missionOps.js'

const ARENA = 200
const CHECK_MS = 1500

function actionOf(d) {
  if (d.state === 'belok') return d.angular > 0 ? 'belok_kiri' : 'belok_kanan'
  return d.state
}

// Petunjuk perbaikan bila keputusan tidak sesuai harapan.
function tipFor(expect, got) {
  if (got === 'cari' && expect !== 'cari') return 'Kubus tidak terdeteksi. Periksa warna target dan kepekatan warna minimum, lalu pastikan kotak muncul pada kubus.'
  if (expect === 'cari') return 'Ada benda lain yang warnanya sama terdeteksi sebagai target. Singkirkan benda itu, atau naikkan kepekatan warna minimum.'
  if (expect === 'belok_kiri' || expect === 'belok_kanan') {
    if (got === 'belok_kiri' || got === 'belok_kanan') return 'Arahnya terbalik. Lihat sisi kiri dan kanan pada gambar kamera, bukan sisi kiri dan kanan tubuhmu.'
    return 'Kubus masih berada di zona tengah. Geser lebih ke tepi gambar, atau perkecil lebar zona tengah.'
  }
  if (got === 'belok_kiri' || got === 'belok_kanan') return 'Kubus belum berada di zona tengah (area biru). Geser kubus ke tengah gambar.'
  if (expect === 'maju') return 'Kubus sudah lebih dekat dari jarak berhenti. Jauhkan kubus, atau perbesar jarak berhenti.'
  return 'Kubus masih lebih jauh dari jarak berhenti. Dekatkan kubus, atau kecilkan jarak berhenti.'
}

function useChecks(username) {
  const key = `cv-amr-p16-checks:${username}`
  const read = () => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }
  const [checks, setChecks] = useState(read)
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(checks))
    } catch {
      /* penyimpanan browser tidak tersedia */
    }
  }, [key, checks])
  return [checks, (id, result) => setChecks((prev) => ({ ...prev, [id]: result })), () => setChecks({})]
}

const STATE_COLOR = { cari: '#6b7280', belok: '#d97706', maju: '#16a34a', berhenti: '#dc2626' }

function Slider({ id, label, value, min, max, step = 1, hint, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 4, margin: '10px 0' }}>
      <label htmlFor={id} style={{ fontSize: 14 }}>
        {label}: <strong>{value}</strong>
        {hint && <span style={{ opacity: 0.7 }}> ({hint})</span>}
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

export default function MissionLab({ done, onDone }) {
  const { user } = useAuth()
  const [checks, setCheck, clearChecks] = useChecks(user.username)
  const recRef = useRef(null) // { id, start, counts, n, cxSum, cxN, distSum, distN }
  const lastDecRef = useRef(null)
  const cbRef = useRef({})
  cbRef.current = { setCheck }
  const [recId, setRecId] = useState(null)
  const [recProgress, setRecProgress] = useState(0)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(0)
  const canvasRef = useRef(null)
  const arenaRef = useRef(null)
  const workRef = useRef(null)
  const frameRef = useRef(0)
  const poseRef = useRef({ x: ARENA / 2, y: ARENA / 2 + 30, th: 0, trail: [] })
  const lastRef = useRef(0)

  const [external, setExternal] = useExternalConfirm()
  const [deviceId, setDeviceId] = useState(savedCameraId)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [color, setColor] = useState('merah')
  const [sMin, setSMin] = useState(110)
  const [deadzone, setDeadzone] = useState(0.15)
  const [stopCm, setStopCm] = useState(15)
  const [sizeMm, setSizeMm] = useState(38)
  const [focal, setFocal] = useState(277) // piksel; perkiraan awal untuk FOV sekitar 60 derajat
  const [calDist, setCalDist] = useState(30)
  const [calNote, setCalNote] = useState('')
  const lastHRef = useRef(0)
  const [cmd, setCmd] = useState({ state: 'cari', linear: 0, angular: 0, error: null })
  const [confirmed, setConfirmed] = useState(false)

  const cfg = useRef({})
  cfg.current = { color, sMin, deadzone, stopCm, sizeMm, focal }

  const recorded = CHECKS.filter((c) => checks[c.id]).length
  const matched = CHECKS.filter((c) => checks[c.id] && checks[c.id].ok).length
  const allRecorded = recorded === CHECKS.length

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    recRef.current = null
    setRecId(null)
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
    const img = wctx.getImageData(0, 0, W, H)
    const mask = segment(img.data, c.sMin, 60)
    const blobs = findBlobs(img.data, mask, 300)
    const target = pickTarget(blobs, c.color)
    const stopH = Math.max(6, Math.min(H, (c.focal * c.sizeMm) / (c.stopCm * 10)))
    const distCm = target ? (c.focal * c.sizeMm) / target.box.h / 10 : null
    lastHRef.current = target ? target.box.h : 0
    const base = decide(target, { ...c, stopH })
    const d = { ...base, distCm, cx: target ? target.cx : null, cy: target ? target.cy : null, pos: positionOf(base.error, c.deadzone) }
    lastDecRef.current = d

    ctx.putImageData(img, 0, 0)
    // zona tengah
    const half = c.deadzone * (W / 2)
    ctx.fillStyle = 'rgba(37,99,235,0.15)'
    ctx.fillRect(W / 2 - half, 0, half * 2, H)
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(W / 2, 0)
    ctx.lineTo(W / 2, H)
    ctx.stroke()
    // garis ambang berhenti (tinggi kotak)
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.strokeRect(W / 2 - stopH / 2, H / 2 - stopH / 2, stopH, stopH)
    ctx.setLineDash([])
    if (target) {
      const { x, y, w, h } = target.box
      ctx.lineWidth = 3
      ctx.strokeStyle = STATE_COLOR[d.state]
      ctx.strokeRect(x, y, w, h)
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillStyle = STATE_COLOR[d.state]
      ctx.fillText(`~${Math.round(d.distCm)} cm`, x + 3, Math.max(2, y - 16))
      ctx.fillStyle = STATE_COLOR[d.state]
      ctx.beginPath()
      ctx.arc(target.cx, target.cy, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.textBaseline = 'top'
    const label = STATES[d.state].text.toUpperCase()
    const tw = ctx.measureText(label).width + 10
    ctx.fillStyle = STATE_COLOR[d.state]
    ctx.fillRect(6, 6, tw, 18)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, 11, 9)

    // robot virtual: integrasi perintah gerak (hanya ilustrasi)
    const now = performance.now()
    const dt = lastRef.current ? Math.min(0.1, (now - lastRef.current) / 1000) : 0
    lastRef.current = now
    const p = poseRef.current
    p.th -= d.angular * dt
    p.x = Math.max(12, Math.min(ARENA - 12, p.x + Math.sin(p.th) * d.linear * 150 * dt))
    p.y = Math.max(12, Math.min(ARENA - 12, p.y - Math.cos(p.th) * d.linear * 150 * dt))
    if (d.linear > 0 && frameRef.current % 3 === 0) {
      p.trail.push([p.x, p.y])
      if (p.trail.length > 150) p.trail.shift()
    }
    const ac = arenaRef.current
    if (ac) {
      const a = ac.getContext('2d')
      a.clearRect(0, 0, ARENA, ARENA)
      a.fillStyle = '#f3f4f6'
      a.fillRect(0, 0, ARENA, ARENA)
      a.strokeStyle = '#9ca3af'
      a.strokeRect(0.5, 0.5, ARENA - 1, ARENA - 1)
      a.strokeStyle = '#60a5fa'
      a.beginPath()
      p.trail.forEach(([x, y], i) => (i ? a.lineTo(x, y) : a.moveTo(x, y)))
      a.stroke()
      a.save()
      a.translate(p.x, p.y)
      a.rotate(p.th)
      a.fillStyle = STATE_COLOR[d.state]
      a.fillRect(-9, -11, 18, 22)
      a.fillStyle = '#fff'
      a.beginPath()
      a.moveTo(0, -14)
      a.lineTo(-6, -6)
      a.lineTo(6, -6)
      a.fill()
      a.restore()
    }

    const rec = recRef.current
    if (rec) {
      const act = actionOf(d)
      rec.counts[act] = (rec.counts[act] || 0) + 1
      rec.n++
      if (d.cx != null) { rec.cxSum += d.cx; rec.cxN++ }
      if (d.distCm != null) { rec.distSum += d.distCm; rec.distN++ }
      const elapsed = now - rec.start
      if (frameRef.current % 4 === 0) setRecProgress(Math.min(1, elapsed / CHECK_MS))
      if (elapsed >= CHECK_MS) {
        recRef.current = null
        const entries = Object.entries(rec.counts).sort((a, b) => b[1] - a[1])
        const [got, count] = entries[0]
        const share = count / rec.n
        const check = CHECKS.find((k) => k.id === rec.id)
        cbRef.current.setCheck(rec.id, {
          ok: got === check.expect && share >= 0.8,
          got,
          share,
          cx: rec.cxN ? rec.cxSum / rec.cxN : null,
          dist: rec.distN ? rec.distSum / rec.distN : null,
        })
        setRecId(null)
        setRecProgress(0)
      }
    }
    frameRef.current++
    if (frameRef.current % 6 === 0) setCmd(d)
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
      lastRef.current = 0
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

  function recordCheck(id) {
    recRef.current = { id, start: performance.now(), counts: {}, n: 0, cxSum: 0, cxN: 0, distSum: 0, distN: 0 }
    setRecId(id)
    setRecProgress(0)
  }

  function resetRobot() {
    poseRef.current = { x: ARENA / 2, y: ARENA / 2 + 30, th: 0, trail: [] }
  }

  const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2)

  return (
    <div>
      <p>
        <strong>Misi:</strong> webcam adalah mata robot. Geser kubus di depan kamera, atau pegang webcam dan
        gerakkan menuju kubus. Lihat keputusan robot: <strong>SEARCH, TURN LEFT, TURN RIGHT, MOVE FORWARD, STOP</strong>. Lalu catat hasil lima kondisi misi pada tabel Catatan Misi.
      </p>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}>
        <input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} />
        <span>Saya memakai webcam USB eksternal, bukan kamera bawaan laptop.</span>
      </label>
      <PreflightPanel />
      <CameraPicker
        deviceId={deviceId}
        running={running}
        disabled={false}
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
            aria-label="Gambar dari webcam dengan keputusan robot"
          />
          <p className="hint">
            Area biru adalah zona tengah. Kotak putus-putus adalah ukuran kubus pada jarak berhenti. Jarak dihitung dari tinggi kotak, jadi hanya perkiraan.
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
          <Slider id="m-s" label="Kepekatan warna minimum" value={sMin} min={40} max={220} step={5} onChange={setSMin} />
          <Slider id="m-d" label="Lebar zona tengah" value={deadzone} min={0.05} max={0.5} step={0.05} hint="makin kecil, makin sering belok" onChange={setDeadzone} />
          <Slider id="m-h" label="Jarak berhenti" value={stopCm} min={5} max={60} step={1} hint="cm dari kamera ke kubus" onChange={setStopCm} />

          <div className="note-box" style={{ display: 'block' }}>
            <p style={{ margin: 0 }}><strong>Kalibrasi jarak (opsional)</strong></p>
            <p className="hint" style={{ margin: '4px 0 8px' }}>
              Perkiraan awal sudah ada, tetapi tiap webcam berbeda. Letakkan kubus pada jarak yang diukur dengan
              penggaris, lalu tekan Kalibrasi.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label>
                Ukuran kubus{' '}
                <select value={sizeMm} onChange={(e) => { setSizeMm(Number(e.target.value)); setCalNote('') }}>
                  {[20, 38, 45].map((v) => <option key={v} value={v}>{v} mm</option>)}
                </select>
              </label>
              <label>
                Jarak sebenarnya{' '}
                <select value={calDist} onChange={(e) => setCalDist(Number(e.target.value))}>
                  {[15, 20, 30, 40].map((v) => <option key={v} value={v}>{v} cm</option>)}
                </select>
              </label>
              <Button
                variant="secondary"
                disabled={!running}
                onClick={() => {
                  if (!lastHRef.current) {
                    setCalNote('Kubus belum terdeteksi. Pastikan kotak hijau muncul pada kubus, lalu coba lagi.')
                    return
                  }
                  const f = (lastHRef.current * calDist * 10) / sizeMm
                  setFocal(f)
                  setCalNote(`Kalibrasi tersimpan. Jarak kubus ${sizeMm} mm kini dihitung dari tinggi kotaknya.`)
                }}
              >
                Kalibrasi
              </Button>
            </div>
            {calNote && <p className="hint" style={{ margin: '6px 0 0' }}>{calNote}</p>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, margin: '16px 0', alignItems: 'start' }}>
        <div className="note-box" style={{ display: 'block', margin: 0 }}>
          <p style={{ margin: 0 }}>
            <strong>Keputusan: {STATES[cmd.state].text}</strong>
          </p>
          <p style={{ margin: '4px 0 8px' }}>{STATES[cmd.state].hint}</p>
          <code style={{ display: 'block' }}>posisi: {cmd.pos || '-'}{cmd.cx != null ? ` (centroid x = ${Math.round(cmd.cx)} dari ${W})` : ''}</code>
          <code style={{ display: 'block' }}>jarak ≈ {cmd.distCm == null ? '-' : `${Math.round(cmd.distCm)} cm`}</code>
          <code style={{ display: 'block' }}>linear.x = {fmt(cmd.linear)} m/s</code>
          <code style={{ display: 'block' }}>angular.z = {fmt(cmd.angular)} rad/s</code>
          <p className="hint" style={{ marginBottom: 0 }}>
            Aturan dasar: LEFT = TURN LEFT, CENTER = MOVE FORWARD, RIGHT = TURN RIGHT, terlalu dekat = STOP.
          </p>
          <p className="hint" style={{ marginBottom: 0 }}>
            Padanan di ROS (hanya informasi): nilai ini dikirim sebagai pesan <code>geometry_msgs/Twist</code>{' '}
            ke topik <code>/cmd_vel</code>.
          </p>
        </div>

        <div>
          <canvas ref={arenaRef} width={ARENA} height={ARENA} style={{ width: 200, height: 200, borderRadius: 8 }} aria-label="Robot virtual dilihat dari atas" />
          <p className="hint" style={{ margin: '4px 0' }}>
            Robot virtual (hanya ilustrasi perintah).{' '}
            <button type="button" onClick={resetRobot} style={{ background: 'none', border: 0, padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
              Kembalikan ke tengah
            </button>
          </p>
        </div>

        <div>
          <p style={{ margin: '0 0 6px' }}><strong>Ringkasan catatan</strong></p>
          <p style={{ margin: 0 }}>Sudah dicatat: {recorded} dari {CHECKS.length}</p>
          <p style={{ margin: 0 }}>Keputusan sesuai: {matched} dari {CHECKS.length}</p>
        </div>
      </div>

      <h3>Catatan Misi ({recorded}/{CHECKS.length})</h3>
      <p className="hint" style={{ marginTop: 0 }}>
        Siapkan adegan sesuai kolom Kondisi, lalu tekan Catat. Sistem merekam keputusan robot selama {CHECK_MS / 1000} detik dan menilai
        apakah sesuai. Kondisi yang gagal boleh dicatat ulang setelah kamu memperbaiki pengaturannya.
        Tombol Ambil gambar di tiap baris menyimpan gambar kondisi itu ke portofolio. Gambar hanya tersimpan di browser ini, jadi hindari wajah orang lain di dalam gambar.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #9ca3af' }}>
              <th style={{ padding: 6 }}>Kondisi</th>
              <th style={{ padding: 6 }}>Keputusan yang benar</th>
              <th style={{ padding: 6 }}>Hasil catatan</th>
              <th style={{ padding: 6 }}>Status</th>
              <th style={{ padding: 6 }}></th>
            </tr>
          </thead>
          <tbody>
            {CHECKS.map((c) => {
              const r = checks[c.id]
              return (
                <Fragment key={c.id}>
                  <tr style={{ borderBottom: r && !r.ok ? 'none' : '1px solid #e5e7eb' }}>
                    <td style={{ padding: 6 }}>
                      <strong>{c.label}</strong>
                      <div className="hint" style={{ margin: 0 }}>{c.how}</div>
                    </td>
                    <td style={{ padding: 6 }}>{c.expectText}</td>
                    <td style={{ padding: 6 }}>
                      {r
                        ? `${ACTION_TEXT[r.got]} (${Math.round(r.share * 100)}%)${r.cx != null && (c.expect === 'belok_kiri' || c.expect === 'belok_kanan') ? `, x ≈ ${Math.round(r.cx)}` : ''}${r.dist != null && (c.expect === 'maju' || c.expect === 'berhenti') ? `, ≈ ${Math.round(r.dist)} cm` : ''}`
                        : '-'}
                    </td>
                    <td style={{ padding: 6 }}>{r ? (r.ok ? '✓ Sesuai' : '✗ Belum sesuai') : '-'}</td>
                    <td style={{ padding: 6 }}>
                      <Button variant="secondary" onClick={() => recordCheck(c.id)} disabled={!running || recId != null}>
                        {recId === c.id ? `Merekam ${Math.round(recProgress * 100)}%` : r ? 'Catat ulang' : 'Catat'}
                      </Button>
                      <CaptureButton slot={`misi-${c.id}`} compact enabled={running} getSource={() => canvasRef.current} note={c.label} />
                    </td>
                  </tr>
                  {r && !r.ok && (
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td colSpan={5} style={{ padding: '0 6px 8px' }}>
                        <span className="hint" style={{ margin: 0 }}>Petunjuk: {tipFor(c.expect, r.got)}</span>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {recorded > 0 && (
        <p>
          <button type="button" onClick={clearChecks} disabled={recId != null} style={{ background: 'none', border: 0, padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
            Hapus semua catatan
          </button>
        </p>
      )}

      {done ? (
        <p className="hint hint--ok">Misi sudah ditandai selesai.</p>
      ) : (
        <div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={!allRecorded} />
            <span>Catatan misi sudah lengkap, dan aku tahu aturan yang memicu tiap keputusan robot.</span>
          </label>
          <Button onClick={onDone} disabled={!allRecorded || !confirmed}>Selesaikan misi</Button>
          {!allRecorded && <p className="hint">Syarat: catat kelima kondisi pada Catatan Misi (hasilnya boleh sesuai atau belum sesuai).</p>}
        </div>
      )}
    </div>
  )
}
