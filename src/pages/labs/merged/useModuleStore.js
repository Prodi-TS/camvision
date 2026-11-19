import { useCallback, useEffect, useState } from 'react'

// State satu modul (p15 sampai p18) yang dibagi antara halaman pembelajaran dan lab.
// Kuncinya sama dengan kunci halaman pembelajaran, jadi data tidak ganda.
//
// `defaults` menyebut field yang dipegang lab ini beserta nilai awalnya.
// Hanya field itu yang ditulis. Field lain (kuis, refleksi) dibiarkan:
// isi terbaru di penyimpanan dibaca dulu sebelum menulis, jadi tidak tertimpa.
export default function useModuleStore(username, moduleId, defaults) {
  const key = `cv-amr-${moduleId}:${username}`

  const read = () => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const [state, setState] = useState(() => ({ ...defaults, ...read() }))

  useEffect(() => {
    try {
      const picked = {}
      for (const f of Object.keys(defaults)) picked[f] = state[f] ?? defaults[f]
      localStorage.setItem(key, JSON.stringify({ ...read(), ...picked }))
    } catch {
      /* penyimpanan browser tidak tersedia */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, state])

  // patch: objek, atau fungsi (prev) => objek
  const update = useCallback(
    (patch) => setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) })),
    []
  )

  return { state, update }
}
