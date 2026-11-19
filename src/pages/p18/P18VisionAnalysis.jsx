import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../auth.jsx'
import { saveProgress } from '../../data/progressStore.js'
import { P18_REFLECTION as REFLECTION_QUESTIONS } from '../../data/reflectionQuestions.js'
import DiagLab from './DiagLab.jsx'
import '../p13/p13.css'

// ---------- Konten P18 ----------
const TP_CODE = '3.3.1'

const TUJUAN =
  'Menganalisis hasil pengujian penglihatan AMR: membaca data, membuat dugaan penyebab, lalu memeriksa dugaan itu dengan bukti sebelum memperbaiki.'

const PERTANYAAN_PEMANTIK =
  'Pada pengujian, deteksi gagal di jarak jauh. Apakah penyebabnya kamera, warna, cahaya, atau ukuran objek, dan bagaimana kamu bisa yakin tanpa menebak?'

const KESIMPULAN =
  'Analisis yang baik bergerak dari gejala ke penyebab dengan bukti. Lihat datanya, buat dugaan, lalu periksa dugaan itu dengan angka. Perbaikan baru dilakukan setelah penyebabnya terbukti, supaya tidak mengubah hal yang bukan masalah.'

const OPS = [
  { term: 'Objek terlalu kecil', text: 'Tanda: kotak target kecil (luas di bawah batas) atau sering hilang saat jauh. Bukti: luas kotak kecil dan banyak cuplikan "terlihat tetapi terlalu kecil".' },
  { term: 'Cahaya terlalu gelap', text: 'Tanda: deteksi turun saat ruangan redup. Bukti: kecerahan gambar rendah, kepekatan warna ikut turun.' },
  { term: 'Cahaya terlalu terang atau silau', text: 'Tanda: deteksi turun saat alas disorot lampu. Bukti: kecerahan gambar sangat tinggi dan kepekatan warna turun karena warna kubus memutih.' },
  { term: 'Warna pudar atau batas kurang cocok', text: 'Tanda: kubus terlihat tetapi sebagian tidak masuk mask. Bukti: kepekatan warna target dekat dengan batas minimum yang kamu atur.' },
  { term: 'Benda lain ikut terdeteksi', text: 'Tanda: alarm palsu saat kubus tidak ada. Bukti: ada kotak target padahal hanya benda lain berwarna mirip di depan kamera.' },
]

const QUIZ = [
  { id: 'q1', prompt: 'Deteksi gagal di jarak jauh. Langkah pertama analisis yang tepat adalah…', options: ['Melihat data: luas kotak, kecerahan, kepekatan warna', 'Langsung mengganti webcam', 'Menurunkan semua batas deteksi', 'Mengabaikan kondisi itu'], answer: 'Melihat data: luas kotak, kecerahan, kepekatan warna', ok: 'Benar. Data menunjukkan penyebab, jadi lihat data sebelum memperbaiki.' },
  { id: 'q2', prompt: 'Data menunjukkan luas kotak target sangat kecil di jarak jauh, dengan kecerahan cukup. Dugaan yang paling didukung adalah…', options: ['Objek terlalu kecil di gambar', 'Cahaya terlalu gelap', 'Warna target salah', 'Webcam rusak'], answer: 'Objek terlalu kecil di gambar', ok: 'Benar. Luas kecil dengan cahaya cukup menunjuk ke ukuran objek.' },
  { id: 'q3', prompt: 'Saat cahaya redup, kecerahan gambar rendah dan kepekatan warna ikut turun. Penyebab yang cocok adalah…', options: ['Cahaya terlalu gelap', 'Objek terlalu kecil', 'Zona tengah terlalu sempit', 'Kubus berpindah'], answer: 'Cahaya terlalu gelap', ok: 'Benar. Kecerahan rendah adalah bukti langsung kurangnya cahaya.' },
  { id: 'q4', prompt: 'Mengapa dugaan perlu diperiksa dengan bukti sebelum diperbaiki?', options: ['Supaya tidak mengubah hal yang bukan penyebab', 'Supaya laporan lebih panjang', 'Karena dugaan selalu salah', 'Supaya tidak perlu menguji ulang'], answer: 'Supaya tidak mengubah hal yang bukan penyebab', ok: 'Benar. Perbaikan yang salah sasaran membuang waktu dan bisa memperburuk keadaan.' },
  { id: 'q5', prompt: 'Pada uji "tanpa kubus", detektor tetap menemukan target. Penyebab yang paling mungkin adalah…', options: ['Benda lain berwarna mirip ikut terdeteksi', 'Kubus terlalu jauh', 'Cahaya terlalu gelap', 'Resolusi terlalu tinggi'], answer: 'Benda lain berwarna mirip ikut terdeteksi', ok: 'Benar. Tanpa kubus, deteksi hanya mungkin berasal dari benda lain.' },
]
const QUIZ_WRONG = 'Belum tepat. Baca lagi materi, lalu coba pilihan lain.'


// ---------- State tersimpan per username di browser ----------
const INITIAL = {
  materiDone: false,
  labDone: false,
  analysis: {},
  quiz: {},
  reflection: { r1: '', r2: '', r3: '' },
  reflectionSaved: false,
}

function readP18Results(username) {
  try {
    return JSON.parse(localStorage.getItem(`cv-amr-p17:${username}`) || '{}').results || {}
  } catch {
    return {}
  }
}

function useP18State(username) {
  const key = `cv-amr-p18:${username}`
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
    { id: 'lab', label: 'Lab Analisis Penyebab', done: state.labDone },
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

export default function P18VisionAnalysis() {
  const { user } = useAuth()
  const { state, update } = useP18State(user.username)
  const p17Results = readP18Results(user.username)
  const [thought, setThought] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const activities = getActivities(state)
  const doneCount = activities.filter((a) => a.done).length
  const percent = Math.round((doneCount / activities.length) * 100)
  const status = percent === 0 ? 'Belum dimulai' : percent === 100 ? 'Selesai' : 'Sedang dipelajari'

  useEffect(() => {
    saveProgress(user.username, 'p18', percent, {
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
          title="Vision Analysis"
          description="Menganalisis hasil pengujian penglihatan robot."
          icon="chart"
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

      <section className="p13-section" aria-labelledby="p18-materi">
        <div className="section-head">
          <div>
            <h2 id="p18-materi">Materi Singkat</h2>
            <p>Baca secukupnya, lalu lanjut ke lab.</p>
          </div>
          {state.materiDone && <StatusBadge status="Selesai" />}
        </div>

        <div className="material-grid">
          <Card>
            <h3>A. Gejala dan Penyebab</h3>
            <p>
              Hasil pengujian hanya menunjukkan gejala, misalnya "gagal di jarak jauh". Penyebabnya masih
              harus dicari. Gejala yang sama bisa berasal dari penyebab berbeda, jadi menebak berisiko.
            </p>
          </Card>

          <Card>
            <h3>B. Tiga Langkah Analisis</h3>
            <p>
              Pertama, lihat data: luas kotak, kecerahan, kepekatan warna. Kedua, buat dugaan penyebab.
              Ketiga, periksa dugaan itu dengan angka. Bila data tidak mendukung, ganti dugaan, bukan datanya.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>C. Lima Penyebab Umum</h3>
            <dl className="char-list">
              {OPS.map((o) => (
                <div key={o.term} className="char-list__row">
                  <dt>{o.term}</dt>
                  <dd>{o.text}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="material-grid__wide">
            <h3>D. Melihat Tahap Pemrosesan</h3>
            <p>
              Satu cara menemukan penyebab adalah melihat hasil tiap tahap. Gambar asli menunjukkan kondisi
              cahaya. Hasil pemisahan warna (mask) menunjukkan bagian mana yang dianggap target. Bila mask
              berlubang atau hilang, masalah ada di tahap warna, bukan di tahap keputusan robot.
            </p>
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> hasil tiap tahap dapat dipublikasikan sebagai
              topik gambar, lalu dilihat dengan <code>rqt_image_view</code> atau RViz saat robot berjalan.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>E. Membandingkan Kondisi dan Waktu Pemrosesan</h3>
            <p>
              Sebelum mencari penyebab, bandingkan dulu hasil pengujian menurut satu faktor. Untuk jarak, bandingkan
              dekat, sedang, dan jauh. Untuk cahaya, bandingkan normal, redup, dan terang pada jarak yang sama. Faktor yang
              membuat tingkat deteksi paling berbeda adalah yang paling memengaruhi keberhasilan deteksi.
            </p>
            <p>
              Bandingkan juga waktu pemrosesan tiap kondisi. Bila waktunya hampir sama di semua kondisi, kegagalan
              deteksi bukan karena kecepatan. Bila waktunya berbeda jauh, periksa apakah jumlah objek atau bercak warna
              di gambar ikut berbeda.
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
        <SectionHead title="Lab Analisis Penyebab" badge="WEBCAM USB">
          Rekam data satu kondisi, buat dugaan, lalu periksa dengan bukti.
        </SectionHead>
        <DiagLab
          p17Results={p17Results}
          analysis={state.analysis || {}}
          setAnalysis={(id, r) => update((prev) => ({ analysis: { ...(prev.analysis || {}), [id]: r } }))}
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
              <label htmlFor={`p18-${q.id}`}>
                {i + 1}. {q.text}
              </label>
              <textarea
                id={`p18-${q.id}`}
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
        <Button to="/pembelajaran/p19">Lanjut ke Vision Optimization</Button>
        <Button to="/pembelajaran" variant="secondary">
          Kembali ke Pembelajaran
        </Button>
      </div>
    </div>
  )
}
