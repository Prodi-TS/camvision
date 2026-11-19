import { NavLink } from 'react-router-dom'
import Icon from './Icon.jsx'
import { learningModules, labs, labOfModule } from '../data/learningData.js'

function NavItem({ to, icon, end = false, sub = false, sub2 = false, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-link${sub ? ' nav-link--sub' : ''}${sub2 ? ' nav-link--sub2' : ''}${isActive ? ' is-active' : ''}`
      }
    >
      {icon && <Icon name={icon} size={18} />}
      <span>{children}</span>
    </NavLink>
  )
}

// Susunan menu Pembelajaran: materi yang labnya hanya satu berdiri sendiri,
// materi yang berbagi lab induk dikelompokkan di bawah nama lab itu.
const LEARNING_TREE = (() => {
  const tree = []
  learningModules.forEach((m) => {
    const info = labOfModule(m.id)
    const same = info ? learningModules.filter((x) => labOfModule(x.id)?.lab.id === info.lab.id) : [m]
    if (same.length <= 1) {
      tree.push(m)
      return
    }
    if (same[0].id === m.id) tree.push({ label: info.lab.shortTitle, children: same })
  })
  return tree
})()

export default function Sidebar({ open, onClose }) {
  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Navigasi utama">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Icon name="eye" size={22} />
        </div>
        <div>
          <div className="sidebar__brand-title">Lab Maya</div>
          <div className="sidebar__brand-sub">Penglihatan Robot</div>
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
        <div className="nav-group nav-group--first">
          <NavItem to="/" icon="dashboard" end>
            Dashboard
          </NavItem>
          <NavItem to="/profil" sub>
            Profil
          </NavItem>
          <NavItem to="/hasil" sub>
            Hasil Saya
          </NavItem>
        </div>

        <div className="nav-group">
          <NavItem to="/pembelajaran" icon="book" end>
            Pembelajaran
          </NavItem>
          {LEARNING_TREE.map((node) =>
            node.children ? (
              <div key={node.label} className="nav-branch">
                <div className="nav-branch__label">{node.label}</div>
                {node.children.map((m) => (
                  <NavItem key={m.id} to={`/pembelajaran/${m.id}`} sub2>
                    {m.navTitle || m.title}
                  </NavItem>
                ))}
              </div>
            ) : (
              <NavItem key={node.id} to={`/pembelajaran/${node.id}`} sub>
                {node.navTitle || node.title}
              </NavItem>
            ),
          )}
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

        <NavItem to="/quiz" icon="help">
          Quiz
        </NavItem>
        <NavItem to="/portofolio" icon="folder">
          Portofolio
        </NavItem>
      </nav>
    </aside>
  )
}
