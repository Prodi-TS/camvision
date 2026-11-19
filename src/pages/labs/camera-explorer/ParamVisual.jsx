import { FovCone } from './CoverageView.jsx'

// Ilustrasi kecil untuk setiap parameter spesifikasi.
export default function ParamVisual({ id, value }) {
  if (id === 'res') {
    const cols = 16
    const rows = 9
    const cell = 12
    const lines = []
    for (let c = 1; c < cols; c++) lines.push(`M${c * cell} 0V${rows * cell}`)
    for (let r = 1; r < rows; r++) lines.push(`M0 ${r * cell}H${cols * cell}`)
    return (
      <svg viewBox="0 0 200 130" className="pv" role="img" aria-label="Kisi piksel pada citra">
        <g transform="translate(4 4)">
          <rect className="pv__frame" width={cols * cell} height={rows * cell} />
          <path className="pv__grid" d={lines.join(' ')} />
        </g>
        <text className="pv__text" x="100" y="124" textAnchor="middle">
          {value} piksel
        </text>
      </svg>
    )
  }

  if (id === 'fps') {
    return (
      <svg viewBox="0 0 200 130" className="pv" role="img" aria-label="Deretan frame dalam satu detik">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect className="pv__frame" x={8 + i * 37} y="26" width="30" height="40" rx="3" />
            <text className="pv__text pv__text--sm" x={23 + i * 37} y="51" textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}
        <path className="pv__axis" d="M8 86H192 M186 81L192 86L186 91" />
        <text className="pv__text" x="100" y="108" textAnchor="middle">
          1 detik
        </text>
        <text className="pv__text pv__text--sm" x="100" y="124" textAnchor="middle">
          {value} = jumlah frame per detik
        </text>
      </svg>
    )
  }

  if (id === 'fov') {
    return (
      <div className="pv pv--fov">
        <FovCone fov={78} />
      </div>
    )
  }

  return (
    <svg viewBox="0 0 200 130" className="pv" role="img" aria-label="Kamera terhubung ke sistem robot lewat kabel">
      <rect className="pv__frame" x="8" y="40" width="54" height="40" rx="6" />
      <text className="pv__text pv__text--sm" x="35" y="64" textAnchor="middle">
        Kamera
      </text>
      <path className="pv__cable" d="M62 60H138" />
      <text className="pv__text" x="100" y="50" textAnchor="middle">
        {value}
      </text>
      <rect className="pv__frame" x="138" y="32" width="54" height="56" rx="6" />
      <text className="pv__text pv__text--sm" x="165" y="56" textAnchor="middle">
        Sistem
      </text>
      <text className="pv__text pv__text--sm" x="165" y="72" textAnchor="middle">
        robot
      </text>
    </svg>
  )
}
