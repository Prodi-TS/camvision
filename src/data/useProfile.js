import { useState } from 'react'

// Identitas siswa (nama, NIS, kelas) diisi sendiri oleh siswa dan disimpan di browser,
// terpisah untuk tiap akun. Dipakai oleh halaman Profil dan Portofolio.

const key = (username) => `cv-amr-profile:${username}`

export const EMPTY_PROFILE = { nama: '', nis: '', kelas: '' }

const text = (v) => (typeof v === 'string' ? v : '')

export function readProfile(username) {
  try {
    const raw = JSON.parse(localStorage.getItem(key(username)) || '{}') || {}
    return { nama: text(raw.nama), nis: text(raw.nis), kelas: text(raw.kelas) }
  } catch {
    return { ...EMPTY_PROFILE }
  }
}

export function saveProfile(username, profile) {
  try {
    localStorage.setItem(key(username), JSON.stringify({ nama: text(profile.nama), nis: text(profile.nis), kelas: text(profile.kelas) }))
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
}

// Banyaknya isian identitas yang sudah terisi (0 sampai 3).
export function profileFilled(profile) {
  return ['nama', 'nis', 'kelas'].filter((k) => text(profile[k]).trim()).length
}

// Mengembalikan [profile, update]. update(patch) langsung menyimpan ke browser.
export default function useProfile(username) {
  const [profile, setProfile] = useState(() => readProfile(username))
  function update(patch) {
    const next = { ...profile, ...patch }
    setProfile(next)
    saveProfile(username, next)
  }
  return [profile, update]
}
