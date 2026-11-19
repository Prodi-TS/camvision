import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../auth.jsx'
import { saveProgress } from '../../data/progressStore.js'
import { P19_REFLECTION as REFLECTION_QUESTIONS } from '../../data/reflectionQuestions.js'
import TuneLab from './TuneLab.jsx'
import '../p13/p13.css'

// ---------- Konten P19 ----------
const TP_CODE = '3.4.1'

const TUJUAN =
  'Memperbaiki sistem penglihatan AMR berdasarkan hasil analisis: mengubah satu pengaturan dalam satu waktu, mengujinya ulang, lalu membandingkan ketepatan dan kecepatannya dengan sebelum perbaikan.'

const PERTANYAAN_PEMANTIK =
  'Kamu menurunkan batas deteksi agar kubus di jarak jauh terdeteksi, dan memang berhasil. Namun, apakah ada hal lain yang ikut memburuk akibat perubahan itu?'

const KESIMPULAN =
  'Perbaikan selalu punya harga. Ubah satu pengaturan, uji ulang semua kondisi, lalu bandingkan dengan hasil sebelumnya. Perbaikan dianggap berhasil bila kondisi yang bermasalah membaik, kondisi lain tidak memburuk, dan waktu pemrosesan masih cukup cepat.'

const OPS = [
  { term: 'Kepekatan warna minimum', text: 'Diturunkan: warna pudar ikut lolos, tetapi warna lain lebih mudah ikut. Dinaikkan: lebih selektif, tetapi kubus yang pudar bisa hilang.' },
  { term: 'Kecerahan minimum', text: 'Diturunkan: area gelap tetap diproses, berguna saat redup. Risikonya bayangan ikut terhitung.' },
  { term: 'Luas minimum', text: 'Diturunkan: objek kecil atau jauh tetap terdeteksi. Risikonya bintik kecil terhitung sebagai objek.' },
  { term: 'Rentang warna', text: 'Dilebarkan: variasi warna kubus tertangkap. Risikonya benda berwarna mirip ikut terdeteksi.' },
  { term: 'Haluskan gambar (blur)', text: 'Dihidupkan: derau kecil berkurang sehingga hasil lebih stabil, terutama saat redup. Risikonya waktu pemrosesan naik.' },
]

const QUIZ = [
  { id: 'q1', prompt: 'Mengapa sebaiknya hanya satu pengaturan diubah dalam satu waktu?', options: ['Supaya efek tiap perubahan bisa diketahui', 'Supaya program lebih pendek', 'Karena kamera hanya menerima satu perubahan', 'Supaya tidak perlu menguji ulang'], answer: 'Supaya efek tiap perubahan bisa diketahui', ok: 'Benar. Bila banyak yang diubah sekaligus, kamu tidak tahu mana yang berpengaruh.' },
  { id: 'q2', prompt: 'Luas minimum diturunkan. Kubus jauh kini terdeteksi, tetapi bintik kecil juga terdeteksi. Ini contoh…', options: ['Perbaikan yang punya harga (trade-off)', 'Kerusakan kamera', 'Perbaikan tanpa risiko', 'Kesalahan penulisan program'], answer: 'Perbaikan yang punya harga (trade-off)', ok: 'Benar. Menaikkan sensitivitas biasanya menaikkan alarm palsu.' },
  { id: 'q3', prompt: 'Setelah mengubah pengaturan, langkah yang paling penting adalah…', options: ['Menguji ulang semua kondisi dan membandingkan dengan sebelumnya', 'Hanya menguji kondisi yang tadinya gagal', 'Langsung menyimpulkan berhasil', 'Menghapus hasil lama'], answer: 'Menguji ulang semua kondisi dan membandingkan dengan sebelumnya', ok: 'Benar. Kondisi yang tadinya baik bisa memburuk tanpa disadari.' },
  { id: 'q4', prompt: 'Rentang warna dilebarkan dan alarm palsu pada pengecoh naik. Penyebabnya…', options: ['Benda berwarna mirip ikut lolos', 'Kamera menjadi lebih gelap', 'Kubus bergeser', 'Luas minimum terlalu besar'], answer: 'Benda berwarna mirip ikut lolos', ok: 'Benar. Rentang yang lebar menerima warna lain yang mirip.' },
  { id: 'q5', prompt: 'Di ROS, pengaturan seperti ambang warna biasanya disimpan sebagai…', options: ['Parameter node', 'Gambar', 'Topik kamera', 'Peta'], answer: 'Parameter node', ok: 'Benar. Parameter bisa diubah tanpa menyusun ulang program.' },
  { id: 'q6', prompt: 'Kamera 30 FPS mengirim satu gambar tiap sekitar 33 ms. Bila memproses satu gambar butuh 50 ms, yang terjadi adalah…', options: ['Sistem tidak mengejar kamera, sehingga keputusan terlambat', 'Kamera otomatis melambat menjadi 50 ms', 'Hasil deteksi pasti lebih akurat', 'Robot berhenti bekerja selamanya'], answer: 'Sistem tidak mengejar kamera, sehingga keputusan terlambat', ok: 'Benar. Pemrosesan yang lebih lambat dari jeda antar gambar membuat keputusan robot tertinggal dari keadaan sebenarnya.' },
]
const QUIZ_WRONG = 'Belum tepat. Baca lagi materi, lalu coba pilihan lain.'


// ---------- State tersimpan per username di browser ----------
const INITIAL = {
  materiDone: false,
  labDone: false,
  after: {},
  quiz: {},
  reflection: { r1: '', r2: '', r3: '' },
  reflectionSaved: false,
}

function readP18Hypotheses(username) {
  try {
    const a = JSON.parse(localStorage.getItem(`cv-amr-p18:${username}`) || '{}').analysis || {}
    return Object.fromEntries(Object.entries(a).filter(([, v]) => v && v.hypothesis).map(([k, v]) => [k, v.hypothesis]))
  } catch {
    return {}
  }
}

function readP17Results(username) {
  try {
    return JSON.parse(localStorage.getItem(`cv-amr-p17:${username}`) || '{}').results || {}
  } catch {
    return {}
  }
}

function useP19State(username) {
  const key = `cv-amr-p19:${username}`
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
    { id: 'lab', label: 'Lab Optimasi Penglihatan', done: state.labDone },
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

export default function P19VisionOptimization() {
  const { user } = useAuth()
  const { state, update } = useP19State(user.username)
    const [thought, setThought] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const activities = getActivities(state)
  const doneCount = activities.filter((a) => a.done).length
  const percent = Math.round((doneCount / activities.length) * 100)
  const status = percent === 0 ? 'Belum dimulai' : percent === 100 ? 'Selesai' : 'Sedang dipelajari'

  useEffect(() => {
    saveProgress(user.username, 'p19', percent, {
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
          title="Vision Optimization"
          description="Meningkatkan kinerja penglihatan robot."
          icon="zap"
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

      <section className="p13-section" aria-labelledby="p19-materi">
        <div className="section-head">
          <div>
            <h2 id="p19-materi">Materi Singkat</h2>
            <p>Baca secukupnya, lalu lanjut ke lab.</p>
          </div>
          {state.materiDone && <StatusBadge status="Selesai" />}
        </div>

        <div className="material-grid">
          <Card>
            <h3>A. Perbaikan Selalu Punya Harga</h3>
            <p>
              Menaikkan kepekaan detektor biasanya menaikkan deteksi, tetapi juga alarm palsu. Menjadikannya
              lebih ketat melakukan sebaliknya. Optimasi berarti mencari titik tengah yang cocok untuk
              kondisi kerja robot.
            </p>
          </Card>

          <Card>
            <h3>B. Satu Perubahan, Satu Pengujian Ulang</h3>
            <p>
              Ubah satu pengaturan, rekam ulang, lalu bandingkan dengan sebelumnya. Dengan cara ini kamu tahu
              pengaturan mana yang berpengaruh. Setelah puas, uji ulang semua kondisi dengan pengaturan akhir.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>C. Pengaturan yang Bisa Dioptimalkan</h3>
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
            <h3>D. Menjaga Hasil Lama (Uji Regresi)</h3>
            <p>
              Perbaikan di satu kondisi bisa merusak kondisi lain tanpa terlihat. Karena itu, daftar uji dari
              tahap Vision Testing dipakai lagi. Bandingkan kolom sebelum dan sesudah. Perbaikan yang baik membuat kondisi
              bermasalah membaik dan tidak membuat kondisi lain memburuk.
            </p>
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> pengaturan seperti ambang warna disimpan sebagai
              parameter node, dan dapat diubah saat robot berjalan tanpa menyusun ulang program.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>E. Kecepatan dan Keandalan</h3>
            <p>
              Optimasi tidak hanya soal akurasi. <strong>Kecepatan</strong> berarti waktu pemrosesan per gambar. Robot yang
              melihat target terlambat juga terlambat berbelok. Pada kamera 30 FPS, anggaran waktunya sekitar 33 ms per
              gambar. <strong>Keandalan</strong> berarti hasil tetap konsisten di semua kondisi, bukan hanya di satu kondisi
              yang kebetulan baik.
            </p>
            <p>
              Langkah tambahan seperti blur membuat hasil lebih stabil, tetapi menambah waktu pemrosesan. Karena itu
              perbaikan yang baik menimbang tiga hal sekaligus: ketepatan, kecepatan, dan konsistensi antar kondisi.
              Di lab, kolom waktu proses menunjukkan harga kecepatan dari tiap perubahan.
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
        <SectionHead title="Lab Optimasi Penglihatan" badge="WEBCAM USB">
          Ubah pengaturan, rekam ulang, dan bandingkan dengan hasil pengujian.
        </SectionHead>
        <TuneLab
          before={readP17Results(user.username)}
          hypotheses={readP18Hypotheses(user.username)}
          after={state.after || {}}
          setAfter={(id, r) => update((prev) => ({ after: { ...(prev.after || {}), [id]: r } }))}
          clearAfter={() => update({ after: {} })}
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
              <label htmlFor={`p19-${q.id}`}>
                {i + 1}. {q.text}
              </label>
              <textarea
                id={`p19-${q.id}`}
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
        <Button to="/quiz">Lanjut ke Quiz</Button>
        <Button to="/pembelajaran" variant="secondary">
          Kembali ke Pembelajaran
        </Button>
      </div>
    </div>
  )
}
