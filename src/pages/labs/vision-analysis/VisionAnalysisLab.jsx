import Card from '../../../components/Card.jsx'
import LabLayout from '../../../components/LabLayout.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import DiagLab from '../../p18/DiagLab.jsx'

const TOOLS = [
  'Webcam USB eksternal, bukan kamera bawaan laptop',
  'Kubus target dan kubus warna lain, seperti saat pengujian',
  'Hasil pengujian dari tahap sebelumnya (tampil otomatis)',
  'Lampu ruangan yang bisa diredupkan, dan penggaris untuk jarak',
]

const STEPS = [
  'Baca bagian Bandingkan Hasil Pengujian: bandingkan jarak dan cahaya serta waktu pemrosesan, lalu pilih faktor yang paling berpengaruh.',
  'Nyalakan kamera dan atur warna target serta kepekatan warna seperti saat pengujian.',
  'Pilih satu kondisi, mulai dari yang bertanda ⚠ (gagal saat pengujian). Siapkan adegannya sesuai petunjuk.',
  'Tekan "Rekam 3 detik". Lihat tabel data: luas kotak, kecerahan, kepekatan warna, benda warna lain, dan waktu pemrosesan.',
  'Pindah ke tampilan "Hasil pemisahan warna" untuk melihat bagian mana yang dianggap target.',
  'Pilih dugaan penyebab. Sistem memeriksanya dengan data dan memberi tahu apakah data mendukung.',
  'Ulangi untuk minimal dua kondisi, lalu tandai analisis selesai. Hasilnya dipakai pada tahap Vision Optimization.',
]

// Tahap "Analisis" pada Vision Test & Analysis Lab.
// p17Results adalah hasil tahap Pengujian, langsung dari state lab, jadi tidak perlu memuat ulang halaman.
export default function VisionAnalysisStage({ state, update, p17Results }) {
  return (
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
            <h2>Lab Analisis Penyebab</h2>
          </div>
          {state.labDone && <StatusBadge status="Selesai" />}
        </div>
        <DiagLab
          p17Results={p17Results ?? {}}
          analysis={state.analysis ?? {}}
          setAnalysis={(id, r) => update((prev) => ({ analysis: { ...(prev.analysis ?? {}), [id]: r } }))}
          done={!!state.labDone}
          onDone={() => update({ labDone: true })}
        />
      </Card>
    </LabLayout>
  )
}
