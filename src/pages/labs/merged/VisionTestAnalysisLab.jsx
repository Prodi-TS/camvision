import { useAuth } from '../../../auth.jsx'
import StagedLab from './StagedLab.jsx'
import useModuleStore from './useModuleStore.js'
import VisionTestingStage from '../vision-testing/VisionTestingLab.jsx'
import VisionAnalysisStage from '../vision-analysis/VisionAnalysisLab.jsx'

// Lab gabungan untuk TP 3.3.1: Vision Testing dan Vision Analysis.
// Pengujian dan analisis kini dua tahap dalam satu halaman. Hasil pengujian
// langsung dipakai pada tahap analisis. Data memakai kunci penyimpanan yang sama seperti sebelumnya.

const P17_FIELDS = { results: {}, labDone: false }
const P18_FIELDS = { analysis: {}, labDone: false }

const INTRO =
  'Satu alur dari pengujian sampai mencari penyebab: ukur seberapa andal sistem penglihatan, lalu cari tahu mengapa kondisi tertentu gagal. Hasil pengujian otomatis dipakai pada tahap analisis. Lab ini menjadi satu kegiatan praktik untuk TP 3.3.1.'

export default function VisionTestAnalysisLab({ lab }) {
  const { user } = useAuth()
  const p17 = useModuleStore(user.username, 'p17', P17_FIELDS)
  const p18 = useModuleStore(user.username, 'p18', P18_FIELDS)

  const stages = [
    {
      id: 'uji',
      title: 'Pengujian',
      about: 'Rekam tujuh kondisi (tiga jarak, cahaya redup, cahaya terang, tanpa kubus, pengecoh), lalu baca tingkat deteksi, posisi, dan waktu pemrosesan. Butuh webcam USB.',
      done: !!p17.state.labDone,
      materi: { to: '/pembelajaran/p17', label: 'Vision Testing' },
      render: () => <VisionTestingStage state={p17.state} update={p17.update} />,
    },
    {
      id: 'analisis',
      title: 'Analisis',
      about: 'Bandingkan hasil pengujian, rekam ulang kondisi yang gagal, lalu cari penyebabnya dengan data. Butuh webcam USB.',
      done: !!p18.state.labDone,
      materi: { to: '/pembelajaran/p18', label: 'Vision Analysis' },
      render: () => <VisionAnalysisStage state={p18.state} update={p18.update} p17Results={p17.state.results} />,
    },
  ]

  return <StagedLab lab={lab} intro={INTRO} stages={stages} />
}
