import { useMemo, useState } from 'react'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import { listOrderedPhotos } from '../../data/photoSlots.js'
import {
  photoTime,
  photoUsageKB,
  readPhotoImages,
  removeAllPhotos,
  removePhoto,
  saveIncludePhotos,
  useIncludePhotos,
  usePhotoIndexText,
} from '../../data/photoStore.js'
import './portfolio.css'
import '../../components/capture.css'

// Mengelola gambar kamera milik satu akun: sertakan atau tidak di portofolio, hapus satu, hapus semua.
export default function PhotoManager({ username }) {
  const indexText = usePhotoIndexText(username) // berubah saat gambar diambil atau dihapus
  const include = useIncludePhotos(username)
  const [confirmAll, setConfirmAll] = useState(false)

  const photos = useMemo(() => {
    const list = listOrderedPhotos(username)
    const imgs = readPhotoImages(username, list.map((p) => p.slot))
    return list.map((p) => ({ ...p, src: imgs[p.slot] || null }))
  }, [username, indexText])
  const kb = useMemo(() => photoUsageKB(username), [username, indexText])

  return (
    <Card>
      <h2>Gambar dari Kamera</h2>
      <p className="hint" style={{ margin: '2px 0 12px' }}>
        Gambar yang kamu ambil dengan tombol Ambil gambar di lab kamera hanya tersimpan di browser ini. Gambar baru keluar dari browser bila kamu mencetak atau menyimpan portofolio sebagai PDF. Hindari wajah orang lain di dalam gambar.
      </p>
      <label className="pf-check">
        <input type="checkbox" checked={include} onChange={(e) => saveIncludePhotos(username, e.target.checked)} />
        <span>Sertakan gambar kamera di portofolio</span>
      </label>
      {!include && photos.length > 0 && (
        <p className="hint" style={{ margin: '6px 0 0' }}>
          Gambar tetap tersimpan, tetapi tidak ikut saat portofolio dibuat. Tekan Perbarui Portofolio setelah mengubah pilihan ini.
        </p>
      )}

      {photos.length === 0 ? (
        <p className="hint" style={{ margin: '12px 0 0' }}>
          Belum ada gambar. Ambil gambar lewat tombol Ambil gambar di lab Camera, Image Processing, Object Detection, AMR Vision Mission, Vision Testing, Analysis, atau Optimization.
        </p>
      ) : (
        <>
          <ul className="pf-thumbs" aria-label="Gambar yang tersimpan">
            {photos.map((p) => (
              <li key={p.slot} className="pf-thumb">
                {p.src && <img src={p.src} alt={`Gambar tersimpan: ${p.title}`} />}
                <span className="pf-thumb__title">{p.title}</span>
                <span className="pf-thumb__time">{photoTime(p.at)}</span>
                <button type="button" className="cap__link pf-thumb__del" onClick={() => removePhoto(username, p.slot)}>
                  Hapus<span className="cap__sr"> gambar {p.title}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="hint" style={{ margin: '0 0 10px' }}>
            {photos.length} gambar, memakai sekitar {kb} KB penyimpanan browser. Batasnya sekitar 5.000 KB dan dipakai bersama oleh semua akun di komputer ini.
          </p>
          {!confirmAll ? (
            <Button variant="secondary" onClick={() => setConfirmAll(true)}>
              Hapus semua gambar
            </Button>
          ) : (
            <div className="pf-confirm" role="group" aria-label="Konfirmasi hapus semua gambar">
              <p style={{ margin: 0 }}>Hapus semua {photos.length} gambar? Ini tidak bisa dibatalkan.</p>
              <div className="page-actions">
                <Button
                  onClick={() => {
                    removeAllPhotos(username)
                    setConfirmAll(false)
                  }}
                >
                  Ya, hapus semua
                </Button>
                <button type="button" className="btn btn--secondary" autoFocus onClick={() => setConfirmAll(false)}>
                  Batal
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
