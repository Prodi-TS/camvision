import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../auth.jsx'
import { saveProgress } from '../../data/progressStore.js'
import { P16_REFLECTION as REFLECTION_QUESTIONS } from '../../data/reflectionQuestions.js'
import '../p13/p13.css'

// ---------- Konten P16 ----------
const TP_CODE = '3.2.1'

const TUJUAN =
  'Menghubungkan hasil deteksi objek dengan keputusan gerak AMR: menentukan TURN LEFT, TURN RIGHT, MOVE FORWARD, atau STOP dari posisi dan ukuran kubus target pada gambar kamera.'

const PERTANYAAN_PEMANTIK =
  'Robot sudah tahu di mana kubus target pada gambar. Bagaimana informasi itu diubah menjadi perintah untuk roda: TURN LEFT, TURN RIGHT, MOVE FORWARD, atau STOP?'

const KESIMPULAN =
  'Misi penglihatan berjalan dalam satu putaran: kamera, deteksi, keputusan, perintah gerak, lalu kamera lagi. Posisi objek pada gambar menentukan arah, dan ukurannya menjadi perkiraan jarak. Aturan sederhana dengan zona tengah dan ambang berhenti sudah cukup untuk mengarahkan robot ke target.'

const OPS = [
  { term: 'SEARCH', text: 'Target belum terlihat. Robot berputar pelan di tempat sambil mencari.' },
  { term: 'TURN LEFT / TURN RIGHT', text: 'Target terlihat tetapi di luar zona tengah. Robot berputar ke arah target sampai target berada di tengah.' },
  { term: 'MOVE FORWARD', text: 'Target berada di zona tengah tetapi kotaknya masih kecil, artinya masih jauh. Robot MOVE FORWARD.' },
  { term: 'STOP', text: 'Target berada di tengah dan kotaknya sudah cukup besar, artinya sudah dekat. Robot berhenti.' },
]

const QUIZ = [
  { id: 'q1', prompt: 'Titik pusat (centroid) target berada di sisi kanan gambar. Robot sebaiknya…', options: ['TURN RIGHT', 'TURN LEFT', 'MOVE BACKWARD', 'STOP'], answer: 'TURN RIGHT', ok: 'Benar. Robot berputar ke arah target sampai target berada di tengah gambar.' },
  { id: 'q2', prompt: 'Kotak target di kamera tampak makin besar. Hal ini biasanya berarti target…', options: ['Makin dekat', 'Makin jauh', 'Berubah warna', 'Berhenti bergerak'], answer: 'Makin dekat', ok: 'Benar. Ukuran di gambar bisa dipakai sebagai perkiraan jarak.' },
  { id: 'q3', prompt: 'Fungsi "zona tengah" pada aturan keputusan adalah…', options: ['Mencegah robot bergoyang karena belok terus-menerus', 'Menambah kecepatan robot', 'Mengubah warna target', 'Menaikkan resolusi kamera'], answer: 'Mencegah robot bergoyang karena belok terus-menerus', ok: 'Benar. Selama target cukup di tengah, robot tidak perlu belok.' },
  { id: 'q4', prompt: 'Target tidak terlihat sama sekali. Keadaan robot yang sesuai adalah…', options: ['SEARCH', 'MOVE FORWARD', 'STOP', 'TURN LEFT'], answer: 'SEARCH', ok: 'Benar. Robot berputar pelan untuk menemukan target.' },
  { id: 'q5', prompt: 'Pesan ROS yang membawa perintah kecepatan linear dan sudut ke roda adalah…', options: ['geometry_msgs/Twist', 'sensor_msgs/Image', 'vision_msgs/Detection2DArray', 'nav_msgs/Path'], answer: 'geometry_msgs/Twist', ok: 'Benar. Twist berisi linear.x dan angular.z, dikirim ke topik /cmd_vel.' },
]
const QUIZ_WRONG = 'Belum tepat. Baca lagi materi, lalu coba pilihan lain.'


// ---------- State tersimpan per username di browser ----------
const INITIAL = {
  materiDone: false,
  labDone: false,
  quiz: {},
  reflection: { r1: '', r2: '', r3: '' },
  reflectionSaved: false,
}

function useP16State(username) {
  const key = `cv-amr-p16:${username}`
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL
    } catch {
      return INITIAL
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* penyimpanan browser tidak tersedia */
    }
  }, [key, state])
  const update = (patch) => setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  return { state, update }
}

function getActivities(state) {
  const quizDone = QUIZ.every((q) => state.quiz[q.id] === q.answer)
  const reflectionDone = state.reflectionSaved && REFLECTION_QUESTIONS.every((q) => (state.reflection[q.id] || '').trim().length > 0)
  return [
    { id: 'materi', label: 'Materi', done: state.materiDone },
    { id: 'lab', label: 'Lab Misi Penglihatan', done: state.labDone },
    { id: 'quiz', label: 'Cek Pemahaman', done: quizDone },
    { id: 'refleksi', label: 'Refleksi', done: reflectionDone },
  ]
}

function SectionHead({ title, badge, children }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {badge && <span className="badge badge--info">{badge}</span>}
    </div>
  )
}

const optionBtn = (active) => ({
  textAlign: 'left',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  border: '1px solid #0d7a94',
  background: active ? 'rgba(13,122,148,0.15)' : 'transparent',
  color: 'inherit',
  font: 'inherit',
  fontSize: 14,
})

export default function P16AmrVisionMission() {
  const { user } = useAuth()
  const { state, update } = useP16State(user.username)
  const [thought, setThought] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const activities = getActivities(state)
  const doneCount = activities.filter((a) => a.done).length
  const percent = Math.round((doneCount / activities.length) * 100)
  const status = percent === 0 ? 'Belum dimulai' : percent === 100 ? 'Selesai' : 'Sedang dipelajari'

  useEffect(() => {
    saveProgress(user.username, 'p16', percent, {
      labDone: !!state.labDone,
      quizCorrect: QUIZ.filter((q) => state.quiz[q.id] === q.answer).length,
      quizTotal: QUIZ.length,
    })
  }, [user.username, percent, state.labDone, state.quiz])
  const allFilled = REFLECTION_QUESTIONS.every((q) => (state.reflection[q.id] || '').trim().length > 0)
  const quizCorrect = QUIZ.filter((q) => state.quiz[q.id] === q.answer).length

  return (
    <div className="page p13">
      <div className="p13__top">
        <PageHeader
          title="AMR Vision Mission"
          description="Menghubungkan penglihatan robot dengan misi AMR."
          icon="robot"
          status={status}
        />
        <div className="p13__tp">
          <span className="badge badge--info">TP {TP_CODE}</span>
        </div>
      </div>

      <Card className="goal">
        <h2>Tujuan Pembelajaran</h2>
        <p>{TUJUAN}</p>
      </Card>

      <Card className="thinking card--accent">
        <h2>Pertanyaan Pemantik</h2>
        <blockquote>{PERTANYAAN_PEMANTIK}</blockquote>
        <p>Pikirkan dulu jawabanmu sebelum membaca materi. Tidak perlu ditulis.</p>
        {!thought ? (
          <Button onClick={() => setThought(true)}>Saya sudah memikirkannya</Button>
        ) : (
          <p className="thinking__after">Simpan pemikiranmu. Lewat materi dan lab berikut, kamu akan menemukan jawabannya.</p>
        )}
      </Card>

      <section className="p13-section" aria-labelledby="p16-materi">
        <div className="section-head">
          <div>
            <h2 id="p16-materi">Materi Singkat</h2>
            <p>Baca secukupnya, lalu lanjut ke lab.</p>
          </div>
          {state.materiDone && <StatusBadge status="Selesai" />}
        </div>

        <div className="material-grid">
          <Card>
            <h3>A. Dari Gambar ke Aksi</h3>
            <p>
              Robot bergerak dengan putaran berulang: kamera mengambil gambar, deteksi menemukan target,
              aturan keputusan memilih aksi, lalu perintah gerak dikirim ke roda. Setelah roda bergerak,
              gambar berikutnya berubah, dan putaran dimulai lagi.
            </p>
          </Card>

          <Card>
            <h3>B. Posisi Menjadi Arah</h3>
            <p>
              Bandingkan titik pusat target (centroid) dengan pusat gambar. Bila target di kanan, robot berputar ke
              kanan. Bila di kiri, ke kiri. Agar robot tidak bergoyang karena selisih kecil, dibuat zona
              tengah: selama target ada di zona itu, robot dianggap sudah menghadap target.
            </p>
            <p>
              Aturan dasarnya: posisi <strong>LEFT</strong> berarti <strong>TURN LEFT</strong>, <strong>CENTER</strong> berarti <strong>MOVE FORWARD</strong>,
              <strong> RIGHT</strong> berarti <strong>TURN RIGHT</strong>, dan bila target <strong>terlalu dekat</strong> robot <strong>STOP</strong>.
            </p>
          </Card>

          <Card>
            <h3>C. Ukuran Menjadi Jarak</h3>
            <p>
              Benda yang dekat tampak besar, benda yang jauh tampak kecil. Karena itu tinggi kotak target
              dipakai sebagai perkiraan jarak. Saat kotak melewati ambang tertentu, robot berhenti. Dengan ukuran asli target
              yang diketahui (misalnya kubus 38 mm), tinggi kotak bisa diubah menjadi perkiraan jarak dalam cm. Cara ini
              hanya bekerja bila ukuran asli targetnya tetap, dan hasilnya hanya perkiraan.
            </p>
            <p>
              <strong>Kalibrasi jarak.</strong> Rumus jarak memakai panjang fokus kamera dalam piksel, dan
              angkanya berbeda tiap kamera. Untuk mengkalibrasi: letakkan kubus pada jarak yang kamu ukur
              dengan penggaris (misalnya 30 cm), lalu catat tinggi kotaknya. Dari satu titik itu, panjang
              fokus bisa dihitung, dan jarak di titik lain menjadi lebih akurat.
            </p>
          </Card>

          <Card>
            <h3>D. Kapan Keputusan Bisa Salah</h3>
            <p>
              Target tertutup sebentar, cahaya berubah, atau benda lain berwarna sama muncul, dan keputusan
              ikut berubah. Zona tengah yang terlalu sempit membuat robot sering belok. Ambang berhenti yang
              terlalu kecil membuat robot berhenti terlalu jauh.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>E. Empat Keadaan Misi</h3>
            <dl className="char-list">
              {OPS.map((o) => (
                <div key={o.term} className="char-list__row">
                  <dt>{o.term}</dt>
                  <dd>{o.text}</dd>
                </div>
              ))}
            </dl>
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> keputusan diubah menjadi pesan{' '}
              <code>geometry_msgs/Twist</code> yang dikirim ke topik <code>/cmd_vel</code>. Isinya dua angka
              utama: <code>linear.x</code> (maju, m/s) dan <code>angular.z</code> (berputar, rad/s).
              Nilai positif pada <code>angular.z</code> berarti berputar ke kiri.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>F. Aturan Keselamatan dan Indikator Keberhasilan</h3>
            <p>
              Di lab ini robotnya virtual, jadi tidak ada risiko. Tetapi saat keputusan yang sama nanti dikirim
              ke robot sungguhan, aturan berikut berlaku.
            </p>
            <dl className="char-list">
              <div className="char-list__row">
                <dt>Uji pertama</dt>
                <dd>Roda diangkat atau robot ditumpu, supaya robot tidak berjalan sendiri bila keputusannya keliru.</dd>
              </div>
              <div className="char-list__row">
                <dt>Kecepatan rendah</dt>
                <dd>Mulai dari kecepatan pelan (di lab ini linear.x 0,2 m/s) dan di area yang bebas dari orang, kabel, dan tepi meja.</dd>
              </div>
              <div className="char-list__row">
                <dt>Cara berhenti cepat</dt>
                <dd>Siapkan tombol darurat atau perintah kecepatan nol, dan tunjuk satu orang yang memegangnya.</dd>
              </div>
              <div className="char-list__row">
                <dt>Target tidak terlihat</dt>
                <dd>Robot tidak boleh melaju. Pada keadaan SEARCH, robot hanya berputar pelan di tempat.</dd>
              </div>
              <div className="char-list__row">
                <dt>Jarak aman</dt>
                <dd>Robot harus berhenti sebelum menyentuh target. Karena jarak hanya perkiraan, beri ruang tambahan.</dd>
              </div>
            </dl>
            <p>
              <strong>Misi dianggap berhasil bila:</strong> tanpa target robot SEARCH dan tidak maju; target di
              kiri atau kanan membuat robot TURN LEFT atau TURN RIGHT ke arah yang benar; target di tengah dan jauh membuat robot
              MOVE FORWARD tanpa bergoyang; target di tengah dan dekat membuat robot STOP pada jarak berhenti.
              Kelima kondisi pada Catatan Misi di lab menguji indikator ini.
            </p>
          </Card>
        </div>

        <div className="p13-section__action">
          {state.materiDone ? (
            <span className="hint hint--ok">Materi sudah ditandai selesai dibaca.</span>
          ) : (
            <Button onClick={() => update({ materiDone: true })}>Saya sudah membaca materi</Button>
          )}
        </div>
      </section>

      <Card className="activity">
        <SectionHead title="Lab Misi Penglihatan" badge="VIRTUAL LAB">
          Praktik misi dengan webcam dikerjakan di Virtual Lab, tahap Misi AMR.
        </SectionHead>
        <p style={{ margin: '0 0 12px' }}>
          {state.labDone ? 'Lab misi sudah kamu tandai selesai.' : 'Lab misi belum selesai. Kerjakan di Virtual Lab, lalu kembali ke sini untuk Cek Pemahaman dan Refleksi.'}
        </p>
        <Button to="/virtual-lab/vision-pipeline-lab?tahap=misi">Buka Lab Misi AMR</Button>
      </Card>

      <Card className="activity">
        <SectionHead title="Cek Pemahaman">
          Pilih jawaban yang tepat. Benar: {quizCorrect}/{QUIZ.length}.
        </SectionHead>
        <div style={{ display: 'grid', gap: 20 }}>
          {QUIZ.map((q, i) => {
            const chosen = state.quiz[q.id]
            return (
              <div key={q.id}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>{i + 1}.</strong> {q.prompt}
                </p>
                <div role="group" aria-label={q.prompt} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={chosen === opt}
                      onClick={() => update((prev) => ({ quiz: { ...prev.quiz, [q.id]: opt } }))}
                      style={optionBtn(chosen === opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {chosen && (
                  <p
                    role="status"
                    style={{
                      margin: '8px 0 0',
                      padding: '8px 12px',
                      borderRadius: 8,
                      ...(chosen === q.answer ? { color: '#166534', background: '#dcfce7' } : { color: '#991b1b', background: '#fee2e2' }),
                    }}
                  >
                    {chosen === q.answer ? q.ok : QUIZ_WRONG}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="activity">
        <SectionHead title="Refleksi">Jawab dengan kata-katamu sendiri.</SectionHead>
        <div className="reflection">
          {REFLECTION_QUESTIONS.map((q, i) => (
            <div key={q.id} className="reflection__item">
              <label htmlFor={`p16-${q.id}`}>
                {i + 1}. {q.text}
              </label>
              <textarea
                id={`p16-${q.id}`}
                rows={3}
                value={state.reflection[q.id] || ''}
                onChange={(e) => {
                  setJustSaved(false)
                  update((prev) => ({ reflection: { ...prev.reflection, [q.id]: e.target.value }, reflectionSaved: false }))
                }}
                placeholder="Tulis jawabanmu dengan kata-katamu sendiri."
              />
            </div>
          ))}
          <div className="reflection__actions">
            <Button
              onClick={() => {
                update({ reflectionSaved: true })
                setJustSaved(true)
              }}
              disabled={!allFilled}
            >
              Simpan Refleksi
            </Button>
            {!allFilled && <span className="hint">Isi ketiga pertanyaan untuk menyimpan.</span>}
            {allFilled && (state.reflectionSaved || justSaved) && <span className="hint hint--ok">Refleksi tersimpan di browser ini.</span>}
          </div>
          <p className="hint">Jawabanmu hanya tersimpan di browser ini. Belum dikirim ke guru.</p>
        </div>
      </Card>

      <Card className="activity">
        <h2 className="card__heading">Progres belajar</h2>
        <ProgressBar value={percent} label="Progres belajar" size="lg" />
        <ul className="checklist">
          {activities.map((a) => (
            <li key={a.id} className="checklist__item">
              <span>{a.label}</span>
              <StatusBadge status={a.done ? 'Selesai' : 'Belum dimulai'} />
            </li>
          ))}
        </ul>
      </Card>

      <Card className="conclusion">
        <h2>Kesimpulan</h2>
        <p>{KESIMPULAN}</p>
      </Card>

      <div className="page-actions">
        <Button to="/pembelajaran/p17">Lanjut ke Vision Testing</Button>
        <Button to="/pembelajaran" variant="secondary">
          Kembali ke Pembelajaran
        </Button>
      </div>
    </div>
  )
}
