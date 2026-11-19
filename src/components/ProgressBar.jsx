export default function ProgressBar({ value = 0, label, size = 'md' }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div className={`progress progress--${size}`}>
      {label && (
        <div className="progress__head">
          <span>{label}</span>
          <strong>{safe}%</strong>
        </div>
      )}
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div className="progress__fill" style={{ width: `${safe}%` }} />
      </div>
    </div>
  )
}
