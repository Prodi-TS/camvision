import { useCallback, useEffect, useState } from 'react'

// Progres lab disimpan di localStorage browser, terpisah untuk tiap username.
// Belum ada database atau server.
const INITIAL = {
  stage: 0,
  started: false,
  partsExplored: [],
  labels: {},
  paramsSeen: [],
  inspected: [],
  lastInspected: null,
  checkpoint: {},
  selection: null,
  decision: null,
  reflection: '',
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

export default function useLabState(username) {
  const key = `cv-amr-lab-camera-explorer-v2:${username}`
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
