import { useState } from 'react'
import CameraDiagram from '../CameraDiagram.jsx'
import { PARTS } from '../labData.js'

export default function PartsStage({ state, update }) {
  const [selId, setSelId] = useState(null)
  const [msg, setMsg] = useState(null)

  const statuses = {}
  PARTS.forEach((p) => {
    const chosen = state.labels[p.id]
    statuses[p.id] = chosen ? (chosen === p.name ? 'ok' : 'wrong') : null
  })
  const okCount = PARTS.filter((p) => statuses[p.id] === 'ok').length
  const selPart = PARTS.find((p) => p.id === selId)

  function pickMarker(id) {
    setSelId(id)
    setMsg(null)
  }

  function assign(name) {
    if (!selPart) return
    const ok = selPart.name === name
    update((prev) => ({ labels: { ...prev.labels, [selPart.id]: name } }))
    setMsg(
      ok
        ? { ok: true, text: `Benar. Bagian ${selPart.no} adalah ${name}.` }
        : {
            ok: false,
            text: 'Belum tepat. Lihat kembali bagian ini pada tahap Explore Camera, lalu coba lagi.',
          }
    )
  }

  return (
    <div className="explore">
      <div className="explore__stage">
        <CameraDiagram activeId={selId} onSelect={pickMarker} mode="label" statuses={statuses} />
        <p className="explore__hint">Kamera ditandai nomor 1–4. Pilih nomor, lalu beri nama bagiannya.</p>
      </div>

      <div className="explore__side">
        <div className="part-tabs" role="group" aria-label="Pilih nomor bagian">
          {PARTS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`part-tab part-tab--${statuses[p.id] || 'idle'}${
                selId === p.id ? ' is-active' : ''
              }`}
              aria-pressed={selId === p.id}
              onClick={() => pickMarker(p.id)}
            >
              Bagian {p.no}
              {statuses[p.id] === 'ok' ? ' ✓' : ''}
            </button>
          ))}
        </div>

        <div className="info-panel">
          {selPart && statuses[selPart.id] !== 'ok' ? (
            <>
              <h3>Bagian {selPart.no}: apa namanya?</h3>
              <div className="chip-row" role="group" aria-label="Pilih nama bagian">
                {PARTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="chip-btn"
                    onClick={() => assign(p.name)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          ) : selPart ? (
            <p>
              Bagian {selPart.no} sudah dilabeli: <strong>{selPart.name}</strong>.
            </p>
          ) : (
            <p className="empty">Pilih salah satu nomor pada kamera.</p>
          )}
          {msg && (
            <p className={`feedback ${msg.ok ? 'feedback--ok' : 'feedback--retry'}`} role="status">
              {msg.text}
            </p>
          )}
        </div>

        <p className="lab-count">
          Bagian teridentifikasi: <strong>{okCount}/{PARTS.length}</strong>
        </p>
      </div>
    </div>
  )
}
