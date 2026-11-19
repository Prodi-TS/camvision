import Card from '../../../components/Card.jsx'
import LabLayout from '../../../components/LabLayout.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import CasePractice from './CasePractice.jsx'
import DetectLab from '../../p15/DetectLab.jsx'
import kubusPdf from './kubusPdf.js'

const TOOLS = [
  'Webcam USB eksternal, bukan kamera bawaan laptop',
  'Kubus target (merah 38 mm), minimal 2 buah',
  'Kubus pengecoh: warna lain, serta merah berukuran 20 mm dan 45 mm',
  'Alas polos berwarna terang atau gelap, tanpa motif',
  'Cahaya ruangan yang merata, tanpa pantulan di permukaan kubus',
]

const STEPS = [
  'Colokkan webcam USB, centang konfirmasi, lalu nyalakan kamera.',
  'Letakkan kubus target dan satu pengecoh di depan kamera. Atur kepekatan warna sampai hanya objek yang tampak pada mask.',
  'Nyalakan tampilan Kontur dan Titik pusat. Gerakkan kubus ke kiri dan ke kanan, lalu amati koordinat x titik pusat berubah.',
  'Bekukan gambar, klik satu objek, lalu beri label "Ini kubus target" atau "Bukan target". Kumpulkan minimal 3 contoh untuk tiap label.',
  'Ganti ke mode uji. Gerakkan kubus, tukar posisinya, lalu dekatkan dan jauhkan dari kamera.',
  'Coba empat kasus di materi E: dua kubus menempel, benda besar, merah berukuran lain, dan kubus dekat kamera. Tambahkan contoh jika model keliru.',
  'Tandai misi selesai setelah model stabil beberapa saat.',
]

// Tahap "Deteksi Objek" pada Vision Pipeline Lab.
// state dan update dipegang halaman lab, dengan kunci yang sama seperti
// halaman pembelajaran Object Detection, sehingga contoh dan status lab sama di kedua tempat.
export default function ObjectDetectionStage({ state, update }) {
  return (
    <LabLayout
      guide={
        <>
          <Card className="activity">
            <div className="section-head">
              <div>
                <h2>Siapkan Alat</h2>
                <p>Cetak pola kubus bila belum punya benda berwarna. Benda lain seperti Lego juga boleh.</p>
              </div>
            </div>
            <ul className="char-list" style={{ listStyle: 'disc', paddingLeft: 20 }}>
              {TOOLS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="note-box">
              <strong>Mau mencetak?</strong> Unduh pola kubus A4 (2 halaman). Cetak berwarna dengan skala 100%
              (<em>Actual size</em>), gunting, lipat, lalu rekatkan.
            </p>
            <p>
              <a className="btn btn--primary" href={kubusPdf} download="pola-kubus-target-dan-ukuran-A4.pdf">
                Unduh pola kubus (PDF)
              </a>
            </p>
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
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> hasil deteksi dikirim sebagai pesan
              <code> vision_msgs/Detection2DArray</code>. Di lab ini kamu melatih model k-NN sederhana.
            </p>
          </Card>
        </>
      }
    >
      <Card className="activity">
        <div className="section-head">
          <div>
            <h2>Lab Deteksi dan Latih Model</h2>
            <p>Contoh yang kamu kumpulkan tersimpan dan ikut tampil di halaman pembelajaran Object Detection.</p>
          </div>
          {state.labDone && <StatusBadge status="Selesai" />}
        </div>
        <DetectLab
          samples={state.samples ?? []}
          setSamples={(fn) => update((prev) => ({ samples: typeof fn === 'function' ? fn(prev.samples ?? []) : fn }))}
          done={!!state.labDone}
          onDone={() => update({ labDone: true })}
        />
      </Card>

      <CasePractice
        cases={state.cases ?? {}}
        setCase={(id, patch) => update((prev) => ({ cases: { ...(prev.cases ?? {}), [id]: { ...((prev.cases ?? {})[id] ?? {}), ...patch } } }))}
      />
    </LabLayout>
  )
}
