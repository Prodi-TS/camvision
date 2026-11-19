import { SCENARIOS, LIDAR_CLOSING } from './p13Data.js'

const CHOICES = ['Kamera', 'LiDAR']

export default function CameraVsLidar({ answers, onAnswer }) {
  const answeredCount = SCENARIOS.filter((s) => answers[s.id]).length

  return (
    <div className="scenarios">
      {SCENARIOS.map((s, index) => {
        const chosen = answers[s.id]
        const isCorrect = chosen === s.answer
        return (
          <div key={s.id} className="scenario">
            <p className="scenario__prompt">
              <span className="scenario__no">{index + 1}</span>
              {s.prompt}
            </p>
            <div className="scenario__choices" role="group" aria-label={`Pilihan untuk skenario ${index + 1}`}>
              {CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`choice${chosen === c ? ' is-chosen' : ''}`}
                  aria-pressed={chosen === c}
                  onClick={() => onAnswer(s.id, c)}
                >
                  {c}
                </button>
              ))}
            </div>
            {chosen && (
              <p
                className={`feedback ${isCorrect ? 'feedback--ok' : 'feedback--retry'}`}
                role="status"
              >
                <strong>{isCorrect ? 'Benar.' : 'Belum tepat.'}</strong> {s.explanation}
              </p>
            )}
          </div>
        )
      })}

      <p className="scenarios__count">
        Skenario dijawab: <strong>{answeredCount} dari {SCENARIOS.length}</strong>
      </p>
      {answeredCount === SCENARIOS.length && <p className="note-box">{LIDAR_CLOSING}</p>}
    </div>
  )
}
