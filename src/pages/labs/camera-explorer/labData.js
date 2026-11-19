// Konten Virtual Lab 1 — Camera Explorer (Mission 01: Camera Inspection).
// Semua angka pada lab ini adalah DATA SIMULASI, bukan spesifikasi kamera nyata.

export const MISSION_CODE = 'Mission 01'
export const MISSION_TITLE = 'Camera Inspection'
export const LAB_TAGLINE =
  'Kenali kamera yang digunakan robot untuk memperoleh informasi visual dari lingkungan.'
export const MISSION_BRIEF =
  'Anda adalah teknisi robotika. Sebelum memasang kamera pada AMR, Anda harus memahami bagian kamera, karakteristiknya, dan spesifikasinya.'
export const MISSION_TASKS = [
  'Jelajahi kamera dan kenali bagian-bagiannya.',
  'Pelajari parameter spesifikasi kamera.',
  'Baca datasheet seperti seorang teknisi.',
  'Pilih kamera untuk skenario misi.',
  'Ambil keputusan sebagai teknisi.',
]

// ---------- Bagian kamera ----------
export const PARTS = [
  {
    id: 'lens',
    no: 1,
    name: 'Lens',
    fungsi: 'Meneruskan dan memfokuskan cahaya menuju sensor gambar.',
    hubungan:
      'Menentukan pemandangan yang masuk ke kamera robot. Luas pandang (FOV) berkaitan dengan bagian ini.',
  },
  {
    id: 'sensor',
    no: 2,
    name: 'Image Sensor',
    fungsi: 'Mengubah cahaya menjadi data citra digital.',
    hubungan:
      'Menghasilkan citra yang menjadi bahan computer vision. Jumlah piksel citra (resolution) berkaitan dengan bagian ini.',
  },
  {
    id: 'interface',
    no: 3,
    name: 'Interface',
    fungsi: 'Menghubungkan kamera ke sistem dan mengirim data citra.',
    hubungan:
      'Citra dari kamera sampai ke sistem robot lewat koneksi ini, misalnya USB.',
  },
  {
    id: 'mounting',
    no: 4,
    name: 'Mounting',
    fungsi: 'Menahan kamera pada posisi tertentu.',
    hubungan:
      'Posisi dan arah pemasangan menentukan bagian lingkungan yang terlihat oleh kamera pada robot.',
  },
]

// ---------- Parameter spesifikasi (DATA SIMULASI) ----------
export const PARAMS = [
  {
    id: 'res',
    label: 'Resolution',
    value: '1920 × 1080',
    purpose: 'Memengaruhi detail citra yang dihasilkan kamera.',
    robot: 'Teknisi memeriksa apakah detail citra sesuai dengan kebutuhan sistem robot.',
  },
  {
    id: 'fps',
    label: 'FPS',
    value: '30 FPS',
    purpose: 'Berkaitan dengan jumlah frame yang diproses per detik.',
    robot: 'Menentukan seberapa sering robot menerima gambar baru dari kamera.',
  },
  {
    id: 'fov',
    label: 'FOV',
    value: '78°',
    purpose: 'Menunjukkan luas area pandang kamera.',
    robot: 'Menentukan seberapa luas lingkungan yang dapat dilihat robot.',
  },
  {
    id: 'iface',
    label: 'Interface',
    value: 'USB',
    purpose: 'Menunjukkan cara kamera terhubung ke sistem.',
    robot:
      'Harus sesuai dengan sambungan pada robot. Pada robot ini kamera masuk lewat USB HUB expansion board, lalu ke komputer utama.',
  },
]

// ---------- Datasheet (DATA SIMULASI) ----------
export const DATASHEET_ROWS = [
  {
    id: 'res',
    term: 'Resolution',
    value: '1920 × 1080',
    reads: 'Ukuran citra: 1920 piksel lebar × 1080 piksel tinggi.',
  },
  {
    id: 'fps',
    term: 'Frame Rate',
    value: '30 FPS',
    reads: 'Frame Rate pada datasheet sama dengan FPS: 30 gambar (frame) per detik.',
  },
  {
    id: 'fov',
    term: 'FOV',
    value: '78°',
    reads: 'Sudut pandang kamera sebesar 78 derajat.',
  },
  {
    id: 'iface',
    term: 'Interface',
    value: 'USB',
    reads:
      'Kamera terhubung melalui USB. Pada robot, kabel USB ini menuju USB HUB expansion board.',
  },
]

// Checkpoint kecil setelah semua baris datasheet diinspeksi.
export const CHECKPOINTS = [
  {
    id: 'c1',
    prompt: 'Baris datasheet mana yang menunjukkan cara kamera terhubung ke sistem?',
    answer: 'iface',
    ok: 'Benar. Baris Interface menunjukkan cara kamera terhubung ke sistem.',
  },
  {
    id: 'c2',
    prompt: 'Baris datasheet mana yang menunjukkan jumlah frame per detik?',
    answer: 'fps',
    ok: 'Benar. Frame Rate (FPS) menunjukkan jumlah frame per detik.',
  },
]
export const CHECKPOINT_WRONG = 'Belum tepat. Baca kembali baris datasheet di atas.'

// ---------- Camera Selection (DATA SIMULASI) ----------
// Kebutuhan robot. Kamera dinilai "sesuai" bila lulus SEMUA kebutuhan.
export const REQUIREMENTS = [
  { key: 'Interface', label: 'Interface USB', ok: (c) => c.iface.startsWith('USB') },
  { key: 'FPS', label: 'FPS minimal 30', ok: (c) => c.fps >= 30 },
  { key: 'FOV', label: 'FOV minimal 60°', ok: (c) => c.fov >= 60 },
  {
    key: 'Resolution',
    label: 'Resolution minimal 1280 × 720',
    ok: (c) => c.width >= 1280 && c.height >= 720,
  },
]

export const SCENARIO = {
  title: 'Mission Scenario',
  text:
    'AMR memilah kubus berwarna. Kamera tersambung ke USB HUB expansion board, lalu ke komputer utama. ' +
    'Kamera harus: Interface USB, FPS minimal 30, FOV minimal 60°, dan Resolution minimal 1280 × 720.',
  need: 'Kamera yang lulus semua kebutuhan robot',
}

// Data mentah. Camera B mewakili webcam USB Full HD milik guru.
// TODO guru: ganti fps dan fov Camera B dengan angka asli webcam (lihat kotak/penjual).
const RAW_CAMERAS = [
  { id: 'A', name: 'Camera A', width: 1280, height: 720, fps: 15, fov: 70, iface: 'USB 2.0' },
  { id: 'B', name: 'Camera B', width: 1920, height: 1080, fps: 30, fov: 70, iface: 'USB 2.0' },
  { id: 'C', name: 'Camera C', width: 1920, height: 1080, fps: 60, fov: 75, iface: 'MIPI-CSI (kabel pita)' },
]

export const CAMERAS = RAW_CAMERAS.map((c) => {
  const fails = REQUIREMENTS.filter((r) => !r.ok(c))
  const fit = fails.length === 0
  return {
    id: c.id,
    name: c.name,
    fov: c.fov,
    specs: {
      Resolution: `${c.width} × ${c.height}`,
      FPS: String(c.fps),
      FOV: `${c.fov}°`,
      Interface: c.iface,
    },
    fit,
    fails: fails.map((r) => r.label),
    why: fit
      ? 'Memenuhi keempat kebutuhan: Interface USB, FPS, FOV, dan Resolution.'
      : `Belum memenuhi: ${fails.map((r) => r.label).join('; ')}.`,
    note: c.iface.startsWith('USB')
      ? undefined
      : 'Catatan: kabel pita CSI tidak bisa dihubungkan lewat USB HUB expansion board.',
  }
})

// ---------- Technician Decision ----------
export const DECISION_QUESTION =
  'Apakah kamera yang dipilih sudah sesuai dengan kebutuhan misi?'

export function evaluateDecision(selection, decision) {
  const cam = CAMERAS.find((c) => c.id === selection)
  if (!cam || !decision) return { answered: false, correct: false, text: '' }

  if (cam.fit && decision === 'YES') {
    return {
      answered: true,
      correct: true,
      text: `Tepat. ${cam.name} memenuhi semua kebutuhan robot: Interface USB, FPS, FOV, dan Resolution.`,
    }
  }
  if (cam.fit && decision === 'NO') {
    return {
      answered: true,
      correct: false,
      text: `Belum tepat. ${cam.name} sebenarnya lulus semua kebutuhan. Cocokkan lagi tiap spesifikasi dengan kebutuhan misi.`,
    }
  }
  if (!cam.fit && decision === 'YES') {
    return {
      answered: true,
      correct: false,
      text: `Belum tepat. ${cam.name} belum memenuhi: ${cam.fails.join('; ')}. Periksa lagi spesifikasi terhadap kebutuhan misi.`,
    }
  }
  return {
    answered: true,
    correct: true,
    text: `Tepat. ${cam.name} belum memenuhi: ${cam.fails.join('; ')}. Kembali ke Choose Camera untuk memilih kamera lain.`,
  }
}

// ---------- Refleksi ----------
export const REFLECTION_QUESTION =
  'Apa pertimbangan utama Anda ketika memilih kamera untuk AMR?'

// ---------- Tahap & progress ----------
export const STAGE_TITLES = [
  'Mission',
  'Explore Camera',
  'Identify Camera Parts',
  'Explore Camera Specifications',
  'Read Datasheet',
  'Choose Camera',
  'Technician Decision',
  'Reflection',
]

export function getActivities(state) {
  const labelsOk = PARTS.filter((p) => state.labels[p.id] === p.name).length
  const checkOk = CHECKPOINTS.every((c) => state.checkpoint[c.id] === c.answer)
  const decision = evaluateDecision(state.selection, state.decision)

  return [
    { id: 'mission', label: 'Mission', done: state.started },
    {
      id: 'explore',
      label: 'Camera Exploration',
      done: state.partsExplored.length === PARTS.length,
      detail: `${state.partsExplored.length}/${PARTS.length}`,
    },
    {
      id: 'parts',
      label: 'Camera Parts',
      done: labelsOk === PARTS.length,
      detail: `${labelsOk}/${PARTS.length}`,
    },
    {
      id: 'specs',
      label: 'Specifications',
      done: state.paramsSeen.length === PARAMS.length,
      detail: `${state.paramsSeen.length}/${PARAMS.length}`,
    },
    {
      id: 'datasheet',
      label: 'Datasheet Inspection',
      done: state.inspected.length === DATASHEET_ROWS.length && checkOk,
      detail: `${state.inspected.length}/${DATASHEET_ROWS.length}`,
    },
    { id: 'selection', label: 'Camera Selection', done: state.selection !== null },
    { id: 'decision', label: 'Technician Decision', done: decision.correct },
    {
      id: 'reflection',
      label: 'Reflection',
      done: state.reflectionSaved && state.reflection.trim().length > 0,
    },
  ]
}
