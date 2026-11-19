import { DATASHEET_ITEMS, TERMS } from './p13Data.js'

export default function DatasheetChallenge({ answers, onAnswer }) {
  const correctCount = DATASHEET_ITEMS.filter((i) => answers[i.id] === i.answer).length
  const allCorrect = correctCount === DATASHEET_ITEMS.length

  return (
    <div className="datasheet">
      <p className="datasheet__intro">
        Pilih istilah yang cocok untuk setiap nilai pada potongan datasheet di bawah.
      </p>

      <ul className="datasheet__list">
        {DATASHEET_ITEMS.map((item) => {
          const chosen = answers[item.id] || ''
          const isCorrect = chosen === item.answer
          const answered = chosen !== ''
          return (
            <li key={item.id} className="datasheet__row">
              <div className="datasheet__value">{item.value}</div>
              <div className="datasheet__answer">
                <label htmlFor={`ds-${item.id}`} className="sr-only">
                  Istilah untuk nilai {item.value}
                </label>
                <select
                  id={`ds-${item.id}`}
                  value={chosen}
                  onChange={(e) => onAnswer(item.id, e.target.value)}
                >
                  <option value="">Pilih istilah…</option>
                  {TERMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {answered && (
                  <p
                    className={`feedback ${isCorrect ? 'feedback--ok' : 'feedback--retry'}`}
                    role="status"
                  >
                    {isCorrect ? (
                      <>
                        <strong>Benar.</strong> {item.why}
                      </>
                    ) : (
                      'Belum tepat. Coba perhatikan kembali istilah pada datasheet.'
                    )}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="datasheet__score">
        Jawaban benar: <strong>{correctCount} dari {DATASHEET_ITEMS.length}</strong>
        {allCorrect && ' — semua istilah sudah tepat.'}
      </p>
    </div>
  )
}
