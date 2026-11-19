const TONES = {
  'Belum dimulai': 'neutral',
  'Belum dikerjakan': 'neutral',
  'Belum ada data': 'neutral',
  'Segera hadir': 'info',
  Tersedia: 'success',
  'Sedang dipelajari': 'active',
  Selesai: 'success',
  'Belum diisi': 'neutral',
  Sebagian: 'active',
  Lengkap: 'success',
}

export default function StatusBadge({ status }) {
  const tone = TONES[status] || 'neutral'
  return <span className={`badge badge--${tone}`}>{status}</span>
}
