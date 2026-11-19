export default function Card({ children, className = '', as: Tag = 'div' }) {
  return <Tag className={`card ${className}`}>{children}</Tag>
}
