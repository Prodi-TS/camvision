// Kemajuan Bengkel Teknisi dihitung dari state tersimpan: tiket yang selesai dan refleksi.
// Dipakai oleh halaman lab, lab gabungan, dan halaman Hasil Saya, supaya angkanya sama.

export function workshopProgress(cfg, state) {
  const solvedMap = (state && state.solved) || {}
  const solved = cfg.tickets.filter((t) => solvedMap[t.id]).length
  const wrong = cfg.tickets.reduce((n, t) => n + ((solvedMap[t.id] && solvedMap[t.id].wrong) || 0), 0)
  const reflectionDone = !!(state && state.reflectionSaved) && ((state && state.reflection) || '').trim().length > 0
  const total = cfg.tickets.length + 1
  const done = solved + (reflectionDone ? 1 : 0)
  return {
    solved,
    tickets: cfg.tickets.length,
    wrong,
    reflectionDone,
    done,
    total,
    percent: Math.round((done / total) * 100),
    finished: done === total,
  }
}

// Membaca state tersimpan satu siswa tanpa memakai React (untuk halaman rekap).
export function readWorkshopState(cfg, username) {
  try {
    const raw = localStorage.getItem(`${cfg.storageKey}:${username}`)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
