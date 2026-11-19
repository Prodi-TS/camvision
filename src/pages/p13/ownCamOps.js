// Webcam milik siswa: pilihan isian datasheet (tanpa mengetik) dan penilaian terhadap kebutuhan misi AMR.
import { REQUIREMENTS } from '../labs/camera-explorer/labData.js'

export const RES = [
  { id: 'vga', text: '640 × 480', width: 640, height: 480 },
  { id: 'hd', text: '1280 × 720 (HD)', width: 1280, height: 720 },
  { id: 'fhd', text: '1920 × 1080 (Full HD)', width: 1920, height: 1080 },
  { id: 'qhd', text: '2560 × 1440 atau lebih', width: 2560, height: 1440 },
  { id: 'unk', text: 'Tidak tahu' },
]

export const FPS = [
  { id: '15', text: '15 FPS', fps: 15 },
  { id: '30', text: '30 FPS', fps: 30 },
  { id: '60', text: '60 FPS', fps: 60 },
  { id: '90', text: 'Lebih dari 60 FPS', fps: 90 },
  { id: 'unk', text: 'Tidak tahu' },
]

export const FOV = [
  { id: 'lt60', text: 'Kurang dari 60°', fov: 50 },
  { id: '60-80', text: '60° sampai 80°', fov: 70 },
  { id: 'gt80', text: 'Lebih dari 80°', fov: 90 },
  { id: 'unk', text: 'Tidak tahu' },
]

export const IFACE = [
  { id: 'usb2', text: 'USB 2.0', iface: 'USB 2.0' },
  { id: 'usb3', text: 'USB 3.0', iface: 'USB 3.0' },
  { id: 'mipi', text: 'MIPI-CSI (kabel pita)', iface: 'MIPI-CSI (kabel pita)' },
  { id: 'lain', text: 'Lainnya', iface: 'Lainnya' },
  { id: 'unk', text: 'Tidak tahu' },
]

// Menilai isian datasheet terhadap kebutuhan robot. status: 'ok' | 'fail' | 'unknown'.
// fit: true bila semua kebutuhan terpenuhi, false bila ada yang tidak, null bila ada yang belum diketahui.
export function evaluate(v = {}) {
  const res = RES.find((r) => r.id === v.res)
  const fps = FPS.find((r) => r.id === v.fps)
  const fov = FOV.find((r) => r.id === v.fov)
  const iface = IFACE.find((r) => r.id === v.iface)
  const cam = { width: res && res.width, height: res && res.height, fps: fps && fps.fps, fov: fov && fov.fov, iface: iface && iface.iface }
  const known = {
    Interface: cam.iface != null,
    FPS: cam.fps != null,
    FOV: cam.fov != null,
    Resolution: cam.width != null,
  }
  const rows = REQUIREMENTS.map((r) => ({
    key: r.key,
    label: r.label,
    status: !known[r.key] ? 'unknown' : r.ok(cam) ? 'ok' : 'fail',
  }))
  const fit = rows.some((r) => r.status === 'fail') ? false : rows.every((r) => r.status === 'ok') ? true : null
  return { rows, fit }
}

// Aktivitas dianggap selesai bila kamera sudah pernah diukur, keempat isian datasheet dipilih, dan keputusan dibuat.
export function ownCamDone(ownCam) {
  const v = ownCam || {}
  return !!(v.measured && v.res && v.fps && v.fov && v.iface && v.decision)
}
