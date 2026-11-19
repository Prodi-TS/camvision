import StatusBadge from './StatusBadge.jsx'
import Icon from './Icon.jsx'

export default function PageHeader({ title, description, code, icon, status }) {
  return (
    <header className="page-header">
      {icon && (
        <div className="page-header__icon">
          <Icon name={icon} size={26} />
        </div>
      )}
      <div className="page-header__text">
        <div className="page-header__title-row">
          {code && <span className="code-tag">{code}</span>}
          <h1>{title}</h1>
          {status && <StatusBadge status={status} />}
        </div>
        {description && <p>{description}</p>}
      </div>
    </header>
  )
}
