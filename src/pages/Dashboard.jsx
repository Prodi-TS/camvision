import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Icon from '../components/Icon.jsx'
import useModuleProgress from '../data/useModuleProgress.js'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { modules: learningModules, overall, last } = useModuleProgress()

  return (
    <div className="page">
      <section className="hero viewfinder">
        <div className="hero__text">
          <h1>Selamat datang di Lab Maya Penglihatan Robot</h1>
          <p>Belajar melihat, memahami, menguji, dan mengoptimalkan penglihatan robot.</p>
        </div>
        <div className="hero__progress">
          <ProgressBar value={overall} label="Progress keseluruhan" size="lg" />
        </div>
      </section>

      <div className="grid grid--dash">
        <Card className="card--accent">
          <div className="card__icon">
            <Icon name="book" size={22} />
          </div>
          <h2>Mulai Belajar</h2>
          <p>Mulai dari materi Camera, materi pertama dalam perjalanan belajarmu.</p>
          <Button to="/pembelajaran/p13">Mulai Belajar</Button>
        </Card>

        <Card>
          <div className="card__icon card__icon--muted">
            <Icon name="clock" size={22} />
          </div>
          <h2>Terakhir Dipelajari</h2>
          {last ? (
            <>
              <p>{last.title} ({last.progress}%)</p>
              <Button to={`/pembelajaran/${last.id}`} variant="secondary">Lanjutkan</Button>
            </>
          ) : (
            <p className="empty">Belum ada aktivitas.</p>
          )}
        </Card>
      </div>

      <section className="section">
        <h2 className="section__title">Progress Pembelajaran</h2>
        <div className="grid grid--modules">
          {learningModules.map((m) => (
            <Link key={m.id} to={`/pembelajaran/${m.id}`} className="card module-tile">
              <div className="module-tile__top">
                <StatusBadge status={m.status} />
              </div>
              <h3>{m.title}</h3>
              <ProgressBar value={m.progress} size="sm" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
