import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../auth.jsx'
import { saveProgress } from '../../data/progressStore.js'
import { P15_REFLECTION as REFLECTION_QUESTIONS } from '../../data/reflectionQuestions.js'
import DetectLab from './DetectLab.jsx'
import '../p13/p13.css'

// ---------- Konten P15 ----------
const TP_CODE = '3.2.1'

const TUJUAN =
  'Mengaplikasikan deteksi objek berbasis warna dan bentuk, serta melatih model kecerdasan buatan sederhana (k-NN) untuk mengenali kubus target dari contoh berlabel.'

const PERTANYAAN_PEMANTIK =
  'Setelah gambar diolah, robot masih memegang kumpulan piksel putih. Bagaimana robot tahu berapa objek di sana, di mana posisinya, dan mana yang kubus target?'

const KESIMPULAN =
  'Deteksi objek mengubah mask menjadi daftar objek dengan kontur, kotak pembatas, dan titik pusat (centroid). Setiap objek dicirikan oleh fitur seperti warna, ukuran, dan bentuk. Model k-NN belajar dari contoh berlabel untuk menentukan mana kubus target. Kualitas model bergantung pada contoh yang diberikan.'

const OPS = [
  { term: 'Pelabelan blob', text: 'Mengelompokkan piksel putih yang saling bersentuhan menjadi satu objek. Setiap kelompok adalah satu blob.' },
  { term: 'Kontur', text: 'Garis tepi yang mengelilingi objek, yaitu piksel objek yang bersebelahan dengan latar.' },
  { term: 'Bounding box', text: 'Kotak terkecil yang membungkus kontur sebuah objek. Memberi letak dan ukuran objek di gambar.' },
  { term: 'Centroid', text: 'Titik pusat objek: rata-rata koordinat (x, y) semua piksel objek. Inilah posisi objek yang dipakai robot.' },
  { term: 'Fitur', text: 'Angka yang menggambarkan ciri objek: warna (hue), ukuran (luas), bentuk (rasio lebar-tinggi), dan kepadatan (seberapa penuh kotaknya).' },
  { term: 'k-NN', text: 'Model yang belajar dari contoh berlabel. Untuk objek baru, ia mencari k contoh paling mirip, lalu mengambil label yang paling banyak. Contoh yang lebih mirip punya suara lebih besar.' },
]

const QUIZ = [
  { id: 'q1', prompt: 'Langkah yang mengubah mask menjadi daftar objek terpisah adalah…', options: ['Grayscale', 'Pelabelan blob', 'Blur', 'Threshold'], answer: 'Pelabelan blob', ok: 'Benar. Pelabelan blob mengelompokkan piksel putih yang bersentuhan menjadi objek.' },
  { id: 'q2', prompt: 'Informasi yang menunjukkan posisi dan ukuran objek pada gambar adalah…', options: ['Bounding box', 'Hue', 'Resolusi', 'Frame rate'], answer: 'Bounding box', ok: 'Benar. Bounding box membungkus objek dan menunjukkan letak serta ukurannya.' },
  { id: 'q3', prompt: 'Angka seperti luas, rasio lebar-tinggi, dan warna rata-rata sebuah objek disebut…', options: ['Fitur', 'Label', 'Noise', 'Piksel'], answer: 'Fitur', ok: 'Benar. Fitur adalah angka yang menggambarkan ciri objek.' },
  { id: 'q4', prompt: 'Ciri utama model yang "belajar" dibanding aturan if-else tetap adalah…', options: ['Ia menyimpan contoh berlabel dan memakainya untuk memutuskan', 'Ia tidak memerlukan data apa pun', 'Ia selalu 100% benar', 'Ia hanya bisa mengenali satu warna'], answer: 'Ia menyimpan contoh berlabel dan memakainya untuk memutuskan', ok: 'Benar. Perilaku model ditentukan oleh contoh yang diberikan, bukan aturan yang ditulis manual.' },
  { id: 'q5', prompt: 'Model salah mengenali sebuah objek baru. Penyebab yang paling mungkin adalah…', options: ['Contoh latihnya kurang beragam', 'Kamera terlalu mahal', 'Layar terlalu kecil', 'Kabel USB terlalu panjang'], answer: 'Contoh latihnya kurang beragam', ok: 'Benar. Objek yang berbeda dari semua contoh latih sering salah dikenali.' },
  { id: 'q6', prompt: 'Titik pusat objek yang dihitung dari rata-rata koordinat semua pikselnya disebut…', options: ['Centroid', 'Kontur', 'Hue', 'Threshold'], answer: 'Centroid', ok: 'Benar. Centroid adalah rata-rata koordinat piksel objek, dan dipakai sebagai posisi objek.' },
]
const QUIZ_WRONG = 'Belum tepat. Baca lagi materi, lalu coba pilihan lain.'


// ---------- State tersimpan per username di browser ----------
const INITIAL = {
  materiDone: false,
  labDone: false,
  samples: [],
  quiz: {},
  reflection: { r1: '', r2: '', r3: '' },
  reflectionSaved: false,
}

function useP15State(username) {
  const key = `cv-amr-p15:${username}`
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
    { id: 'lab', label: 'Lab Deteksi dan Latih Model', done: state.labDone },
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

export default function P15ObjectDetection() {
  const { user } = useAuth()
  const { state, update } = useP15State(user.username)
  const [thought, setThought] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const activities = getActivities(state)
  const doneCount = activities.filter((a) => a.done).length
  const percent = Math.round((doneCount / activities.length) * 100)
  const status = percent === 0 ? 'Belum dimulai' : percent === 100 ? 'Selesai' : 'Sedang dipelajari'

  useEffect(() => {
    saveProgress(user.username, 'p15', percent, {
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
          title="Object Detection"
          description="Mengenali objek yang terlihat oleh robot."
          icon="target"
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

      <section className="p13-section" aria-labelledby="p15-materi">
        <div className="section-head">
          <div>
            <h2 id="p15-materi">Materi Singkat</h2>
            <p>Baca secukupnya, lalu lanjut ke lab.</p>
          </div>
          {state.materiDone && <StatusBadge status="Selesai" />}
        </div>

        <div className="material-grid">
          <Card>
            <h3>A. Dari Mask ke Objek</h3>
            <p>
              Pada Image Processing, filter warna menghasilkan mask: piksel putih adalah warna target. Namun mask hanyalah
              piksel. Robot perlu tahu berapa objek di sana, di mana posisinya, dan seberapa besar. Karena
              itu piksel putih yang bersentuhan dikelompokkan menjadi satu objek.
            </p>
          </Card>

          <Card>
            <h3>B. Mengapa Perlu Mengenali, Bukan Hanya Menemukan</h3>
            <p>
              Di meja bisa ada banyak benda berwarna. Warna saja tidak cukup untuk memilih kubus target.
              Robot perlu memakai beberapa ciri sekaligus, lalu memutuskan mana yang target.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>C. Istilah Penting</h3>
            <dl className="char-list">
              {OPS.map((o) => (
                <div key={o.term} className="char-list__row">
                  <dt>{o.term}</dt>
                  <dd>{o.text}</dd>
                </div>
              ))}
            </dl>
            <p>
              <strong>Membaca posisi dari centroid.</strong> Gambar kamera di lab ini berukuran 320 × 240 piksel,
              jadi titik tengahnya (160, 120). Centroid dengan x kecil, misalnya (80, 120), berarti objek ada di
              sisi kiri gambar. Bila x besar, misalnya (240, 120), objek ada di sisi kanan. Robot membandingkan
              x centroid dengan 160 untuk memutuskan arah, seperti yang dilakukan di AMR Vision Mission.
            </p>
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> di OpenCV, kontur dicari dengan{' '}
              <code>cv2.findContours</code>, kotak dengan <code>cv2.boundingRect</code>, dan centroid dihitung dari{' '}
              <code>cv2.moments</code> (cx = m10 / m00, cy = m01 / m00).
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>D. Belajar dari Contoh</h3>
            <p>
              Alih-alih menulis aturan "kubus target selalu berukuran sekian dan berwarna sekian", kamu
              memberi contoh: ini kubus target, ini bukan. Model menyimpan contoh itu sebagai angka fitur.
              Saat melihat objek baru, model membandingkannya dengan contoh dan memilih label tetangga
              terdekat. Inilah bentuk paling sederhana dari pembelajaran mesin. Model yang dipakai robot
              sungguhan lebih besar, tetapi prinsipnya sama: belajar dari data berlabel.
            </p>
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> hasil deteksi dikirim sebagai pesan
              seperti <code>vision_msgs/Detection2DArray</code>, berisi kotak pembatas, label, dan skor
              kepercayaan. Pada robot sungguhan, deteksi sering memakai jaringan saraf seperti YOLO. Di lab
              ini kamu melatih model sendiri dengan k-NN.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>E. Empat Kasus Deteksi yang Sering Salah</h3>
            <p>
              Deteksi tidak selalu benar. Empat kasus berikut sering muncul saat kamu memakai kubus
              berwarna di lab. Kenali gejalanya, pahami penyebabnya, lalu coba perbaikannya di lab webcam.
            </p>
            <dl className="char-list">
              <div className="char-list__row">
                <dt>1. Dua kubus menyatu menjadi satu kotak</dt>
                <dd>
                  <strong>Gejala:</strong> dua kubus yang berdekatan hanya mendapat satu kotak pembatas,
                  lebar dan besar.<br />
                  <strong>Penyebab:</strong> piksel mask kedua kubus bersentuhan, sehingga dikelompokkan
                  sebagai satu objek.<br />
                  <strong>Perbaikan:</strong> beri jarak antar kubus, atau naikkan kamera agar sela di antara
                  kubus terlihat.
                </dd>
              </div>
              <div className="char-list__row">
                <dt>2. Benda besar ikut terdeteksi</dt>
                <dd>
                  <strong>Gejala:</strong> permukaan meja atau kardus muncul sebagai objek raksasa.<br />
                  <strong>Penyebab:</strong> warnanya masuk rentang HSV target, dan ukurannya melewati batas
                  luas minimum.<br />
                  <strong>Perbaikan:</strong> perketat batas warna (terutama kepekatan), atau ajarkan model
                  bahwa objek sebesar itu bukan target.
                </dd>
              </div>
              <div className="char-list__row">
                <dt>3. Kotak merah kecil dikira kubus target</dt>
                <dd>
                  <strong>Gejala:</strong> benda merah berukuran lain mendapat label target dengan skor
                  cukup tinggi.<br />
                  <strong>Penyebab:</strong> contoh "bukan target" yang kamu berikan belum memuat benda
                  merah berukuran lain, sehingga model hanya melihat warna yang sama.<br />
                  <strong>Perbaikan:</strong> tambahkan contoh "bukan target" dengan warna sama tetapi
                  ukuran berbeda.
                </dd>
              </div>
              <div className="char-list__row">
                <dt>4. Kubus target dekat kamera dikira bukan target</dt>
                <dd>
                  <strong>Gejala:</strong> kubus yang benar tidak dikenali ketika didekatkan ke kamera.<br />
                  <strong>Penyebab:</strong> semakin dekat, kubus tampak semakin besar. Contoh latihmu
                  hanya dari satu jarak, sehingga ukuran besar dianggap asing.<br />
                  <strong>Perbaikan:</strong> kumpulkan contoh target dari beberapa jarak.
                </dd>
              </div>
            </dl>
            <p className="note-box">
              <strong>Pola yang sama:</strong> kasus 3 dan 4 bukan salah rumus, melainkan salah data.
              Model hanya sebaik contoh yang diberikan. Contoh yang kurang beragam menghasilkan
              keputusan yang rapuh.
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
        <SectionHead title="Lab Deteksi dan Latih Model" badge="WEBCAM USB">
          Temukan objek di depan webcam, beri label pada contohnya, lalu uji model yang kamu latih.
        </SectionHead>
        <DetectLab
          samples={state.samples}
          setSamples={(fn) => update((prev) => ({ samples: typeof fn === 'function' ? fn(prev.samples) : fn }))}
          done={state.labDone}
          onDone={() => update({ labDone: true })}
        />
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
              <label htmlFor={`p15-${q.id}`}>
                {i + 1}. {q.text}
              </label>
              <textarea
                id={`p15-${q.id}`}
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
        <Button to="/pembelajaran/p16">Lanjut ke AMR Vision Mission</Button>
        <Button to="/pembelajaran" variant="secondary">
          Kembali ke Pembelajaran
        </Button>
      </div>
    </div>
  )
}
