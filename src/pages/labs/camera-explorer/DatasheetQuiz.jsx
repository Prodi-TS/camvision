import { QUESTIONS, PARAM_OPTIONS, WRONG_FEEDBACK, SPECS } from './labData.js'

export default function DatasheetQuiz({ answers, onAnswer }) {
  const correctCount = QUESTIONS.filter((q) => answers[q.id] === q.answer).length

  return (
    <div className="quiz">
      <div className="quiz__data" aria-label="Data simulasi kamera">
        {SPECS.map((s) => (
          <span key={s.label} className="quiz__chip">
            <em>{s.label}</em> {s.value}
          </span>
        ))}
      </div>

      {QUESTIONS.map((q, index) => {
        const chosen = answers[q.id]
        const isCorrect = chosen === q.answer
        return (
          <div key={q.id} className="question">
            <p className="question__prompt">
              <span className="question__no">{index + 1}</span>
              {q.prompt}
            </p>
            <div
              className="question__options"
              role="group"
              aria-label={`Pilihan jawaban pertanyaan ${index + 1}`}
            >
              {PARAM_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`option${chosen === opt ? ' is-chosen' : ''}`}
                  aria-pressed={chosen === opt}
                  onClick={() => onAnswer(q.id, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {chosen && (
              <p
                className={`feedback ${isCorrect ? 'feedback--ok' : 'feedback--retry'}`}
                role="status"
              >
                {isCorrect ? q.correct : WRONG_FEEDBACK}
              </p>
            )}
          </div>
        )
      })}

      <p className="lab-count">
        Jawaban benar: <strong>{correctCount}/{QUESTIONS.length}</strong>
      </p>
    </div>
  )
}
