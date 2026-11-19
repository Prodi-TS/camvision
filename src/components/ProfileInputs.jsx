import { useId } from 'react'

// Isian identitas siswa. Dipakai di halaman Profil dan Portofolio dengan data yang sama.
// profile: { nama, nis, kelas }, onChange(patch) menyimpan perubahan.
const FIELDS = [
  { key: 'nama', label: 'Nama lengkap', max: 60, autoComplete: 'name', placeholder: 'Tulis nama lengkapmu' },
  { key: 'nis', label: 'NIS', max: 20, inputMode: 'numeric', placeholder: 'Nomor induk siswa' },
  { key: 'kelas', label: 'Kelas', max: 20, placeholder: 'Contoh: XI TJKT 1' },
]

export default function ProfileInputs({ profile, onChange }) {
  const uid = useId()
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      {FIELDS.map((f) => (
        <label key={f.key} className="field" htmlFor={`${uid}-${f.key}`}>
          {f.label}
          <input
            id={`${uid}-${f.key}`}
            type="text"
            value={profile[f.key]}
            maxLength={f.max}
            autoComplete={f.autoComplete || 'off'}
            inputMode={f.inputMode}
            placeholder={f.placeholder}
            onChange={(e) => onChange({ [f.key]: e.target.value })}
          />
        </label>
      ))}
    </div>
  )
}
