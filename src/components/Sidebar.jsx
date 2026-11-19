import { NavLink } from 'react-router-dom'
import Icon from './Icon.jsx'
import { learningModules, labs } from '../data/learningData.js'

function NavItem({ to, icon, end = false, sub = false, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-link${sub ? ' nav-link--sub' : ''}${isActive ? ' is-active' : ''}`
      }
    >
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Navigasi utama">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Icon name="eye" size={22} />
        </div>
        <div>
          <div className="sidebar__brand-title">Computer Vision</div>
          <div className="sidebar__brand-sub">AMR Learning Lab</div>
        </div>
        <button
          type="button"
          className="sidebar__close"
          onClick={onClose}
          aria-label="Tutup menu navigasi"
        >
          <Icon name="close" size={20} />
        </button>
      </div>

      <nav className="sidebar__nav">
        <NavItem to="/" icon="dashboard" end>
          Dashboard
        </NavItem>
        <NavItem to="/profil" icon="user">
          Profil
        </NavItem>

        <div className="nav-group">
          <NavItem to="/pembelajaran" icon="book" end>
            Pembelajaran
          </NavItem>
          {learningModules.map((m) => (
            <NavItem key={m.id} to={`/pembelajaran/${m.id}`} sub>
              {m.title}
            </NavItem>
          ))}
          <NavItem to="/quiz" sub>
            Quiz
          </NavItem>
        </div>

        <div className="nav-group">
          <NavItem to="/virtual-lab" icon="flask" end>
            Virtual Lab
          </NavItem>
          {labs.map((l) => (
            <NavItem key={l.id} to={`/virtual-lab/${l.id}`} sub>
              {l.shortTitle}
            </NavItem>
          ))}
        </div>

        <NavItem to="/hasil" icon="chart">
          Hasil Saya
        </NavItem>
        <NavItem to="/portofolio" icon="folder">
          Portofolio
        </NavItem>
      </nav>
    </aside>
  )
}
