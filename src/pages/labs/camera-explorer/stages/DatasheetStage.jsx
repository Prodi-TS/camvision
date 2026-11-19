import { DATASHEET_ROWS, CHECKPOINTS, CHECKPOINT_WRONG } from '../labData.js'

export default function DatasheetStage({ state, update }) {
  const allInspected = state.inspected.length === DATASHEET_ROWS.length
  const lastInspected = state.lastInspected
  const row = DATASHEET_ROWS.find((r) => r.id === lastInspected)

  function inspect(id) {
    update((prev) => ({
      lastInspected: id,
      inspected: prev.inspected.includes(id) ? prev.inspected : [...prev.inspected, id],
    }))
  }

  function answer(cpId, rowId) {
    update((prev) => ({ checkpoint: { ...prev.checkpoint, [cpId]: rowId } }))
  }

  return (
    <div className="datasheet-stage">
      <div className="datasheet">
        <div className="datasheet__title">
          <strong>CAMERA DATASHEET</strong>
          <span className="badge badge--info">DATA SIMULASI</span>
        </div>
        <ul className="datasheet__rows">
          {DATASHEET_ROWS.map((r) => (
            <li
              key={r.id}
              className={`ds-row${lastInspected === r.id ? ' is-highlight' : ''}${
                state.inspected.includes(r.id) ? ' is-inspected' : ''
              }`}
            >
              <span className="ds-row__term">{r.term}</span>
              <span className="ds-row__value">{r.value}</span>
              <button
                type="button"
                className="ds-row__btn"
                aria-label={`Inspect ${r.term}`}
                onClick={() => inspect(r.id)}
              >
                Inspect
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="info-panel" aria-live="polite">
        {row ? (
          <>
            <h3>
              {row.term}: {row.value}
            </h3>
            <p className="ds-reads">{row.reads}</p>
          </>
        ) : (
          <p className="empty">Tekan Inspect pada setiap baris untuk membaca datasheet.</p>
        )}
        <p className="lab-count">
          Baris diinspeksi: <strong>{state.inspected.length}/{DATASHEET_ROWS.length}</strong>
        </p>
      </div>

      {allInspected && (
        <div className="checkpoint">
          <h3>Checkpoint singkat</h3>
          {CHECKPOINTS.map((cp) => {
            const chosen = state.checkpoint[cp.id]
            const ok = chosen === cp.answer
            return (
              <div key={cp.id} className="checkpoint__item">
                <p>{cp.prompt}</p>
                <div className="chip-row" role="group" aria-label={cp.prompt}>
                  {DATASHEET_ROWS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`chip-btn${chosen === r.id ? ' is-chosen' : ''}`}
                      aria-pressed={chosen === r.id}
                      onClick={() => answer(cp.id, r.id)}
                    >
                      {r.term}
                    </button>
                  ))}
                </div>
                {chosen && (
                  <p className={`feedback ${ok ? 'feedback--ok' : 'feedback--retry'}`} role="status">
                    {ok ? cp.ok : CHECKPOINT_WRONG}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
