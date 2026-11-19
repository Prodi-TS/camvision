import { useMemo, useState } from 'react'
import { useAuth } from '../auth.jsx'
import { photoTime, readPhoto, removePhoto, savePhoto, usePhotoStamp } from '../data/photoStore.js'
import { slotTitle } from '../data/photoSlots.js'
import './capture.css'

const FAIL_TEXT = {
  sumber: 'Kamera belum menampilkan gambar. Nyalakan kamera dan tunggu gambarnya muncul, lalu coba lagi.',
  penuh: 'Penyimpanan browser penuh, jadi gambar tidak tersimpan. Hapus beberapa gambar lama di halaman Portofolio, lalu coba lagi.',
}

// Tombol untuk menyimpan satu gambar dari kamera ke portofolio.
// - slot: satu kondisi, satu slot. Mengambil ulang menggantikan gambar lama di slot itu.
// - getSource: fungsi yang mengembalikan elemen canvas atau video (atau daftar elemen) saat tombol ditekan.
// - enabled: false bila kamera belum menyala.
// - note: keterangan singkat yang ikut disimpan (misalnya mode yang sedang dipakai).
export default function CaptureButton({ slot, getSource, enabled = true, note = '', label = 'Ambil gambar', compact = false }) {
  const { user } = useAuth()
  const username = user?.username || ''
  const stamp = usePhotoStamp(username, slot)
  const url = useMemo(() => (stamp ? readPhoto(username, slot) : null), [username, slot, stamp])
  const [msg, setMsg] = useState(null) // { slot, tone, text }
  const shown = msg && msg.slot === slot ? msg : null
  const title = slotTitle(slot)

  const take = () => {
    let res
    try {
      res = savePhoto(username, slot, getSource(), note)
    } catch {
      res = { ok: false, reason: 'sumber' }
    }
    setMsg(
      res.ok
        ? { slot, tone: 'ok', text: 'Gambar tersimpan dan ikut masuk portofolio.' }
        : { slot, tone: 'bad', text: FAIL_TEXT[res.reason] || FAIL_TEXT.sumber },
    )
  }

  const remove = () => {
    removePhoto(username, slot)
    setMsg({ slot, tone: 'ok', text: 'Gambar dihapus.' })
  }

  return (
    <div className={`cap${compact ? ' cap--compact' : ''}`}>
      <div className="cap__row">
        <button type="button" className="btn btn--secondary cap__btn" onClick={take} disabled={!enabled}>
          {stamp ? 'Ambil ulang gambar' : label}
          <span className="cap__sr"> untuk {title}</span>
        </button>
        {!enabled && !stamp && <span className="hint cap__hint">Nyalakan kamera dulu.</span>}
      </div>
      {shown && (
        <p className={`cap__msg cap__msg--${shown.tone}`} role="status">
          {shown.text}
        </p>
      )}
      {url && (
        <figure className="cap__fig">
          <img className="cap__img" src={url} alt={`Gambar tersimpan: ${title}`} />
          <figcaption className="cap__cap">
            Diambil {photoTime(stamp)}.{' '}
            <button type="button" className="cap__link" onClick={remove}>
              Hapus gambar<span className="cap__sr"> {title}</span>
            </button>
          </figcaption>
        </figure>
      )}
      {!compact && !stamp && (
        <p className="hint cap__hint">Gambar hanya tersimpan di browser ini. Hindari wajah orang lain di dalam gambar.</p>
      )}
    </div>
  )
}
