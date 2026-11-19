// Ilustrasi kamera besar.
// mode "explore": nama bagian selalu tampil.
// mode "label": bagian ditandai nomor; nama tampil setelah dilabeli dengan benar.

const BADGES = {
  lens: { x: 188, y: 72, no: 1 },
  sensor: { x: 372, y: 40, no: 2 },
  interface: { x: 464, y: 223, no: 3 },
  mounting: { x: 150, y: 246, no: 4 },
}

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

export default function CameraDiagram({
  activeId = null,
  onSelect,
  mode = 'explore',
  statuses = {},
}) {
  const explore = mode === 'explore'
  const showName = (id) => explore || statuses[id] === 'ok'
  const isActive = (id) => activeId === id
  const ariaName = (id, name) => (explore ? name : `Bagian nomor ${BADGES[id].no}`)

  function badge(id) {
    if (explore) return null
    const b = BADGES[id]
    const st = statuses[id] || 'idle'
    return (
      <g className={`cam-badge cam-badge--${st}`}>
        <circle cx={b.x} cy={b.y} r="14" />
        <text x={b.x} y={b.y + 5} textAnchor="middle">
          {st === 'ok' ? '✓' : b.no}
        </text>
      </g>
    )
  }

  return (
    <svg
      viewBox="0 0 480 300"
      className={`cam-svg${explore && activeId ? ' has-active' : ''}`}
      role="group"
      aria-label="Ilustrasi kamera dengan empat bagian yang dapat dipilih"
    >
      <rect className="cam-body" x="130" y="40" width="220" height="160" rx="30" />

      <Part id="mounting" label={ariaName('mounting', 'Mounting')} active={isActive('mounting')} onSelect={onSelect}>
        <rect className="cam-shape cam-mount" x="215" y="198" width="50" height="38" rx="6" />
        <rect className="cam-shape cam-mount" x="150" y="234" width="180" height="24" rx="8" />
        {showName('mounting') && (
          <text className="cam-label" x="240" y="281" textAnchor="middle">
            Mounting
          </text>
        )}
        {badge('mounting')}
      </Part>

      <Part id="lens" label={ariaName('lens', 'Lens')} active={isActive('lens')} onSelect={onSelect}>
        <circle className="cam-shape cam-lens-ring" cx="240" cy="118" r="54" />
        <circle className="cam-lens-mid" cx="240" cy="118" r="38" />
        <circle className="cam-lens-core" cx="240" cy="118" r="16" />
        <circle className="cam-lens-glint" cx="230" cy="108" r="5" />
        {showName('lens') && (
          <text className="cam-label cam-label--light" x="240" y="190" textAnchor="middle">
            Lens
          </text>
        )}
        {badge('lens')}
      </Part>

      <path className="cam-link" d="M294 118 L372 105" />

      <Part id="sensor" label={ariaName('sensor', 'Image Sensor')} active={isActive('sensor')} onSelect={onSelect}>
        <rect className="cam-shape cam-callout" x="372" y="40" width="96" height="92" rx="10" />
        <rect className="cam-chip" x="388" y="54" width="64" height="64" rx="4" />
        <path
          className="cam-chip-grid"
          d="M404 54V118 M420 54V118 M436 54V118 M388 70H452 M388 86H452 M388 102H452"
        />
        {showName('sensor') && (
          <text className="cam-label" x="420" y="150" textAnchor="middle">
            Image Sensor
          </text>
        )}
        {badge('sensor')}
      </Part>

      <Part id="interface" label={ariaName('interface', 'Interface')} active={isActive('interface')} onSelect={onSelect}>
        <path className="cam-shape cam-cable" d="M350 175 C392 175 388 236 412 236" />
        <rect className="cam-shape cam-plug" x="412" y="223" width="52" height="26" rx="4" />
        <path className="cam-plug-pins" d="M424 232H452 M424 240H452" />
        {showName('interface') && (
          <text className="cam-label" x="438" y="270" textAnchor="middle">
            Interface
          </text>
        )}
        {badge('interface')}
      </Part>
    </svg>
  )
}
