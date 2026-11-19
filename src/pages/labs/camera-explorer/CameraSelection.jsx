import { CAMERAS, SELECTION_SCENARIO, SELECTION_NOTE } from './labData.js'

export default function CameraSelection({ selected, onSelect }) {
  const chosen = CAMERAS.find((c) => c.id === selected)

  return (
    <div className="selection">
      <div className="scenario-box">
        <strong>Skenario</strong>
        <p>{SELECTION_SCENARIO}</p>
      </div>

      <div className="camera-grid">
        {CAMERAS.map((cam) => {
          const isChosen = selected === cam.id
          return (
            <div key={cam.id} className={`cam-card${isChosen ? ' is-chosen' : ''}`}>
              <h3>{cam.name}</h3>
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
                onClick={() => onSelect(cam.id)}
              >
                {isChosen ? 'Dipilih' : `Pilih ${cam.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {chosen && (
        <>
          <p
            className={`feedback ${chosen.correct ? 'feedback--ok' : 'feedback--retry'}`}
            role="status"
          >
            {chosen.feedback}
          </p>
          {chosen.correct && <p className="note-box">{SELECTION_NOTE}</p>}
        </>
      )}
    </div>
  )
}
