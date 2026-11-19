import { useAuth } from '../auth.jsx'
import { learningModules } from './learningData.js'
import { readProgress, readModuleState, statusOf } from './progressStore.js'

// Progress tiap modul untuk satu siswa, dihitung dari data di browser (tanpa React).
// Dipakai oleh hook di bawah dan oleh portofolio, jadi angkanya selalu sama.
export function computeModuleProgress(username) {
  const saved = username ? readProgress(username) : {}
  const modules = learningModules.map((m) => {
    const p = saved[m.id] || {}
    let percent = p.percent || 0
    // Lab yang diselesaikan lewat halaman Virtual Lab belum tentu tercatat di progress.
    // Pada P14-P19 tiap aktivitas bernilai 25%.
    if (username && m.id !== 'p13' && !p.labDone && readModuleState(username, m.id).labDone) percent = Math.min(100, percent + 25)
    return { ...m, progress: percent, status: statusOf(percent), updatedAt: p.updatedAt || 0, extra: p }
  })
  const overall = Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length)
  const last = modules.filter((m) => m.updatedAt).sort((a, b) => b.updatedAt - a.updatedAt)[0] || null
  return { modules, overall, last }
}

// Modul pembelajaran yang sudah digabung dengan progress milik siswa yang login.
export default function useModuleProgress() {
  const { user } = useAuth()
  return computeModuleProgress(user ? user.username : null)
}
