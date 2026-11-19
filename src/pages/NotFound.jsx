import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function NotFound({ backTo = '/', backLabel = 'Kembali ke Dashboard' }) {
  return (
    <div className="page">
      <PageHeader
        title="Halaman tidak ditemukan"
        description="Alamat yang kamu buka tidak tersedia. Pilih menu di sebelah kiri atau kembali ke halaman awal."
      />
      <Card>
        <Button to={backTo}>{backLabel}</Button>
      </Card>
    </div>
  )
}
