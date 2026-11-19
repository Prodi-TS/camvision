import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../auth.jsx'
import { saveProgress } from '../../data/progressStore.js'
import { P17_REFLECTION as REFLECTION_QUESTIONS } from '../../data/reflectionQuestions.js'
import VisionTestLab from './VisionTestLab.jsx'
import '../p13/p13.css'

// ---------- Konten P17 ----------
const TP_CODE = '3.3.1'

const TUJUAN =
  'Menguji sistem penglihatan AMR secara terukur: menyiapkan kondisi uji, mengambil data berulang, lalu menghitung tingkat deteksi, alarm palsu, ketepatan keputusan, posisi objek, dan waktu pemrosesan.'

const PERTANYAAN_PEMANTIK =
  'Detektor kubus berhasil saat dicoba satu kali. Apakah itu cukup untuk membuktikan robot siap bekerja di lantai gudang, dan bagaimana mengujinya agar hasilnya bisa dipercaya?'

const KESIMPULAN =
  'Pengujian yang baik mengubah kesan menjadi angka. Setiap kondisi diuji berulang, satu faktor diubah dalam satu waktu, dan hasilnya dibandingkan dengan kriteria lulus. Selain ketepatan, kecepatan juga diukur lewat waktu pemrosesan. Kondisi yang paling lemah menjadi bahan analisis dan perbaikan pada tahap berikutnya.'

const OPS = [
  { term: 'Tingkat deteksi', text: 'Persentase cuplikan gambar yang menemukan target, saat target memang ada. Makin tinggi makin baik.' },
  { term: 'Alarm palsu', text: 'Persentase cuplikan yang "menemukan" target padahal target tidak ada, misalnya benda lain yang salah dikenali sebagai target. Makin rendah makin baik.' },
  { term: 'Kestabilan posisi', text: 'Seberapa bergeser posisi kotak saat target diam, dalam piksel. Makin kecil makin stabil.' },
  { term: 'Posisi objek', text: 'Rata-rata titik pusat (centroid) target selama direkam. Bila kubus diletakkan di tengah, posisi yang terukur seharusnya dekat titik tengah gambar (160, 120).' },
  { term: 'Waktu pemrosesan', text: 'Waktu yang dibutuhkan untuk memproses satu gambar sampai target ditentukan, dalam milidetik (ms). Kamera 30 FPS mengirim satu gambar tiap sekitar 33 ms, jadi pemrosesan yang lebih lambat dari itu tidak mengejar kamera.' },
  { term: 'Kriteria lulus', text: 'Batas yang ditetapkan sebelum uji. Contoh: saat target ada, deteksi minimal 80%. Saat target tidak ada, alarm palsu maksimal 10%.' },
]

const QUIZ = [
  { id: 'q1', prompt: 'Detektor berhasil pada satu percobaan. Hasil itu belum cukup karena…', options: ['Satu percobaan tidak menunjukkan seberapa konsisten hasilnya', 'Kamera hanya boleh dipakai sekali', 'Percobaan pertama selalu salah', 'Warna target akan berubah'], answer: 'Satu percobaan tidak menunjukkan seberapa konsisten hasilnya', ok: 'Benar. Pengujian perlu pengulangan agar konsistensinya terukur.' },
  { id: 'q2', prompt: 'Pada uji "tanpa kubus", detektor menandai sesuatu di 40% cuplikan. Kejadian ini disebut…', options: ['Alarm palsu', 'Tingkat deteksi', 'Kestabilan posisi', 'Kriteria lulus'], answer: 'Alarm palsu', ok: 'Benar. Alarm palsu adalah deteksi saat targetnya sebenarnya tidak ada.' },
  { id: 'q3', prompt: 'Agar penyebab kegagalan mudah ditemukan, kondisi uji sebaiknya…', options: ['Diubah satu faktor dalam satu waktu', 'Diubah semuanya sekaligus', 'Tidak pernah diubah', 'Dipilih acak tanpa dicatat'], answer: 'Diubah satu faktor dalam satu waktu', ok: 'Benar. Dengan satu faktor berubah, penyebab perbedaan hasil mudah dilacak.' },
  { id: 'q4', prompt: 'Kubus diam, tetapi kotak target bergeser sampai ±15 piksel antar cuplikan. Ukuran yang buruk di sini adalah…', options: ['Kestabilan posisi', 'Tingkat deteksi', 'Resolusi kamera', 'Kriteria lulus'], answer: 'Kestabilan posisi', ok: 'Benar. Posisi yang bergeser-geser membuat robot sulit mengambil keputusan belok.' },
  { id: 'q5', prompt: 'Uji jarak jauh gagal, sedangkan jarak sedang lulus. Langkah berikutnya yang paling masuk akal adalah…', options: ['Menyelidiki mengapa objek kecil di gambar tidak terdeteksi', 'Menghapus uji jarak jauh', 'Menganggap semua uji lulus', 'Mengganti warna target'], answer: 'Menyelidiki mengapa objek kecil di gambar tidak terdeteksi', ok: 'Benar. Kegagalan yang terukur menjadi petunjuk bagian mana yang perlu dianalisis dan diperbaiki.' },
]
const QUIZ_WRONG = 'Belum tepat. Baca lagi materi, lalu coba pilihan lain.'


// ---------- State tersimpan per username di browser ----------
const INITIAL = {
  materiDone: false,
  labDone: false,
  results: {},
  quiz: {},
  reflection: { r1: '', r2: '', r3: '' },
  reflectionSaved: false,
}

function useP17State(username) {
  const key = `cv-amr-p17:${username}`
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
    { id: 'lab', label: 'Lab Pengujian Penglihatan', done: state.labDone },
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

export default function P17VisionTesting() {
  const { user } = useAuth()
  const { state, update } = useP17State(user.username)
  const [thought, setThought] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const activities = getActivities(state)
  const doneCount = activities.filter((a) => a.done).length
  const percent = Math.round((doneCount / activities.length) * 100)
  const status = percent === 0 ? 'Belum dimulai' : percent === 100 ? 'Selesai' : 'Sedang dipelajari'

  useEffect(() => {
    saveProgress(user.username, 'p17', percent, {
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
          title="Vision Testing"
          description="Menguji kinerja sistem penglihatan robot."
          icon="check"
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

      <section className="p13-section" aria-labelledby="p17-materi">
        <div className="section-head">
          <div>
            <h2 id="p17-materi">Materi Singkat</h2>
            <p>Baca secukupnya, lalu lanjut ke lab.</p>
          </div>
          {state.materiDone && <StatusBadge status="Selesai" />}
        </div>

        <div className="material-grid">
          <Card>
            <h3>A. Mengapa Sekali Coba Tidak Cukup</h3>
            <p>
              Detektor yang berhasil sekali bisa gagal saat cahaya berubah atau kubus berpindah. Pengujian
              mengulang pengambilan data pada kondisi yang sudah ditentukan, lalu mengubah hasilnya menjadi
              angka yang bisa dibandingkan.
            </p>
          </Card>

          <Card>
            <h3>B. Menyusun Kondisi Uji</h3>
            <p>
              Ubah satu faktor dalam satu waktu: jarak, cahaya, latar, atau benda pengecoh. Sertakan juga uji
              saat kubus tidak ada. Uji seperti ini menunjukkan apakah detektor salah menandai benda lain.
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
          </Card>

          <Card className="material-grid__wide">
            <h3>D. Membaca Tabel Hasil</h3>
            <p>
              Tabel hasil memuat satu baris per kondisi. Cari baris yang gagal, lalu lihat polanya. Jika yang
              gagal hanya jarak jauh, masalahnya mungkin ukuran objek di gambar. Jika yang gagal hanya cahaya
              redup, masalahnya mungkin batas warna. Pola itulah yang dianalisis pada Vision Analysis.
            </p>
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> pada robot sungguhan, data uji direkam
              dengan rosbag, lalu diputar ulang untuk membandingkan hasil sebelum dan sesudah perbaikan
              dengan data yang persis sama.
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
        <SectionHead title="Lab Pengujian Penglihatan" badge="WEBCAM USB">
          Rekam tujuh kondisi uji dan lihat sendiri tingkat deteksi, alarm palsu, dan kondisi terlemah.
        </SectionHead>
        <VisionTestLab
          results={state.results || {}}
          setResult={(id, r) => update((prev) => ({ results: { ...(prev.results || {}), [id]: r } }))}
          clearResults={() => update({ results: {} })}
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
              <label htmlFor={`p17-${q.id}`}>
                {i + 1}. {q.text}
              </label>
              <textarea
                id={`p17-${q.id}`}
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
        <Button to="/pembelajaran/p18">Lanjut ke Vision Analysis</Button>
        <Button to="/pembelajaran" variant="secondary">
          Kembali ke Pembelajaran
        </Button>
      </div>
    </div>
  )
}
