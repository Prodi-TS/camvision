import { useId } from 'react'

// Kerucut FOV kecil (tampak atas), dipakai pada kartu kamera dan visual parameter.
export function FovCone({ fov, label = true }) {
  const L = 88
  const half = ((fov / 2) * Math.PI) / 180
  const dx = L * Math.sin(half)
  const dy = L * Math.cos(half)
  const x1 = 80 - dx
  const x2 = 80 + dx
  const y = 100 - dy
  return (
    <svg viewBox="0 0 160 112" className="fov-cone" role="img" aria-label={`Sudut pandang ${fov} derajat`}>
      <path className="fov-cone__area" d={`M80 100 L${x1} ${y} A${L} ${L} 0 0 1 ${x2} ${y} Z`} />
      <rect className="fov-cone__cam" x="71" y="98" width="18" height="12" rx="3" />
      {label && (
        <text className="fov-cone__text" x="80" y="82" textAnchor="middle">
          {fov}°
        </text>
      )}
    </svg>
  )
}

// Tampak atas: robot di lorong sempit. Area biru = area yang terlihat kamera.
export function CoverageView({ fov }) {
  const clipId = `cov-${useId().replace(/:/g, '')}`
  const L = 170
  const half = fov ? ((fov / 2) * Math.PI) / 180 : 0
  const ax = 160
  const ay = 182
  const dx = L * Math.sin(half)
  const dy = L * Math.cos(half)

  return (
    <svg viewBox="0 0 320 210" className="coverage" role="img"
      aria-label={fov ? `Area pandang kamera ${fov} derajat di lorong sempit` : 'Lorong sempit, belum ada kamera dipilih'}>
      <defs>
        <clipPath id={clipId}>
          <rect x="52" y="8" width="216" height="190" />
        </clipPath>
      </defs>

      <rect className="coverage__floor" x="52" y="8" width="216" height="190" />
      {fov ? (
        <path
          className="coverage__view"
          clipPath={`url(#${clipId})`}
          d={`M${ax} ${ay} L${ax - dx} ${ay - dy} A${L} ${L} 0 0 1 ${ax + dx} ${ay - dy} Z`}
        />
      ) : null}
      <rect className="coverage__wall" x="40" y="8" width="12" height="190" />
      <rect className="coverage__wall" x="268" y="8" width="12" height="190" />
      <rect className="coverage__robot" x="146" y="180" width="28" height="18" rx="4" />
      <circle className="coverage__lens" cx="160" cy="180" r="4" />
      <text className="coverage__text" x="160" y="28" textAnchor="middle">
        {fov ? `FOV ${fov}°` : 'Pilih kamera untuk melihat area pandang'}
      </text>
    </svg>
  )
}
