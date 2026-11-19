import Card from './Card.jsx'
import Button from './Button.jsx'
import StatusBadge from './StatusBadge.jsx'
import { Link } from 'react-router-dom'
import { labOfModule, modulesOfLab } from '../data/learningData.js'
import useModuleProgress from '../data/useModuleProgress.js'
import './lab-parent.css'

// Keterangan kecil "Lab induk" untuk satu materi (dipakai di kartu dan halaman materi).
export function LabParentTag({ moduleId }) {
  const info = labOfModule(moduleId)
  if (!info) return null
  return (
    <p className="lab-parent-tag">
      <span className="lab-parent-tag__label">Lab induk</span>
      <span className="lab-parent-tag__name">
        <strong>{info.lab.title}</strong>
        {info.stageLabel && <span className="lab-parent-tag__stage"> · {info.stageLabel}</span>}
      </span>
    </p>
  )
}

// Bilah di atas halaman materi: materi ini dipraktikkan di lab mana, dengan tombol ke lab.
export function LabParentBar({ moduleId }) {
  const info = labOfModule(moduleId)
  if (!info) return null
  return (
    <div className="page lab-parent-bar-wrap">
      <Card className="lab-parent-bar">
        <div>
          <LabParentTag moduleId={moduleId} />
          <p className="lab-parent-bar__text">Materi ini dipraktikkan di lab tersebut.</p>
        </div>
        <Button to={info.to} variant="secondary">Buka lab</Button>
      </Card>
    </div>
  )
}

// Kartu di atas halaman lab: materi apa yang perlu dipelajari lebih dulu.
export function LabMateriCard({ labId }) {
  const { modules } = useModuleProgress()
  const need = modulesOfLab(labId)
  if (need.length === 0) return null
  const progress = Object.fromEntries(modules.map((m) => [m.id, m]))
  return (
    <div className="page lab-parent-bar-wrap">
      <Card className="lab-materi">
        <h2 className="card__heading">Materi yang perlu dipelajari</h2>
        <p className="lab-materi__hint">
          {need.length > 1
            ? 'Lab ini terdiri dari beberapa tahap. Pelajari materi tiap tahap sebelum mengerjakannya.'
            : 'Pelajari materi ini sebelum mengerjakan lab.'}
        </p>
        <ul className="lab-materi__list">
          {need.map((m) => (
            <li key={m.id}>
              <div>
                <Link to={`/pembelajaran/${m.id}`}><strong>{m.title}</strong></Link>
                {m.stageLabel && <span className="lab-materi__stage"> · {m.stageLabel}</span>}
              </div>
              <StatusBadge status={(progress[m.id] || m).status} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
