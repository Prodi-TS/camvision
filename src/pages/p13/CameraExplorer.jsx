import { useState } from 'react'
import { CAMERA_PARTS } from './p13Data.js'

function Part({ id, label, active, onSelect, children }) {
  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    }
  }
  return (
    <g
      className={`cam-part${active ? ' is-active' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={active}
      onClick={() => onSelect(id)}
      onKeyDown={handleKey}
    >
      {children}
    </g>
  )
}

export default function CameraExplorer({ seen, onSeen }) {
  const [activeId, setActiveId] = useState(null)
  const active = CAMERA_PARTS.find((p) => p.id === activeId)

  function select(id) {
    setActiveId(id)
    onSeen(id)
  }

  return (
    <div className="explorer">
      <div className="explorer__figure">
        <svg
          viewBox="0 0 480 300"
          className="cam-svg"
          role="group"
          aria-label="Ilustrasi sederhana kamera dengan empat bagian yang dapat dipilih"
        >
          {/* Badan kamera (bukan bagian yang dipilih) */}
          <rect className="cam-body" x="130" y="40" width="220" height="160" rx="30" />

          {/* Mounting */}
          <Part id="mounting" label="Mounting" active={activeId === 'mounting'} onSelect={select}>
            <rect className="cam-shape cam-mount" x="215" y="198" width="50" height="38" rx="6" />
            <rect className="cam-shape cam-mount" x="150" y="234" width="180" height="24" rx="8" />
            <text className="cam-label" x="240" y="281" textAnchor="middle">
              Mounting
            </text>
          </Part>

          {/* Lens */}
          <Part id="lens" label="Lens" active={activeId === 'lens'} onSelect={select}>
            <circle className="cam-shape cam-lens-ring" cx="240" cy="118" r="54" />
            <circle className="cam-lens-mid" cx="240" cy="118" r="38" />
            <circle className="cam-lens-core" cx="240" cy="118" r="16" />
            <circle className="cam-lens-glint" cx="230" cy="108" r="5" />
            <text className="cam-label cam-label--light" x="240" y="190" textAnchor="middle">
              Lens
            </text>
          </Part>

          {/* Garis penghubung lens -> image sensor */}
          <path className="cam-link" d="M294 118 L372 105" />

          {/* Image Sensor (tampilan penampang) */}
          <Part id="sensor" label="Image Sensor" active={activeId === 'sensor'} onSelect={select}>
            <rect className="cam-shape cam-callout" x="372" y="40" width="96" height="92" rx="10" />
            <rect className="cam-chip" x="388" y="54" width="64" height="64" rx="4" />
            <path className="cam-chip-grid" d="M404 54V118 M420 54V118 M436 54V118 M388 70H452 M388 86H452 M388 102H452" />
            <text className="cam-label" x="420" y="150" textAnchor="middle">
              Image Sensor
            </text>
          </Part>

          {/* Interface */}
          <Part id="interface" label="Interface" active={activeId === 'interface'} onSelect={select}>
            <path className="cam-shape cam-cable" d="M350 175 C392 175 388 236 412 236" />
            <rect className="cam-shape cam-plug" x="412" y="223" width="52" height="26" rx="4" />
            <path className="cam-plug-pins" d="M424 232H452 M424 240H452" />
            <text className="cam-label" x="438" y="270" textAnchor="middle">
              Interface
            </text>
          </Part>
        </svg>
        <p className="explorer__hint">Pilih bagian pada gambar atau gunakan tombol di bawah.</p>
      </div>

      <div className="explorer__side">
        <div className="part-tabs" role="group" aria-label="Pilih bagian kamera">
          {CAMERA_PARTS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`part-tab${activeId === p.id ? ' is-active' : ''}${
                seen.includes(p.id) ? ' is-seen' : ''
              }`}
              aria-pressed={activeId === p.id}
              onClick={() => select(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="part-info" aria-live="polite">
          {active ? (
            <>
              <h3>{active.name}</h3>
              <dl>
                <dt>Fungsi</dt>
                <dd>{active.fungsi}</dd>
                <dt>Peran dalam sistem computer vision</dt>
                <dd>{active.peran}</dd>
              </dl>
            </>
          ) : (
            <p className="empty">Pilih salah satu bagian kamera untuk melihat penjelasannya.</p>
          )}
        </div>

        <p className="explorer__count">
          Bagian yang sudah kamu buka: <strong>{seen.length} dari {CAMERA_PARTS.length}</strong>
        </p>
      </div>
    </div>
  )
}
