// Panel "Sebelum mulai" untuk semua lab yang memakai webcam.
export default function PreflightPanel() {
  return (
    <details className="note-box" style={{ marginBottom: 14 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Sebelum mulai: siapkan kamera</summary>
      <ol style={{ margin: '8px 0 0', paddingLeft: 20, display: 'grid', gap: 4 }}>
        <li>Colokkan webcam USB eksternal, lalu buka halaman ini lewat <code>localhost</code> atau HTTPS (kamera tidak bisa dipakai lewat alamat biasa).</li>
        <li>Saat browser meminta izin, pilih <strong>Izinkan</strong> (Allow).</li>
        <li>Pilih webcam eksternal pada daftar kamera, bukan kamera bawaan laptop.</li>
        <li>Pastikan tidak ada aplikasi lain yang sedang memakai kamera.</li>
      </ol>
    </details>
  )
}
