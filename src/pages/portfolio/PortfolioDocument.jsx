import { Link } from 'react-router-dom'
import { formatWhen } from '../../data/portfolioData.js'
import { FILTER_SLOTS, DETECT_SLOTS, MISSION_SLOTS, TEST_SLOTS, ANALYSIS_SLOTS, OPT_SLOTS } from '../../data/photoSlots.js'
import './portfolio.css'

// Dokumen portofolio. Isinya dibaca dari `data` (hasil buildPortfolio) pada saat tombol Generate ditekan,
// jadi tidak berubah sendiri. Bagian yang belum dikerjakan tetap tampil dan ditandai.

const pct = (x) => (x == null ? '-' : `${Math.round(x * 100)}%`)
const msText = (x) => (x == null ? '-' : `${x.toFixed(1)} ms`)
const TONE = { Lengkap: 'ok', Sebagian: 'warn' }

function Status({ status }) {
  return <span className={`pf-tag pf-tag--${TONE[status] || 'none'}`}>{status}</span>
}

function Missing({ children = 'belum dikerjakan' }) {
  return <em className="pf-missing">{children}</em>
}

function Table({ head, children, label }) {
  return (
    <div className="pf-table-wrap">
      <table className="pf-table" aria-label={label}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Part({ no, title, status, children }) {
  const id = `pf-h-${no}`
  return (
    <section className="pf-part" aria-labelledby={id}>
      <h3 id={id}>
        <span className="pf-no">{no}</span>
        {title}
        <Status status={status} />
      </h3>
      {children}
    </section>
  )
}

function Empty({ children }) {
  return <p className="pf-empty">{children}</p>
}

const yesNo = (done) => (done ? <span className="pf-ok">Selesai</span> : <Missing>belum selesai</Missing>)

// ---------- Gambar dari kamera ----------
// pics(slot) mengembalikan { src, title, note } atau null bila gambarnya tidak ada atau tidak disertakan.
// Slot yang tidak punya gambar dilewati. Bila tidak ada satu pun, tidak ada yang ditampilkan.
function Figures({ label, slots, pics, cols = 3, caption }) {
  const list = slots.map((slot) => ({ slot, p: pics(slot) })).filter((x) => x.p)
  if (!list.length) return null
  return (
    <div className="pf-gallery">
      {label && <h5>{label}</h5>}
      <div className={`pf-figs pf-figs--${cols}`}>
        {list.map(({ slot, p }) => (
          <figure key={slot} className="pf-fig">
            <img src={p.src} alt={`Gambar dari kamera: ${p.title}`} />
            <figcaption>{caption ? caption(slot, p) : p.note || p.title}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

// Gambar saat pengujian (sebelum) disandingkan dengan gambar sesudah penyetelan, tiap kondisi satu baris.
function BeforeAfter({ pics, rows }) {
  const list = rows.map((r, i) => ({ label: r.label, before: pics(TEST_SLOTS[i]), after: pics(OPT_SLOTS[i]) })).filter((r) => r.after)
  if (!list.length) return null
  return (
    <div className="pf-gallery">
      <h5>Gambar dari webcam: sebelum dan sesudah penyetelan</h5>
      <div className="pf-figs pf-figs--2">
        {list.flatMap((r) => [
          r.before ? (
            <figure key={`${r.label}-b`} className="pf-fig">
              <img src={r.before.src} alt={`Gambar dari kamera: ${r.label}, sebelum penyetelan`} />
              <figcaption>Sebelum: {r.label}</figcaption>
            </figure>
          ) : (
            <figure key={`${r.label}-b`} className="pf-fig pf-fig--none">
              <figcaption>Sebelum: {r.label}. Gambar saat pengujian belum diambil.</figcaption>
            </figure>
          ),
          <figure key={`${r.label}-a`} className="pf-fig">
            <img src={r.after.src} alt={`Gambar dari kamera: ${r.label}, sesudah penyetelan`} />
            <figcaption>Sesudah: {r.label}</figcaption>
          </figure>,
        ])}
      </div>
    </div>
  )
}

function photoLine(foto) {
  if (!foto) return null
  if (foto.stored === 0) return 'Gambar dari kamera: belum ada gambar yang diambil.'
  if (!foto.included) return `Gambar dari kamera: ${foto.stored} gambar tersimpan, tidak disertakan dalam portofolio ini (pilihan siswa).`
  return `Gambar dari kamera: ${foto.items.length} gambar disertakan, tersebar pada bagian yang bersangkutan.`
}

// ---------- Bagian Virtual Lab ----------
function Workshop({ w }) {
  return (
    <>
      <p>
        Tiket selesai: <strong>{w.solved}</strong> dari {w.total}. Total kesalahan: <strong>{w.wrong}</strong>. Gambar, log, dan data pada tiket bengkel adalah simulasi.
      </p>
      <Table head={['Tiket', 'Status', 'Kesalahan']} label="Tiket bengkel">
        {w.tickets.map((t) => (
          <tr key={t.title}>
            <td>{t.title}</td>
            <td>{t.solved ? <span className="pf-ok">Selesai</span> : <Missing>belum dikerjakan</Missing>}</td>
            <td>{t.solved ? t.wrong : '-'}</td>
          </tr>
        ))}
      </Table>
    </>
  )
}

function Detection({ d }) {
  return (
    <>
      <p>
        Contoh yang diajarkan ke model: kubus target <strong>{d.target}</strong>, bukan target <strong>{d.bukan}</strong>.
      </p>
      <Table head={['Kasus', 'Sebelum perbaikan', 'Perbaikan dicoba', 'Sesudah perbaikan']} label="Praktik empat kasus">
        {d.cases.map((c) => (
          <tr key={c.title}>
            <td>{c.title}</td>
            <td>{c.before || <Missing>-</Missing>}</td>
            <td>{c.fixed ? 'Ya' : <Missing>belum</Missing>}</td>
            <td>{c.after || <Missing>-</Missing>}</td>
          </tr>
        ))}
      </Table>
    </>
  )
}

function Mission({ m }) {
  return (
    <Table head={['Kondisi', 'Keputusan yang benar', 'Hasil catatan', 'Status']} label="Catatan misi">
      {m.rows.map((r) => (
        <tr key={r.label}>
          <td>{r.label}</td>
          <td>{r.expect}</td>
          <td>{r.got || <Missing>belum dicatat</Missing>}</td>
          <td>{r.ok == null ? '-' : r.ok ? <span className="pf-ok">Sesuai</span> : <span className="pf-bad">Belum sesuai</span>}</td>
        </tr>
      ))}
    </Table>
  )
}

function Stage({ stage, pics }) {
  const missionCaption = (slot, p) => {
    const r = stage.mission && stage.mission.rows[MISSION_SLOTS.indexOf(slot)]
    if (!r) return p.note || p.title
    return `${r.label}${r.ok == null ? '' : r.ok ? ': sesuai' : ': belum sesuai'}`
  }
  const filterCaption = (slot, p) => `${p.note || p.title} (kiri: gambar asli, kanan: hasil)`
  return (
    <div className="pf-stage">
      <h5>
        Tahap {stage.title}: {yesNo(stage.done)}
      </h5>
      {stage.workshop && <Workshop w={stage.workshop} />}
      {stage.detection && <Detection d={stage.detection} />}
      {stage.mission && <Mission m={stage.mission} />}
      {stage.see && <p className="pf-note">Hasil rinci ada pada bagian {stage.see}.</p>}
      {stage.id === 'olah' && <Figures label="Gambar dari webcam: pengolahan citra" slots={FILTER_SLOTS} pics={pics} cols={2} caption={filterCaption} />}
      {stage.id === 'deteksi' && <Figures label="Gambar dari webcam: deteksi objek" slots={DETECT_SLOTS} pics={pics} cols={2} />}
      {stage.id === 'misi' && <Figures label="Gambar dari webcam: kondisi misi" slots={MISSION_SLOTS} pics={pics} cols={3} caption={missionCaption} />}
    </div>
  )
}

function Webcam({ w, pics }) {
  const status = w.done ? 'Lengkap' : w.measured || w.decision ? 'Sebagian' : 'Belum dikerjakan'
  const mark = { ok: '✓ terpenuhi', fail: '✗ belum terpenuhi', unknown: 'belum diketahui' }
  return (
    <div className="pf-lab">
      <h4>
        Webcam yang dipakai (praktik pada materi Camera) <Status status={status} />
      </h4>
      <Figures slots={['webcam']} pics={pics} cols={3} caption={(slot, p) => p.note || 'Gambar dari webcam yang dipakai'} />
      {!w.measured && !w.decision && w.datasheet.every(([, v]) => !v) ? (
        <Empty>Webcam belum diukur dan datasheet belum diisi.</Empty>
      ) : (
        <>
          <Table head={['Data', 'Isi']} label="Webcam yang dipakai">
            <tr>
              <td>Hasil pengukuran</td>
              <td>
                {w.measured ? (
                  <>
                    {w.measured.label || 'kamera tanpa nama'}, {w.measured.width} × {w.measured.height}, sekitar {w.measured.fps} FPS
                  </>
                ) : (
                  <Missing>belum diukur</Missing>
                )}
              </td>
            </tr>
            {w.datasheet.map(([k, v]) => (
              <tr key={k}>
                <td>Datasheet: {k}</td>
                <td>{v || <Missing>belum dipilih</Missing>}</td>
              </tr>
            ))}
            {w.needs.map((n) => (
              <tr key={n.label}>
                <td>Kebutuhan misi</td>
                <td>
                  {n.label}: {mark[n.status]}
                </td>
              </tr>
            ))}
            <tr>
              <td>Keputusan siswa</td>
              <td>
                {w.decision ? (
                  <>
                    {w.decision}
                    {w.decisionRight == null ? '' : w.decisionRight ? ' (sesuai daftar kebutuhan)' : ' (belum sesuai daftar kebutuhan)'}
                  </>
                ) : (
                  <Missing>belum diputuskan</Missing>
                )}
              </td>
            </tr>
          </Table>
        </>
      )}
    </div>
  )
}

// ---------- Bagian Testing, Analysis, Optimization ----------
function Testing({ t, pics }) {
  const testCaption = (slot, p) => {
    const r = t.rows[TEST_SLOTS.indexOf(slot)]
    if (!r || !r.tested) return p.note || p.title
    return `${r.label}: terdeteksi ${pct(r.rate)}, ${r.pass ? 'lulus' : 'gagal'}`
  }
  const figs = <Figures label="Gambar dari webcam saat pengujian" slots={TEST_SLOTS} pics={pics} cols={3} caption={testCaption} />
  if (t.tested === 0) {
    return (
      <>
        <Empty>Belum ada kondisi yang diuji.</Empty>
        {figs}
      </>
    )
  }
  const s = t.summary
  return (
    <>
      <p className="pf-note">
        Aturan lulus: bila kubus ada, terdeteksi pada sedikitnya {Math.round(t.passPresent * 100)}% cuplikan. Bila kubus tidak ada, terdeteksi paling banyak {Math.round(t.passAbsent * 100)}% cuplikan (alarm palsu).
      </p>
      <Table head={['Kondisi', 'Kubus target', 'Tingkat deteksi', 'Posisi x rata-rata', 'Waktu proses', 'Hasil']} label="Hasil pengujian">
        {t.rows.map((r) => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td>{r.present ? 'Ada' : 'Tidak ada'}</td>
            <td>{r.tested ? pct(r.rate) : <Missing>belum diuji</Missing>}</td>
            <td>{r.x == null ? '-' : Math.round(r.x)}</td>
            <td>{msText(r.ms)}</td>
            <td>{r.pass == null ? '-' : r.pass ? <span className="pf-ok">Lulus</span> : <span className="pf-bad">Gagal</span>}</td>
          </tr>
        ))}
      </Table>
      {s && (
        <p>
          Lulus <strong>{s.passed}</strong> dari {s.total} uji. Ketepatan keputusan <strong>{pct(s.accuracy)}</strong>. Alarm palsu rata-rata {pct(s.falseAlarm)}.
          {s.ms != null && (
            <>
              {' '}
              Waktu proses rata-rata {msText(s.ms)}; satu frame kamera 30 FPS berlangsung sekitar {t.frameBudgetMs} ms, jadi waktu proses {s.ms <= t.frameBudgetMs ? 'masih' : 'sudah'}{' '}
              {s.ms <= t.frameBudgetMs ? 'di bawah' : 'melewati'} batas itu.
            </>
          )}
          {s.weakest && <> Kondisi paling lemah: {s.weakest}.</>}
        </p>
      )}
      {t.tested < t.total && <p className="pf-note">{t.total - t.tested} kondisi belum diuji.</p>}
      {figs}
    </>
  )
}

function Analysis({ a, pics }) {
  const figs = <Figures label="Gambar dari webcam saat analisis" slots={ANALYSIS_SLOTS} pics={pics} cols={3} />
  if (a.analyzed === 0 && !a.factor.choice) {
    return (
      <>
        <Empty>Belum ada kondisi yang dianalisis.</Empty>
        {figs}
      </>
    )
  }
  const f = a.factor
  return (
    <>
      {a.analyzed > 0 && (
        <Table head={['Kondisi', 'Dugaan penyebab', 'Bukti dari data', 'Hasil periksa']} label="Hasil analisis penyebab">
          {a.rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td>{r.hypothesis}</td>
              <td>{r.evidence || '-'}</td>
              <td>{r.verdict}</td>
            </tr>
          ))}
        </Table>
      )}
      <p className="pf-note">
        Kondisi dianalisis: {a.analyzed} dari {a.total}.
      </p>
      {f.choice ? (
        <p>
          Faktor yang menurut siswa paling memengaruhi keberhasilan deteksi: <strong>{f.choice}</strong>.
          {f.strongest && (
            <>
              {' '}
              Selisih tingkat deteksi karena jarak {f.byDistance} poin, karena cahaya {f.byLight} poin.{' '}
              {f.supported
                ? 'Data mendukung jawaban ini.'
                : f.strongest === 'Pengaruhnya hampir sama'
                  ? 'Data menunjukkan pengaruh keduanya hampir sama.'
                  : `Data lebih menunjuk ke ${f.strongest.toLowerCase()}.`}
            </>
          )}
        </p>
      ) : (
        <p>
          Faktor yang paling berpengaruh: <Missing>belum dipilih</Missing>.
        </p>
      )}
      {figs}
    </>
  )
}

function Optimization({ o, pics }) {
  const figs = <BeforeAfter pics={pics} rows={o.rows} />
  if (o.recorded === 0) {
    return (
      <>
        <Empty>Belum ada kondisi yang direkam ulang.</Empty>
        {figs}
      </>
    )
  }
  const s = o.summary
  return (
    <>
      {s && (
        <p>
          Sesudah perbaikan: lulus <strong>{s.after.passed}</strong> dari {s.after.total} uji, ketepatan keputusan <strong>{pct(s.after.accuracy)}</strong>
          {s.before ? ` (sebelum: lulus ${s.before.passed} dari ${s.before.total}, ketepatan ${pct(s.before.accuracy)})` : ''}.
        </p>
      )}
      {o.settings && (
        <p>
          Warna target: {o.settings.color || '-'}. Yang diubah: {o.settings.changes.length ? o.settings.changes.join('; ') : 'pengaturan bawaan'}.
          {o.settings.consistent === false && ' Catatan: tidak semua kondisi direkam dengan pengaturan yang sama.'}
        </p>
      )}
      <Table head={['Kondisi', 'Deteksi sebelum', 'Deteksi sesudah', 'Waktu proses (sebelum → sesudah)', 'Hasil (sebelum → sesudah)']} label="Sebelum dan sesudah optimasi">
        {o.rows.map((r) => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td>{r.before ? pct(r.before.rate) : '-'}</td>
            <td>{r.after ? pct(r.after.rate) : <Missing>belum direkam</Missing>}</td>
            <td>{r.before && r.after ? `${msText(r.before.ms)} → ${msText(r.after.ms)}` : '-'}</td>
            <td>{r.before && r.after ? `${r.before.pass ? 'Lulus' : 'Gagal'} → ${r.after.pass ? 'Lulus' : 'Gagal'}` : '-'}</td>
          </tr>
        ))}
      </Table>
      {o.better.length > 0 && <p>Kondisi yang membaik: {o.better.join(', ')}.</p>}
      {o.worse.length > 0 && <p>Kondisi yang memburuk (harga dari perbaikan): {o.worse.join(', ')}.</p>}
      {o.recorded < o.total && <p className="pf-note">{o.total - o.recorded} kondisi belum direkam ulang.</p>}
      {figs}
    </>
  )
}

// ---------- Dokumen ----------
// images: { slot: dataUrl }, diambil saat portofolio dibuat, jadi dokumen tidak berubah bila gambar di lab diganti.
export default function PortfolioDocument({ data, at, images, headingRef }) {
  const id = data.identitas
  const no = Object.fromEntries(data.sections.map((s, i) => [s.id, i + 1]))
  const lab = data.lab
  const meta = Object.fromEntries((data.foto && Array.isArray(data.foto.items) ? data.foto.items : []).map((i) => [i.slot, i]))
  const pics = (slot) => (meta[slot] && images && images[slot] ? { ...meta[slot], src: images[slot] } : null)
  const todoBySection = data.sections
    .map((s) => ({ section: s, items: data.todo.filter((t) => t.section === s.id) }))
    .filter((g) => g.items.length)

  return (
    <article className="pf-doc" aria-labelledby="pf-title">
      <header className="pf-head">
        <p className="pf-kicker">Interactive Computer Vision Laboratory</p>
        <h2 id="pf-title" tabIndex={-1} ref={headingRef}>
          Portofolio Hasil Belajar
        </h2>
        <p className="pf-sub">Computer Vision pada Autonomous Mobile Robot</p>
        <p className="pf-meta">
          Dibuat {formatWhen(at)}. Akun {id.username}.
        </p>
      </header>

      {!data.complete && (
        <p className="pf-notice" role="note">
          <strong>Catatan:</strong> portofolio ini dibuat saat sebagian pekerjaan belum selesai ({data.completeCount} dari {data.sections.length} bagian lengkap). Bagian yang belum dikerjakan
          ditandai dan dirinci pada Ringkasan Kelengkapan.
        </p>
      )}

      <Part no={no.identitas} title="Identitas Siswa" status={id.status}>
        {id.unreadable ? (
          <Empty>{data.identitas.line}.</Empty>
        ) : (
          <dl className="pf-dl">
            <div>
              <dt>Nama</dt>
              <dd>{id.nama || <Missing>belum diisi</Missing>}</dd>
            </div>
            <div>
              <dt>NIS</dt>
              <dd>{id.nis || <Missing>belum diisi</Missing>}</dd>
            </div>
            <div>
              <dt>Kelas</dt>
              <dd>{id.kelas || <Missing>belum diisi</Missing>}</dd>
            </div>
            <div>
              <dt>Akun</dt>
              <dd>{id.username}</dd>
            </div>
            <div>
              <dt>Program Keahlian</dt>
              <dd>{id.program}</dd>
            </div>
            <div>
              <dt>Konsentrasi</dt>
              <dd>{id.konsentrasi}</dd>
            </div>
          </dl>
        )}
      </Part>

      <section className="pf-part pf-summary" aria-labelledby="pf-h-ringkasan">
        <h3 id="pf-h-ringkasan">Ringkasan Kelengkapan</h3>
        <p>
          Progres belajar keseluruhan <strong>{data.progress.overall ?? 0}%</strong>. Bagian yang sudah lengkap: <strong>{data.completeCount}</strong> dari {data.sections.length}.
        </p>
        <Table head={['Bagian', 'Status', 'Isi singkat']} label="Status tiap bagian">
          {data.sections.map((s) => (
            <tr key={s.id}>
              <td>
                {no[s.id]}. {s.title}
              </td>
              <td>
                <Status status={s.status} />
              </td>
              <td>{s.line}</td>
            </tr>
          ))}
        </Table>
        {photoLine(data.foto) && <p className="pf-note">{photoLine(data.foto)}</p>}
        {todoBySection.length > 0 ? (
          <>
            <h4>Yang belum dikerjakan saat portofolio dibuat</h4>
            {todoBySection.map((g) => (
              <div key={g.section.id} className="pf-todo">
                <p className="pf-todo__title">
                  {no[g.section.id]}. {g.section.title}
                </p>
                <ul>
                  {g.items.map((t) => (
                    <li key={t.text}>
                      <Link to={t.to} className="pf-todo__link">
                        {t.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        ) : (
          <p className="pf-ok">Semua bagian sudah lengkap.</p>
        )}
      </section>

      <Part no={no.progress} title="Progres Belajar" status={data.progress.status}>
        {data.progress.unreadable ? (
          <Empty>{data.progress.line}.</Empty>
        ) : (
          <Table head={['Materi', 'Progres', 'Status']} label="Progres tiap materi">
            {data.progress.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>
                  <span className="pf-bar" aria-hidden="true">
                    <span style={{ width: `${r.percent}%` }} />
                  </span>
                  {r.percent}%
                </td>
                <td>{r.status}</td>
              </tr>
            ))}
          </Table>
        )}
      </Part>

      <Part no={no.quiz} title="Hasil Quiz" status={data.quiz.status}>
        {data.quiz.unreadable ? (
          <Empty>{data.quiz.line}.</Empty>
        ) : (
          <>
            <Table head={['Materi', 'Kegiatan', 'Jawaban benar', 'Sudah dijawab']} label="Hasil cek pemahaman">
              {data.quiz.rows.map((r) => (
                <tr key={`${r.module}-${r.name}`}>
                  <td>{r.module}</td>
                  <td>{r.name}</td>
                  <td>{r.total == null || r.answered === 0 ? <Missing>belum dikerjakan</Missing> : `${r.correct} dari ${r.total}`}</td>
                  <td>{r.total == null ? '-' : `${r.answered} dari ${r.total}`}</td>
                </tr>
              ))}
            </Table>
            <p className="pf-note">Soal berupa pilihan. Siswa boleh mengganti jawaban, jadi angka ini adalah keadaan terakhir.</p>
          </>
        )}
      </Part>

      <Part no={no.lab} title="Hasil Virtual Lab" status={lab.status}>
        {lab.unreadable ? (
          <Empty>{lab.line}.</Empty>
        ) : (
          <>
            <p>
              Tahap lab yang selesai: <strong>{lab.doneStages}</strong> dari {lab.totalStages}.
            </p>
            {lab.labs.map((l) => (
              <div key={l.id} className="pf-lab">
                <h4>
                  {l.title} <Status status={l.status} />
                </h4>
                {l.stages.map((s) => (
                  <Stage key={s.id} stage={s} pics={pics} />
                ))}
              </div>
            ))}
            <Webcam w={lab.webcam} pics={pics} />
          </>
        )}
      </Part>

      <Part no={no.testing} title="Hasil Testing" status={data.testing.status}>
        {data.testing.unreadable ? <Empty>{data.testing.line}.</Empty> : <Testing t={data.testing} pics={pics} />}
      </Part>

      <Part no={no.analysis} title="Hasil Analysis" status={data.analysis.status}>
        {data.analysis.unreadable ? <Empty>{data.analysis.line}.</Empty> : <Analysis a={data.analysis} pics={pics} />}
      </Part>

      <Part no={no.optimization} title="Hasil Optimization" status={data.optimization.status}>
        {data.optimization.unreadable ? <Empty>{data.optimization.line}.</Empty> : <Optimization o={data.optimization} pics={pics} />}
      </Part>

      <Part no={no.refleksi} title="Refleksi" status={data.refleksi.status}>
        {data.refleksi.unreadable ? (
          <Empty>{data.refleksi.line}.</Empty>
        ) : (
          data.refleksi.units.map((u) => (
            <div key={u.title} className="pf-refl">
              <h4>
                {u.title} <Status status={u.status} />
              </h4>
              {u.answered > 0 && !u.saved && <p className="pf-note">Draf: refleksi ini belum disimpan oleh siswa.</p>}
              {u.items.map((i) => (
                <div key={i.question} className="pf-qa">
                  <p className="pf-q">{i.question}</p>
                  <p className="pf-a">{i.answer || <Missing>belum dijawab</Missing>}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </Part>

      <footer className="pf-foot">
        Dibuat otomatis dari data belajar di browser siswa. Hasil pengujian, analisis, dan optimasi berasal dari rekaman webcam siswa sendiri, begitu juga gambar dari kamera yang
        disertakan. Gambar, log, dan data pada tiket bengkel adalah simulasi.
      </footer>
    </article>
  )
}
