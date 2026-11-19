import { useState } from 'react'
import Button from '../../../../components/Button.jsx'
import { REFLECTION_QUESTION } from '../labData.js'

export default function ReflectionStage({ state, update }) {
  const [justSaved, setJustSaved] = useState(false)
  const filled = state.reflection.trim().length > 0

  function change(value) {
    setJustSaved(false)
    update({ reflection: value, reflectionSaved: false })
  }

  return (
    <div className="reflection">
      <label htmlFor="lab1-reflection">{REFLECTION_QUESTION}</label>
      <textarea
        id="lab1-reflection"
        rows={5}
        value={state.reflection}
        onChange={(e) => change(e.target.value)}
        placeholder="Tulis pertimbanganmu sebagai teknisi."
      />
      <div className="reflection__actions">
        <Button
          onClick={() => {
            update({ reflectionSaved: true })
            setJustSaved(true)
          }}
          disabled={!filled}
        >
          Simpan Refleksi
        </Button>
        {!filled && <span className="hint">Tulis jawaban untuk menyimpan.</span>}
        {filled && (state.reflectionSaved || justSaved) && (
          <span className="hint hint--ok">Refleksi tersimpan di browser ini.</span>
        )}
      </div>
      <p className="hint">Jawabanmu hanya tersimpan di browser ini. Belum dikirim ke guru.</p>
    </div>
  )
}
