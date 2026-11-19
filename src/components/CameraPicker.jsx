import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth.jsx'

const KEY = 'cv-amr-camera-id'

// Pilihan kamera diingat di browser ini supaya tidak perlu memilih ulang di tiap lab.
export function savedCameraId() {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

export function saveCameraId(id) {
  try {
    localStorage.setItem(KEY, id || '')
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
}

// Pernyataan "saya memakai webcam USB eksternal" diingat selama tab ini terbuka (per akun),
// jadi tidak perlu dicentang lagi di tiap lab atau tahap lab.
export function useExternalConfirm() {
  const { user } = useAuth()
  const key = `cv-amr-external-ok:${user ? user.username : ''}`
  const [value, setValue] = useState(() => {
    try {
      return sessionStorage.getItem(key) === '1'
    } catch {
      return false
    }
  })
  const set = useCallback(
    (v) => {
      setValue(!!v)
      try {
        if (v) sessionStorage.setItem(key, '1')
        else sessionStorage.removeItem(key)
      } catch {
        /* penyimpanan browser tidak tersedia */
      }
    },
    [key]
  )
  return [value, set]
}

// Membuka kamera yang dipilih. Bila kamera pilihan sudah dicabut, pakai kamera default.
export async function cameraStream(id) {
  const base = { width: { ideal: 640 }, height: { ideal: 480 } }
  if (id) {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: { ...base, deviceId: { exact: id } }, audio: false })
    } catch (e) {
      if (e && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) {
        saveCameraId('')
      } else {
        throw e
      }
    }
  }
  return navigator.mediaDevices.getUserMedia({ video: base, audio: false })
}

async function listCameras() {
  try {
    const all = await navigator.mediaDevices.enumerateDevices()
    return all.filter((d) => d.kind === 'videoinput')
  } catch {
    return []
  }
}

export default function CameraPicker({ deviceId, onChange, running = false, disabled = false }) {
  const [devices, setDevices] = useState([])
  const [note, setNote] = useState('')

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return
    setDevices(await listCameras())
  }, [])

  useEffect(() => {
    refresh()
    if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) return undefined
    navigator.mediaDevices.addEventListener('devicechange', refresh)
    return () => navigator.mediaDevices.removeEventListener('devicechange', refresh)
  }, [refresh])

  // Setelah kamera menyala, izin sudah diberikan dan nama kamera tersedia.
  useEffect(() => {
    if (running) refresh()
  }, [running, refresh])

  const usable = devices.filter((d) => d.deviceId)
  const hasNames = usable.length > 0 && usable.every((d) => d.label)
  const value = usable.some((d) => d.deviceId === deviceId) ? deviceId : ''

  async function reveal() {
    setNote('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      s.getTracks().forEach((t) => t.stop())
      await refresh()
    } catch {
      setNote('Izin kamera diperlukan untuk menampilkan nama kamera. Klik ikon gembok di address bar, izinkan kamera, lalu coba lagi.')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Pilih kamera</span>
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ maxWidth: 420 }}
        >
          <option value="">Kamera default sistem</option>
          {usable.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Kamera ${i + 1}`}
            </option>
          ))}
        </select>
      </label>
      {!hasNames && !running && (
        <p className="hint" style={{ margin: 0 }}>
          Nama kamera baru tampil setelah izin kamera diberikan.{' '}
          <button
            type="button"
            onClick={reveal}
            style={{ background: 'none', border: 0, padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
          >
            Tampilkan daftar kamera
          </button>
        </p>
      )}
      {hasNames && usable.length > 1 && (
        <p className="hint" style={{ margin: 0 }}>
          Ada {usable.length} kamera. Pilih webcam USB eksternal.
        </p>
      )}
      {note && <p role="alert" className="hint" style={{ margin: 0, color: '#991b1b' }}>{note}</p>}
    </div>
  )
}
