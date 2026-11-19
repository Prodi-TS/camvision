import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Icon from '../components/Icon.jsx'
import { quizzes } from '../data/learningData.js'

export default function Quiz() {
  return (
    <div className="page">
      <PageHeader
        title="Quiz Computer Vision AMR"
        description="Soal quiz akan tersedia pada tahap berikutnya."
        icon="help"
      />

      <div className="grid grid--cards">
        {quizzes.map((q) => (
          <Card key={q.id} className="item-card">
            <div className="item-card__top">
              <div className="card__icon">
                <Icon name="help" size={22} />
              </div>
              <StatusBadge status={q.status} />
            </div>
            <h2>{q.title}</h2>
            <div className="item-card__action">
              <Button disabled title="Quiz belum tersedia">
                Mulai Quiz
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
