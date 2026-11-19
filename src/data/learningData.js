// Data statis Tahap 1. Belum ada database, login, atau penyimpanan progres.

export const STATUS_NOT_STARTED = 'Belum dimulai'
export const STATUS_SOON = 'Segera hadir'

export const student = {
  nama: 'Nama Siswa',
  nis: '-',
  kelas: '-',
  program: 'Teknik Jaringan Komputer dan Telekomunikasi',
  konsentrasi: 'Teknisi Autonomous Mobile Robot',
  status: 'Siswa',
}

export const learningModules = [
  {
    id: 'p13',
    code: 'P13',
    title: 'Camera',
    description: 'Mengenal kamera sebagai sensor penglihatan robot.',
    icon: 'camera',
    status: STATUS_NOT_STARTED,
    progress: 0,
  },
  {
    id: 'p14',
    code: 'P14',
    title: 'Image Processing',
    description: 'Memahami cara gambar dari kamera diolah.',
    icon: 'sliders',
    status: STATUS_NOT_STARTED,
    progress: 0,
  },
  {
    id: 'p15',
    code: 'P15',
    title: 'Object Detection',
    description: 'Mengenali objek yang terlihat oleh robot.',
    icon: 'target',
    status: STATUS_NOT_STARTED,
    progress: 0,
  },
  {
    id: 'p16',
    code: 'P16',
    title: 'AMR Vision Mission',
    description: 'Menghubungkan penglihatan robot dengan misi AMR.',
    icon: 'robot',
    status: STATUS_NOT_STARTED,
    progress: 0,
  },
  {
    id: 'p17',
    navTitle: 'Testing',
    code: 'P17',
    title: 'Vision Testing',
    description: 'Menguji kinerja sistem penglihatan robot.',
    icon: 'check',
    status: STATUS_NOT_STARTED,
    progress: 0,
  },
  {
    id: 'p18',
    navTitle: 'Analysis',
    code: 'P18',
    title: 'Vision Analysis',
    description: 'Menganalisis hasil pengujian penglihatan robot.',
    icon: 'chart',
    status: STATUS_NOT_STARTED,
    progress: 0,
  },
  {
    id: 'p19',
    navTitle: 'Optimization',
    code: 'P19',
    title: 'Vision Optimization',
    description: 'Meningkatkan kinerja penglihatan robot.',
    icon: 'zap',
    status: STATUS_NOT_STARTED,
    progress: 0,
  },
]

export const labs = [
  {
    id: 'camera-explorer',
    title: 'Camera Explorer',
    shortTitle: 'Camera Explorer',
    description: 'Jelajahi kamera sebagai sensor penglihatan robot.',
    icon: 'camera',
    status: 'Tersedia',
  },
  // Lab gabungan untuk TP 3.2.1 (Image Processing, Object Detection, AMR Vision Mission).
  {
    id: 'vision-pipeline-lab',
    title: 'Vision Pipeline Lab',
    shortTitle: 'Vision Pipeline',
    description: 'Tiga tahap berurutan: olah gambar, kenali objek, lalu jalankan misi AMR.',
    icon: 'robot',
    status: 'Tersedia',
  },
  // Lab gabungan untuk TP 3.3.1 (Vision Testing, Vision Analysis).
  {
    id: 'vision-test-analysis-lab',
    title: 'Vision Test & Analysis Lab',
    shortTitle: 'Test & Analysis',
    description: 'Dua tahap berurutan: uji sistem penglihatan robot, lalu cari penyebab kegagalannya.',
    icon: 'chart',
    status: 'Tersedia',
  },
  {
    id: 'vision-optimization-lab',
    title: 'Vision Optimization Lab',
    shortTitle: 'Optimization',
    description: 'Praktik meningkatkan kinerja penglihatan robot.',
    icon: 'zap',
    status: 'Tersedia',
  },
]

// Hubungan materi dengan lab induknya: lab mana yang dipakai untuk mempraktikkan materi itu.
// `stage` adalah tahap di dalam lab gabungan (kosong bila lab tidak bertahap).
export const MODULE_LAB = {
  p13: { lab: 'camera-explorer', stage: null, stageLabel: '' },
  p14: { lab: 'vision-pipeline-lab', stage: 'olah', stageLabel: 'Tahap 1 · Olah Gambar' },
  p15: { lab: 'vision-pipeline-lab', stage: 'deteksi', stageLabel: 'Tahap 2 · Deteksi Objek' },
  p16: { lab: 'vision-pipeline-lab', stage: 'misi', stageLabel: 'Tahap 3 · Misi AMR' },
  p17: { lab: 'vision-test-analysis-lab', stage: 'uji', stageLabel: 'Tahap 1 · Uji' },
  p18: { lab: 'vision-test-analysis-lab', stage: 'analisis', stageLabel: 'Tahap 2 · Analisis' },
  p19: { lab: 'vision-optimization-lab', stage: null, stageLabel: '' },
}

export function labOfModule(moduleId) {
  const link = MODULE_LAB[moduleId]
  if (!link) return null
  const lab = labs.find((l) => l.id === link.lab)
  if (!lab) return null
  const to = `/virtual-lab/${lab.id}${link.stage ? `?tahap=${link.stage}` : ''}`
  return { lab, to, stageLabel: link.stageLabel }
}

export function modulesOfLab(labId) {
  return learningModules
    .filter((m) => MODULE_LAB[m.id] && MODULE_LAB[m.id].lab === labId)
    .map((m) => ({ ...m, stageLabel: MODULE_LAB[m.id].stageLabel }))
}

export const quizzes = [
  { id: 'quiz-1', title: 'Quiz 1 — Camera', status: 'Belum dikerjakan' },
  { id: 'quiz-2', title: 'Quiz 2 — Image Processing', status: 'Belum dikerjakan' },
  { id: 'quiz-3', title: 'Quiz 3 — Object Detection', status: 'Belum dikerjakan' },
  { id: 'quiz-4', title: 'Quiz 4 — AMR Vision', status: 'Belum dikerjakan' },
  { id: 'quiz-5', title: 'Quiz 5 — Testing & Optimization', status: 'Belum dikerjakan' },
]

export const resultCards = [
  { id: 'progress', title: 'Progress Pembelajaran', icon: 'book' },
  { id: 'quiz', title: 'Quiz', icon: 'help' },
  { id: 'lab', title: 'Virtual Lab', icon: 'flask' },
  { id: 'testing', title: 'Vision Testing', icon: 'check' },
  { id: 'analysis', title: 'Vision Analysis', icon: 'chart' },
  { id: 'optimization', title: 'Vision Optimization', icon: 'zap' },
]

export const portfolioSections = [
  { id: 'identitas', title: 'Identitas Siswa', icon: 'user' },
  { id: 'progress', title: 'Progres Belajar', icon: 'book' },
  { id: 'quiz', title: 'Hasil Quiz', icon: 'help' },
  { id: 'lab', title: 'Hasil Virtual Lab', icon: 'flask' },
  { id: 'testing', title: 'Hasil Testing', icon: 'check' },
  { id: 'analysis', title: 'Hasil Analysis', icon: 'chart' },
  { id: 'optimization', title: 'Hasil Optimization', icon: 'zap' },
  { id: 'refleksi', title: 'Refleksi', icon: 'file' },
]

export function getOverallProgress() {
  const total = learningModules.reduce((sum, m) => sum + m.progress, 0)
  return Math.round(total / learningModules.length)
}
