import { useCallback, useEffect, useState } from 'react'

// Progres P13 disimpan di localStorage browser, terpisah untuk tiap username.
// Belum ada database atau server.
const INITIAL = {
  materiDone: false,
  explorerSeen: [],
  datasheet: {},
  lidar: {},
  ownCam: {},
  reflection: { r1: '', r2: '', r3: '', r4: '', r5: '' },
  reflectionSaved: false,
}

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return INITIAL
    return { ...INITIAL, ...JSON.parse(raw) }
  } catch {
    return INITIAL
  }
}

export default function useP13State(username) {
  const key = `cv-amr-p13:${username}`
  const [state, setState] = useState(() => load(key))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* abaikan jika penyimpanan browser tidak tersedia */
    }
  }, [key, state])

  // patch: objek, atau fungsi (prev) => objek
  const update = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      ...(typeof patch === 'function' ? patch(prev) : patch),
    }))
  }, [])

  return { state, update }
}
