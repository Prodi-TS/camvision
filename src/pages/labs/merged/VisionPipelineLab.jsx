import { useAuth } from '../../../auth.jsx'
import StagedLab from './StagedLab.jsx'
import useModuleStore from './useModuleStore.js'
import WorkshopLab, { useWorkshopState } from '../workshop/WorkshopLab.jsx'
import { IMAGE_WORKSHOP } from '../workshop/ticketsImage.js'
import { workshopProgress } from '../workshop/workshopProgress.js'
import ObjectDetectionStage from '../object-detection/ObjectDetectionLab.jsx'
import AmrMissionStage from '../amr-mission/AmrMissionLab.jsx'

// Lab gabungan untuk TP 3.2.1: Image Processing, Object Detection, dan AMR Vision Mission.
// Tiga lab yang dulu terpisah kini menjadi tiga tahap berurutan dalam satu halaman.
// Data tiap tahap memakai kunci penyimpanan yang sama seperti sebelumnya.

const WORKSHOP_ID = 'image-processing-lab'
const WORKSHOP_LAB = { id: WORKSHOP_ID, title: 'Bengkel Citra', icon: 'sliders' }
const P15_FIELDS = { samples: [], labDone: false, cases: {} }
const P16_FIELDS = { labDone: false }

const INTRO =
  'Satu alur dari gambar kamera sampai keputusan robot: bersihkan gambar, kenali objek, lalu ubah posisi objek menjadi gerak robot. Kerjakan berurutan. Hasil tiap tahap tersimpan, jadi kamu boleh berpindah tahap kapan saja. Lab ini menjadi satu kegiatan praktik untuk TP 3.2.1.'

export default function VisionPipelineLab({ lab }) {
  const { user } = useAuth()
  const workshop = useWorkshopState(WORKSHOP_ID, user.username)
  const p15 = useModuleStore(user.username, 'p15', P15_FIELDS)
  const p16 = useModuleStore(user.username, 'p16', P16_FIELDS)

  const stages = [
    {
      id: 'olah',
      title: 'Olah Gambar',
      about: 'Selesaikan tiket kerusakan pada filter citra: periksa, tentukan penyebab, lalu perbaiki. Gambarnya simulasi, tidak butuh webcam.',
      done: workshopProgress(IMAGE_WORKSHOP, workshop.state).finished,
      materi: { to: '/pembelajaran/p14', label: 'Image Processing' },
      render: () => <WorkshopLab lab={WORKSHOP_LAB} embedded store={workshop} />,
    },
    {
      id: 'deteksi',
      title: 'Deteksi Objek',
      about: 'Pisahkan objek dari latar, lihat kotak, kontur, dan titik pusatnya, lalu ajari model mengenali kubus target. Butuh webcam USB.',
      done: !!p15.state.labDone,
      materi: { to: '/pembelajaran/p15', label: 'Object Detection' },
      render: () => <ObjectDetectionStage state={p15.state} update={p15.update} />,
    },
    {
      id: 'misi',
      title: 'Misi AMR',
      about: 'Ubah posisi titik pusat objek menjadi keputusan gerak (SEARCH, TURN, MOVE FORWARD, STOP), lalu catat lima kondisi misi. Butuh webcam USB.',
      done: !!p16.state.labDone,
      materi: { to: '/pembelajaran/p16', label: 'AMR Vision Mission' },
      render: () => <AmrMissionStage state={p16.state} update={p16.update} />,
    },
  ]

  return <StagedLab lab={lab} intro={INTRO} stages={stages} />
}
