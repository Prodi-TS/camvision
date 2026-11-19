// Tata letak lab: petunjuk praktikum di kiri, lab di kanan.
// Di layar sempit (ponsel), petunjuk tampil di atas lab.
export default function LabLayout({ guide, children }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      <aside aria-label="Petunjuk praktikum" style={{ flex: '1 1 260px', maxWidth: 360, minWidth: 0, display: 'grid', gap: 16 }}>
        {guide}
      </aside>
      <div style={{ flex: '3 1 480px', minWidth: 0, display: 'grid', gap: 16 }}>{children}</div>
    </div>
  )
}
