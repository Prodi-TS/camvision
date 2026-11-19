import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import CaptureButton from '../../components/CaptureButton.jsx'
import CameraPicker, { cameraStream, savedCameraId, saveCameraId, useExternalConfirm } from '../../components/CameraPicker.jsx'
import PreflightPanel from '../../components/PreflightPanel.jsx'
import { RES, FPS, FOV, IFACE, evaluate } from './ownCamOps.js'

// Mengukur FPS sebenarnya dari aliran video selama sekitar 2 detik.
function measureFps(video, ms = 2000) {
  return new Promise((resolve) => {
    if (!video.requestVideoFrameCallback) {
      resolve(null)
      return
    }
    let n = 0
    let t0 = null
    let finished = false
    const finish = (val) => {
      if (finished) return
      finished = true
      resolve(val)
    }
    const tick = (now) => {
      if (finished) return
      if (t0 == null) t0 = now
      else n++
      if (now - t0 >= ms) {
        finish(n / ((now - t0) / 1000))
        return
      }
      video.requestVideoFrameCallback(tick)
    }
    video.requestVideoFrameCallback(tick)
    setTimeout(() => finish(null), ms + 3000)
  })
}

function Pick({ id, label, hint, options, value, onChange }) {
  return (
    <label htmlFor={id} style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 14 }}>
        {label} <span style={{ opacity: 0.7 }}>({hint})</span>
      </span>
      <select id={id} value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 320 }}>
        <option value="">Pilih…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.text}</option>
        ))}
      </select>
    </label>
  )
}

const btn = (active) => ({
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  border: '1px solid #0d7a94',
  background: active ? '#0d7a94' : 'transparent',
  color: active ? '#ffffff' : 'inherit',
  font: 'inherit',
  fontSize: 14,
  fontWeight: 600,
})

export default function OwnCamera({ value, onChange }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [external, setExternal] = useExternalConfirm()
  const [deviceId, setDeviceId] = useState(savedCameraId)
  const [running, setRunning] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const [error, setError] = useState('')

  const v = value || {}
  const m = v.measured || null
  const ev = evaluate(v)
  const set = (patch) => onChange(patch)

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setRunning(false)
    setMeasuring(false)
  }, [])
  useEffect(() => stop, [stop])

  async function start(idArg) {
    const id = typeof idArg === 'string' ? idArg : deviceId
    setError('')
    try {
      const stream = await cameraStream(id)
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      setRunning(true)
      const track = stream.getVideoTracks()[0]
      const st = track.getSettings ? track.getSettings() : {}
      const cap = track.getCapabilities ? track.getCapabilities() : {}
      setMeasuring(true)
      const fps = await measureFps(video)
      if (!streamRef.current) return
      setMeasuring(false)
      set({
        measured: {
          label: track.label || '',
          width: st.width || video.videoWidth,
          height: st.height || video.videoHeight,
          fps,
          capW: cap.width && cap.width.max ? cap.width.max : null,
          capH: cap.height && cap.height.max ? cap.height.max : null,
          capFps: cap.frameRate && cap.frameRate.max ? cap.frameRate.max : null,
        },
      })
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

  // Perbandingan isian datasheet dengan hasil pengukuran (petunjuk, bukan penilaian).
  const notes = []
  if (m) {
    const claimRes = RES.find((r) => r.id === v.res)
    if (claimRes && claimRes.width && m.capW && claimRes.width > m.capW) {
      notes.push(`Kamu memilih ${claimRes.text}, tetapi kamera hanya melaporkan sampai ${m.capW} × ${m.capH}. Baca lagi angka pada datasheet atau kemasan.`)
    }
    const claimFps = FPS.find((r) => r.id === v.fps)
    if (claimFps && claimFps.fps && claimFps.id !== '90' && m.fps != null && m.fps < claimFps.fps * 0.75) {
      notes.push(`FPS terukur (${m.fps.toFixed(0)}) lebih rendah dari datasheet (${claimFps.fps}). Penyebab umum: cahaya ruangan redup sehingga kamera menurunkan FPS, port USB yang dipakai bersama perangkat lain, atau kamera belum memakai mode tercepatnya.`)
    }
  }

  return (
    <div>
      <div className="note-box">
        <strong>Misi:</strong> ukur webcam yang sedang kamu pegang, isi datasheet-nya, lalu nilai apakah webcam itu
        memenuhi kebutuhan misi AMR (Interface USB, FPS minimal 30, FOV minimal 60°, Resolution minimal 1280 × 720).
      </div>

      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} disabled={running} style={{ marginTop: 4 }} />
          <span>Saya memakai webcam USB eksternal, bukan kamera bawaan laptop.</span>
        </label>
        <PreflightPanel />
        <CameraPicker
          deviceId={deviceId}
          running={running}
          disabled={measuring}
          onChange={(id) => {
            setDeviceId(id)
            saveCameraId(id)
            if (running) {
              stop()
              start(id)
            }
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!running ? (
            <Button onClick={start} disabled={!external}>Nyalakan dan ukur kamera</Button>
          ) : (
            <Button variant="secondary" onClick={stop}>Matikan kamera</Button>
          )}
          {measuring && <span className="hint">Mengukur FPS selama sekitar 2 detik…</span>}
        </div>
        {!external && !running && <p className="hint">Centang dulu pernyataan di atas untuk menyalakan kamera.</p>}
        {error && (
          <p role="alert" style={{ margin: 0, padding: '10px 14px', borderRadius: 8, color: '#991b1b', background: '#fee2e2' }}>
            {error}
          </p>
        )}
      </div>

      <video
        ref={videoRef}
        playsInline
        muted
        aria-label="Gambar dari webcam"
        style={{ width: '100%', maxWidth: 320, borderRadius: 8, background: '#111', marginTop: 12, display: running ? 'block' : 'none' }}
      />
      <CaptureButton
        slot="webcam"
        enabled={running}
        getSource={() => videoRef.current}
        note={m && m.label ? `Kamera: ${m.label}` : ''}
      />

      {m && (
        <>
          <h3 style={{ marginTop: 18 }}>Hasil Pengukuran</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
              <tbody>
                {[
                  ['Nama kamera', m.label || 'tidak dilaporkan'],
                  ['Resolusi yang dipakai lab ini', `${m.width} × ${m.height}`],
                  ['Resolusi maksimum yang dilaporkan kamera', m.capW ? `${m.capW} × ${m.capH}` : 'tidak dilaporkan browser'],
                  ['FPS terukur', m.fps == null ? 'tidak bisa diukur di browser ini' : `${m.fps.toFixed(1)} FPS`],
                  ['FPS maksimum yang dilaporkan kamera', m.capFps ? `${Math.round(m.capFps)} FPS` : 'tidak dilaporkan browser'],
                ].map(([k, val]) => (
                  <tr key={k} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 6 }}>{k}</td>
                    <td style={{ padding: 6 }}><strong>{val}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">
            Browser tidak bisa membaca FOV dan jenis interface. Dua hal itu, serta angka resolusi dan FPS resmi,
            kamu cari di datasheet, kotak kemasan, atau halaman penjual.
          </p>
        </>
      )}

      <h3 style={{ marginTop: 18 }}>Isi Datasheet Webcam-mu</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <Pick id="oc-res" label="Resolution" hint="resolusi maksimum" options={RES} value={v.res} onChange={(x) => set({ res: x })} />
        <Pick id="oc-fps" label="FPS" hint="frame per detik" options={FPS} value={v.fps} onChange={(x) => set({ fps: x })} />
        <Pick id="oc-fov" label="Field of View" hint="sudut pandang" options={FOV} value={v.fov} onChange={(x) => set({ fov: x })} />
        <Pick id="oc-iface" label="Interface" hint="cara terhubung" options={IFACE} value={v.iface} onChange={(x) => set({ iface: x })} />
      </div>

      {notes.length > 0 && (
        <div className="note-box" style={{ display: 'block' }}>
          {notes.map((n) => (
            <p key={n} style={{ margin: '0 0 6px' }}>{n}</p>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 18 }}>Cocok untuk Misi AMR?</h3>
      <ul className="checklist">
        {ev.rows.map((r) => (
          <li key={r.key} className="checklist__item">
            <span>{r.label}</span>
            <span className={r.status === 'ok' ? 'hint hint--ok' : 'hint'}>
              {r.status === 'ok' ? '✓ terpenuhi' : r.status === 'fail' ? '✗ belum terpenuhi' : 'belum diketahui'}
            </span>
          </li>
        ))}
      </ul>

      <p style={{ margin: '12px 0 6px' }}>Menurutmu, apakah webcam ini memenuhi semua kebutuhan misi AMR?</p>
      <div role="group" aria-label="Keputusan" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" aria-pressed={v.decision === 'ya'} onClick={() => set({ decision: 'ya' })} style={btn(v.decision === 'ya')}>
          Ya, memenuhi
        </button>
        <button type="button" aria-pressed={v.decision === 'belum'} onClick={() => set({ decision: 'belum' })} style={btn(v.decision === 'belum')}>
          Belum memenuhi
        </button>
      </div>
      {v.decision && (
        <p
          role="status"
          style={{
            margin: '10px 0 0',
            padding: '8px 12px',
            borderRadius: 8,
            ...(ev.fit === null
              ? { color: '#92400e', background: '#fef3c7' }
              : (v.decision === 'ya') === ev.fit
                ? { color: '#166534', background: '#dcfce7' }
                : { color: '#991b1b', background: '#fee2e2' }),
          }}
        >
          {ev.fit === null
            ? 'Ada data yang belum diketahui. Cari di kotak kemasan, halaman penjual, atau datasheet, lalu isi lagi.'
            : (v.decision === 'ya') === ev.fit
              ? ev.fit
                ? 'Sesuai. Semua kebutuhan terpenuhi, jadi webcam ini cocok untuk misi AMR.'
                : 'Sesuai. Ada kebutuhan yang belum terpenuhi, jadi webcam ini belum cocok untuk misi AMR.'
              : 'Belum sesuai dengan daftar kebutuhan di atas. Periksa lagi baris yang bertanda ✗ atau belum diketahui.'}
        </p>
      )}

      {!(m && v.res && v.fps && v.fov && v.iface && v.decision) && (
        <p className="hint">Aktivitas ini selesai bila kamera sudah diukur, keempat isian datasheet dipilih, dan keputusan dibuat.</p>
      )}
    </div>
  )
}
