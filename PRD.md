# PRD: Qurban Online Patungan (qurban-online-patungan)

## Ringkasan
Aplikasi web untuk mengelola qurban sapi dengan sistem patungan: satu ekor sapi
dibagi menjadi 7 slot patungan. Peserta klaim slot, membayar dengan cicilan
3 termin, sapi disembelih sesuai jadwal, peserta mengambil daging dengan kupon
QR, dan panitia mencatat distribusi daging ke penerima (mustahik).

## Stack
- Next.js 14.2 (App Router) + TypeScript 5 (strict)
- Prisma 5.22 + SQLite (tanggal disimpan sebagai TEXT `YYYY-MM-DD`,
  jam TEXT `HH:MM`, timestamp TEXT ISO, ID `Int @id @default(autoincrement())`)
- Tailwind CSS, alias `@/*` ke root project
- QR kupon: package `qrcode` (render SVG di server)

## Entitas & Aturan Bisnis

### F1 — Master hewan qurban
- Hewan: kode (unik, mis. `SP-001`), nama sapi, harga (Rp), bobot estimasi (kg).
- Saat hewan dibuat, otomatis dibuat 7 slot patungan (nomor 1..7, status `tersedia`).
- Status hewan diturunkan: `tersedia` (ada slot kosong), `penuh` (7/7 terisi).
- GET /api/hewan → daftar + ringkasan slot terisi. POST /api/hewan → buat hewan + 7 slot.
  Validasi: kode unik (409 jika duplikat), harga > 0, bobot > 0 (400 jika tidak valid).

### F2 — Klaim slot (ATOMIK)
- POST /api/hewan/[id]/slot body `{namaPeserta, telepon}` mengambil slot tersedia
  pertama (nomor terkecil).
- **Atomik** (tanpa interactive transaction): loop nomor slot 1..7, tiap langkah
  `updateMany` single-statement dengan `where {hewanId, nomorSlot, status: "tersedia"}`;
  affected-row 1 berarti menang, 0 berarti kalah race dan lanjut ke nomor berikut.
  Jika semua 0 → 409 (penuh). Interactive `prisma.$transaction` tidak dipakai
  karena tidak tahan konkurensi di SQLite.
- Slot ke-8 pasti 409. Diuji dengan 10 request paralel → tepat 7 sukses, 3 gagal 409.
- Saat slot diklaim: dibuatkan 3 termin cicilan (masing-masing = harga/7/3, pembulatan
  dibebankan ke termin terakhir agar total pas) dan 1 kupon QR (kode unik, status `aktif`).

### F3 — Cicilan
- Setiap slot punya 3 termin cicilan: `terminKe`, `jumlah`, `jatuhTempo`, status
  `belum_lunas`/`lunas`, `dibayarPada`.
- POST /api/cicilan/[id]/bayar body `{jumlah?, tanggalBayar?, catatan?}`:
  pembayaran sebagian diperbolehkan (jumlah tercatat akumulasi); termin lunas saat
  total bayar >= jumlah termin. Tandai lunas **atomik**: `updateMany` dengan
  `where {id, status: "belum_lunas"}`; jika row 0 → 409 (sudah lunas).
- Status slot diturunkan: `lunas` jika 3 termin lunas, selain itu `terklaim`.
- GET /api/slot/[id]/cicilan → termin + riwayat pembayaran.

### F4 — Jadwal penyembelihan
- Jadwal: tanggal, lokasi, kapasitas (jumlah sapi/hewan).
- GET/POST /api/jadwal. POST /api/slot/[id]/jadwal body `{jadwalId}` mengikat slot ke
  jadwal. Kapasitas dicek: jumlah hewan unik yang terikat ke jadwal < kapasitas;
  jika penuh → 409. Dicek ulang dalam transaksi.
- Validasi: tanggal format YYYY-MM-DD, kapasitas > 0 (400).

### F5 — Kupon QR
- Tiap slot terisi punya 1 kupon: kode unik (mis. `QPN-<acak>`), status `aktif`.
- GET /api/kupon/[kode]/qr → SVG QR dari kode (content-type image/svg+xml),
  siap dicetak/ditunjukkan peserta.
- POST /api/kupon/[kode]/scan → tandai `terpakai` + catat waktu. **Atomik**:
  `updateMany` dengan `where {kode, status: "aktif"}`; row 0 → 409 "kupon sudah dipakai".
  Scan kedua selalu ditolak.

### F6 — Distribusi daging (penerima)
- Penerima: nama, alamat/dusun, jumlahPaket, status `belum_diserahkan`/`diserahkan`,
  tanggalSerah.
- GET/POST /api/penerima. POST /api/penerima/[id]/serahkan → status `diserahkan`
  + tanggal. Idempoten: sudah diserahkan → 409 (atau 200 tanpa perubahan; dipilih 409
  agar eksplisit).
- GET /api/laporan → ringkasan: total hewan, slot terisi/lunas, total dana terkumpul,
  total paket didistribusikan, daftar penerima per status.

## UI (bahasa Indonesia)
- `/` dashboard: ringkasan angka + daftar hewan dengan visual 7 slot (segmen).
- `/hewan` daftar hewan, tambah hewan.
- `/hewan/[id]` detail hewan: 7 slot (klik slot tersedia → form klaim), daftar peserta,
  status cicilan per slot, ikat ke jadwal sembelih, kupon per slot.
- `/cicilan/[slotId]` termin + bayar + riwayat.
- `/jadwal` daftar & tambah jadwal sembelih.
- `/scan` halaman scan kupon: input kode manual → tombol "Tandai diambil" (+ hasil).
- `/distribusi` daftar penerima, tambah penerima, tandai diserahkan, laporan.

## Non-fungsional
- `npm run build` lolos. Semua endpoint kunci diuji via curl (sukses + error).
- Uji atomicity: 10 request klaim paralel → tepat 7 sukses / 3 gagal 409.
- Tanpa browser/screenshot.

## Keputusan desain (antislop)
- Reading: admin tool untuk panitia masjid/qurban, visual language utilitarian yang
  hangat, dial ENERGY 1 / RHYTHM 2 / MOTION 1.
- Warna: emerald (identitas qurban/hijau masjid) + netral slate; tanpa gradient
  dekoratif. Motif identitas: segmen 7 slot & tiket kupon bergaris perforasi.
- Tanpa angka testimoni/statistik fiktif; semua angka dari database.
