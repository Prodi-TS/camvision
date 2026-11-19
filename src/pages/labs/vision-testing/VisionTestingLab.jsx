import Card from '../../../components/Card.jsx'
import LabLayout from '../../../components/LabLayout.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import VisionTestLab from '../../p17/VisionTestLab.jsx'

const TOOLS = [
  'Webcam USB eksternal, bukan kamera bawaan laptop',
  'Satu kubus target (merah 38 mm dari pola kubus Object Detection cocok)',
  'Satu kubus warna lain sebagai pengecoh',
  'Penggaris atau pita ukur untuk jarak 15, 30, dan 60 cm',
  'Lampu ruangan yang bisa diredupkan, kain untuk menutupi cahaya, dan lampu atau senter untuk membuat alas terang',
]

const STEPS = [
  'Colokkan webcam, centang konfirmasi, lalu nyalakan kamera.',
  'Pilih warna target dan atur kepekatan warna sampai kotak hanya muncul pada kubus. Setelah itu jangan diubah.',
  'Siapkan kondisi sesuai petunjuk di layar, lalu tekan "Rekam 3 detik". Jangan menggeser apa pun selama merekam.',
  'Ulangi untuk ketujuh kondisi: tiga jarak, cahaya redup, cahaya terang, tanpa kubus, dan pengecoh warna lain.',
  'Baca tabel hasil dan ringkasan: tingkat deteksi, posisi rata-rata target, dan waktu pemrosesan. Temukan kondisi yang paling lemah.',
  'Tandai pengujian selesai, lalu lanjut ke tahap Analisis. Hasilnya dipakai di sana.',
]

// Tahap "Pengujian" pada Vision Test & Analysis Lab.
// state dan update dipegang halaman lab, dengan kunci yang sama seperti halaman pembelajaran Vision Testing.
export default function VisionTestingStage({ state, update }) {
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
            <h2>Lab Pengujian Penglihatan</h2>
          </div>
          {state.labDone && <StatusBadge status="Selesai" />}
        </div>
        <VisionTestLab
          results={state.results ?? {}}
          setResult={(id, r) => update((prev) => ({ results: { ...(prev.results ?? {}), [id]: r } }))}
          clearResults={() => update({ results: {} })}
          done={!!state.labDone}
          onDone={() => update({ labDone: true })}
        />
      </Card>
    </LabLayout>
  )
}
