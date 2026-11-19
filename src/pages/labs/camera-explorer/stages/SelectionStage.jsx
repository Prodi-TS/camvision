import { FovCone, CoverageView } from '../CoverageView.jsx'
import { CAMERAS, SCENARIO } from '../labData.js'

export default function SelectionStage({ state, update }) {
  const chosen = CAMERAS.find((c) => c.id === state.selection)

  function choose(id) {
    // Mengganti kamera membatalkan keputusan teknisi sebelumnya.
    update({ selection: id, decision: null })
  }

  return (
    <div className="selection-stage">
      <div className="scenario-card">
        <div>
          <span className="scenario-card__label">{SCENARIO.title}</span>
          <p className="scenario-card__text">{SCENARIO.text}</p>
          <span className="badge badge--info">DATA SIMULASI</span>
        </div>
        <div className="scenario-card__view">
          <CoverageView fov={chosen ? chosen.fov : null} />
        </div>
      </div>

      <div className="camera-grid">
        {CAMERAS.map((cam) => {
          const isChosen = state.selection === cam.id
          return (
            <div key={cam.id} className={`cam-card${isChosen ? ' is-chosen' : ''}`}>
              <h3>{cam.name}</h3>
              <FovCone fov={cam.fov} label={false} />
              <dl>
                {Object.entries(cam.specs).map(([k, v]) => (
                  <div key={k} className="cam-card__row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                className="btn btn--secondary"
                aria-pressed={isChosen}
                onClick={() => choose(cam.id)}
              >
                {isChosen ? 'Dipilih' : `Pilih ${cam.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {chosen && (
        <div className="result-panel" aria-live="polite">
          <div className="result-panel__col">
            <span className="result-panel__label">Your Selection</span>
            <strong>{chosen.name}</strong>
            <span>
              FOV {chosen.specs.FOV} · {chosen.specs.Resolution} · {chosen.specs.FPS} FPS ·{' '}
              {chosen.specs.Interface}
            </span>
          </div>
          <div className="result-panel__col result-panel__col--why">
            <span className="result-panel__label">Why?</span>
            <p>
              Kebutuhan skenario: <strong>{SCENARIO.need.toLowerCase()}</strong>. {chosen.why}
            </p>
            {chosen.note && <p className="note-box">{chosen.note}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
