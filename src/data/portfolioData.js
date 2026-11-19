// Menyusun isi portofolio satu siswa dari data yang tersimpan di browser.
// Tanpa React, jadi bisa dipanggil kapan saja, termasuk saat belum ada yang dikerjakan.
// Bagian yang belum dikerjakan tetap dibuat dan ditandai. Pembuatan portofolio tidak pernah ditolak.
// Hasilnya objek biasa (bisa di-JSON-kan), tanpa waktu, sehingga dua panggilan berurutan sama persis
// bila data tidak berubah. Waktu pembuatan dicatat oleh pemanggil.

import { findAccount } from './accounts.js'
import { student as studentDefaults, learningModules, labs as labRegistry, portfolioSections } from './learningData.js'
import { readProgress, readModuleState, statusOf } from './progressStore.js'
import { computeModuleProgress } from './useModuleProgress.js'
import { buildSummary } from './studentSummary.js'
import { readProfile, profileFilled } from './useProfile.js'
import { readIncludePhotos } from './photoStore.js'
import { listOrderedPhotos } from './photoSlots.js'
import {
  P14_REFLECTION,
  P15_REFLECTION,
  P16_REFLECTION,
  P17_REFLECTION,
  P18_REFLECTION,
  P19_REFLECTION,
} from './reflectionQuestions.js'
import { REFLECTION_QUESTIONS as P13_REFLECTION, DATASHEET_ITEMS, SCENARIOS } from '../pages/p13/p13Data.js'
import { RES, FPS, FOV, IFACE, evaluate, ownCamDone } from '../pages/p13/ownCamOps.js'
import { CAMERA_WORKSHOP } from '../pages/labs/workshop/ticketsCamera.js'
import { IMAGE_WORKSHOP } from '../pages/labs/workshop/ticketsImage.js'
import { workshopProgress, readWorkshopState } from '../pages/labs/workshop/workshopProgress.js'
import { CASES } from '../pages/labs/object-detection/CasePractice.jsx'
import { CHECKS, ACTION_TEXT, readChecks } from '../pages/p16/missionOps.js'
import { TESTS, PASS_PRESENT, PASS_ABSENT, FRAME_BUDGET_MS, isPass, correctness, overall } from '../pages/p17/testOps.js'
import { HYPOTHESES, FACTOR_CHOICES, inferCauses, verdict, strongestFactor } from '../pages/p18/analysisOps.js'
import { COLOR_CENTER, changes, paramsKey } from '../pages/p19/optOps.js'

const MIN_ANALYZED = 2 // sama dengan syarat pada lab analisis

// ---------- Pembantu ----------
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v) => (typeof v === 'string' ? v : '')
const moduleState = (username, id) => obj(readModuleState(username, id))
const safe = (fn, fallback) => {
  try {
    return fn()
  } catch {
    return fallback
  }
}
const rank = (done, total) => (!done ? 'Belum dikerjakan' : done >= total ? 'Lengkap' : 'Sebagian')
const moduleTitle = (id) => (learningModules.find((m) => m.id === id) || {}).title || id
const labTitle = (id) => (labRegistry.find((l) => l.id === id) || {}).title || id

const LAB_LINK = {
  camera: '/virtual-lab/camera-explorer',
  olah: '/virtual-lab/vision-pipeline-lab?tahap=olah',
  deteksi: '/virtual-lab/vision-pipeline-lab?tahap=deteksi',
  misi: '/virtual-lab/vision-pipeline-lab?tahap=misi',
  uji: '/virtual-lab/vision-test-analysis-lab?tahap=uji',
  analisis: '/virtual-lab/vision-test-analysis-lab?tahap=analisis',
  optimasi: '/virtual-lab/vision-optimization-lab',
}

// Hasil pengujian yang sah saja (punya tingkat deteksi), dipakai oleh analisis dan optimasi.
function cleanResults(username) {
  const raw = obj(moduleState(username, 'p17').results)
  return Object.fromEntries(TESTS.filter((t) => num(obj(raw[t.id]).rate) != null).map((t) => [t.id, raw[t.id]]))
}

// ---------- 1. Identitas ----------
function buildIdentity(username, todo, profile) {
  const account = findAccount(username) || { username, role: 'Siswa' }
  const p = profile || readProfile(username)
  const filled = profileFilled(p)
  if (filled < 3) todo.push({ section: 'identitas', text: 'Isi nama, NIS, dan kelas di halaman Profil', to: '/profil' })
  return {
    status: filled === 0 ? 'Belum diisi' : filled === 3 ? 'Lengkap' : 'Sebagian',
    line: `${filled} dari 3 isian identitas terisi`,
    nama: p.nama.trim(),
    nis: p.nis.trim(),
    kelas: p.kelas.trim(),
    username,
    role: account.role,
    program: studentDefaults.program,
    konsentrasi: studentDefaults.konsentrasi,
  }
}

// ---------- 2. Progres ----------
function buildProgress(username, todo) {
  const { modules, overall: all } = computeModuleProgress(username)
  const rows = modules.map((m) => ({ id: m.id, title: m.title, percent: m.progress, status: statusOf(m.progress) }))
  rows
    .filter((r) => r.percent < 100)
    .forEach((r) =>
      todo.push({
        section: 'progress',
        text: r.percent === 0 ? `Mulai materi ${r.title}` : `Selesaikan materi ${r.title} (${r.percent}% selesai)`,
        to: `/pembelajaran/${r.id}`,
      })
    )
  const started = rows.filter((r) => r.percent > 0).length
  const full = rows.filter((r) => r.percent >= 100).length
  return {
    status: started === 0 ? 'Belum dikerjakan' : full === rows.length ? 'Lengkap' : 'Sebagian',
    line: `Progres keseluruhan ${all}%`,
    overall: all,
    rows,
  }
}

// ---------- 3. Quiz ----------
function buildQuiz(username, todo) {
  const saved = obj(readProgress(username))
  const p13 = moduleState(username, 'p13')
  const ds = obj(p13.datasheet)
  const ld = obj(p13.lidar)
  const rows = [
    {
      module: 'Camera',
      name: 'Datasheet Challenge',
      total: DATASHEET_ITEMS.length,
      answered: DATASHEET_ITEMS.filter((i) => ds[i.id]).length,
      correct: DATASHEET_ITEMS.filter((i) => ds[i.id] === i.answer).length,
      to: '/pembelajaran/p13',
    },
    {
      module: 'Camera',
      name: 'Camera vs LiDAR',
      total: SCENARIOS.length,
      answered: SCENARIOS.filter((s) => ld[s.id]).length,
      correct: SCENARIOS.filter((s) => ld[s.id] === s.answer).length,
      to: '/pembelajaran/p13',
    },
  ]
  learningModules
    .filter((m) => m.id !== 'p13')
    .forEach((m) => {
      const entry = obj(saved[m.id])
      rows.push({
        module: m.title,
        name: m.id === 'p14' ? 'Pilih Filter yang Tepat' : 'Cek Pemahaman',
        total: num(entry.quizTotal),
        answered: Object.keys(obj(moduleState(username, m.id).quiz)).length,
        correct: num(entry.quizCorrect) ?? 0,
        to: `/pembelajaran/${m.id}`,
      })
    })
  rows.forEach((r) => {
    if (r.total != null && r.answered > 0 && r.correct >= r.total) return
    todo.push({
      section: 'quiz',
      text: r.total != null && r.answered > 0 ? `${r.name} (${r.module}): ${r.correct} dari ${r.total} benar` : `Kerjakan ${r.name} (${r.module})`,
      to: r.to,
    })
  })
  const known = rows.filter((r) => r.total != null)
  const answeredAny = rows.some((r) => r.answered > 0)
  const allRight = rows.every((r) => r.total != null && r.answered > 0 && r.correct >= r.total)
  const correct = known.reduce((n, r) => n + r.correct, 0)
  const total = known.reduce((n, r) => n + r.total, 0)
  return {
    status: !answeredAny ? 'Belum dikerjakan' : allRight ? 'Lengkap' : 'Sebagian',
    line: answeredAny ? `${correct} jawaban benar dari ${total} soal` : 'Belum ada soal yang dijawab',
    rows,
    correct,
    total,
  }
}

// ---------- 4. Virtual Lab ----------
function workshopBlock(cfg, username) {
  const st = obj(readWorkshopState(cfg, username))
  const prog = workshopProgress(cfg, st)
  const solved = obj(st.solved)
  return {
    solved: prog.solved,
    total: prog.tickets,
    wrong: prog.wrong,
    finished: prog.finished,
    tickets: cfg.tickets.map((t) => ({
      title: t.title,
      solved: !!solved[t.id],
      wrong: solved[t.id] ? num(obj(solved[t.id]).wrong) ?? 0 : null,
    })),
    reflection: { question: cfg.reflectionQuestion, answer: str(st.reflection).trim(), saved: !!st.reflectionSaved },
  }
}

function buildWebcam(username) {
  const oc = obj(moduleState(username, 'p13').ownCam)
  const m = oc.measured ? obj(oc.measured) : null
  const ev = evaluate(oc)
  const textOf = (list, id) => (list.find((x) => x.id === id) || {}).text || null
  const round1 = (v) => (num(v) == null ? null : Math.round(v * 10) / 10)
  return {
    done: ownCamDone(oc),
    measured: m
      ? { label: str(m.label), width: num(m.width), height: num(m.height), fps: round1(m.fps), capFps: round1(m.capFps) }
      : null,
    datasheet: [
      ['Resolution', textOf(RES, oc.res)],
      ['FPS', textOf(FPS, oc.fps)],
      ['FOV', textOf(FOV, oc.fov)],
      ['Interface', textOf(IFACE, oc.iface)],
    ],
    needs: ev.rows.map((r) => ({ label: r.label, status: r.status })),
    fit: ev.fit,
    decision: oc.decision === 'ya' ? 'Memenuhi' : oc.decision === 'belum' ? 'Belum memenuhi' : null,
    decisionRight: oc.decision && ev.fit != null ? (oc.decision === 'ya') === ev.fit : null,
  }
}

function missionText(check, r) {
  if (!r) return null
  const got = ACTION_TEXT[r.got] || '-'
  const share = num(r.share) != null ? ` (${Math.round(r.share * 100)}%)` : ''
  const x = num(r.cx) != null && (check.expect === 'belok_kiri' || check.expect === 'belok_kanan') ? `, x ≈ ${Math.round(r.cx)}` : ''
  const d = num(r.dist) != null && (check.expect === 'maju' || check.expect === 'berhenti') ? `, ≈ ${Math.round(r.dist)} cm` : ''
  return `${got}${share}${x}${d}`
}

function buildLab(username, todo) {
  const labDone = (id) => !!moduleState(username, id).labDone

  const camWorkshop = workshopBlock(CAMERA_WORKSHOP, username)
  const imgWorkshop = workshopBlock(IMAGE_WORKSHOP, username)

  const p15 = moduleState(username, 'p15')
  const samples = Array.isArray(p15.samples) ? p15.samples : []
  const cases = obj(p15.cases)
  const detection = {
    target: samples.filter((s) => obj(s).label === 'target').length,
    bukan: samples.filter((s) => obj(s).label === 'bukan').length,
    cases: CASES.map((c) => {
      const s = obj(cases[c.id])
      return {
        title: c.title,
        before: s.before != null ? c.optionsBefore[s.before] || null : null,
        fixed: !!s.fixed,
        after: s.after != null ? c.optionsAfter[s.after] || null : null,
        done: s.before != null && !!s.fixed && s.after != null,
      }
    }),
  }

  const checks = obj(readChecks(username))
  const mission = {
    rows: CHECKS.map((c) => {
      const r = checks[c.id] ? obj(checks[c.id]) : null
      return { label: c.label, expect: c.expectText, got: missionText(c, r), ok: r ? !!r.ok : null }
    }),
  }

  const labs = [
    {
      id: 'camera-explorer',
      title: labTitle('camera-explorer'),
      stages: [{ id: 'camera', title: 'Bengkel Kamera', done: camWorkshop.finished, workshop: camWorkshop }],
    },
    {
      id: 'vision-pipeline-lab',
      title: labTitle('vision-pipeline-lab'),
      stages: [
        { id: 'olah', title: 'Olah Gambar', done: imgWorkshop.finished, workshop: imgWorkshop },
        { id: 'deteksi', title: 'Deteksi Objek', done: labDone('p15'), detection },
        { id: 'misi', title: 'Misi AMR', done: labDone('p16'), mission },
      ],
    },
    {
      id: 'vision-test-analysis-lab',
      title: labTitle('vision-test-analysis-lab'),
      stages: [
        { id: 'uji', title: 'Pengujian', done: labDone('p17'), see: 'Hasil Testing' },
        { id: 'analisis', title: 'Analisis', done: labDone('p18'), see: 'Hasil Analysis' },
      ],
    },
    {
      id: 'vision-optimization-lab',
      title: labTitle('vision-optimization-lab'),
      stages: [{ id: 'optimasi', title: 'Optimasi', done: labDone('p19'), see: 'Hasil Optimization' }],
    },
  ]

  let doneStages = 0
  let totalStages = 0
  labs.forEach((l) => {
    l.status = rank(l.stages.filter((s) => s.done).length, l.stages.length)
    l.stages.forEach((s) => {
      totalStages += 1
      if (s.done) {
        doneStages += 1
        return
      }
      todo.push({
        section: 'lab',
        text: l.stages.length === 1 ? `${l.title}: selesaikan praktik` : `${l.title}: tahap ${s.title}`,
        to: LAB_LINK[s.id] || '/virtual-lab',
      })
    })
  })

  return {
    status: rank(doneStages, totalStages),
    line: `${doneStages} dari ${totalStages} tahap lab selesai`,
    doneStages,
    totalStages,
    labs,
    webcam: buildWebcam(username),
  }
}

// ---------- 5. Testing ----------
function buildTesting(username, todo) {
  const results = cleanResults(username)
  const rows = TESTS.map((t) => {
    const r = results[t.id]
    return {
      label: t.label,
      present: t.present,
      tested: !!r,
      rate: r ? r.rate : null,
      x: r ? num(r.x) : null,
      ms: r ? num(r.ms) : null,
      pass: r ? isPass(t, r.rate) : null,
    }
  })
  const tested = rows.filter((r) => r.tested).length
  const s = tested ? overall(results) : null
  if (tested < TESTS.length) {
    todo.push({
      section: 'testing',
      text: tested === 0 ? 'Rekam ketujuh kondisi pengujian' : `Rekam ${TESTS.length - tested} kondisi pengujian yang belum diuji`,
      to: LAB_LINK.uji,
    })
  }
  return {
    status: rank(tested, TESTS.length),
    line: `${tested} dari ${TESTS.length} kondisi sudah diuji`,
    tested,
    total: TESTS.length,
    rows,
    summary: s
      ? { passed: s.passed, total: s.total, detection: s.detection, falseAlarm: s.falseAlarm, accuracy: s.accuracy, ms: s.ms, weakest: s.weakest ? s.weakest.label : null }
      : null,
    passPresent: PASS_PRESENT,
    passAbsent: PASS_ABSENT,
    frameBudgetMs: FRAME_BUDGET_MS,
  }
}

// ---------- 6. Analysis ----------
function evidenceOf(m) {
  const mm = obj(m)
  const out = []
  if (num(mm.rate) != null) out.push(`terdeteksi ${Math.round(mm.rate * 100)}%`)
  if (num(mm.tinyRate) != null && mm.tinyRate > 0) out.push(`terlalu kecil ${Math.round(mm.tinyRate * 100)}%`)
  if (num(mm.medArea) != null) out.push(`luas kotak ${Math.round(mm.medArea)} piksel`)
  if (num(mm.bright) != null) out.push(`kecerahan ${Math.round(mm.bright)}`)
  if (num(mm.sat) != null) out.push(`kepekatan warna ${Math.round(mm.sat)}`)
  if (num(mm.decoyRate) != null && mm.decoyRate > 0) out.push(`benda lain ${Math.round(mm.decoyRate * 100)}%`)
  return out.join(', ')
}

function buildAnalysis(username, todo) {
  const p18 = moduleState(username, 'p18')
  const raw = obj(p18.analysis)
  const rows = TESTS.filter((t) => raw[t.id] && raw[t.id].hypothesis && raw[t.id].metrics).map((t) => {
    const e = obj(raw[t.id])
    const causes = inferCauses(t, e.metrics, num(e.sMin) ?? 110)
    const v = verdict(e.hypothesis, causes)
    return {
      label: t.label,
      hypothesis: (HYPOTHESES.find((h) => h.id === e.hypothesis) || {}).text || str(e.hypothesis),
      evidence: evidenceOf(e.metrics),
      verdict: v.text.replace('dugaanmu', 'dugaan'),
      ok: v.ok,
    }
  })

  const results = cleanResults(username)
  const strongest = strongestFactor(results)
  const choiceId = obj(raw._factor).choice
  const nameOf = (id) => (FACTOR_CHOICES.find((f) => f.id === id) || {}).text || null
  const factor = {
    choice: nameOf(choiceId),
    strongest: strongest ? nameOf(strongest.id) : null,
    supported: strongest && choiceId ? choiceId === strongest.id : null,
    byDistance: strongest ? Math.round(strongest.d * 100) : null,
    byLight: strongest ? Math.round(strongest.c * 100) : null,
  }

  const done = !!p18.labDone
  if (!done) {
    todo.push({
      section: 'analysis',
      text: rows.length === 0 ? 'Mulai analisis penyebab kegagalan' : `Analisis penyebab: ${rows.length} kondisi dianalisis (minimal ${MIN_ANALYZED})`,
      to: LAB_LINK.analisis,
    })
  }
  return {
    status: done ? 'Lengkap' : rows.length ? 'Sebagian' : 'Belum dikerjakan',
    line: `${rows.length} dari ${TESTS.length} kondisi dianalisis`,
    analyzed: rows.length,
    total: TESTS.length,
    rows,
    factor,
  }
}

// ---------- 7. Optimization ----------
function buildOptimization(username, todo, sum) {
  const p19 = moduleState(username, 'p19')
  const after = obj(p19.after)
  const before = cleanResults(username)
  const rows = TESTS.map((t) => {
    const b = before[t.id]
    const a = num(obj(after[t.id]).rate) != null ? after[t.id] : null
    return {
      label: t.label,
      before: b ? { rate: b.rate, ms: num(b.ms), pass: isPass(t, b.rate) } : null,
      after: a ? { rate: a.rate, ms: num(a.ms), pass: isPass(t, a.rate) } : null,
      delta: b && a ? correctness(t, a.rate) - correctness(t, b.rate) : null,
    }
  })
  const recorded = rows.filter((r) => r.after).length

  const first = TESTS.map((t) => after[t.id]).find((a) => a && a.params)
  const settings = first
    ? safe(
        () => ({
          color: (COLOR_CENTER[first.params.color] || {}).label || null,
          changes: changes(first.params),
          consistent: recorded === TESTS.length ? TESTS.every((t) => paramsKey(after[t.id].params) === paramsKey(first.params)) : null,
        }),
        null
      )
    : null

  const done = !!p19.labDone
  if (!done) {
    todo.push({
      section: 'optimization',
      text: recorded === 0 ? 'Mulai optimasi dan rekam ulang kondisi' : `Optimasi: ${recorded} dari ${TESTS.length} kondisi direkam ulang`,
      to: LAB_LINK.optimasi,
    })
  }
  const opt = sum && sum.optimization ? sum.optimization : null
  return {
    status: done ? 'Lengkap' : recorded ? 'Sebagian' : 'Belum dikerjakan',
    line: `${recorded} dari ${TESTS.length} kondisi direkam ulang`,
    recorded,
    total: TESTS.length,
    rows,
    settings,
    summary: opt
      ? {
          after: { passed: opt.after.passed, total: opt.after.total, accuracy: opt.after.accuracy, ms: opt.after.ms },
          before: opt.before ? { passed: opt.before.passed, total: opt.before.total, accuracy: opt.before.accuracy, ms: opt.before.ms } : null,
        }
      : null,
    better: rows.filter((r) => r.delta != null && r.delta > 0.0001).map((r) => r.label),
    worse: rows.filter((r) => r.delta != null && r.delta < -0.0001).map((r) => r.label),
  }
}

// ---------- 8. Refleksi ----------
const MODULE_REFLECTIONS = [
  { id: 'p13', questions: P13_REFLECTION },
  { id: 'p14', questions: P14_REFLECTION },
  { id: 'p15', questions: P15_REFLECTION },
  { id: 'p16', questions: P16_REFLECTION },
  { id: 'p17', questions: P17_REFLECTION },
  { id: 'p18', questions: P18_REFLECTION },
  { id: 'p19', questions: P19_REFLECTION },
]

function buildReflections(username, todo, lab) {
  const units = MODULE_REFLECTIONS.map((m) => {
    const st = moduleState(username, m.id)
    const answers = obj(st.reflection)
    const items = m.questions.map((q) => ({ question: q.text, answer: str(answers[q.id]).trim() }))
    return { title: `Materi ${moduleTitle(m.id)}`, items, saved: !!st.reflectionSaved, to: `/pembelajaran/${m.id}` }
  })
  // Refleksi bengkel pada Virtual Lab (satu pertanyaan tiap bengkel).
  const cam = lab.labs[0].stages[0].workshop
  const img = lab.labs[1].stages[0].workshop
  ;[
    { title: 'Virtual Lab: Camera Explorer', w: cam, to: LAB_LINK.camera },
    { title: 'Virtual Lab: Vision Pipeline, tahap Olah Gambar', w: img, to: LAB_LINK.olah },
  ].forEach((u) =>
    units.push({
      title: u.title,
      items: [{ question: u.w.reflection.question, answer: u.w.reflection.answer }],
      saved: u.w.reflection.saved,
      to: u.to,
    })
  )

  units.forEach((u) => {
    const answered = u.items.filter((i) => i.answer).length
    u.answered = answered
    u.status = answered === 0 ? 'Belum dikerjakan' : answered === u.items.length && u.saved ? 'Lengkap' : 'Sebagian'
    if (u.status === 'Lengkap') return
    todo.push({
      section: 'refleksi',
      text:
        answered === 0
          ? `Tulis refleksi ${u.title}`
          : answered < u.items.length
            ? `Lengkapi refleksi ${u.title} (${answered} dari ${u.items.length} dijawab)`
            : `Simpan refleksi ${u.title}`,
      to: u.to,
    })
  })
  const complete = units.filter((u) => u.status === 'Lengkap').length
  const any = units.some((u) => u.answered > 0)
  return {
    status: !any ? 'Belum dikerjakan' : rank(complete, units.length),
    line: `${complete} dari ${units.length} refleksi tersimpan`,
    units,
  }
}

// ---------- Gambar dari kamera ----------
// Hanya keterangan gambar (slot, judul, waktu). Isi gambarnya diambil terpisah saat portofolio dibuat,
// supaya data ini tetap kecil dan bisa dibandingkan untuk mengetahui apakah ada perubahan.
// Gambar bukan syarat kelengkapan, jadi tidak masuk ke daftar bagian maupun daftar yang belum dikerjakan.
function buildPhotos(username) {
  const stored = listOrderedPhotos(username)
  const included = readIncludePhotos(username)
  return {
    included,
    stored: stored.length,
    items: included ? stored.map((p) => ({ slot: p.slot, title: p.title, at: p.at, note: p.note })) : [],
  }
}

// ---------- Rakitan akhir ----------
// Satu bagian yang gagal dibaca (data rusak di browser) tidak boleh menggagalkan seluruh portofolio.
function section(build, label) {
  try {
    return build()
  } catch {
    return { status: 'Belum dikerjakan', line: `Data ${label} tidak terbaca`, unreadable: true }
  }
}

// profile (opsional): isian identitas yang sedang tampil di layar. Bila kosong, dibaca dari browser.
export function buildPortfolio(username, profile) {
  const todo = []
  const sum = safe(() => buildSummary(username), null)

  const identitas = section(() => buildIdentity(username, todo, profile), 'identitas')
  const progress = section(() => buildProgress(username, todo), 'progres')
  const quiz = section(() => buildQuiz(username, todo), 'quiz')
  const lab = section(() => buildLab(username, todo), 'Virtual Lab')
  const testing = section(() => buildTesting(username, todo), 'pengujian')
  const analysis = section(() => buildAnalysis(username, todo), 'analisis')
  const optimization = section(() => buildOptimization(username, todo, sum), 'optimasi')
  const refleksi = lab.unreadable
    ? { status: 'Belum dikerjakan', line: 'Data refleksi tidak terbaca', unreadable: true }
    : section(() => buildReflections(username, todo, lab), 'refleksi')

  const data = { identitas, progress, quiz, lab, testing, analysis, optimization, refleksi }
  const sections = portfolioSections.map((s) => ({ id: s.id, title: s.title, icon: s.icon, status: data[s.id].status, line: data[s.id].line }))
  const foto = safe(() => buildPhotos(username), { included: true, stored: 0, items: [] })

  return {
    ...data,
    foto,
    sections,
    todo,
    complete: sections.every((s) => s.status === 'Lengkap'),
    completeCount: sections.filter((s) => s.status === 'Lengkap').length,
  }
}

// Nama berkas yang disarankan saat disimpan sebagai PDF.
export function portfolioFileName(data, at) {
  const who = (data.identitas.nama || data.identitas.username || 'siswa').trim()
  const clean = who.normalize('NFKD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'siswa'
  const d = new Date(at)
  const pad = (n) => String(n).padStart(2, '0')
  return `Portofolio-${clean}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

// Tanggal dan jam pembuatan, dalam waktu Indonesia Barat.
export function formatWhen(at) {
  const d = new Date(at)
  try {
    return `${new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(d)} WIB`
  } catch {
    return d.toLocaleString('id-ID')
  }
}
