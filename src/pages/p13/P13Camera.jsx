import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../auth.jsx'
import { saveProgress } from '../../data/progressStore.js'
import CameraExplorerLab from '../labs/camera-explorer/CameraExplorerLab.jsx'
import DatasheetChallenge from './DatasheetChallenge.jsx'
import CameraVsLidar from './CameraVsLidar.jsx'
import Reflection from './Reflection.jsx'
import OwnCamera from './OwnCamera.jsx'
import useP13State from './useP13State.js'
import {
  TP_CODE,
  TUJUAN,
  PERTANYAAN_PEMANTIK,
  KESIMPULAN,
  CHARACTERISTICS,
  getActivities,
} from './p13Data.js'
import './p13.css'

function SectionHead({ title, badge, level: Heading = 'h2', children }) {
  return (
    <div className="section-head">
      <div>
        <Heading>{title}</Heading>
        {children && <p>{children}</p>}
      </div>
      {badge && <span className="badge badge--info">{badge}</span>}
    </div>
  )
}

// Nomor penanda pada gambar webcam, sesuai nomor di kartu karakteristik.
const CHAR_NO = { Resolution: 1, FPS: 2, 'Field of View (FOV)': 3, Interface: 4 }

// Bagian kamera yang menentukan tiap karakteristik (ditampilkan di kartu).
const CHAR_PART = {
  Resolution: 'sensor gambar di balik lensa',
  FPS: 'sensor dan rangkaian elektronik di badan kamera',
  'Field of View (FOV)': 'lensa',
  Interface: 'kabel dan colokan USB',
}

const MARK = '#0d7a94'

function Marker({ x, y, no }) {
  return (
    <g>
      <circle cx={x} cy={y} r="9" fill={MARK} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        fill="#ffffff"
      >
        {no}
      </text>
    </g>
  )
}

function Leader({ x1, y1, x2, y2 }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={MARK} strokeWidth="1.5" />
      <circle cx={x2} cy={y2} r="2.5" fill={MARK} />
    </g>
  )
}

// Ilustrasi webcam dengan empat penanda karakteristik.
// Warna garis mengikuti warna teks halaman.
function CameraParts() {
  return (
    <svg
      viewBox="0 0 240 210"
      role="img"
      aria-label="Ilustrasi webcam USB dengan empat penanda karakteristik"
      style={{ width: '100%', height: 'auto' }}
    >
      {/* kabel dan colokan USB */}
      <path
        d="M120 168 C120 194 160 196 176 190"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="176" y="183" width="24" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
      {/* dudukan */}
      <rect x="110" y="132" width="20" height="22" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="3" />
      <rect x="68" y="152" width="104" height="16" rx="8" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="3" />
      {/* badan kamera */}
      <rect x="36" y="30" width="168" height="106" rx="24" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="3" />
      {/* lensa */}
      <circle cx="120" cy="83" r="36" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="120" cy="83" r="26" fill="#102a43" />
      <circle cx="120" cy="83" r="14" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="111" cy="74" r="5" fill="#ffffff" fillOpacity="0.55" />
      {/* lampu indikator dan mikrofon */}
      <circle cx="178" cy="52" r="4.5" fill="#22c3de" />
      <circle cx="62" cy="52" r="2.5" fill="currentColor" fillOpacity="0.5" />
      <circle cx="62" cy="62" r="2.5" fill="currentColor" fillOpacity="0.5" />

      {/* penanda karakteristik */}
      <Leader x1={120} y1={21} x2={120} y2={50} />
      <Marker x={120} y={12} no={1} />
      <Leader x1={25} y1={100} x2={54} y2={100} />
      <Marker x={16} y={100} no={2} />
      <Leader x1={215} y1={110} x2={152} y2={100} />
      <Marker x={224} y={110} no={3} />
      <Leader x1={213} y1={190} x2={199} y2={190} />
      <Marker x={222} y={190} no={4} />
    </svg>
  )
}

export default function P13Camera() {
  const { user } = useAuth()
  const { state, update } = useP13State(user.username)
  const [thought, setThought] = useState(false)

  // Camera Explorer lama sudah dihapus (digantikan Mission 01), jadi aktivitasnya
  // tidak dihitung lagi di progress P13.
  const activities = getActivities(state).filter(
    (a) => !/explor/i.test(`${a.id} ${a.label}`)
  )
  const doneCount = activities.filter((a) => a.done).length
  const percent = Math.round((doneCount / activities.length) * 100)
  const status = percent === 0 ? 'Belum dimulai' : percent === 100 ? 'Selesai' : 'Sedang dipelajari'

  useEffect(() => {
    saveProgress(user.username, 'p13', percent)
  }, [user.username, percent])

  return (
    <div className="page p13">
      {/* 1. Header */}
      <div className="p13__top">
        <PageHeader
          title="Camera"
          description="Memahami kamera sebagai sensor visual pada Autonomous Mobile Robot."
          icon="camera"
          status={status}
        />
        <div className="p13__tp">
          <span className="badge badge--info">TP {TP_CODE}</span>
        </div>
      </div>

      {/* 2. Tujuan Pembelajaran */}
      <Card className="goal">
        <h2>Tujuan Pembelajaran</h2>
        <p>{TUJUAN}</p>
      </Card>

      {/* 3. Pertanyaan Pemantik */}
      <Card className="thinking card--accent">
        <h2>Pertanyaan Pemantik</h2>
        <blockquote>{PERTANYAAN_PEMANTIK}</blockquote>
        <p>Pikirkan dulu jawabanmu sebelum membaca materi. Tidak perlu ditulis.</p>
        {!thought ? (
          <Button onClick={() => setThought(true)}>Saya sudah memikirkannya</Button>
        ) : (
          <p className="thinking__after">
            Simpan pemikiranmu. Lewat materi dan aktivitas berikut, kamu akan menemukan
            jawabannya, lalu kembali ke pertanyaan ini saat Refleksi.
          </p>
        )}
      </Card>

      {/* 4. Materi singkat */}
      <section className="p13-section" aria-labelledby="materi-title">
        <div className="section-head">
          <div>
            <h2 id="materi-title">Materi Singkat</h2>
            <p>Baca secukupnya, lalu lanjut ke aktivitas.</p>
          </div>
          {state.materiDone && <StatusBadge status="Selesai" />}
        </div>

        <div className="material-grid">
          <Card>
            <h3>A. Computer Vision</h3>
            <p>
              Computer vision membuat mesin, termasuk robot, dapat memperoleh informasi dari
              citra. Pada AMR, informasi visual dari lingkungan menjadi bahan bagi sistem
              persepsi robot.
            </p>
          </Card>

          <Card>
            <h3>B. Kamera sebagai Sensor Visual</h3>
            <p>
              Kamera adalah sensor visual yang menghasilkan citra dari lingkungan. Pada AMR,
              kamera menjadi salah satu sensor persepsi, berdampingan dengan sensor navigasi
              seperti LiDAR.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>C. Karakteristik Kamera</h3>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 20px' }}>
              <div style={{ width: '100%', maxWidth: 300 }}>
                <CameraParts />
              </div>
            </div>
            <dl className="char-list">
              {CHARACTERISTICS.map((c, i) => {
                const no = CHAR_NO[c.term] ?? i + 1
                const part = CHAR_PART[c.term]
                return (
                  <div key={c.term} className="char-list__row">
                    <dt>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          marginRight: 8,
                          borderRadius: '50%',
                          background: '#0d7a94',
                          color: '#ffffff',
                          fontSize: 12,
                          fontWeight: 700,
                          verticalAlign: 'middle',
                        }}
                      >
                        {no}
                      </span>
                      {c.term}
                    </dt>
                    <dd>
                      {c.text}
                      {part && (
                        <span
                          style={{
                            display: 'block',
                            marginTop: 6,
                            opacity: 0.75,
                            fontSize: '0.9em',
                          }}
                        >
                          Pada gambar: {part}.
                        </span>
                      )}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </Card>

          <Card className="material-grid__wide">
            <h3>D. Kamera Sudah Dikenali Sistem?</h3>
            <p>
              Sebelum kamera dipakai, pastikan komputer atau robot mengenalinya. Di Linux, kamera USB
              muncul sebagai perangkat video, misalnya <code>/dev/video0</code> (kamera kedua biasanya{' '}
              <code>/dev/video1</code>). Bila tidak muncul, periksa kabel dan port USB, lalu coba port lain.
              Di browser (seperti pada lab di web ini), kamu memilih kamera dari daftar setelah memberi izin.
            </p>
            <p className="note-box">
              <strong>Padanan di ROS (hanya informasi):</strong> node kamera membuka perangkat video itu
              lalu menerbitkan gambarnya sebagai topik, misalnya <code>/image_raw</code>.
            </p>
          </Card>

          <Card className="material-grid__wide">
            <h3>E. Datasheet Kamera</h3>
            <p>
              Datasheet memuat spesifikasi kamera. Dengan membacanya, kamu mengetahui
              Resolution, FPS, Field of View, Interface, dan karakteristik lainnya, lalu
              menghubungkannya dengan kebutuhan sistem AMR.
            </p>
            <p className="note-box">
              Angka pada Datasheet Challenge dan Camera Explorer berlabel DATA SIMULASI dan bukan
              spesifikasi kamera nyata. Aktivitas Webcam-mu memakai kamera milikmu yang sebenarnya.
            </p>

            {/* Datasheet Challenge (digabung ke bagian D) */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: '1px solid rgba(128, 128, 128, 0.25)',
              }}
            >
              <SectionHead title="Datasheet Challenge" badge="DATA SIMULASI" level="h4">
                Cocokkan nilai pada datasheet dengan istilahnya.
              </SectionHead>
              <DatasheetChallenge
                answers={state.datasheet}
                onAnswer={(id, term) =>
                  update((prev) => ({ datasheet: { ...prev.datasheet, [id]: term } }))
                }
              />
            </div>
          </Card>

          <Card className="material-grid__wide">
            <h3>F. Kamera dan Jarak</h3>
            <p>
              Tidak semua kamera bisa mengukur jarak. Webcam biasa hanya menghasilkan gambar berwarna. Untuk memperoleh
              jarak, ada beberapa cara, dari yang paling sederhana sampai yang paling langsung.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #9ca3af' }}>
                    <th style={{ padding: 6 }}>Jenis</th>
                    <th style={{ padding: 6 }}>Cara memperoleh jarak</th>
                    <th style={{ padding: 6 }}>Keterbatasan</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Kamera satu lensa (webcam)', 'Perkiraan dari ukuran objek di gambar. Perlu ukuran asli objek dan kalibrasi panjang fokus. Dipakai di lab AMR Vision Mission.', 'Hanya perkiraan. Salah bila ukuran objek berubah atau objeknya tidak dikenal.'],
                    ['Kamera stereo (dua lensa)', 'Dua lensa dipasang berjauhan (baseline). Objek yang sama tampak bergeser antar dua gambar (disparity). Jarak = panjang fokus × baseline ÷ disparity.', 'Butuh permukaan bertekstur. Akurasi turun cepat pada jarak jauh, dan perhitungannya berat.'],
                    ['Kamera depth RGB-D', 'Menghasilkan gambar warna dan peta jarak tiap piksel. Memakai pola cahaya inframerah (structured light), waktu pantul cahaya (time of flight), atau stereo aktif. Contoh: Intel RealSense, Orbbec, Azure Kinect.', 'Terganggu sinar matahari, permukaan mengkilap atau transparan, dan jangkauannya terbatas.'],
                    ['LiDAR (bukan kamera)', 'Pantulan laser memberi jarak langsung ke banyak titik. Tidak menghasilkan warna.', 'Tidak bisa membedakan warna atau tulisan. Harga lebih mahal.'],
                  ].map(([a, b, c]) => (
                    <tr key={a} style={{ borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                      <td style={{ padding: 6 }}><strong>{a}</strong></td>
                      <td style={{ padding: 6 }}>{b}</td>
                      <td style={{ padding: 6 }}>{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Pada AMR, aturan <strong>terlalu dekat → STOP</strong> bisa memakai jarak dari ukuran objek (webcam) atau jarak
              langsung dari kamera depth. Pilihannya bergantung pada ketelitian yang dibutuhkan, biaya, dan kondisi cahaya.
            </p>
            <p className="note-box">
              Padanan di ROS (hanya informasi): gambar warna berupa <code>sensor_msgs/Image</code>, peta jarak dari kamera depth
              berupa <code>sensor_msgs/Image</code> berisi nilai kedalaman, dan awan titik 3D berupa <code>sensor_msgs/PointCloud2</code>.
            </p>
          </Card>
        </div>

        <div className="p13-section__action">
          {state.materiDone ? (
            <span className="hint hint--ok">Materi sudah ditandai selesai dibaca.</span>
          ) : (
            <Button onClick={() => update({ materiDone: true })}>
              Saya sudah membaca materi
            </Button>
          )}
        </div>
      </section>

      {/* 5. Camera vs LiDAR */}
      <Card className="activity">
        <SectionHead title="Kamera atau LiDAR?">
          Pilih sensor yang menghasilkan informasi sesuai kebutuhan robot.
        </SectionHead>
        <CameraVsLidar
          answers={state.lidar}
          onAnswer={(id, choice) =>
            update((prev) => ({ lidar: { ...prev.lidar, [id]: choice } }))
          }
        />
      </Card>

      {/* 6. Mission 01: Camera Explorer Lab (dipindah dari halaman Virtual Lab).
          Memakai state sendiri (useLabState), terpisah dari state P13. */}
      <section className="p13-section" aria-label="Mission 01 Camera Explorer">
        <CameraExplorerLab />
      </section>

      {/* 6b. Webcam milik siswa: ukur, isi datasheet, nilai terhadap kebutuhan misi */}
      <Card className="activity">
        <SectionHead title="Webcam-mu" badge="WEBCAM USB">
          Ukur webcam yang kamu pegang, isi datasheet-nya, lalu nilai apakah cocok untuk misi AMR.
        </SectionHead>
        <OwnCamera
          value={state.ownCam}
          onChange={(patch) => update((prev) => ({ ownCam: { ...(prev.ownCam || {}), ...patch } }))}
        />
      </Card>

      {/* 7. Refleksi */}
      <Card className="activity">
        <SectionHead title="Refleksi">
          Jawab dengan kata-katamu sendiri. Kamu boleh kembali ke pertanyaan pemantik di atas.
        </SectionHead>
        <Reflection
          answers={state.reflection}
          saved={state.reflectionSaved}
          onChange={(id, value) =>
            update((prev) => ({
              reflection: { ...prev.reflection, [id]: value },
              reflectionSaved: false,
            }))
          }
          onSave={() => update({ reflectionSaved: true })}
        />
      </Card>

      {/* 8. Progres belajar */}
      <Card className="activity">
        <h2 className="card__heading">Progres belajar</h2>
        <ProgressBar value={percent} label="Progres belajar" size="lg" />
        <ul className="checklist">
          {activities.map((a) => (
            <li key={a.id} className="checklist__item">
              <span>{a.label}</span>
              <StatusBadge status={a.done ? 'Selesai' : 'Belum dimulai'} />
            </li>
          ))}
        </ul>
      </Card>

      {/* 9. Kesimpulan */}
      <Card className="conclusion">
        <h2>Kesimpulan</h2>
        <p>{KESIMPULAN}</p>
      </Card>

      {/* 10. Lanjut ke Image Processing */}
      <div className="page-actions">
        <Button to="/pembelajaran/p14">Lanjut ke Image Processing</Button>
        <Button to="/pembelajaran" variant="secondary">
          Kembali ke Pembelajaran
        </Button>
      </div>
      <p className="hint">Materi berikutnya adalah akuisisi dan pengolahan citra digital.</p>
    </div>
  )
}
