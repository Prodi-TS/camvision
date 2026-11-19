import { useCallback, useEffect, useMemo, useState } from 'react'
import Card from '../../../components/Card.jsx'
import Button from '../../../components/Button.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import ProgressBar from '../../../components/ProgressBar.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { useAuth } from '../../../auth.jsx'
import { CAMERA_WORKSHOP } from './ticketsCamera.js'
import { IMAGE_WORKSHOP } from './ticketsImage.js'
import { workshopProgress } from './workshopProgress.js'

// Bengkel Teknisi: lab berbasis tiket kerusakan.
// Alur tiap tiket: gejala -> periksa -> diagnosis -> perbaikan -> uji robot.
// Semua gambar, log, dan data adalah SIMULASI.

export const WORKSHOPS = {
  'camera-explorer': CAMERA_WORKSHOP,
  'image-processing-lab': IMAGE_WORKSHOP,
}

const MARK = '#0d7a94'
const OK = { color: '#166534', background: '#dcfce7' }
const BAD = { color: '#991b1b', background: '#fee2e2' }
const MIN_TOOLS = 2

// ---------- Gambar simulasi ----------
const FLOOR = '#be9f78'

function Objects() {
  return (
    <g>
      <rect x="220" y="140" width="50" height="50" fill="#288c46" />
      <circle cx="60" cy="170" r="28" fill="#2850be" />
      <rect x="240" y="50" width="35" height="30" fill="#e1c828" />
      <rect x="110" y="110" width="60" height="60" fill="#c82328" />
      <polygon points="110,110 130,92 190,92 170,110" fill="#e14646" />
      <polygon points="170,110 190,92 190,152 170,170" fill="#961420" />
    </g>
  )
}

function Photo() {
  return (
    <g>
      <rect width="320" height="240" fill={FLOOR} />
      <Objects />
    </g>
  )
}

function colorAt(x, y) {
  if (x >= 110 && x < 170 && y >= 110 && y < 170) return '#c82328'
  if (y >= 92 && y < 110) {
    const shift = (110 - y) * (20 / 18)
    if (x >= 110 + shift && x < 170 + shift) return '#e14646'
  }
  if (x >= 170 && x < 190 && y >= 92 && y < 170) return '#961420'
  if (x >= 220 && x < 270 && y >= 140 && y < 190) return '#288c46'
  if ((x - 60) * (x - 60) + (y - 170) * (y - 170) <= 28 * 28) return '#2850be'
  if (x >= 240 && x < 275 && y >= 50 && y < 80) return '#e1c828'
  return FLOOR
}

function Blocks() {
  const cells = []
  const s = 20
  for (let cy = 0; cy < 12; cy++) {
    for (let cx = 0; cx < 16; cx++) {
      cells.push(<rect key={`${cx}-${cy}`} x={cx * s} y={cy * s} width={s} height={s} fill={colorAt(cx * s + s / 2, cy * s + s / 2)} />)
    }
  }
  return <g shapeRendering="crispEdges">{cells}</g>
}

function Label({ x, y, children, color = '#ffffff', size = 15, anchor = 'start' }) {
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontWeight="700" textAnchor={anchor} fontFamily="system-ui, sans-serif">
      {children}
    </text>
  )
}

const CUBES = [
  { x: 80, y: 90 },
  { x: 160, y: 70 },
  { x: 240, y: 90 },
]
const CONE_LEN = 200
// Sama dengan segitiga yang digambar: titik di dalam bila berada di antara dua sisi dan sebelum sisi ujung.
function inCone(p, theta) {
  const dy = 190 - p.y
  return dy > 0 && dy <= CONE_LEN * Math.cos(theta) && Math.abs(p.x - 160) <= dy * Math.tan(theta)
}

function NarrowScene({ fixed }) {
  const deg = fixed ? 45 : 15
  const th = (deg * Math.PI) / 180
  const L = CONE_LEN
  const lx = 160 - L * Math.sin(th)
  const rx = 160 + L * Math.sin(th)
  const y = 190 - L * Math.cos(th)
  return (
    <svg viewBox="0 0 320 240" role="img" aria-label={`Tampak atas robot dengan FOV ${deg} derajat`} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}>
      <rect width="320" height="240" fill="#e8dfd0" />
      <polygon points={`160,190 ${lx},${y} ${rx},${y}`} fill="rgba(13,122,148,0.28)" stroke={MARK} strokeWidth="1.5" />
      <rect x="142" y="190" width="36" height="28" rx="6" fill={MARK} />
      {CUBES.map((c) => {
        const seen = inCone(c, th)
        return (
          <g key={c.x}>
            <rect x={c.x - 9} y={c.y - 9} width="18" height="18" fill="#c82328" />
            <circle cx={c.x} cy={c.y} r="17" fill="none" stroke={seen ? '#16a34a' : '#dc2626'} strokeWidth="2" strokeDasharray={seen ? '0' : '4 3'} />
          </g>
        )
      })}
      <Label x="10" y="24" color="#1f2937" size={16}>FOV {deg}°</Label>
      <Label x="10" y="232" color="#1f2937" size={11}>hijau = terlihat, merah putus-putus = tidak terlihat</Label>
    </svg>
  )
}

// Menggambar bentuk kubus putih untuk mask.
function CubeMask({ top = true, side = true, front = true }) {
  return (
    <g fill="#ffffff" stroke="#ffffff" strokeWidth="0.8">
      {front && <rect x="110" y="110" width="60" height="60" />}
      {top && <polygon points="110,110 130,92 190,92 170,110" />}
      {side && <polygon points="170,110 190,92 190,152 170,170" />}
    </g>
  )
}

function speckles() {
  const dots = []
  let s = 7
  for (let i = 0; i < 38; i++) {
    s = (s * 1664525 + 1013904223) % 4294967296
    const x = 6 + (s / 4294967296) * 300
    s = (s * 1664525 + 1013904223) % 4294967296
    const y = 6 + (s / 4294967296) * 228
    if (x > 100 && x < 200 && y > 85 && y < 175) continue
    dots.push(<rect key={i} x={x} y={y} width="4" height="4" fill="#ffffff" />)
  }
  return dots
}

function ImageScene({ kind, fixed }) {
  let mask
  if (kind === 'img-dark') mask = fixed ? <CubeMask /> : null
  else if (kind === 'img-speckle') mask = (<><CubeMask />{!fixed && speckles()}</>)
  else if (kind === 'img-wrong') mask = (<><CubeMask />{!fixed && <rect x="240" y="50" width="35" height="30" fill="#ffffff" />}</>)
  else mask = <CubeMask top={fixed} />
  return (
    <svg viewBox="0 0 660 262" role="img" aria-label="Gambar kamera di kiri dan hasil filter di kanan" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <g>
        <Photo />
        {kind === 'img-dark' && <rect width="320" height="240" fill="#000000" opacity="0.72" />}
      </g>
      <g transform="translate(340,0)">
        <rect width="320" height="240" fill="#000000" />
        {mask}
      </g>
      <Label x="0" y="258" color="currentColor" size={13}>Gambar kamera</Label>
      <Label x="340" y="258" color="currentColor" size={13}>Hasil filter (mask)</Label>
    </svg>
  )
}

function CameraScene({ kind, fixed }) {
  if (kind === 'cam-narrow') return <NarrowScene fixed={fixed} />
  let body
  if (kind === 'cam-nosignal') {
    body = fixed ? (
      <Photo />
    ) : (
      <g>
        <rect width="320" height="240" fill="#000000" />
        <Label x="160" y="125" color="#ef4444" size={26} anchor="middle">NO SIGNAL</Label>
      </g>
    )
  } else if (kind === 'cam-stutter') {
    body = fixed ? (
      <g>
        <Photo />
        <Label x="12" y="26" color="#16a34a" size={16}>30 FPS</Label>
      </g>
    ) : (
      <g>
        <rect width="320" height="240" fill={FLOOR} />
        <g opacity="0.3" transform="translate(-48,0)"><Objects /></g>
        <g opacity="0.5" transform="translate(-24,0)"><Objects /></g>
        <Objects />
        <Label x="12" y="26" color="#dc2626" size={16}>8 FPS</Label>
      </g>
    )
  } else {
    body = fixed ? (
      <g>
        <Photo />
        <Label x="12" y="26" color="#16a34a" size={14}>1280 × 720</Label>
      </g>
    ) : (
      <g>
        <Blocks />
        <Label x="12" y="26" color="#dc2626" size={14}>160 × 120</Label>
      </g>
    )
  }
  return (
    <svg viewBox="0 0 320 240" role="img" aria-label="Tampilan layar kamera robot" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}>
      {body}
    </svg>
  )
}

function Scene({ kind, fixed }) {
  return kind.startsWith('img-') ? <ImageScene kind={kind} fixed={fixed} /> : <CameraScene kind={kind} fixed={fixed} />
}

// ---------- State tersimpan ----------
const INITIAL = { solved: {}, reflection: '', reflectionSaved: false }

// Bila key kosong, hook ini tidak membaca dan tidak menulis penyimpanan
// (dipakai saat state dipegang pemanggil, yaitu lab gabungan).
function useLabState(key) {
  const [state, setState] = useState(() => {
    if (!key) return INITIAL
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL
    } catch {
      return INITIAL
    }
  })
  useEffect(() => {
    if (!key) return
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* penyimpanan browser tidak tersedia */
    }
  }, [key, state])
  const update = useCallback(
    (patch) => setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) })),
    []
  )
  return { state, update }
}

// Dipakai lab gabungan: state tiket dipegang halaman lab, jadi status tahap ikut terbarui.
export function useWorkshopState(labId, username) {
  const cfg = WORKSHOPS[labId] || CAMERA_WORKSHOP
  return useLabState(`${cfg.storageKey}:${username ?? 'tamu'}`)
}

const btn = (active) => ({
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  border: `1px solid ${MARK}`,
  background: active ? MARK : 'transparent',
  color: active ? '#ffffff' : 'inherit',
  font: 'inherit',
  fontSize: 14,
  fontWeight: 600,
})

const optionBtn = (active) => ({
  textAlign: 'left',
  padding: '10px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  border: `1px solid ${MARK}`,
  background: active ? 'rgba(13,122,148,0.15)' : 'transparent',
  color: 'inherit',
  font: 'inherit',
})

function Feedback({ good, children }) {
  return (
    <p role="status" style={{ margin: '10px 0 0', padding: '8px 12px', borderRadius: 8, ...(good ? OK : BAD) }}>
      {children}
    </p>
  )
}

function Choice({ title, step, spec, picked, onPick, locked, lockedText }) {
  const chosen = spec.options.find((o) => o.id === picked)
  const good = picked === spec.correct
  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ margin: '0 0 8px' }}>
        {step}. {title}
      </h3>
      {locked ? (
        <p className="hint">{lockedText}</p>
      ) : (
        <>
          <p style={{ margin: '0 0 8px' }}>{spec.question}</p>
          <div role="group" aria-label={spec.question} style={{ display: 'grid', gap: 8 }}>
            {spec.options.map((o) => (
              <button key={o.id} type="button" aria-pressed={picked === o.id} onClick={() => onPick(o.id)} style={optionBtn(picked === o.id)}>
                {o.text}
              </button>
            ))}
          </div>
          {chosen && <Feedback good={good}>{chosen.why}</Feedback>}
        </>
      )}
    </div>
  )
}

function TicketPanel({ ticket, index, solved, work, setWork, onSolve }) {
  const w = work || { tools: [], diag: null, fix: null, wrong: 0 }
  const isSolved = Boolean(solved)
  const diagOk = isSolved || w.diag === ticket.diagnosis.correct
  const fixOk = isSolved || w.fix === ticket.fix.correct
  const enoughTools = isSolved || w.tools.length >= MIN_TOOLS

  function inspect(id) {
    setWork((prev) => {
      const cur = prev || { tools: [], diag: null, fix: null, wrong: 0 }
      return cur.tools.includes(id) ? cur : { ...cur, tools: [...cur.tools, id] }
    })
  }
  function pick(kind, spec, id) {
    setWork((prev) => {
      const cur = prev || { tools: [], diag: null, fix: null, wrong: 0 }
      if (cur[kind] === id) return cur
      return { ...cur, [kind]: id, wrong: cur.wrong + (id === spec.correct ? 0 : 1) }
    })
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div>
          <Scene kind={ticket.scene} fixed={isSolved} />
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <p style={{ margin: 0 }}>{isSolved ? ticket.success : ticket.report}</p>
          {!isSolved && (
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Log robot (simulasi)</div>
              <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: '#0f172a', color: '#e2e8f0', fontSize: 12, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                {ticket.log.join('\n')}
              </pre>
            </div>
          )}
        </div>
      </div>

      {!isSolved && (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ margin: '0 0 8px' }}>1. Periksa</h3>
          <p style={{ margin: '0 0 8px' }}>
            Lakukan pemeriksaan minimal {MIN_TOOLS} hal sebelum menentukan penyebab. Diperiksa: {w.tools.length}/{ticket.tools.length}.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ticket.tools.map((t) => (
              <button key={t.id} type="button" onClick={() => inspect(t.id)} style={btn(w.tools.includes(t.id))} aria-pressed={w.tools.includes(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {w.tools.length > 0 && (
            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
              {ticket.tools
                .filter((t) => w.tools.includes(t.id))
                .map((t) => (
                  <li key={t.id} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(128,128,128,0.35)' }}>
                    <strong>{t.label}:</strong> {t.result}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {!isSolved && (
        <Choice
          step="2"
          title="Diagnosis"
          spec={ticket.diagnosis}
          picked={w.diag}
          onPick={(id) => pick('diag', ticket.diagnosis, id)}
          locked={!enoughTools}
          lockedText={`Periksa minimal ${MIN_TOOLS} hal dulu untuk membuka diagnosis.`}
        />
      )}

      {!isSolved && (
        <Choice
          step="3"
          title="Perbaikan"
          spec={ticket.fix}
          picked={w.fix}
          onPick={(id) => pick('fix', ticket.fix, id)}
          locked={!diagOk}
          lockedText="Tentukan penyebab yang benar dulu untuk membuka perbaikan."
        />
      )}

      {!isSolved && (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ margin: '0 0 8px' }}>4. Uji robot</h3>
          <Button onClick={() => onSolve(w.wrong)} disabled={!(diagOk && fixOk)}>
            Jalankan robot
          </Button>
          {!(diagOk && fixOk) && <p className="hint">Selesaikan diagnosis dan perbaikan yang benar untuk menguji robot.</p>}
        </div>
      )}

      {isSolved && (
        <Feedback good>
          Tiket {index + 1} selesai. Kesalahan pada tiket ini: {solved.wrong}.
        </Feedback>
      )}
    </div>
  )
}

// embedded: dipakai sebagai satu tahap di lab gabungan (tanpa judul halaman dan tombol kembali).
// store: { state, update } dari useWorkshopState bila state dipegang pemanggil.
export default function WorkshopLab({ lab, embedded = false, store }) {
  const { user } = useAuth()
  const cfg = WORKSHOPS[lab?.id] || CAMERA_WORKSHOP
  const own = useLabState(store ? null : `${cfg.storageKey}:${user?.username ?? 'tamu'}`)
  const { state, update } = store || own
  const [current, setCurrent] = useState(cfg.tickets[0].id)
  const [works, setWorks] = useState({})
  const [justSaved, setJustSaved] = useState(false)

  const ticket = cfg.tickets.find((t) => t.id === current) || cfg.tickets[0]
  const index = cfg.tickets.indexOf(ticket)
  const { solved: solvedCount, wrong: totalWrong, percent, done, total } = workshopProgress(cfg, state)
  const status = done === 0 ? 'Belum dimulai' : done === total ? 'Selesai' : 'Sedang dipelajari'

  const setWork = useMemo(
    () => (fn) => setWorks((prev) => ({ ...prev, [current]: fn(prev[current]) })),
    [current]
  )

  return (
    <div className="page">
      {!embedded && (
        <PageHeader title={lab?.title ?? cfg.title} description={cfg.description} icon={lab?.icon ?? 'flask'} status={status} />
      )}

      <Card>
        <h2>{embedded ? 'Bengkel Citra' : 'Progress'}</h2>
        <ProgressBar value={percent} label={embedded ? 'Progres tahap' : 'Progress lab'} size="lg" />
        <p className="hint">
          Tiket selesai: {solvedCount}/{cfg.tickets.length}. Total kesalahan: {totalWrong}.
        </p>
        <p>{cfg.intro}</p>
        <p className="note-box">Semua gambar, log, dan angka pada lab ini adalah SIMULASI untuk latihan.</p>
      </Card>

      <Card>
        <h2>Daftar Tiket</h2>
        <div role="tablist" aria-label="Daftar tiket" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cfg.tickets.map((t, i) => (
            <button key={t.id} type="button" role="tab" aria-selected={current === t.id} onClick={() => setCurrent(t.id)} style={btn(current === t.id)}>
              {state.solved[t.id] ? '✓ ' : ''}Tiket {i + 1}
            </button>
          ))}
        </div>
        <h3 style={{ margin: '16px 0 12px' }}>
          Tiket {index + 1}: {ticket.title}
        </h3>
        <TicketPanel
          key={ticket.id}
          ticket={ticket}
          index={index}
          solved={state.solved[ticket.id]}
          work={works[ticket.id]}
          setWork={setWork}
          onSolve={(wrong) => update((prev) => ({ solved: { ...prev.solved, [ticket.id]: { wrong } } }))}
        />
        {state.solved[ticket.id] && index < cfg.tickets.length - 1 && (
          <div style={{ marginTop: 14 }}>
            <Button variant="secondary" onClick={() => setCurrent(cfg.tickets[index + 1].id)}>
              Tiket berikutnya
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <h2>Refleksi</h2>
        {solvedCount < cfg.tickets.length ? (
          <p className="hint">Selesaikan semua tiket untuk membuka refleksi.</p>
        ) : (
          <div className="reflection">
            <div className="reflection__item">
              <label htmlFor="ws-refl">{cfg.reflectionQuestion}</label>
              <textarea
                id="ws-refl"
                rows={4}
                value={state.reflection}
                onChange={(e) => {
                  setJustSaved(false)
                  update({ reflection: e.target.value, reflectionSaved: false })
                }}
                placeholder="Tulis jawabanmu dengan kata-katamu sendiri."
              />
            </div>
            <div className="reflection__actions">
              <Button
                disabled={!state.reflection.trim()}
                onClick={() => {
                  update({ reflectionSaved: true })
                  setJustSaved(true)
                }}
              >
                Simpan Refleksi
              </Button>
              {(state.reflectionSaved || justSaved) && state.reflection.trim() && <span className="hint hint--ok">Refleksi tersimpan di browser ini.</span>}
            </div>
          </div>
        )}
      </Card>

      <div className="page-actions">
        {!embedded && (
          <Button to="/virtual-lab" variant="secondary">
            Kembali ke Virtual Lab
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            if (window.confirm('Ulangi lab dari awal? Semua tiket dan jawabanmu akan dihapus.')) {
              setWorks({})
              setCurrent(cfg.tickets[0].id)
              update(INITIAL)
            }
          }}
        >
          Ulangi dari awal
        </Button>
      </div>
    </div>
  )
}
