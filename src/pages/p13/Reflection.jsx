import { useState } from 'react'
import Button from '../../components/Button.jsx'
import { REFLECTION_QUESTIONS } from './p13Data.js'

export default function Reflection({ answers, saved, onChange, onSave }) {
  const [justSaved, setJustSaved] = useState(false)
  const allFilled = REFLECTION_QUESTIONS.every((q) => (answers[q.id] || '').trim().length > 0)

  function handleChange(id, value) {
    setJustSaved(false)
    onChange(id, value)
  }

  function handleSave() {
    onSave()
    setJustSaved(true)
  }

  return (
    <div className="reflection">
      {REFLECTION_QUESTIONS.map((q, i) => (
        <div key={q.id} className="reflection__item">
          <label htmlFor={`refl-${q.id}`}>
            {i + 1}. {q.text}
          </label>
          <textarea
            id={`refl-${q.id}`}
            rows={3}
            value={answers[q.id] || ''}
            onChange={(e) => handleChange(q.id, e.target.value)}
            placeholder="Tulis jawabanmu dengan kata-katamu sendiri."
          />
        </div>
      ))}

      <div className="reflection__actions">
        <Button onClick={handleSave} disabled={!allFilled}>
          Simpan Refleksi
        </Button>
        {!allFilled && <span className="hint">Isi semua pertanyaan untuk menyimpan.</span>}
        {allFilled && (saved || justSaved) && (
          <span className="hint hint--ok">Refleksi tersimpan di browser ini.</span>
        )}
      </div>
      <p className="hint">Jawabanmu hanya tersimpan di browser ini. Belum dikirim ke guru.</p>
    </div>
  )
}
