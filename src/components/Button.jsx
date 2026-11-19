import { Link } from 'react-router-dom'

// - Jika ada `to`, tampil sebagai link ke halaman lain.
// - Jika `disabled`, tombol nonaktif (fitur belum dibuat).
export default function Button({
  to,
  variant = 'primary',
  disabled = false,
  children,
  onClick,
  title,
}) {
  const cls = `btn btn--${variant}`
  if (to && !disabled) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button
      type="button"
      className={cls}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}
