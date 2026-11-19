// Daftar slot gambar kamera: nama slot, judul yang tampil, dan urutannya di portofolio.
// Satu slot untuk satu kondisi, jadi tombol "Ambil gambar" di tiap lab selalu menunjuk satu slot.

import { TESTS } from '../pages/p17/testOps.js'
import { CHECKS } from '../pages/p16/missionOps.js'
import { listPhotos } from './photoStore.js'

export const FILTER_MODES = [
  { id: 'gray', label: 'Grayscale' },
  { id: 'thresh', label: 'Threshold' },
  { id: 'edge', label: 'Edge (Sobel)' },
  { id: 'hsv', label: 'Filter warna (HSV)' },
]

const FIXED = [
  { slot: 'webcam', title: 'Camera: webcam yang dipakai' },
  ...FILTER_MODES.map((m) => ({ slot: `filter-${m.id}`, title: `Image Processing: ${m.label}` })),
  { slot: 'deteksi-ajari', title: 'Object Detection: saat mengajari model' },
  { slot: 'deteksi-uji', title: 'Object Detection: saat menguji model' },
  ...CHECKS.map((c) => ({ slot: `misi-${c.id}`, title: `AMR Vision Mission: ${c.label}` })),
  ...TESTS.map((t) => ({ slot: `uji-${t.id}`, title: `Vision Testing: ${t.label}` })),
  ...TESTS.map((t) => ({ slot: `analisis-${t.id}`, title: `Vision Analysis: ${t.label}` })),
  ...TESTS.map((t) => ({ slot: `optimasi-${t.id}`, title: `Vision Optimization: ${t.label} (sesudah)` })),
]

export const SLOT_ORDER = FIXED.map((s) => s.slot)

// Kelompok slot untuk tiap bagian portofolio. Urutannya sama dengan urutan TESTS dan CHECKS.
export const FILTER_SLOTS = FILTER_MODES.map((m) => `filter-${m.id}`)
export const DETECT_SLOTS = ['deteksi-ajari', 'deteksi-uji']
export const MISSION_SLOTS = CHECKS.map((c) => `misi-${c.id}`)
export const TEST_SLOTS = TESTS.map((t) => `uji-${t.id}`)
export const ANALYSIS_SLOTS = TESTS.map((t) => `analisis-${t.id}`)
export const OPT_SLOTS = TESTS.map((t) => `optimasi-${t.id}`)

export function slotTitle(slot) {
  const f = FIXED.find((s) => s.slot === slot)
  return f ? f.title : slot
}

// Gambar yang tersimpan untuk satu akun, urut seperti di portofolio. Slot yang tidak dikenal diabaikan.
// Hasil: [{ slot, title, at, w, h, note }]. Isi gambarnya tidak dibaca.
export function listOrderedPhotos(username) {
  const bySlot = Object.fromEntries(listPhotos(username).map((p) => [p.slot, p]))
  return SLOT_ORDER.filter((slot) => bySlot[slot]).map((slot) => ({ ...bySlot[slot], title: slotTitle(slot) }))
}
