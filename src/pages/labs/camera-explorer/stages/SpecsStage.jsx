import { useState } from 'react'
import ParamVisual from '../ParamVisual.jsx'
import { PARAMS } from '../labData.js'

export default function SpecsStage({ state, update }) {
  const [activeId, setActiveId] = useState(null)
  const active = PARAMS.find((p) => p.id === activeId)

  function select(id) {
    setActiveId(id)
    update((prev) =>
      prev.paramsSeen.includes(id) ? {} : { paramsSeen: [...prev.paramsSeen, id] }
    )
  }

  return (
    <div className="specs-stage">
      <div className="spec-panel">
        <div className="spec-panel__head">
          <strong>Camera Specifications</strong>
          <span className="badge badge--info">DATA SIMULASI</span>
        </div>
        <div className="spec-panel__grid">
          {PARAMS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`spec-tile${activeId === p.id ? ' is-active' : ''}${
                state.paramsSeen.includes(p.id) ? ' is-seen' : ''
              }`}
              aria-pressed={activeId === p.id}
              onClick={() => select(p.id)}
            >
              <span className="spec-tile__label">{p.label}</span>
              <span className="spec-tile__value">{p.value}</span>
              <span className="spec-tile__cta">Parameter ini untuk apa?</span>
            </button>
          ))}
        </div>
      </div>

      <div className="info-panel info-panel--wide" aria-live="polite">
        {active ? (
          <div className="param-detail">
            <div className="param-detail__visual">
              <ParamVisual id={active.id} value={active.value} />
            </div>
            <div>
              <h3>
                {active.label} <span className="param-detail__value">{active.value}</span>
              </h3>
              <dl>
                <dt>Digunakan untuk</dt>
                <dd>{active.purpose}</dd>
                <dt>Bagi teknisi robot</dt>
                <dd>{active.robot}</dd>
              </dl>
            </div>
          </div>
        ) : (
          <p className="empty">Klik salah satu parameter untuk melihat kegunaannya.</p>
        )}
      </div>

      <p className="lab-count">
        Parameter diperiksa: <strong>{state.paramsSeen.length}/{PARAMS.length}</strong>
      </p>
      <p className="note-box">
        Angka pada panel ini adalah data simulasi untuk latihan, bukan spesifikasi kamera nyata.
      </p>
    </div>
  )
}
