import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useAuth } from '../auth.jsx'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__menu"
        onClick={onMenuClick}
        aria-label="Buka menu navigasi"
      >
        <Icon name="menu" size={22} />
      </button>
      <div className="topbar__title">Interactive Computer Vision Laboratory</div>
      <Link to="/profil" className="topbar__user" aria-label="Buka profil">
        <span className="topbar__avatar">
          <Icon name="user" size={16} />
        </span>
        <span className="topbar__name">{user.username}</span>
        {user.role === 'Admin' && <span className="badge badge--active">Admin</span>}
      </Link>
      <button type="button" className="topbar__logout" onClick={logout}>
        Keluar
      </button>
    </header>
  )
}
