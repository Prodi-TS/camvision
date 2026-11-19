// Tiket Bengkel Citra (P14). Semua data dan log adalah SIMULASI.

export const IMAGE_WORKSHOP = {
  title: 'Image Processing Lab',
  description: 'Bengkel teknisi: filter citra pada robot AMR bermasalah. Periksa, tentukan penyebab, lalu perbaiki.',
  storageKey: 'cv-amr-lab-image-workshop',
  intro:
    'Kamera robot sudah baik, tapi pengolahan citranya bermasalah. Setiap tiket adalah satu masalah pada hasil filter. Hasil filter (mask) menampilkan piksel yang dianggap kubus target sebagai putih. Periksa parameternya dulu, baru tentukan penyebab dan perbaikannya.',
  reflectionQuestion:
    'Dari tiket yang kamu kerjakan, parameter atau langkah pengolahan mana yang paling berpengaruh pada hasil, dan bagaimana kamu mengetahuinya?',
  tickets: [
    {
      id: 'i1',
      title: 'Kubus tidak terdeteksi saat redup',
      scene: 'img-dark',
      report: 'Operator: "Saat lampu dimatikan sebagian, robot tidak menemukan kubus merah sama sekali. Saat terang, aman."',
      log: ['[INFO] filter warna: merah', '[WARN] piksel terdeteksi: 0'],
      tools: [
        { id: 'image', label: 'Lihat gambar kamera', result: 'Gambar sangat gelap. Kubus masih terlihat kemerahan tetapi tampak gelap.' },
        { id: 'params', label: 'Lihat parameter filter', result: 'Hue 170 sampai 10 (merah), S min 100, V min 150. Kubus pada gambar redup bernilai V sekitar 80.' },
        { id: 'mask', label: 'Lihat hasil (mask)', result: 'Mask kosong. Tidak ada piksel putih.' },
      ],
      diagnosis: {
        question: 'Apa penyebab kubus tidak terdeteksi?',
        correct: 'b',
        options: [
          { id: 'a', text: 'Rentang Hue salah, bukan warna merah.', why: 'Belum tepat. Hue 170 sampai 10 memang rentang merah, dan di gambar terang filter berhasil.' },
          { id: 'b', text: 'V min terlalu tinggi untuk gambar yang redup.', why: 'Benar. Kubus bernilai V sekitar 80, tetapi filter hanya menerima V di atas 150.' },
          { id: 'c', text: 'Kamera rusak.', why: 'Belum tepat. Kamera menghasilkan gambar, hanya saja gelap.' },
        ],
      },
      fix: {
        question: 'Perbaikan apa yang kamu lakukan?',
        correct: 'a',
        options: [
          { id: 'a', text: 'Turunkan V min, misalnya menjadi sekitar 50.', why: 'Benar. Piksel kubus yang gelap kini ikut diterima.' },
          { id: 'b', text: 'Naikkan S min menjadi 250.', why: 'Belum tepat. S min yang lebih tinggi justru menyaring lebih ketat.' },
          { id: 'c', text: 'Ganti kamera.', why: 'Belum tepat. Kameranya tidak bermasalah.' },
        ],
      },
      success: 'Mask kini menampilkan kubus sebagai area putih, walaupun gambar redup.',
    },
    {
      id: 'i2',
      title: 'Banyak bintik putih kecil',
      scene: 'img-speckle',
      report: 'Operator: "Selain kubus, hasil filter penuh bintik putih kecil. Robot sering mengira bintik itu objek."',
      log: ['[INFO] komponen terdeteksi: 41', '[WARN] banyak objek berukuran sangat kecil'],
      tools: [
        { id: 'image', label: 'Lihat gambar kamera', result: 'Gambar tampak normal dengan sedikit butiran halus (noise) yang wajar pada kamera.' },
        { id: 'params', label: 'Lihat parameter filter', result: 'Hue 170 sampai 10, S min 100, V min 60. Haluskan (blur): mati. Bersihkan bintik (erode lalu dilate): mati.' },
        { id: 'mask', label: 'Lihat hasil (mask)', result: 'Kubus terdeteksi utuh, tetapi ada puluhan bintik putih kecil tersebar.' },
      ],
      diagnosis: {
        question: 'Apa penyebab bintik putih?',
        correct: 'a',
        options: [
          { id: 'a', text: 'Noise belum dibersihkan: blur dan pembersih bintik mati.', why: 'Benar. Butiran noise lolos filter warna, dan tidak ada langkah yang membuangnya.' },
          { id: 'b', text: 'Rentang Hue terlalu sempit.', why: 'Belum tepat. Kubus sudah terdeteksi utuh, dan Hue yang sempit tidak menambah bintik.' },
          { id: 'c', text: 'Resolusi kamera terlalu rendah.', why: 'Belum tepat. Resolusi rendah membuat gambar kasar, bukan bintik acak di mask.' },
        ],
      },
      fix: {
        question: 'Perbaikan apa yang kamu lakukan?',
        correct: 'c',
        options: [
          { id: 'a', text: 'Perlebar toleransi Hue.', why: 'Belum tepat. Itu justru membuat lebih banyak piksel lolos.' },
          { id: 'b', text: 'Matikan filter warna.', why: 'Belum tepat. Tanpa filter warna, robot tidak bisa memisahkan kubus dari latar.' },
          { id: 'c', text: 'Nyalakan blur, lalu bersihkan bintik (erode lalu dilate).', why: 'Benar. Blur menghaluskan noise, dan erode lalu dilate membuang bintik kecil sambil menjaga kubus.' },
        ],
      },
      success: 'Mask kini bersih. Hanya kubus yang tampak putih.',
    },
    {
      id: 'i3',
      title: 'Benda lain ikut terdeteksi',
      scene: 'img-wrong',
      report: 'Operator: "Selain kubus merah, kotak kuning di dekatnya ikut dianggap target dan robot mengambilnya."',
      log: ['[INFO] objek terdeteksi: 2', '[WARN] salah satu objek berwarna kuning'],
      tools: [
        { id: 'image', label: 'Lihat gambar kamera', result: 'Ada kubus merah dan kotak kuning di meja. Pencahayaan normal.' },
        { id: 'params', label: 'Lihat parameter filter', result: 'Hue tengah merah, toleransi Hue 35 (sangat lebar). S min 100, V min 60.' },
        { id: 'mask', label: 'Lihat hasil (mask)', result: 'Mask menampilkan dua area putih: kubus merah dan kotak kuning.' },
      ],
      diagnosis: {
        question: 'Apa penyebab kotak kuning ikut terdeteksi?',
        correct: 'c',
        options: [
          { id: 'a', text: 'Kamera menampilkan warna yang salah.', why: 'Belum tepat. Warna pada gambar kamera sudah benar: kubus merah dan kotak kuning.' },
          { id: 'b', text: 'V min terlalu rendah.', why: 'Belum tepat. V min memengaruhi terang-gelap, sedangkan yang lolos di sini berbeda jenis warna.' },
          { id: 'c', text: 'Toleransi Hue terlalu lebar sehingga warna kuning ikut diterima.', why: 'Benar. Dengan toleransi 35, rentang Hue meluas dari merah sampai ke kuning.' },
        ],
      },
      fix: {
        question: 'Perbaikan apa yang kamu lakukan?',
        correct: 'b',
        options: [
          { id: 'a', text: 'Naikkan V min.', why: 'Belum tepat. Itu menyaring berdasarkan terang-gelap, bukan jenis warna.' },
          { id: 'b', text: 'Persempit toleransi Hue, misalnya menjadi sekitar 12.', why: 'Benar. Rentang kini hanya mencakup merah, sehingga kuning tidak lolos.' },
          { id: 'c', text: 'Matikan blur.', why: 'Belum tepat. Blur tidak berhubungan dengan jenis warna yang diterima.' },
        ],
      },
      success: 'Mask kini hanya menampilkan kubus merah.',
    },
    {
      id: 'i4',
      title: 'Sisi atas kubus tidak terdeteksi',
      scene: 'img-half',
      report: 'Operator: "Hasil filter hanya menampilkan sisi depan dan samping kubus. Sisi atas yang lebih pucat tidak ikut."',
      log: ['[INFO] objek terdeteksi: 1', '[WARN] bentuk objek tidak lengkap'],
      tools: [
        { id: 'image', label: 'Lihat gambar kamera', result: 'Kubus terlihat jelas. Sisi atas tampak lebih terang dan lebih pucat dibanding sisi depan.' },
        { id: 'params', label: 'Lihat parameter filter', result: 'Hue merah, toleransi Hue 12, S min 200, V min 50. Sisi atas kubus bernilai S sekitar 176.' },
        { id: 'mask', label: 'Lihat hasil (mask)', result: 'Mask menampilkan sisi depan dan sisi samping. Area sisi atas hitam.' },
      ],
      diagnosis: {
        question: 'Apa penyebab sisi atas tidak terdeteksi?',
        correct: 'a',
        options: [
          { id: 'a', text: 'S min terlalu tinggi, sedangkan sisi atas lebih pucat.', why: 'Benar. Sisi atas bernilai S sekitar 176, tetapi filter hanya menerima S di atas 200.' },
          { id: 'b', text: 'Rentang Hue salah.', why: 'Belum tepat. Sisi depan dan samping memakai Hue yang sama dan terdeteksi.' },
          { id: 'c', text: 'V min terlalu tinggi.', why: 'Belum tepat. V min hanya 50, dan sisi atas justru paling terang.' },
        ],
      },
      fix: {
        question: 'Perbaikan apa yang kamu lakukan?',
        correct: 'b',
        options: [
          { id: 'a', text: 'Naikkan V min.', why: 'Belum tepat. V min bukan penyebabnya.' },
          { id: 'b', text: 'Turunkan S min, misalnya menjadi sekitar 120.', why: 'Benar. Sisi atas yang lebih pucat kini ikut diterima.' },
          { id: 'c', text: 'Ganti kamera.', why: 'Belum tepat. Gambarnya sudah jelas, hanya filternya terlalu ketat.' },
        ],
      },
      success: 'Mask kini menampilkan seluruh kubus, termasuk sisi atas.',
    },
  ],
}
