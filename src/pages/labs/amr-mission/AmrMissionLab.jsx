import Card from '../../../components/Card.jsx'
import LabLayout from '../../../components/LabLayout.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import MissionLab from '../../p16/MissionLab.jsx'

const TOOLS = [
  'Webcam USB eksternal, bukan kamera bawaan laptop',
  'Satu kubus berwarna pekat (merah 38 mm dari pola kubus Object Detection cocok)',
  'Alas polos dan cahaya ruangan merata',
]

const STEPS = [
  'Colokkan webcam USB, centang konfirmasi, lalu nyalakan kamera.',
  'Pilih warna target sesuai kubusmu. Atur kepekatan warna sampai kotak hanya muncul pada kubus.',
  'Amati dulu keputusan robot: jauhkan kubus (SEARCH), masukkan di tepi gambar (TURN LEFT atau TURN RIGHT), geser ke tengah lalu dekatkan (MOVE FORWARD, lalu STOP). Perhatikan posisi dan koordinat centroid pada kotak keputusan.',
  'Opsional: kalibrasi jarak dengan penggaris agar angka cm lebih tepat.',
  'Isi Catatan Misi: siapkan tiap kondisi, tekan Catat, lalu lihat hasilnya sesuai atau belum. Bila belum, ikuti petunjuknya, perbaiki pengaturan, dan catat ulang.',
  'Ubah lebar zona tengah dan jarak berhenti. Amati bagaimana perilaku robot berubah.',
  'Tandai misi selesai setelah kelima kondisi tercatat.',
]

// Tahap "Misi AMR" pada Vision Pipeline Lab.
// state dan update dipegang halaman lab, dengan kunci yang sama seperti halaman pembelajaran AMR Vision Mission.
export default function AmrMissionStage({ state, update }) {
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
            <p className="hint">Pola kubus bisa diunduh di tahap Deteksi Objek.</p>
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
            <h2>Lab Misi Penglihatan</h2>
          </div>
          {state.labDone && <StatusBadge status="Selesai" />}
        </div>
        <MissionLab done={!!state.labDone} onDone={() => update({ labDone: true })} />
      </Card>
    </LabLayout>
  )
}
