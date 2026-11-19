// Gambar dari kamera untuk portofolio. Tersimpan di browser (localStorage), terpisah untuk tiap akun.
// Satu "slot" untuk satu kondisi (misalnya "uji-t1"), jadi mengambil ulang menggantikan gambar lama
// dan jumlah gambar tiap siswa terbatas. Gambar dibuat kecil (lebar 320 px, JPEG) agar penyimpanan
// browser, yang hanya sekitar 5 MB dan dipakai bersama oleh semua akun di komputer itu, tidak cepat penuh.
// Tidak ada yang dikirim ke server. Gambar baru keluar dari browser bila siswa mencetak portofolionya.

import { useSyncExternalStore } from 'react'

const indexKey = (username) => `cv-amr-photos:${username}`
const imageKey = (username, slot) => `cv-amr-photo:${username}:${slot}`

export const PHOTO_WIDTH = 320
const QUALITIES = [0.65, 0.5] // bila hasil pertama terlalu besar, coba kualitas lebih rendah
const MAX_CHARS = 45000 // sekitar 33 KB per gambar

// ---------- Pemberitahuan perubahan ----------
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

export function subscribePhotos(fn) {
  listeners.add(fn)
  window.addEventListener('storage', fn) // perubahan dari tab lain
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', fn)
  }
}

// ---------- Baca ----------
// Indeks: { slot: { at, w, h, note } }. Kecil, jadi aman dibaca sering.
export function readPhotoIndex(username) {
  try {
    const raw = JSON.parse(localStorage.getItem(indexKey(username)) || '{}')
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  } catch {
    return {}
  }
}

// Data gambar (data URL) atau null bila tidak ada.
export function readPhoto(username, slot) {
  try {
    const v = localStorage.getItem(imageKey(username, slot))
    return typeof v === 'string' && v.startsWith('data:image/') ? v : null
  } catch {
    return null
  }
}

// Daftar gambar yang benar-benar ada di penyimpanan: [{ slot, at, w, h, note }].
// Isi gambarnya tidak dibaca, jadi aman dipanggil di setiap penyusunan tampilan.
export function listPhotos(username) {
  const idx = readPhotoIndex(username)
  const prefix = `cv-amr-photo:${username}:`
  const present = new Set()
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix)) present.add(k.slice(prefix.length))
    }
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
  return Object.keys(idx)
    .filter((slot) => present.has(slot) && idx[slot] && typeof idx[slot].at === 'number')
    .map((slot) => ({
      slot,
      at: idx[slot].at,
      w: typeof idx[slot].w === 'number' ? idx[slot].w : 0,
      h: typeof idx[slot].h === 'number' ? idx[slot].h : 0,
      note: typeof idx[slot].note === 'string' ? idx[slot].note : '',
    }))
}

// Isi gambar untuk beberapa slot sekaligus: { slot: dataUrl }. Slot tanpa gambar dilewati.
export function readPhotoImages(username, slots) {
  const out = {}
  slots.forEach((slot) => {
    const v = readPhoto(username, slot)
    if (v) out[slot] = v
  })
  return out
}

// Perkiraan ruang yang dipakai gambar akun ini, dalam KB.
export function photoUsageKB(username) {
  let chars = 0
  listPhotos(username).forEach(({ slot }) => {
    const v = readPhoto(username, slot)
    if (v) chars += v.length
  })
  return Math.round(chars / 1024)
}

// ---------- Pilihan: sertakan gambar di portofolio ----------
// Bawaannya disertakan. Siswa bisa mematikannya tanpa menghapus gambar.
const includeKey = (username) => `cv-amr-photos-include:${username}`

export function readIncludePhotos(username) {
  try {
    return localStorage.getItem(includeKey(username)) !== '0'
  } catch {
    return true
  }
}

export function saveIncludePhotos(username, include) {
  try {
    localStorage.setItem(includeKey(username), include ? '1' : '0')
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
  emit()
}

// ---------- Ambil dan simpan ----------
// source: elemen canvas atau video, atau daftar elemen (digabung berdampingan).
// Mengembalikan { url, w, h } atau null bila sumber belum siap.
export function captureToDataUrl(source) {
  const list = (Array.isArray(source) ? source : [source]).filter(Boolean)
  const items = list.map((el) => ({ el, w: el.videoWidth || el.width, h: el.videoHeight || el.height }))
  if (!items.length || items.some((i) => !i.w || !i.h)) return null
  const n = items.length
  const gap = 4
  const cellW = n === 1 ? PHOTO_WIDTH : Math.floor((PHOTO_WIDTH * 1.5 - gap * (n - 1)) / n)
  const heights = items.map((i) => Math.round((cellW * i.h) / i.w))
  const w = cellW * n + gap * (n - 1)
  const h = Math.max(...heights)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 0, w, h)
  items.forEach((it, k) => ctx.drawImage(it.el, k * (cellW + gap), 0, cellW, heights[k]))
  let url = ''
  for (const q of QUALITIES) {
    url = canvas.toDataURL('image/jpeg', q)
    if (url.length <= MAX_CHARS) break
  }
  return { url, w, h }
}

// Hasil: { ok: true, at } atau { ok: false, reason: 'sumber' | 'penuh' }.
export function savePhoto(username, slot, source, note = '') {
  let shot = null
  try {
    shot = captureToDataUrl(source)
  } catch {
    shot = null
  }
  if (!shot) return { ok: false, reason: 'sumber' }
  const prev = readPhotoIndex(username)
  const at = Date.now()
  try {
    localStorage.setItem(imageKey(username, slot), shot.url)
    localStorage.setItem(indexKey(username), JSON.stringify({ ...prev, [slot]: { at, w: shot.w, h: shot.h, note: String(note).slice(0, 80) } }))
  } catch {
    // Penyimpanan penuh: jangan tinggalkan gambar yang tidak tercatat.
    try {
      if (!prev[slot]) localStorage.removeItem(imageKey(username, slot))
    } catch {
      /* abaikan */
    }
    return { ok: false, reason: 'penuh' }
  }
  emit()
  return { ok: true, at }
}

// ---------- Hapus ----------
export function removePhoto(username, slot) {
  try {
    localStorage.removeItem(imageKey(username, slot))
    const idx = readPhotoIndex(username)
    delete idx[slot]
    localStorage.setItem(indexKey(username), JSON.stringify(idx))
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
  emit()
}

export function removeAllPhotos(username) {
  try {
    const prefix = `cv-amr-photo:${username}:`
    const keys = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(prefix)) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
    localStorage.setItem(indexKey(username), '{}')
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
  emit()
}

// ---------- Tampilan waktu ----------
export function photoTime(at) {
  try {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(at)) + ' WIB'
  } catch {
    return ''
  }
}

// ---------- Hook ----------
// Waktu pengambilan gambar pada satu slot (0 bila belum ada). Komponen ikut diperbarui saat gambar berubah.
export function usePhotoStamp(username, slot) {
  return useSyncExternalStore(subscribePhotos, () => {
    const e = readPhotoIndex(username)[slot]
    return e && typeof e.at === 'number' ? e.at : 0
  })
}

export function useIncludePhotos(username) {
  return useSyncExternalStore(subscribePhotos, () => readIncludePhotos(username))
}

// Teks indeks mentah, stabil selama isinya tidak berubah. Dipakai halaman yang mengelola semua gambar.
export function usePhotoIndexText(username) {
  return useSyncExternalStore(subscribePhotos, () => {
    try {
      return localStorage.getItem(indexKey(username)) || ''
    } catch {
      return ''
    }
  })
}
