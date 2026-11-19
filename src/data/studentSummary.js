// Merangkum hasil belajar satu siswa dari data yang tersimpan di browser.
// Dipakai oleh halaman Hasil Saya dan Portofolio.
import { learningModules, labs as labRegistry } from './learningData.js'
import { readProgress, readModuleState } from './progressStore.js'
import { IMAGE_WORKSHOP } from '../pages/labs/workshop/ticketsImage.js'
import { CAMERA_WORKSHOP } from '../pages/labs/workshop/ticketsCamera.js'
import { workshopProgress, readWorkshopState } from '../pages/labs/workshop/workshopProgress.js'
import { TESTS, isPass, overall } from '../pages/p17/testOps.js'
import { HYPOTHESES, inferCauses, verdict } from '../pages/p18/analysisOps.js'
import { changes } from '../pages/p19/optOps.js'

export function buildSummary(username) {
  const saved = readProgress(username)
  const modules = learningModules.map((m) => {
    const p = saved[m.id] || {}
    return { id: m.id, code: m.code, title: m.title, percent: p.percent || 0, quizCorrect: p.quizCorrect ?? null, quizTotal: p.quizTotal ?? null }
  })

  // Virtual Lab: sama dengan menu. Lab gabungan terdiri dari beberapa tahap.
  const labDone = (id) => !!readModuleState(username, id).labDone
  const labTitle = (id) => (labRegistry.find((l) => l.id === id) || {}).title || id
  const labs = [
    {
      id: 'camera-explorer',
      title: labTitle('camera-explorer'),
      stages: [{ title: 'Bengkel Kamera', done: workshopProgress(CAMERA_WORKSHOP, readWorkshopState(CAMERA_WORKSHOP, username)).finished }],
    },
    {
      id: 'vision-pipeline-lab',
      title: labTitle('vision-pipeline-lab'),
      stages: [
        { title: 'Olah Gambar', done: workshopProgress(IMAGE_WORKSHOP, readWorkshopState(IMAGE_WORKSHOP, username)).finished },
        { title: 'Deteksi Objek', done: labDone('p15') },
        { title: 'Misi AMR', done: labDone('p16') },
      ],
    },
    {
      id: 'vision-test-analysis-lab',
      title: labTitle('vision-test-analysis-lab'),
      stages: [
        { title: 'Pengujian', done: labDone('p17') },
        { title: 'Analisis', done: labDone('p18') },
      ],
    },
    {
      id: 'vision-optimization-lab',
      title: labTitle('vision-optimization-lab'),
      stages: [{ title: 'Optimasi', done: labDone('p19') }],
    },
  ]

  // P17: hasil pengujian
  const before = readModuleState(username, 'p17').results || {}
  const testRows = TESTS.map((t) => ({ label: t.label, present: t.present, rate: before[t.id] ? before[t.id].rate : null, pass: before[t.id] ? isPass(t, before[t.id].rate) : null }))
  const sumBefore = overall(before)
  const testing = sumBefore ? { rows: testRows, summary: sumBefore } : null

  // P18: dugaan penyebab
  const analysisRaw = readModuleState(username, 'p18').analysis || {}
  const analysis = TESTS.filter((t) => analysisRaw[t.id] && analysisRaw[t.id].hypothesis && analysisRaw[t.id].metrics)
    .map((t) => {
      const e = analysisRaw[t.id]
      const causes = inferCauses(t, e.metrics, e.sMin ?? 110)
      const v = verdict(e.hypothesis, causes)
      return { label: t.label, hypothesis: HYPOTHESES.find((h) => h.id === e.hypothesis)?.text || e.hypothesis, verdict: v.text, ok: v.ok }
    })

  // P19: sebelum dan sesudah
  const afterRaw = readModuleState(username, 'p19').after || {}
  const afterSum = overall(afterRaw)
  let optimization = null
  if (afterSum) {
    const first = TESTS.map((t) => afterRaw[t.id]).find(Boolean)
    const matched = Object.fromEntries(TESTS.filter((t) => before[t.id] && afterRaw[t.id]).map((t) => [t.id, before[t.id]]))
    optimization = {
      after: afterSum,
      before: overall(matched),
      changes: first && first.params ? changes(first.params) : [],
    }
  }

  return { modules, labs, testing, analysis, optimization }
}
