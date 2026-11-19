// Tiket Bengkel Kamera (P13). Semua data dan log adalah SIMULASI.

export const CAMERA_WORKSHOP = {
  title: 'Camera Explorer',
  description: 'Bengkel teknisi: robot AMR bermasalah dengan kameranya. Periksa, tentukan penyebab, lalu perbaiki.',
  storageKey: 'cv-amr-lab-camera-workshop',
  intro:
    'Kamu teknisi di bengkel robot. Setiap tiket adalah satu robot yang kameranya bermasalah. Periksa dulu, baru tentukan penyebabnya, lalu pilih perbaikan yang tepat. Kebutuhan robot: kamera USB, minimal 30 FPS, FOV minimal 60°, resolusi minimal 1280 × 720.',
  reflectionQuestion:
    'Sebelum menentukan penyebab, pemeriksaan apa yang paling membantumu, dan mengapa pemeriksaan itu penting dilakukan dulu?',
  tickets: [
    {
      id: 'k1',
      title: 'Kamera tidak terbaca',
      scene: 'cam-nosignal',
      report: 'Operator: "Robot dinyalakan, layar kamera hitam bertuliskan NO SIGNAL. Lampu kamera tidak menyala."',
      log: ['[ERROR] usb_cam: gagal membuka /dev/video0', '[WARN] tidak ada perangkat video terdeteksi'],
      tools: [
        { id: 'wiring', label: 'Cek sambungan', result: 'Kabel USB kamera menancap di papan ROS robot expansion board. Port USB HUB expansion board kosong.' },
        { id: 'datasheet', label: 'Cek datasheet', result: 'Kamera: Interface USB 2.0, 1920 × 1080, 30 FPS, FOV 70°. Spesifikasi sesuai kebutuhan robot.' },
        { id: 'settings', label: 'Cek pengaturan', result: 'Pengaturan resolusi dan FPS normal. Daftar perangkat video kosong.' },
      ],
      diagnosis: {
        question: 'Apa penyebab kamera tidak terbaca?',
        correct: 'a',
        options: [
          { id: 'a', text: 'Kabel kamera tidak tersambung ke USB HUB expansion board.', why: 'Benar. Pada robot ini kamera harus masuk lewat USB HUB expansion board, lalu ke komputer utama.' },
          { id: 'b', text: 'FOV kamera terlalu sempit.', why: 'Belum tepat. FOV memengaruhi luas pandang, bukan terbaca atau tidaknya kamera. Datasheet menunjukkan FOV 70°, sudah cukup.' },
          { id: 'c', text: 'Resolusi kamera terlalu rendah.', why: 'Belum tepat. Resolusi 1920 × 1080 sudah memenuhi kebutuhan, dan masalahnya kamera tidak terbaca sama sekali.' },
        ],
      },
      fix: {
        question: 'Perbaikan apa yang kamu lakukan?',
        correct: 'a',
        options: [
          { id: 'a', text: 'Pindahkan kabel kamera ke port USB HUB expansion board.', why: 'Benar. Kamera sekarang menuju hub, lalu ke komputer utama.' },
          { id: 'b', text: 'Naikkan FPS kamera menjadi 60.', why: 'Belum tepat. FPS tidak bisa dinaikkan bila kamera tidak terbaca.' },
          { id: 'c', text: 'Ganti lensa dengan yang lebih lebar.', why: 'Belum tepat. Lensa tidak berhubungan dengan sambungan kabel.' },
        ],
      },
      success: 'Layar kamera menyala. Robot kembali melihat meja kerja.',
    },
    {
      id: 'k2',
      title: 'Video patah-patah',
      scene: 'cam-stutter',
      report: 'Operator: "Gambar kamera tersendat. Kubus yang bergerak meninggalkan bayangan dan robot sering terlambat bereaksi."',
      log: ['[INFO] usb_cam: frame rate terukur 8 FPS', '[WARN] terlambat memproses frame'],
      tools: [
        { id: 'wiring', label: 'Cek sambungan', result: 'Kabel kamera tersambung dengan benar ke USB HUB expansion board. Tidak ada kabel longgar.' },
        { id: 'datasheet', label: 'Cek datasheet', result: 'Kamera: USB 2.0, 1920 × 1080, FPS maksimum 15, FOV 70°. Kebutuhan robot: minimal 30 FPS.' },
        { id: 'settings', label: 'Cek pengaturan', result: 'Resolusi 1920 × 1080. FPS terukur 8 sampai 10.' },
      ],
      diagnosis: {
        question: 'Apa penyebab video patah-patah?',
        correct: 'b',
        options: [
          { id: 'a', text: 'Kabel kamera putus atau longgar.', why: 'Belum tepat. Hasil cek sambungan menunjukkan kabel tersambung dengan benar, dan gambar tetap muncul.' },
          { id: 'b', text: 'FPS kamera di bawah kebutuhan robot.', why: 'Benar. Kamera hanya sanggup 15 FPS, sedangkan robot butuh minimal 30 FPS.' },
          { id: 'c', text: 'FOV kamera terlalu sempit.', why: 'Belum tepat. FOV memengaruhi luas pandang, bukan kelancaran gambar.' },
        ],
      },
      fix: {
        question: 'Perbaikan apa yang kamu lakukan?',
        correct: 'b',
        options: [
          { id: 'a', text: 'Ganti kabel USB dengan yang baru.', why: 'Belum tepat. Kabelnya sudah baik. Batas 15 FPS ada pada kameranya.' },
          { id: 'b', text: 'Ganti dengan kamera yang mendukung minimal 30 FPS.', why: 'Benar. Kamera baru memenuhi kebutuhan frame rate robot.' },
          { id: 'c', text: 'Pasang lensa yang lebih lebar.', why: 'Belum tepat. Lensa tidak mengubah frame rate.' },
        ],
      },
      success: 'Gambar kini mengalir lancar di 30 FPS. Kubus bergerak tanpa bayangan.',
    },
    {
      id: 'k3',
      title: 'Robot tidak melihat kubus di samping',
      scene: 'cam-narrow',
      report: 'Operator: "Robot hanya menemukan kubus yang tepat di depannya. Kubus di kiri dan kanan tidak pernah terlihat."',
      log: ['[INFO] objek terdeteksi: 1', '[INFO] area kerja berisi 3 kubus'],
      tools: [
        { id: 'wiring', label: 'Cek sambungan', result: 'Kabel kamera tersambung ke USB HUB expansion board. Gambar muncul normal.' },
        { id: 'datasheet', label: 'Cek datasheet', result: 'Kamera: USB 2.0, 1920 × 1080, 30 FPS, FOV 30°. Kebutuhan robot: FOV minimal 60°.' },
        { id: 'settings', label: 'Cek pengaturan', result: 'Resolusi dan FPS normal. Kamera menghadap lurus ke depan.' },
      ],
      diagnosis: {
        question: 'Apa penyebab kubus di samping tidak terlihat?',
        correct: 'c',
        options: [
          { id: 'a', text: 'Kabel kamera salah port.', why: 'Belum tepat. Gambar muncul normal, jadi sambungan sudah benar.' },
          { id: 'b', text: 'Resolusi kamera terlalu rendah.', why: 'Belum tepat. Resolusi 1920 × 1080 sudah cukup. Resolusi memengaruhi detail, bukan luas pandang.' },
          { id: 'c', text: 'FOV kamera terlalu sempit.', why: 'Benar. FOV 30° hanya melihat sedikit ke kiri dan kanan, sedangkan robot butuh minimal 60°.' },
        ],
      },
      fix: {
        question: 'Perbaikan apa yang kamu lakukan?',
        correct: 'a',
        options: [
          { id: 'a', text: 'Ganti dengan kamera yang FOV-nya minimal 60°.', why: 'Benar. Pandangan melebar sehingga kubus di samping ikut terlihat.' },
          { id: 'b', text: 'Naikkan FPS kamera.', why: 'Belum tepat. FPS tidak memperluas pandangan.' },
          { id: 'c', text: 'Pindahkan kabel ke port USB lain.', why: 'Belum tepat. Sambungan sudah benar dan tidak berhubungan dengan luas pandang.' },
        ],
      },
      success: 'Ketiga kubus kini berada dalam pandangan robot.',
    },
    {
      id: 'k4',
      title: 'Detail kubus tidak jelas',
      scene: 'cam-lowres',
      report: 'Operator: "Gambar kamera kasar dan kotak-kotak. Bentuk dan warna kubus sulit dibedakan dari benda lain."',
      log: ['[INFO] usb_cam: gambar 160 × 120', '[WARN] kontur objek tidak jelas'],
      tools: [
        { id: 'wiring', label: 'Cek sambungan', result: 'Kabel kamera tersambung dengan benar ke USB HUB expansion board.' },
        { id: 'datasheet', label: 'Cek datasheet', result: 'Kamera: USB 2.0, resolusi maksimum 160 × 120, 30 FPS, FOV 70°. Kebutuhan robot: minimal 1280 × 720.' },
        { id: 'settings', label: 'Cek pengaturan', result: 'Resolusi aktif 160 × 120. FPS 30, lancar.' },
      ],
      diagnosis: {
        question: 'Apa penyebab gambar kasar?',
        correct: 'b',
        options: [
          { id: 'a', text: 'FPS kamera terlalu rendah.', why: 'Belum tepat. FPS 30 sudah cukup dan gambar lancar. Masalahnya detail gambar.' },
          { id: 'b', text: 'Resolusi kamera terlalu rendah.', why: 'Benar. Resolusi 160 × 120 jauh di bawah kebutuhan 1280 × 720, jadi detail kubus hilang.' },
          { id: 'c', text: 'FOV kamera terlalu lebar.', why: 'Belum tepat. FOV 70° wajar, dan FOV tidak menentukan ketajaman detail.' },
        ],
      },
      fix: {
        question: 'Perbaikan apa yang kamu lakukan?',
        correct: 'c',
        options: [
          { id: 'a', text: 'Ganti kabel USB.', why: 'Belum tepat. Kabel tidak membatasi resolusi di kasus ini.' },
          { id: 'b', text: 'Sempitkan FOV kamera.', why: 'Belum tepat. FOV tidak menambah detail gambar.' },
          { id: 'c', text: 'Ganti dengan kamera yang resolusinya minimal 1280 × 720.', why: 'Benar. Kamera baru menghasilkan detail yang cukup untuk membedakan kubus.' },
        ],
      },
      success: 'Bentuk dan warna kubus kini jelas.',
    },
  ],
}
