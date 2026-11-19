import Card from '../../../components/Card.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'

// Praktik empat kasus. Tidak ada jawaban benar atau salah:
// siswa mencoba di webcam, lalu memilih apa yang mereka lihat.
export const CASES = [
  {
    id: 'c1',
    title: 'Kasus 1. Dua kubus menempel',
    setup: 'Letakkan dua kubus target saling menempel di depan kamera.',
    seeBefore: 'Apa yang kamu lihat pada kotak pembatas?',
    optionsBefore: ['Satu kotak besar untuk kedua kubus', 'Dua kotak, satu untuk tiap kubus'],
    fix: 'Beri jarak sekitar 2 cm di antara kedua kubus, atau naikkan kamera.',
    seeAfter: 'Sekarang apa yang kamu lihat?',
    optionsAfter: ['Masih satu kotak', 'Menjadi dua kotak'],
  },
  {
    id: 'c2',
    title: 'Kasus 2. Benda besar ikut terdeteksi',
    setup: 'Letakkan benda besar berwarna sama dengan target (misalnya kertas atau kardus merah) di dalam pandangan kamera.',
    seeBefore: 'Apa yang terjadi pada benda besar itu?',
    optionsBefore: ['Muncul kotak besar sebagai objek', 'Tidak muncul kotak'],
    fix: 'Naikkan "kepekatan warna minimum", atau beri contoh "Bukan target" pada benda besar itu, lalu uji lagi.',
    seeAfter: 'Setelah perbaikan, bagaimana benda besar itu?',
    optionsAfter: ['Kotaknya hilang atau berlabel bukan target', 'Masih berlabel kubus target'],
  },
  {
    id: 'c3',
    title: 'Kasus 3. Kubus merah kecil',
    setup: 'Pakai mode uji. Letakkan kubus merah 20 mm di depan kamera, di samping kubus target.',
    seeBefore: 'Label apa yang diberikan model pada kubus kecil?',
    optionsBefore: ['Kubus target', 'Bukan target'],
    fix: 'Kembali ke mode ajar. Beri sedikitnya 3 contoh "Bukan target" dari kubus merah 20 mm, lalu uji lagi.',
    seeAfter: 'Setelah ditambah contoh, label kubus kecil menjadi?',
    optionsAfter: ['Kubus target', 'Bukan target'],
  },
  {
    id: 'c4',
    title: 'Kasus 4. Kubus target didekatkan',
    setup: 'Pakai mode uji. Dekatkan kubus target 38 mm ke kamera sampai tampak jauh lebih besar.',
    seeBefore: 'Label apa yang diberikan model pada kubus yang dekat?',
    optionsBefore: ['Kubus target', 'Bukan target'],
    fix: 'Kembali ke mode ajar. Beri sedikitnya 3 contoh "Ini kubus target" dari jarak dekat, lalu uji lagi.',
    seeAfter: 'Setelah ditambah contoh jarak dekat, label kubus menjadi?',
    optionsAfter: ['Kubus target', 'Bukan target'],
  },
]

export function casesDoneCount(cases = {}) {
  return CASES.filter((c) => {
    const s = cases[c.id]
    return s && s.before != null && s.fixed && s.after != null
  }).length
}

function Radio({ name, options, value, onChange }) {
  return (
    <div role="radiogroup" style={{ display: 'grid', gap: 6, margin: '6px 0 12px' }}>
      {options.map((o, i) => (
        <label key={o} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input type="radio" name={name} checked={value === i} onChange={() => onChange(i)} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  )
}

export default function CasePractice({ cases = {}, setCase }) {
  const done = casesDoneCount(cases)
  return (
    <Card className="activity">
      <div className="section-head">
        <div>
          <h2>Praktik Empat Kasus</h2>
          <p>
            Ulangi tiap kasus dengan kubus asli di lab webcam. Tidak ada jawaban benar atau salah:
            pilih apa yang benar-benar kamu lihat.
          </p>
        </div>
        {done === CASES.length && <StatusBadge status="Selesai" />}
      </div>
      <p className="hint">Kasus selesai: {done}/{CASES.length}</p>

      <div style={{ display: 'grid', gap: 20 }}>
        {CASES.map((c) => {
          const s = cases[c.id] || {}
          const ok = s.before != null && s.fixed && s.after != null
          return (
            <div key={c.id} className="note-box" style={{ display: 'block' }}>
              <h3 style={{ marginTop: 0 }}>
                {c.title} {ok && <span className="hint hint--ok">✓ selesai</span>}
              </h3>
              <p><strong>1. Susun:</strong> {c.setup}</p>
              <p style={{ marginBottom: 0 }}>{c.seeBefore}</p>
              <Radio name={`${c.id}-b`} options={c.optionsBefore} value={s.before} onChange={(v) => setCase(c.id, { before: v })} />

              <p><strong>2. Perbaiki:</strong> {c.fix}</p>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0 12px' }}>
                <input type="checkbox" checked={!!s.fixed} onChange={(e) => setCase(c.id, { fixed: e.target.checked })} />
                <span>Perbaikan sudah saya coba</span>
              </label>

              <p style={{ marginBottom: 0 }}><strong>3. Amati lagi:</strong> {c.seeAfter}</p>
              <Radio name={`${c.id}-a`} options={c.optionsAfter} value={s.after} onChange={(v) => setCase(c.id, { after: v })} />
            </div>
          )
        })}
      </div>

      <p className="note-box">
        <strong>Perhatikan:</strong> kasus 1 dan 2 diperbaiki dengan mengubah posisi atau pengaturan.
        Kasus 3 dan 4 diperbaiki dengan menambah contoh. Dalam kasus mana perbaikan paling cepat terlihat?
      </p>
    </Card>
  )
}
