// Ringkasan progress tiap modul, disimpan per username di localStorage browser.
// Setiap halaman P13-P19 menulis ke sini, lalu Dashboard, Pembelajaran, dan
// Hasil Saya membacanya. Belum ada server.

export const MODULE_IDS = ['p13', 'p14', 'p15', 'p16', 'p17', 'p18', 'p19']

const key = (username) => `cv-amr-progress:${username}`

export function statusOf(percent) {
  if (!percent) return 'Belum dimulai'
  return percent >= 100 ? 'Selesai' : 'Sedang dipelajari'
}

// Data yang tersimpan bisa rusak (misalnya diubah manual), jadi hasilnya selalu objek.
const asObject = (v) => (v && typeof v === 'object' ? v : {})

export function readProgress(username) {
  try {
    return asObject(JSON.parse(localStorage.getItem(key(username)) || '{}'))
  } catch {
    return {}
  }
}

export function saveProgress(username, id, percent, extra = {}) {
  try {
    const all = readProgress(username)
    const prev = all[id] || {}
    const same = prev.percent === percent && JSON.stringify({ ...prev, updatedAt: 0 }) === JSON.stringify({ ...prev, ...extra, percent, updatedAt: 0 })
    if (same) return
    all[id] = { ...prev, ...extra, percent, updatedAt: Date.now() }
    localStorage.setItem(key(username), JSON.stringify(all))
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
}

// Membaca state mentah satu modul (dipakai halaman rekap).
export function readModuleState(username, id) {
  try {
    return asObject(JSON.parse(localStorage.getItem(`cv-amr-${id}:${username}`) || '{}'))
  } catch {
    return {}
  }
}
