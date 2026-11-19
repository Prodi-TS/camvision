import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Icon from '../components/Icon.jsx'
import { LabParentTag } from '../components/LabParent.jsx'
import useModuleProgress from '../data/useModuleProgress.js'

export default function Learning() {
  const { modules: learningModules } = useModuleProgress()
  return (
    <div className="page">
      <PageHeader
        title="Pembelajaran"
        description="Tujuh materi, dari Camera sampai Vision Optimization."
        icon="book"
      />

      <div className="grid grid--cards">
        {learningModules.map((m) => (
          <Card key={m.id} className="item-card">
            <div className="item-card__top">
              <div className="card__icon">
                <Icon name={m.icon} size={22} />
              </div>
              <StatusBadge status={m.status} />
            </div>
            <h2>{m.title}</h2>
            <p>{m.description}</p>
            <LabParentTag moduleId={m.id} />
            <div className="item-card__action">
              <Button to={`/pembelajaran/${m.id}`}>{m.progress > 0 ? 'Lanjutkan' : 'Mulai'}</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="card--accent quiz-banner">
        <div>
          <h2>Quiz</h2>
          <p>Uji pemahamanmu setelah mempelajari materi.</p>
        </div>
        <Button to="/quiz">Masuk Quiz</Button>
      </Card>
    </div>
  )
}
