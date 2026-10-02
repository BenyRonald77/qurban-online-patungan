import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bagiTermin, jatuhTempoTermin, kodeKupon, JUMLAH_SLOT } from "@/lib/qurban";

/**
 * Klaim slot patungan secara ATOMIK.
 *
 * Pola: conditional updateMany single-statement per nomor slot
 * (1..7), tanpa interactive transaction. Setiap statement dieksekusi atomik
 * oleh SQLite (single writer): hanya satu request yang mendapat
 * affected-row = 1 untuk satu slot; yang kalah mendapat 0 dan lanjut coba
 * slot berikutnya. Jika semua 0 -> 409 (penuh).
 *
 * Interactive prisma.$transaction TIDAK dipakai di sini karena tidak tahan
 * konkurensi pada SQLite (timeout massal pada race test).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const hewanId = Number(params.id);
  if (!Number.isInteger(hewanId))
    return NextResponse.json({ error: "id hewan tidak valid" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const namaPeserta = String(body?.namaPeserta ?? "").trim();
  const telepon = String(body?.telepon ?? "").trim();
  if (!namaPeserta)
    return NextResponse.json({ error: "nama peserta wajib diisi" }, { status: 400 });

  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId } });
  if (!hewan)
    return NextResponse.json({ error: "hewan tidak ditemukan" }, { status: 404 });

  // 1) Klaim atomik: rebut satu slot tersedia (nomor terkecil dulu).
  let slotId: number | null = null;
  let nomorSlot = 0;
  for (let n = 1; n <= JUMLAH_SLOT; n++) {
    const upd = await prisma.slot.updateMany({
      where: { hewanId, nomorSlot: n, status: "tersedia" },
      data: { namaPeserta, telepon: telepon || null, status: "terklaim" },
    });
    if (upd.count === 1) {
      const s = await prisma.slot.findFirst({ where: { hewanId, nomorSlot: n } });
      if (s) {
        slotId = s.id;
        nomorSlot = n;
      }
      break;
    }
  }
  if (slotId === null)
    return NextResponse.json({ error: "semua slot sudah terisi" }, { status: 409 });

  // 2) Buatkan 3 termin cicilan + 1 kupon QR untuk slot yang dimenangkan.
  //    Jika gagal di tengah jalan, slot dilepas kembali (kompensasi).
  try {
    const termin = bagiTermin(hewan.harga / 7);
    for (let t = 0; t < termin.length; t++) {
      await prisma.cicilan.create({
        data: {
          slotId,
          terminKe: t + 1,
          jumlah: termin[t],
          jatuhTempo: jatuhTempoTermin(t + 1),
          status: "belum_lunas",
        },
      });
    }
    // Kode kupon unik; coba ulang bila (sangat jarang) bertabrakan.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await prisma.kupon.create({
          data: { slotId, kode: kodeKupon(), status: "aktif" },
        });
        break;
      } catch (e) {
        if ((e as { code?: string }).code === "P2002" && attempt < 4) continue;
        throw e;
      }
    }
  } catch (e) {
    await prisma.slot.updateMany({
      where: { id: slotId, status: "terklaim" },
      data: { namaPeserta: null, telepon: null, status: "tersedia" },
    });
    throw e;
  }

  const hasil = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { cicilan: { orderBy: { terminKe: "asc" } }, kupon: true },
  });
  return NextResponse.json({ ...hasil, nomorSlot }, { status: 201 });
}
