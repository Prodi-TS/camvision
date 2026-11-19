import { Link, useSearchParams } from 'react-router-dom'
import Card from '../../../components/Card.jsx'
import Button from '../../../components/Button.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import ProgressBar from '../../../components/ProgressBar.jsx'
import '../../p13/p13.css'

const MARK = '#0d7a94'

const tab = (active) => ({
  padding: '10px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  border: `1px solid ${MARK}`,
  background: active ? MARK : 'transparent',
  color: active ? '#ffffff' : 'inherit',
  font: 'inherit',
  fontSize: 15,
  fontWeight: 600,
  textAlign: 'left',
})

// Lab bertahap: beberapa lab yang berurutan digabung dalam satu halaman.
// Satu tahap tampil sekaligus, jadi hanya satu kamera yang menyala. Hasil tiap
// tahap disimpan oleh halaman ini, jadi tidak hilang saat siswa berpindah tahap.
//
// stages: [{ id, title, about, done, materi: { to, label }, render }]
// Tahap yang aktif dibaca dari alamat (?tahap=id), sehingga halaman pembelajaran
// dan alamat lab lama bisa langsung menuju tahap tertentu.
export default function StagedLab({ lab, intro, stages }) {
  const [params, setParams] = useSearchParams()
  const found = stages.findIndex((s) => s.id === params.get('tahap'))
  const index = found < 0 ? 0 : found
  const stage = stages[index]
  const prev = stages[index - 1]
  const next = stages[index + 1]

  const doneCount = stages.filter((s) => s.done).length
  const percent = Math.round((doneCount / stages.length) * 100)
  const status = doneCount === 0 ? 'Belum dimulai' : doneCount === stages.length ? 'Selesai' : 'Sedang dipelajari'

  function go(id) {
    setParams({ tahap: id }, { replace: true })
    window.scrollTo(0, 0)
  }

  return (
    <div className="page p13">
      <PageHeader title={lab.title} description={lab.description} icon={lab.icon} status={status} />

      <Card>
        <h2>Alur Lab</h2>
        {intro && <p>{intro}</p>}
        <ProgressBar value={percent} label={`Progres lab: ${doneCount} dari ${stages.length} tahap selesai`} size="lg" />
        <div role="tablist" aria-label="Tahap lab" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {stages.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`tahap-${s.id}`}
              aria-selected={s.id === stage.id}
              aria-controls="tahap-panel"
              onClick={() => go(s.id)}
              style={tab(s.id === stage.id)}
            >
              {s.done ? '✓ ' : ''}Tahap {i + 1}: {s.title}
            </button>
          ))}
        </div>
        <p style={{ margin: '4px 0 0' }}>
          <strong>
            Tahap {index + 1} dari {stages.length}.
          </strong>{' '}
          {stage.about}{' '}
          {stage.materi && (
            <Link to={stage.materi.to} style={{ color: MARK, fontWeight: 600, textDecoration: 'underline' }}>
              Buka materi {stage.materi.label}
            </Link>
          )}
        </p>
      </Card>

      <div role="tabpanel" id="tahap-panel" aria-labelledby={`tahap-${stage.id}`} style={{ display: 'grid', gap: 16 }}>
        {stage.render()}
      </div>

      <div className="page-actions">
        {prev && (
          <Button variant="secondary" onClick={() => go(prev.id)}>
            Tahap sebelumnya: {prev.title}
          </Button>
        )}
        {next && (
          <Button variant={stage.done ? 'primary' : 'secondary'} onClick={() => go(next.id)}>
            Tahap berikutnya: {next.title}
          </Button>
        )}
        <Button to="/virtual-lab" variant="secondary">
          Kembali ke Virtual Lab
        </Button>
      </div>
    </div>
  )
}
