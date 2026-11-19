import { useEffect, useState } from 'react'
import Card from '../../../components/Card.jsx'
import Button from '../../../components/Button.jsx'
import LabLayout from '../../../components/LabLayout.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { useAuth } from '../../../auth.jsx'
import TuneLab from '../../p19/TuneLab.jsx'
import '../../p13/p13.css'

// Memakai kunci penyimpanan yang sama dengan halaman P19.
function useSharedState(username) {
  const key = `cv-amr-p19:${username}`
  const read = () => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }
  const [state, setState] = useState(read)
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ ...read(), after: state.after ?? {}, labDone: !!state.labDone }))
    } catch {
      /* penyimpanan browser tidak tersedia */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state.after, state.labDone])
  const update = (patch) => setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  return { state, update }
}

const TOOLS = [
  'Webcam USB eksternal, bukan kamera bawaan laptop',
  'Kubus target dan kubus warna lain, seperti saat pengujian',
  'Hasil pengujian dan dugaan analisismu (tampil otomatis bila sudah dikerjakan di akun ini)',
  'Lampu ruangan yang bisa diredupkan, dan penggaris untuk jarak',
]

const STEPS = [
  'Nyalakan kamera. Lihat kondisi yang bertanda ⚠ (gagal saat pengujian) dan saran dari dugaanmu saat analisis.',
  'Ubah SATU pengaturan sesuai saran, lalu rekam ulang kondisi yang bermasalah.',
  'Bandingkan kolom Sebelum dan Sesudah, termasuk waktu proses. Bila belum membaik, ubah pengaturan lain, bukan banyak sekaligus. Coba juga opsi blur dan lihat harganya pada waktu proses.',
  'Setelah puas, rekam ulang ketujuh kondisi dengan pengaturan akhir yang sama persis.',
  'Cek apakah ada kondisi yang memburuk. Itu harga dari perbaikanmu.',
  'Tandai optimasi selesai bila ketujuh kondisi sudah direkam dengan pengaturan yang sama.',
]

function readP17Results(username) {
  try {
    return JSON.parse(localStorage.getItem(`cv-amr-p17:${username}`) || '{}').results || {}
  } catch {
    return {}
  }
}

function readP18Hypotheses(username) {
  try {
    const a = JSON.parse(localStorage.getItem(`cv-amr-p18:${username}`) || '{}').analysis || {}
    return Object.fromEntries(Object.entries(a).filter(([, v]) => v && v.hypothesis).map(([k, v]) => [k, v.hypothesis]))
  } catch {
    return {}
  }
}

export default function VisionOptimizationLab({ lab }) {
  const { user } = useAuth()
  const { state, update } = useSharedState(user.username)

  return (
    <div className="page p13">
      <PageHeader title={lab.title} description={lab.description} icon={lab.icon} status={lab.status} />

      <LabLayout
        guide={
          <>
    <Card className="activity">
            <div className="section-head">
              <div>
                <h2>Siapkan Alat</h2>
              </div>
            </div>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'grid', gap: 4 }}>
              {TOOLS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="hint">Pola kubus bisa diunduh di lab Vision Pipeline, tahap Deteksi Objek.</p>
          </Card>

          <Card className="activity">
            <div className="section-head">
              <div>
                <h2>Langkah Kerja</h2>
              </div>
            </div>
            <ol style={{ paddingLeft: 20, display: 'grid', gap: 8, margin: 0 }}>
              {STEPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </Card>
          </>
        }
      >
    <Card className="activity">
            <div className="section-head">
              <div>
                <h2>Lab Optimasi Penglihatan</h2>
              </div>
              {state.labDone && <StatusBadge status="Selesai" />}
            </div>
            <TuneLab
              before={readP17Results(user.username)}
              hypotheses={readP18Hypotheses(user.username)}
              after={state.after ?? {}}
              setAfter={(id, r) => update((prev) => ({ after: { ...(prev.after ?? {}), [id]: r } }))}
              clearAfter={() => update({ after: {} })}
              done={!!state.labDone}
              onDone={() => update({ labDone: true })}
            />
          </Card>
      </LabLayout>

      <div className="page-actions">
        <Button to="/pembelajaran/p19">Kembali ke halaman pembelajaran Vision Optimization</Button>
        <Button to="/virtual-lab" variant="secondary">
          Kembali ke Virtual Lab
        </Button>
      </div>
    </div>
  )
}
