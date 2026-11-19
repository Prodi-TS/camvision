import { useState } from 'react'
import CameraDiagram from '../CameraDiagram.jsx'
import { PARTS } from '../labData.js'

export default function ExploreStage({ state, update }) {
  const [activeId, setActiveId] = useState(null)
  const active = PARTS.find((p) => p.id === activeId)

  function select(id) {
    setActiveId(id)
    update((prev) =>
      prev.partsExplored.includes(id) ? {} : { partsExplored: [...prev.partsExplored, id] }
    )
  }

  return (
    <div className="explore">
      <div className="explore__stage">
        <CameraDiagram activeId={activeId} onSelect={select} mode="explore" />
        <p className="explore__hint">Klik bagian kamera untuk memeriksanya.</p>
      </div>

      <div className="explore__side">
        <div className="part-tabs" role="group" aria-label="Pilih bagian kamera">
          {PARTS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`part-tab${activeId === p.id ? ' is-active' : ''}${
                state.partsExplored.includes(p.id) ? ' is-seen' : ''
              }`}
              aria-pressed={activeId === p.id}
              onClick={() => select(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="info-panel" aria-live="polite">
          {active ? (
            <>
              <h3>{active.name}</h3>
              <dl>
                <dt>Fungsi</dt>
                <dd>{active.fungsi}</dd>
                <dt>Hubungan dengan sistem robot</dt>
                <dd>{active.hubungan}</dd>
              </dl>
            </>
          ) : (
            <p className="empty">Belum ada bagian yang dipilih. Mulai dari bagian mana saja.</p>
          )}
        </div>

        <p className="lab-count">
          Bagian diperiksa: <strong>{state.partsExplored.length}/{PARTS.length}</strong>
        </p>
      </div>
    </div>
  )
}
