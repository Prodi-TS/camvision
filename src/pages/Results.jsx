import Card from '../components/Card.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import Icon from '../components/Icon.jsx'
import { resultCards } from '../data/learningData.js'
import { useAuth } from '../auth.jsx'
import useModuleProgress from '../data/useModuleProgress.js'
import { buildSummary } from '../data/studentSummary.js'

const pct = (x) => (x == null ? '-' : `${Math.round(x * 100)}%`)
const list = { margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }

export default function Results() {
  const { user } = useAuth()
  const { modules, overall } = useModuleProgress()
  const s = buildSummary(user.username)

  const content = {
    progress: (
      <div style={{ display: 'grid', gap: 10 }}>
        {modules.map((m) => (
          <div key={m.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14 }}>
              <span>{m.title}</span>
              <span>{m.progress}%</span>
            </div>
            <ProgressBar value={m.progress} size="sm" />
          </div>
        ))}
      </div>
    ),
    quiz: (
      <ul style={list}>
        {s.modules.filter((m) => m.quizTotal != null).length === 0 && <li className="empty" style={{ listStyle: 'none', marginLeft: -20 }}>Belum ada data.</li>}
        {s.modules.filter((m) => m.quizTotal != null).map((m) => (
          <li key={m.id}>{m.title}: {m.quizCorrect} dari {m.quizTotal} benar</li>
        ))}
      </ul>
    ),
    lab: (
      <div style={{ display: 'grid', gap: 10 }}>
        {s.labs.map((l) =>
          l.stages.length === 1 ? (
            <p key={l.id} style={{ margin: 0 }}>
              <strong>{l.title}:</strong> {l.stages[0].done ? '✓ Selesai' : 'Belum selesai'}
            </p>
          ) : (
            <div key={l.id}>
              <strong>
                {l.title} ({l.stages.filter((g) => g.done).length} dari {l.stages.length} tahap)
              </strong>
              <ul style={list}>
                {l.stages.map((g) => (
                  <li key={g.title}>{g.title}: {g.done ? '✓ Selesai' : 'Belum selesai'}</li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    ),
    testing: s.testing ? (
      <div>
        <p style={{ margin: '0 0 6px' }}>
          Lulus {s.testing.summary.passed} dari {s.testing.summary.total} uji. Ketepatan keputusan {pct(s.testing.summary.accuracy)}.
          Alarm palsu rata-rata {pct(s.testing.summary.falseAlarm)}.
        </p>
        <ul style={list}>
          {s.testing.rows.map((r) => (
            <li key={r.label}>{r.label}: {r.rate == null ? 'belum diuji' : `${pct(r.rate)} (${r.pass ? 'lulus' : 'gagal'})`}</li>
          ))}
        </ul>
      </div>
    ) : <p className="empty">Belum ada data.</p>,
    analysis: s.analysis.length ? (
      <ul style={list}>
        {s.analysis.map((a) => (
          <li key={a.label}>
            <strong>{a.label}:</strong> dugaan "{a.hypothesis}". {a.verdict}
          </li>
        ))}
      </ul>
    ) : <p className="empty">Belum ada data.</p>,
    optimization: s.optimization ? (
      <div>
        <p style={{ margin: '0 0 6px' }}>
          Sesudah perbaikan: lulus {s.optimization.after.passed} dari {s.optimization.after.total} uji, ketepatan {pct(s.optimization.after.accuracy)}
          {s.optimization.before ? ` (sebelum: ${pct(s.optimization.before.accuracy)})` : ''}.
        </p>
        <p style={{ margin: 0 }}>
          Yang diubah: {s.optimization.changes.length ? s.optimization.changes.join('; ') : 'pengaturan bawaan'}.
        </p>
      </div>
    ) : <p className="empty">Belum ada data.</p>,
  }

  return (
    <div className="page">
      <PageHeader
        title="Hasil Saya"
        description="Ringkasan perkembangan belajarmu."
        icon="chart"
      />

      <Card>
        <ProgressBar value={overall} label="Progress keseluruhan" size="lg" />
      </Card>

      <div className="grid grid--cards">
        {resultCards.map((r) => (
          <Card key={r.id} className="item-card">
            <div className="item-card__top">
              <div className="card__icon">
                <Icon name={r.icon} size={22} />
              </div>
            </div>
            <h2>{r.id === 'quiz' ? 'Cek Pemahaman' : r.title}</h2>
            {content[r.id]}
          </Card>
        ))}
      </div>
    </div>
  )
}
