import { useEffect, useRef, useState } from 'react'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ProfileInputs from '../components/ProfileInputs.jsx'
import PortfolioDocument from './portfolio/PortfolioDocument.jsx'
import PhotoManager from './portfolio/PhotoManager.jsx'
import useProfile from '../data/useProfile.js'
import { buildPortfolio, portfolioFileName, formatWhen } from '../data/portfolioData.js'
import { readPhotoImages, useIncludePhotos, usePhotoIndexText } from '../data/photoStore.js'
import { useAuth } from '../auth.jsx'

// Portofolio bisa dibuat kapan saja, walaupun belum semua selesai. Bagian yang belum dikerjakan
// ikut dibuat dan ditandai. Dokumen adalah potret data saat tombol ditekan, lalu dicetak jadi PDF
// lewat jendela cetak browser (tanpa server).
export default function Portfolio() {
  const { user } = useAuth()
  const [profile, updateProfile] = useProfile(user.username)
  const [snapshot, setSnapshot] = useState(null) // { data, images, at }
  const headingRef = useRef(null)
  // Dua langganan ini hanya agar halaman dihitung ulang saat gambar kamera atau pilihan sertakan berubah.
  usePhotoIndexText(user.username)
  useIncludePhotos(user.username)

  // Status tiap bagian selalu mengikuti data terbaru.
  const live = buildPortfolio(user.username, profile)
  const stale = snapshot ? JSON.stringify(live) !== JSON.stringify(snapshot.data) : false
  const stamp = snapshot ? snapshot.at : 0

  // Gambar ikut disimpan di potret, supaya dokumen tidak berubah sendiri bila gambar di lab diganti.
  function generate() {
    const data = buildPortfolio(user.username, profile)
    const images = readPhotoImages(user.username, data.foto.items.map((i) => i.slot))
    setSnapshot({ data, images, at: Date.now() })
  }

  // Setelah dokumen muncul, pindah ke judulnya supaya langsung terlihat.
  useEffect(() => {
    if (!stamp || !headingRef.current) return
    headingRef.current.scrollIntoView({ block: 'start' })
    headingRef.current.focus({ preventScroll: true })
  }, [stamp])

  // Saat dokumen sudah dibuat, mencetak (tombol atau Ctrl+P) hanya mencetak dokumen,
  // dan judul halaman dipakai browser sebagai nama berkas PDF.
  useEffect(() => {
    if (!snapshot) return undefined
    const fileName = portfolioFileName(snapshot.data, snapshot.at)
    let prevTitle = null
    const before = () => {
      if (prevTitle == null) prevTitle = document.title
      document.title = fileName
      document.body.classList.add('pf-printing')
    }
    const after = () => {
      document.body.classList.remove('pf-printing')
      if (prevTitle != null) document.title = prevTitle
      prevTitle = null
    }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
      after()
    }
  }, [snapshot])

  return (
    <div className="page pf-page">
      <PageHeader
        title="Portofolio"
        description="Kumpulan hasil belajarmu dalam satu dokumen. Boleh dibuat kapan saja, walaupun belum semua selesai."
        icon="folder"
      />

      <Card>
        <h2>Identitas</h2>
        <p className="hint" style={{ margin: '2px 0 12px' }}>
          Isian ini tampil di halaman pertama portofolio dan sama dengan yang ada di halaman Profil.
        </p>
        <ProfileInputs profile={profile} onChange={updateProfile} />
      </Card>

      <div className="grid grid--cards">
        {live.sections.map((s) => (
          <Card key={s.id} className="item-card">
            <div className="item-card__top">
              <div className="card__icon">
                <Icon name={s.icon} size={22} />
              </div>
              <StatusBadge status={s.status} />
            </div>
            <h2>{s.title}</h2>
            <p className="hint" style={{ margin: 0 }}>
              {s.line}
            </p>
          </Card>
        ))}
      </div>

      <PhotoManager username={user.username} />

      <Card>
        <h2>Buat Portofolio</h2>
        <p style={{ margin: '4px 0 12px' }}>
          Tekan tombol kapan saja. Bagian yang belum dikerjakan ikut dibuat dan ditandai, jadi guru bisa melihat mana yang sudah dan belum selesai. Setelah menambah pekerjaan,
          tekan Perbarui Portofolio.
        </p>
        <div className="page-actions">
          <Button onClick={generate}>{snapshot ? 'Perbarui Portofolio' : 'Generate Portofolio'}</Button>
          <Button variant="secondary" onClick={() => window.print()} disabled={!snapshot} title={snapshot ? undefined : 'Buat portofolio dulu'}>
            Cetak / Simpan sebagai PDF
          </Button>
        </div>
        <p className="hint" style={{ margin: '10px 0 0' }}>
          Untuk menyimpan PDF: tekan Cetak, lalu pada jendela cetak pilih Tujuan &ldquo;Simpan sebagai PDF&rdquo; (Save as PDF).
        </p>
        <div role="status" aria-live="polite">
          {snapshot && !stale && <p className="hint" style={{ margin: '8px 0 0', color: '#166534' }}>Portofolio dibuat {formatWhen(snapshot.at)}. Dokumennya ada di bawah.</p>}
          {snapshot && stale && (
            <p className="hint" style={{ margin: '8px 0 0', color: '#855400' }}>
              Ada perubahan data sejak portofolio dibuat. Tekan Perbarui Portofolio agar dokumen mengikuti.
            </p>
          )}
        </div>
      </Card>

      <div className="pf-doc-wrap">{snapshot && <PortfolioDocument data={snapshot.data} at={snapshot.at} images={snapshot.images} headingRef={headingRef} />}</div>
    </div>
  )
}
