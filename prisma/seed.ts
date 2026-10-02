import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = () => new Date().toISOString();
const acak = (n: number) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

async function buatHewan(kode: string, nama: string, harga: number, bobot: number) {
  const hewan = await prisma.hewan.create({
    data: { kode, nama, harga, bobotEstimasi: bobot, createdAt: now() },
  });
  for (let n = 1; n <= 7; n++) {
    await prisma.slot.create({
      data: { hewanId: hewan.id, nomorSlot: n, status: "tersedia", createdAt: now() },
    });
  }
  return hewan;
}

function bagiTermin(hargaPerSlot: number): number[] {
  const per = Math.floor(hargaPerSlot / 3);
  return [per, per, hargaPerSlot - per * 2];
}

async function main() {
  const n = await prisma.hewan.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }

  const h1 = await buatHewan("SP-001", "Sapi Brahman Jantan", 21000000, 320);
  const h2 = await buatHewan("SP-002", "Sapi Limosin Betina", 17500000, 280);
  const h3 = await buatHewan("SP-003", "Sapi Simental Jantan", 24500000, 360);

  // Jadwal sembelih
  const j1 = await prisma.jadwalSembelih.create({
    data: { tanggal: "2026-05-27", lokasi: "Lapangan Masjid Al-Ikhlas", kapasitas: 5, createdAt: now() },
  });

  // SP-001: 4 slot terisi (1 lunas, 3 cicilan jalan), terikat ke jadwal j1
  const harga1 = h1.harga / 7;
  const termin1 = bagiTermin(harga1);
  const peserta = [
    { nama: "Haji Mahmud", telp: "081234567890", lunas: true },
    { nama: "Bu Siti Aminah", telp: "081234567891", lunas: false },
    { nama: "Pak Budi Santoso", telp: "081234567892", lunas: false },
    { nama: "Keluarga H. Rojak", telp: "081234567893", lunas: false },
  ];
  let no = 1;
  for (const p of peserta) {
    const slot = await prisma.slot.update({
      where: { hewanId_nomorSlot: { hewanId: h1.id, nomorSlot: no } },
      data: { namaPeserta: p.nama, telepon: p.telp, status: p.lunas ? "lunas" : "terklaim", jadwalSembelihId: j1.id },
    });
    for (let t = 0; t < 3; t++) {
      const c = await prisma.cicilan.create({
        data: {
          slotId: slot.id, terminKe: t + 1, jumlah: termin1[t],
          jatuhTempo: `2026-0${3 + t}-15`,
          status: p.lunas ? "lunas" : "belum_lunas",
          dibayarPada: p.lunas ? `2026-0${3 + t}-10` : null,
        },
      });
      if (p.lunas) {
        await prisma.pembayaran.create({
          data: { slotId: slot.id, cicilanId: c.id, jumlah: termin1[t], tanggalBayar: `2026-0${3 + t}-10`, catatan: "Lunas via transfer" },
        });
      }
    }
    if (!p.lunas && no <= 2) {
      // contoh cicilan sebagian: termin 1 lunas untuk 2 slot
      const c1 = await prisma.cicilan.findFirst({ where: { slotId: slot.id, terminKe: 1 } });
      if (c1) {
        await prisma.cicilan.update({ where: { id: c1.id }, data: { status: "lunas", dibayarPada: "2026-03-12" } });
        await prisma.pembayaran.create({
          data: { slotId: slot.id, cicilanId: c1.id, jumlah: termin1[0], tanggalBayar: "2026-03-12", catatan: "Tunai" },
        });
      }
    }
    await prisma.kupon.create({
      data: { slotId: slot.id, kode: `QPN-${acak(6)}`, status: "aktif" },
    });
    no++;
  }

  // SP-002: 1 slot terisi, kupon sudah dipakai (contoh scan)
  const slot2 = await prisma.slot.update({
    where: { hewanId_nomorSlot: { hewanId: h2.id, nomorSlot: 1 } },
    data: { namaPeserta: "Pak Dedi Kurniawan", telepon: "081298765432", status: "lunas" },
  });
  const harga2 = h2.harga / 7;
  const termin2 = bagiTermin(harga2);
  for (let t = 0; t < 3; t++) {
    const c = await prisma.cicilan.create({
      data: {
        slotId: slot2.id, terminKe: t + 1, jumlah: termin2[t],
        jatuhTempo: `2026-0${3 + t}-15`, status: "lunas", dibayarPada: `2026-0${3 + t}-08`,
      },
    });
    await prisma.pembayaran.create({
      data: { slotId: slot2.id, cicilanId: c.id, jumlah: termin2[t], tanggalBayar: `2026-0${3 + t}-08` },
    });
  }
  await prisma.kupon.create({
    data: { slotId: slot2.id, kode: `QPN-${acak(6)}`, status: "terpakai", dipakaiPada: now() },
  });

  // Penerima daging
  const penerima = [
    { nama: "Keluarga Pak Warno", alamat: "Dusun Krajan RT 02", paket: 3, diserahkan: true },
    { nama: "Ibu Sumini", alamat: "Dusun Krajan RT 05", paket: 2, diserahkan: true },
    { nama: "Pak Slamet Riyadi", alamat: "Dusun Sengon RT 01", paket: 2, diserahkan: false },
    { nama: "Keluarga Bu Parti", alamat: "Dusun Sengon RT 03", paket: 3, diserahkan: false },
    { nama: "Yayasan Panti Asuhan", alamat: "Jl. Raya No. 12", paket: 10, diserahkan: false },
  ];
  for (const p of penerima) {
    await prisma.penerima.create({
      data: {
        nama: p.nama, alamat: p.alamat, jumlahPaket: p.paket,
        status: p.diserahkan ? "diserahkan" : "belum_diserahkan",
        tanggalSerah: p.diserahkan ? "2026-05-28" : null,
        createdAt: now(),
      },
    });
  }

  console.log("seed selesai: 3 sapi, 2 terisi sebagian, 1 jadwal, 5 penerima");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
