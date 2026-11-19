import { useParams } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import Icon from '../components/Icon.jsx'
import NotFound from './NotFound.jsx'
import P13Camera from './p13/P13Camera.jsx'
import P14ImageProcessing from './p14/P14ImageProcessing.jsx'
import P19VisionOptimization from './p19/P19VisionOptimization.jsx'
import P18VisionAnalysis from './p18/P18VisionAnalysis.jsx'
import P17VisionTesting from './p17/P17VisionTesting.jsx'
import P16AmrVisionMission from './p16/P16AmrVisionMission.jsx'
import P15ObjectDetection from './p15/P15ObjectDetection.jsx'
import { learningModules } from '../data/learningData.js'

export default function LearningDetail() {
  const { id } = useParams()
  const module = learningModules.find((m) => m.id === id)

  if (!module) {
    return <NotFound backTo="/pembelajaran" backLabel="Kembali ke Pembelajaran" />
  }

  // P13 sudah memiliki halaman pembelajaran sendiri (Tahap 2).
  if (module.id === 'p13') {
    return <P13Camera />
  }

  // P14 sampai P19 memiliki halaman pembelajaran sendiri.
  if (module.id === 'p14') {
    return <P14ImageProcessing />
  }
  if (module.id === 'p15') {
    return <P15ObjectDetection />
  }
  if (module.id === 'p16') {
    return <P16AmrVisionMission />
  }
  if (module.id === 'p17') {
    return <P17VisionTesting />
  }
  if (module.id === 'p18') {
    return <P18VisionAnalysis />
  }
  if (module.id === 'p19') {
    return <P19VisionOptimization />
  }

  return (
    <div className="page">
      <PageHeader
        title={module.title}
        description={module.description}
        icon={module.icon}
        status={module.status}
      />

      <Card>
        <h2 className="card__heading">Learning Progress</h2>
        <ProgressBar value={module.progress} size="lg" />
      </Card>

      <div className="placeholder">
        <Icon name="book" size={32} />
        <p>Materi akan tersedia pada tahap berikutnya.</p>
      </div>

      <div className="page-actions">
        <Button to="/pembelajaran" variant="secondary">
          Kembali ke Pembelajaran
        </Button>
      </div>
    </div>
  )
}
