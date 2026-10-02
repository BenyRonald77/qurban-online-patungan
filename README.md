# Qurban Online Patungan

Aplikasi web untuk mengelola qurban sapi dengan sistem patungan. Satu ekor sapi
dibagi menjadi 7 slot patungan: peserta klaim slot, membayar dengan cicilan
3 termin, sapi disembelih sesuai jadwal, daging diambil dengan kupon QR, dan
panitia mencatat distribusi ke penerima (mustahik).

## Stack
Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS (App Router).

## Cara Menjalankan

```bash
npm install --ignore-scripts   # VM ini: download binary Prisma gagal, pakai workaround di bawah
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Workaround Prisma di VM ini (download `binaries.prisma.sh` selalu ECONNRESET):
```bash
npm install --ignore-scripts
cp ~/workspace/ts-convert/prisma-engines/schema-engine-debian-openssl-3.0.x \
   node_modules/@prisma/engines/
cp ~/workspace/ts-convert/prisma-engines/libquery_engine-debian-openssl-3.0.x.so.node \
   node_modules/@prisma/engines/
npx prisma generate
```
Jika generate menolak cache karena hash mismatch, hapus trailing newline di file
`.sha256` pada `~/.cache/prisma/engines/<hash>/`, lalu generate ulang.

Buka http://localhost:3000

## Halaman
- `/` — dashboard: ringkasan angka + daftar hewan dengan visual 7 slot.
- `/hewan` — daftar hewan, tambah hewan baru.
- `/hewan/[id]` — detail hewan: 7 slot (klik slot tersedia untuk klaim), daftar
  peserta, status cicilan, ikat slot ke jadwal sembelih, kupon QR per slot.
- `/cicilan?slot=<id>` — 3 termin cicilan, catat pembayaran, riwayat.
- `/jadwal` — jadwal penyembelihan (tanggal, lokasi, kapasitas).
- `/scan` — scan kupon QR: masukkan kode, tandai daging diambil.
- `/distribusi` — penerima daging, tandai diserahkan, laporan distribusi.

## API
- `GET/POST /api/hewan` — daftar & tambah hewan (otomatis 7 slot).
- `GET /api/hewan/[id]` — detail hewan + slot + cicilan + kupon.
- `POST /api/hewan/[id]/slot` — klaim slot atomik `{namaPeserta, telepon}`.
- `GET /api/slot/[id]/cicilan` — termin + riwayat pembayaran per slot.
- `POST /api/cicilan/[id]/bayar` — catat pembayaran `{jumlah?, tanggalBayar?, catatan?}`.
- `GET/POST /api/jadwal` — daftar & tambah jadwal sembelih.
- `POST /api/slot/[id]/jadwal` — ikat slot ke jadwal `{jadwalId}` (cek kapasitas).
- `GET /api/kupon/[kode]/qr` — SVG QR kupon.
- `POST /api/kupon/[kode]/scan` — tandai kupon terpakai (atomik).
- `GET/POST /api/penerima` — daftar & tambah penerima daging.
- `POST /api/penerima/[id]/serahkan` — tandai paket diserahkan.
- `GET /api/laporan` — ringkasan distribusi.

Aturan atomicity: klaim slot, pelunasan termin, dan scan kupon memakai
`updateMany` dengan filter status di dalam transaksi; request bersamaan tidak
bisa double-claim (409 untuk yang kalah).
