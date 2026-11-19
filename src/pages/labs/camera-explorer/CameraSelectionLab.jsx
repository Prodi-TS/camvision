import { useEffect, useState } from 'react'
import Card from '../../../components/Card.jsx'
import Button from '../../../components/Button.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import ProgressBar from '../../../components/ProgressBar.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { useAuth } from '../../../auth.jsx'
import { CAMERAS, REQUIREMENTS, SCENARIO } from './labData.js'

// Lab: memilih kamera dari datasheet untuk robot.
// Data kamera dan kebutuhan diambil dari labData.js, jadi jawaban benar
// dihitung otomatis dan selalu sama dengan Mission 01 di P13.
// Semua angka adalah DATA SIMULASI.

const INFO = {
  Interface: {
    need: 'USB',
    part: 'Kabel dan colokan USB',
    why: 'Kamera tersambung ke USB HUB expansion board. Kamera berkabel pita CSI tidak bisa lewat hub.',
    unit: '',
  },
  FPS: {
    need: 'minimal 30',
    part: 'Sensor dan elektronik di badan kamera',
    why: 'Robot bergerak, jadi gambar harus cukup cepat supaya tidak patah-patah.',
    unit: ' FPS',
  },
  FOV: {
    need: 'minimal 60°',
    part: 'Lensa',
    why: 'Robot perlu melihat area yang cukup lebar di depannya.',
    unit: '',
  },
  Resolution: {
    need: 'minimal 1280 × 720',
    part: 'Sensor gambar di balik lensa',
    why: 'Detail kubus (warna dan bentuk) harus cukup jelas.',
    unit: '',
  },
}

const PATH_OPTIONS = [
  { id: 'hub', text: 'Kamera → USB HUB expansion board → komputer utama' },
  { id: 'ros', text: 'Kamera → ROS robot expansion board → komputer utama' },
  { id: 'screen', text: 'Kamera → layar 7 inci → komputer utama' },
]

const MARK = '#0d7a94'
const OK = { color: '#166534', background: '#dcfce7' }
const BAD = { color: '#991b1b', background: '#fee2e2' }
const cell = {
  border: '1px solid rgba(128, 128, 128, 0.3)',
  padding: '10px 12px',
  verticalAlign: 'top',
  textAlign: 'left',
  minWidth: 150,
}
const choiceBtn = (active) => ({
  textAlign: 'left',
  padding: '10px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  border: `1px solid ${MARK}`,
  background: active ? 'rgba(13,122,148,0.15)' : 'transparent',
  color: 'inherit',
  font: 'inherit',
})

const EMPTY = {
  path: '',
  marks: {},
  analysisChecked: false,
  choice: '',
  choiceConfirmed: false,
  note: '',
  noteSaved: false,
}

function useState_(username) {
  const key = `cv-amr-lab-camera-explorer:${username}`
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
    } catch {
      return EMPTY
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
    setState((prev) => ({
      ...prev,
      ...(typeof patch === 'function' ? patch(prev) : patch),
    }))
  return { state, update }
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 6,
        cursor: 'pointer',
        border: `1px solid ${MARK}`,
        background: active ? MARK : 'transparent',
        color: active ? '#ffffff' : MARK,
      }}
    >
      {children}
    </button>
  )
}

function Feedback({ good, children }) {
  return (
    <p
      role="status"
      style={{ margin: '12px 0 0', padding: '10px 14px', borderRadius: 8, ...(good ? OK : BAD) }}
    >
      {children}
    </p>
  )
}

function PathDiagram() {
  const box = { fill: 'none', stroke: 'currentColor', strokeWidth: 2 }
  const line = { stroke: 'currentColor', strokeWidth: 2, markerEnd: 'url(#cs-arrow)' }
  return (
    <svg
      viewBox="0 0 600 180"
      role="img"
      aria-label="Jalur sambungan: kamera ke USB HUB expansion board ke komputer utama. LiDAR juga masuk ke hub yang sama."
      style={{ width: '100%', maxWidth: 620, height: 'auto' }}
    >
      <defs>
        <marker id="cs-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <rect x="225" y="6" width="170" height="40" rx="8" {...box} />
      <text x="310" y="31" textAnchor="middle" fontSize="14" fill="currentColor">LiDAR</text>
      <line x1="310" y1="46" x2="310" y2="86" {...line} />

      <rect x="10" y="90" width="140" height="56" rx="8" {...box} />
      <text x="80" y="124" textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor">Kamera</text>

      <rect x="225" y="90" width="170" height="56" rx="8" {...box} fill="rgba(13,122,148,0.12)" />
      <text x="310" y="114" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">USB HUB</text>
      <text x="310" y="132" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">expansion board</text>

      <rect x="450" y="90" width="140" height="56" rx="8" {...box} />
      <text x="520" y="114" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">Komputer utama</text>
      <text x="520" y="132" textAnchor="middle" fontSize="11" fill="currentColor">Jetson / Raspberry Pi 5</text>

      <line x1="150" y1="118" x2="222" y2="118" {...line} />
      <line x1="395" y1="118" x2="447" y2="118" {...line} />
      <text x="186" y="108" textAnchor="middle" fontSize="11" fill="currentColor">USB</text>
      <text x="421" y="108" textAnchor="middle" fontSize="11" fill="currentColor">USB</text>
    </svg>
  )
}

export default function CameraSelectionLab({ lab }) {
  const { user } = useAuth()
  const { state, update } = useState_(user?.username ?? 'tamu')

  const passes = (cam, req) => !cam.fails.includes(req.label)
  const expected = (cam, req) => (passes(cam, req) ? 'ya' : 'tidak')
  const markKey = (cam, req) => `${cam.id}:${req.key}`
  const best = CAMERAS.find((c) => c.fit)

  const wrongCount = CAMERAS.reduce(
    (n, c) => n + REQUIREMENTS.filter((r) => state.marks[markKey(c, r)] !== expected(c, r)).length,
    0
  )
  const pathDone = state.path === 'hub'
  const analysisDone = state.analysisChecked && wrongCount === 0
  const choiceDone = state.choiceConfirmed && state.choice === best?.id
  const noteDone = state.noteSaved && state.note.trim().length > 0

  const tasks = [
    { id: 'path', label: 'Jalur sambungan kamera', done: pathDone },
    { id: 'analysis', label: 'Analisis datasheet', done: analysisDone },
    { id: 'choice', label: 'Keputusan pemilihan kamera', done: choiceDone },
    { id: 'note', label: 'Refleksi', done: noteDone },
  ]
  const doneCount = tasks.filter((t) => t.done).length
  const percent = Math.round((doneCount / tasks.length) * 100)
  const status =
    doneCount === 0 ? 'Belum dimulai' : doneCount === tasks.length ? 'Selesai' : 'Sedang dipelajari'

  const setMark = (key, value) =>
    update((prev) => ({ marks: { ...prev.marks, [key]: value }, analysisChecked: false }))

  const chosen = CAMERAS.find((c) => c.id === state.choice)

  return (
    <div className="page">
      <PageHeader
        title={lab?.title ?? 'Camera Explorer'}
        description="Baca datasheet, cocokkan dengan kebutuhan robot, lalu putuskan kamera mana yang sesuai."
        icon={lab?.icon ?? 'camera'}
        status={status}
      />

      <Card>
        <h2>Progress</h2>
        <ProgressBar value={percent} label="Progress lab" size="lg" />
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 8 }}>
          {tasks.map((t) => (
            <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span>{t.label}</span>
              <StatusBadge status={t.done ? 'Selesai' : 'Belum dimulai'} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2>Langkah 1. Misi</h2>
        <p>{SCENARIO.text}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 760 }}>
            <thead>
              <tr>
                <th style={cell}>Karakteristik</th>
                <th style={cell}>Kebutuhan misi</th>
                <th style={cell}>Berasal dari bagian</th>
                <th style={cell}>Alasan</th>
              </tr>
            </thead>
            <tbody>
              {REQUIREMENTS.map((r) => (
                <tr key={r.key}>
                  <td style={cell}><strong>{r.key}</strong></td>
                  <td style={cell}>{INFO[r.key].need}</td>
                  <td style={cell}>{INFO[r.key].part}</td>
                  <td style={cell}>{INFO[r.key].why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note-box">Semua angka datasheet pada lab ini adalah DATA SIMULASI untuk latihan membaca datasheet.</p>
      </Card>

      <Card>
        <h2>Langkah 2. Jalur sambungan kamera</h2>
        <p>
          Pada panduan wiring ROSMASTER X3 PLUS, kamera tidak langsung menuju komputer. Ia lewat
          papan hub terlebih dahulu. LiDAR juga masuk ke hub yang sama.
        </p>
        <PathDiagram />
        <p style={{ marginTop: 16 }}>
          <strong>Cek pemahaman:</strong> bagaimana jalur sambungan kamera USB pada robot ini?
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {PATH_OPTIONS.map((o) => (
            <button key={o.id} type="button" onClick={() => update({ path: o.id })} aria-pressed={state.path === o.id} style={choiceBtn(state.path === o.id)}>
              {o.text}
            </button>
          ))}
        </div>
        {state.path && (
          <Feedback good={pathDone}>
            {pathDone
              ? 'Tepat. Kamera masuk ke USB HUB expansion board, lalu hub tersambung ke port USB komputer utama.'
              : 'Belum tepat. Lihat lagi diagram: ke papan apa kabel kamera berujung sebelum sampai ke komputer?'}
          </Feedback>
        )}
      </Card>

      <Card>
        <h2>Langkah 3. Datasheet dan analisis</h2>
        <p>
          Baca nilai tiap kamera, lalu tandai apakah nilai itu <strong>memenuhi</strong> kebutuhan
          misi atau tidak. Tekan Periksa analisis kalau semua sel sudah terisi.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={cell}>Karakteristik</th>
                {CAMERAS.map((c) => (
                  <th key={c.id} style={cell}>{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REQUIREMENTS.map((r) => (
                <tr key={r.key}>
                  <td style={cell}>
                    <strong>{r.key}</strong>
                    <div style={{ fontSize: 13 }}>Kebutuhan: {INFO[r.key].need}</div>
                  </td>
                  {CAMERAS.map((c) => {
                    const key = markKey(c, r)
                    const mark = state.marks[key]
                    const right = state.analysisChecked && mark === expected(c, r)
                    return (
                      <td key={c.id} style={cell}>
                        <div>{c.specs[r.key]}{INFO[r.key].unit}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          <ToggleBtn active={mark === 'ya'} onClick={() => setMark(key, 'ya')}>Memenuhi</ToggleBtn>
                          <ToggleBtn active={mark === 'tidak'} onClick={() => setMark(key, 'tidak')}>Tidak</ToggleBtn>
                        </div>
                        {state.analysisChecked && (
                          <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 6, fontSize: 12, ...(right ? OK : BAD) }}>
                            {right ? 'Tepat' : mark ? 'Periksa lagi' : 'Belum diisi'}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14 }}>
          <Button onClick={() => update({ analysisChecked: true })}>Periksa analisis</Button>
        </div>
        {state.analysisChecked && (
          <Feedback good={wrongCount === 0}>
            {wrongCount === 0
              ? 'Semua tepat. Lanjut ke keputusan.'
              : `Masih ada ${wrongCount} sel yang belum tepat atau belum diisi. Baca lagi nilai di datasheet dan bandingkan dengan kebutuhan.`}
          </Feedback>
        )}
      </Card>

      <Card>
        <h2>Langkah 4. Keputusan</h2>
        {!analysisDone ? (
          <p className="hint">Selesaikan Langkah 3 dengan semua jawaban tepat untuk membuka langkah ini.</p>
        ) : (
          <>
            <p>Kamera mana yang kamu pilih untuk robot ini?</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CAMERAS.map((c) => (
                <button key={c.id} type="button" onClick={() => update({ choice: c.id, choiceConfirmed: false })} aria-pressed={state.choice === c.id} style={choiceBtn(state.choice === c.id)}>
                  <strong>{c.name}</strong>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <Button disabled={!state.choice} onClick={() => update({ choiceConfirmed: true })}>Konfirmasi pilihan</Button>
            </div>
            {state.choiceConfirmed && chosen && (
              <Feedback good={choiceDone}>
                {choiceDone
                  ? `${chosen.name} memenuhi keempat kebutuhan misi: Interface, FPS, FOV, dan Resolution.`
                  : `${chosen.name} belum memenuhi: ${chosen.fails.join('; ')}. Pilih kamera lain yang lulus semua kebutuhan.`}
              </Feedback>
            )}
          </>
        )}
      </Card>

      <Card>
        <h2>Langkah 5. Refleksi</h2>
        <label htmlFor="cs-note" style={{ display: 'block', marginBottom: 8 }}>
          Mengapa kamera itu paling sesuai untuk robot ini? Tulis 2 sampai 3 kalimat.
        </label>
        <textarea
          id="cs-note"
          rows={5}
          value={state.note}
          onChange={(e) => update({ note: e.target.value, noteSaved: false })}
          placeholder="Tulis jawabanmu di sini."
          style={{ width: '100%', maxWidth: 720 }}
        />
        <div style={{ marginTop: 12 }}>
          <Button disabled={!state.note.trim()} onClick={() => update({ noteSaved: true })}>Simpan refleksi</Button>
        </div>
        {state.noteSaved && <Feedback good>Refleksi tersimpan.</Feedback>}
      </Card>

      <div className="page-actions">
        <Button to="/virtual-lab" variant="secondary">Kembali ke Virtual Lab</Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (window.confirm('Ulangi lab dari awal? Jawabanmu akan dihapus.')) update(EMPTY)
          }}
        >
          Ulangi dari awal
        </Button>
      </div>
    </div>
  )
}
