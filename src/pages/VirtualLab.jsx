import PageHeader from '../components/PageHeader.jsx'

// Halaman sementara. Konsep Virtual Lab akan diisi nanti.
export default function VirtualLab() {
  return (
    <div className="page">
      <PageHeader
        title="Virtual Lab"
        description="Konsep Virtual Lab akan tersedia pada tahap berikutnya."
        icon="flask"
      />
      <div className="placeholder">
        <p>Halaman ini masih kosong.</p>
      </div>
    </div>
  )
}
