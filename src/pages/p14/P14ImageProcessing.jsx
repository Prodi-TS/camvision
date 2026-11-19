import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../auth.jsx'
import { saveProgress } from '../../data/progressStore.js'
import { P14_REFLECTION as REFLECTION_QUESTIONS } from '../../data/reflectionQuestions.js'
import WebcamLab from './WebcamLab.jsx'
import '../p13/p13.css'

// ---------- Konten P14 ----------
const TP_CODE = '3.2.1'

const TUJUAN =
  'Mengaplikasikan pra-pengolahan citra (grayscale, threshold, deteksi tepi, dan filter warna HSV) pada citra dari kamera untuk memisahkan objek target.'

const PERTANYAAN_PEMANTIK =
  'Kamera memberi robot ratusan ribu angka piksel pada setiap gambar. Bagaimana robot bisa menemukan satu kubus berwarna di antara angka-angka itu?'

const KESIMPULAN =
  'Citra dari kamera adalah kumpulan angka piksel. Pra-pengolahan seperti grayscale, threshold, deteksi tepi, dan filter warna HSV menyederhanakan citra supaya objek target mudah dipisahkan. Pilihan filter bergantung pada ciri objek yang dicari.'

const OPERATIONS = [
  { term: 'Grayscale', text: 'Mengubah citra berwarna menjadi satu nilai terang-gelap per piksel. Datanya lebih kecil dan sering menjadi langkah awal.' },
  { term: 'Threshold', text: 'Mengubah citra menjadi hitam putih murni. Piksel yang lebih terang dari ambang menjadi putih, sisanya hitam.' },
  { term: 'Edge (Sobel)', text: 'Menyorot tepi, yaitu tempat nilai piksel berubah tajam. Berguna untuk menemukan batas dan bentuk objek.' },
  { term: 'Filter warna (HSV)', text: 'Menyaring piksel berdasarkan warna. Piksel yang cocok menjadi putih, sisanya hitam. Hasilnya disebut mask.' },
]

const CHOICES = ['Grayscale', 'Threshold', 'Edge (Sobel)', 'Filter warna (HSV)']

const QUIZ = [
  { id: 'q1', prompt: 'Robot perlu memisahkan kubus merah dari kubus biru.', options: CHOICES, answer: 'Filter warna (HSV)', ok: 'Benar. Pemisahan berdasarkan warna memakai filter warna.' },
  { id: 'q2', prompt: 'Robot perlu menemukan batas atau garis tepi sebuah kubus.', options: CHOICES, answer: 'Edge (Sobel)', ok: 'Benar. Deteksi tepi menyorot tempat nilai piksel berubah tajam.' },
  { id: 'q3', prompt: 'Warna tidak dibutuhkan, dan datanya ingin diperkecil sebelum diproses.', options: CHOICES, answer: 'Grayscale', ok: 'Benar. Grayscale membuang informasi warna dan menyisakan terang-gelap.' },
  { id: 'q4', prompt: 'Citra ingin dijadikan hitam putih murni berdasarkan terang atau gelap.', options: CHOICES, answer: 'Threshold', ok: 'Benar. Threshold membagi piksel menjadi putih atau hitam dengan satu ambang.' },
  {
    id: 'q5',
    prompt: 'Mengapa filter warna memakai HSV dan bukan langsung RGB?',
    options: [
      'HSV memakai lebih sedikit piksel daripada RGB.',
      'Hue memisahkan jenis warna dari tingkat terang-gelapnya, jadi lebih tahan perubahan cahaya.',
      'RGB tidak bisa dibaca oleh komputer.',
    ],
    answer: 'Hue memisahkan jenis warna dari tingkat terang-gelapnya, jadi lebih tahan perubahan cahaya.',
    ok: 'Benar. Saat cahaya berubah, Value berubah paling banyak sedangkan Hue relatif tetap.',
  },
]
const QUIZ_WRONG = 'Belum tepat. Baca lagi materi tentang operasi citra, lalu coba pilihan lain.'


// ---------- State tersimpan per username di browser ----------
const INITIAL = {
  materiDone: false,
  labDone: false,
  quiz: {},
  reflection: { r1: '', r2: '', r3: '' },
  reflectionSaved: false,
}

function useP14State(username) {
  const key = `cv-amr-p14:${username}`
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
  const update = (patch) =>
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
  return { state, update }
}

function getActivities(state) {
  const quizDone = QUIZ.every((q) => state.quiz[q.id] === q.answer)
  const reflectionDone =
    state.reflectionSaved &&
    REFLECTION_QUESTIONS.every((q) => (state.reflection[q.id] || '').trim().length > 0)
  return [
    { id: 'materi', label: 'Materi', done: state.materiDone },
    { id: 'lab', label: 'Lab Filter Webcam', done: state.labDone },
    { id: 'quiz', label: 'Pilih Filter yang Tepat', done: quizDone },
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

export default function P14ImageProcessing() {
  const { user } = useAuth()
  const { state, update } = useP14State(user.username)
  const [thought, setThought] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const activities = getActivities(state)
  const doneCount = activities.filter((a) => a.done).length
  const percent = Math.round((doneCount / activities.length) * 100)
  const status = percent === 0 ? 'Belum dimulai' : percent === 100 ? 'Selesai' : 'Sedang dipelajari'

  useEffect(() => {
    saveProgress(user.username, 'p14', percent, {
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
          title="Image Processing"
          description="Mengolah citra dari kamera agar objek target mudah dikenali robot."
          icon="sliders"
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
          <p className="thinking__after">
            Simpan pemikiranmu. Lewat materi dan lab berikut, kamu akan menemukan jawabannya.
          </p>
        )}
      </Card>

      <section className="p13-section" aria-labelledby="p14-materi">
        <div className="section-head">
          <div>
            <h2 id="p14-materi">Materi Singkat</h2>
            <p>Baca secukupnya, lalu lanjut ke lab.</p>
          </div>
          {state.materiDone && <StatusBadge status="Selesai" />}
        </div>

        <div className="material-grid">
          <Card>
            <h3>A. Citra Digital</h3>
            <p>
              Langkah pertama adalah akuisisi citra (<em>image acquisition</em>): kamera menangkap gambar dan
              mengirimnya ke komputer sebagai citra digital. Citra adalah kotak-kotak kecil bernama piksel.
              Pada format RGB, setiap piksel menyimpan tiga angka warna (Red, Green, Blue, atau merah, hijau,
              biru) antara 0 dan 255. Citra 640 × 480 berisi 307.200 piksel. Robot hanya menerima angka-angka ini.
            </p>
          </Card>

          <Card>
            <h3>B. Mengapa Perlu Pra-pengolahan</h3>
            <p>
              Citra mentah penuh detail yang tidak dibutuhkan misi. Pra-pengolahan menyisakan
              informasi yang berguna, misalnya hanya area berwarna target, sehingga langkah
              berikutnya lebih mudah dan cepat.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>C. Empat Operasi Dasar</h3>
            <dl className="char-list">
              {OPERATIONS.map((o) => (
                <div key={o.term} className="char-list__row">
                  <dt>{o.term}</dt>
                  <dd>{o.text}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="material-grid__wide">
            <h3>D. Ruang Warna HSV</h3>
            <p>
              HSV menggambarkan warna dengan tiga nilai: <strong>Hue</strong> (jenis warna),{' '}
              <strong>Saturation</strong> (seberapa pekat), dan <strong>Value</strong> (seberapa
              terang). Karena jenis warna terpisah dari terang-gelap, filter HSV lebih tahan saat
              cahaya berubah. Skala di lab ini: H dalam derajat 0–360, S dan V 0–255.
            </p>
            <p>
              <strong>Hue itu lingkaran, bukan garis.</strong> Warna tersusun melingkar: merah di
              0°, kuning sekitar 60°, hijau 120°, biru 240°, lalu kembali ke merah di 360°. Karena
              itu merah tidak bisa ditulis satu rentang biasa. Rentangnya melewati titik 0°, misalnya
              340° sampai 10°, jadi H min boleh lebih besar dari H max. Catatan: OpenCV memakai
              setengah dari derajat ini (H 0–179), jadi 340° menjadi 170.
            </p>
            <p>
              <strong>Cahaya mengubah angkanya.</strong> Saat cahaya redup, Value turun dan Saturation
              ikut berubah, sedangkan Hue relatif tetap. Sisi-sisi kubus yang menghadap arah cahaya
              berbeda juga punya terang berbeda, sehingga satu kubus bisa terdiri dari beberapa nilai
              V. Karena itu batas V min dan S min tidak boleh terlalu ketat.
            </p>
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> gambar dari kamera dikirim sebagai
              pesan <code>sensor_msgs/Image</code>. Node memakai <code>cv_bridge</code> untuk
              mengubahnya menjadi gambar OpenCV, lalu memakai <code>cv2.cvtColor</code>,{' '}
              <code>cv2.threshold</code>, <code>cv2.Canny</code>, dan <code>cv2.inRange</code> untuk
              operasi seperti di lab ini.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>E. Menghaluskan dan Membersihkan Bintik</h3>
            <p>
              Hasil filter warna sering berbintik: ada titik putih kecil di latar yang warnanya
              kebetulan mirip, atau lubang hitam di dalam kubus. Dua langkah tambahan membantu:
            </p>
            <dl className="char-list">
              <div className="char-list__row">
                <dt>Blur</dt>
                <dd>Meratakan tiap piksel dengan tetangganya sebelum difilter, sehingga derau kecil dari kamera berkurang.</dd>
              </div>
              <div className="char-list__row">
                <dt>Erode lalu dilate</dt>
                <dd>Erode mengikis tepi area putih sehingga bintik kecil hilang. Dilate lalu menggemukkan area yang tersisa, sehingga kubus kembali ke ukuran semula.</dd>
              </div>
            </dl>
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> di OpenCV, ini{' '}
              <code>cv2.GaussianBlur</code>, <code>cv2.erode</code>, dan <code>cv2.dilate</code>{' '}
              (atau <code>cv2.morphologyEx</code>) yang dipanggil di dalam node pengolah gambar.
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
        <SectionHead title="Lab Filter Webcam" badge="WEBCAM USB">
          Coba tiap filter pada gambar langsung dari webcam, lalu isolasi kubus target dengan filter warna.
        </SectionHead>
        <WebcamLab done={state.labDone} onDone={() => update({ labDone: true })} />
      </Card>

      <Card className="activity">
        <SectionHead title="Pilih Filter yang Tepat">
          Pilih filter yang cocok untuk setiap kebutuhan robot. Benar: {quizCorrect}/{QUIZ.length}.
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
                      ...(chosen === q.answer
                        ? { color: '#166534', background: '#dcfce7' }
                        : { color: '#991b1b', background: '#fee2e2' }),
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
        <SectionHead title="Refleksi">
          Jawab dengan kata-katamu sendiri. Kamu boleh kembali ke pertanyaan pemantik di atas.
        </SectionHead>
        <div className="reflection">
          {REFLECTION_QUESTIONS.map((q, i) => (
            <div key={q.id} className="reflection__item">
              <label htmlFor={`p14-${q.id}`}>
                {i + 1}. {q.text}
              </label>
              <textarea
                id={`p14-${q.id}`}
                rows={3}
                value={state.reflection[q.id] || ''}
                onChange={(e) => {
                  setJustSaved(false)
                  update((prev) => ({
                    reflection: { ...prev.reflection, [q.id]: e.target.value },
                    reflectionSaved: false,
                  }))
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
            {allFilled && (state.reflectionSaved || justSaved) && (
              <span className="hint hint--ok">Refleksi tersimpan di browser ini.</span>
            )}
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
        <Button to="/pembelajaran/p15">Lanjut ke Object Detection</Button>
        <Button to="/pembelajaran" variant="secondary">
          Kembali ke Pembelajaran
        </Button>
      </div>
    </div>
  )
}
