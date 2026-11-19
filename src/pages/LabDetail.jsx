import { Navigate, useParams } from 'react-router-dom'
import Button from '../components/Button.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import NotFound from './NotFound.jsx'
import WorkshopLab, { WORKSHOPS } from './labs/workshop/WorkshopLab.jsx'
import VisionPipelineLab from './labs/merged/VisionPipelineLab.jsx'
import VisionTestAnalysisLab from './labs/merged/VisionTestAnalysisLab.jsx'
import VisionOptimizationLab from './labs/vision-optimization/VisionOptimizationLab.jsx'
import { labs } from '../data/learningData.js'

// Alamat lab lama (sebelum digabung) diarahkan ke tahap yang sesuai pada lab gabungan,
// supaya tautan atau bookmark lama tetap berfungsi.
const LEGACY = {
  'image-processing-lab': ['vision-pipeline-lab', 'olah'],
  'object-detection-lab': ['vision-pipeline-lab', 'deteksi'],
  'amr-vision-mission': ['vision-pipeline-lab', 'misi'],
  'vision-testing-lab': ['vision-test-analysis-lab', 'uji'],
  'vision-analysis': ['vision-test-analysis-lab', 'analisis'],
}

export default function LabDetail() {
  const { id } = useParams()

  if (LEGACY[id]) {
    const [to, stage] = LEGACY[id]
    return <Navigate to={`/virtual-lab/${to}?tahap=${stage}`} replace />
  }

  const lab = labs.find((l) => l.id === id)

  if (!lab) {
    return <NotFound backTo="/virtual-lab" backLabel="Kembali ke Virtual Lab" />
  }

  // Lab berbentuk Bengkel Teknisi (tiket kerusakan).
  if (WORKSHOPS[lab.id]) {
    return <WorkshopLab lab={lab} />
  }

  if (lab.id === 'vision-pipeline-lab') {
    return <VisionPipelineLab lab={lab} />
  }

  if (lab.id === 'vision-test-analysis-lab') {
    return <VisionTestAnalysisLab lab={lab} />
  }

  if (lab.id === 'vision-optimization-lab') {
    return <VisionOptimizationLab lab={lab} />
  }

  // Lab lain sementara menampilkan placeholder.
  return (
    <div className="page">
      <PageHeader
        title={lab.title}
        description={lab.description}
        icon={lab.icon}
        status={lab.status}
      />

      <div className="placeholder">
        <Icon name="flask" size={32} />
        <p>Lab ini akan tersedia pada tahap berikutnya.</p>
      </div>

      <div className="page-actions">
        <Button to="/virtual-lab" variant="secondary">
          Kembali ke Virtual Lab
        </Button>
      </div>
    </div>
  )
}
