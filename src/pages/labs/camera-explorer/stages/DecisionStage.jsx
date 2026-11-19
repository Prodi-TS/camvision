import Button from '../../../../components/Button.jsx'
import { CAMERAS, SCENARIO, DECISION_QUESTION, evaluateDecision } from '../labData.js'

export default function DecisionStage({ state, update, goTo }) {
  const cam = CAMERAS.find((c) => c.id === state.selection)

  if (!cam) {
    return (
      <div className="locked">
        <p>Pilih kamera terlebih dahulu sebelum mengambil keputusan.</p>
        <Button onClick={() => goTo(5)}>Kembali ke Choose Camera</Button>
      </div>
    )
  }

  const result = evaluateDecision(state.selection, state.decision)

  return (
    <div className="decision-stage">
      <div className="chain">
        <div className="chain__box">
          <span className="chain__label">Kebutuhan robot</span>
          <strong>{SCENARIO.need}</strong>
          <span>{SCENARIO.text}</span>
        </div>
        <span className="chain__arrow" aria-hidden="true">
          ↓
        </span>
        <div className="chain__box">
          <span className="chain__label">Spesifikasi kamera</span>
          <strong>
            {cam.name} · FOV {cam.specs.FOV}
          </strong>
          <span>
            {cam.specs.Resolution} · {cam.specs.FPS} FPS · {cam.specs.Interface}
          </span>
        </div>
        <span className="chain__arrow" aria-hidden="true">
          ↓
        </span>
        <div
          className={`chain__box chain__box--decision${
            result.answered ? (result.correct ? ' is-ok' : ' is-retry') : ''
          }`}
        >
          <span className="chain__label">Keputusan teknisi</span>
          <strong>{state.decision === 'YES' ? 'Sesuai' : state.decision === 'NO' ? 'Belum sesuai' : '…'}</strong>
        </div>
      </div>

      <div className="decision-panel">
        <h3>{DECISION_QUESTION}</h3>
        <div className="decision-panel__buttons" role="group" aria-label="Keputusan teknisi">
          {['YES', 'NO'].map((d) => (
            <button
              key={d}
              type="button"
              className={`decision-btn${state.decision === d ? ' is-chosen' : ''}`}
              aria-pressed={state.decision === d}
              onClick={() => update({ decision: d })}
            >
              {d}
            </button>
          ))}
        </div>

        {result.answered && (
          <p
            className={`feedback ${result.correct ? 'feedback--ok' : 'feedback--retry'}`}
            role="status"
          >
            {result.text}
          </p>
        )}

        <div className="decision-panel__actions">
          <Button variant="secondary" onClick={() => goTo(5)}>
            Ubah pilihan kamera
          </Button>
        </div>
      </div>
    </div>
  )
}
