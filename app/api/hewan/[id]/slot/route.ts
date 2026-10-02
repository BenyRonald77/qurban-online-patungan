import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bagiTermin, jatuhTempoTermin, kodeKupon } from "@/lib/qurban";

/**
 * Klaim slot patungan secara ATOMIK.
 * Mengambil slot tersedia bernomor terkecil, lalu updateMany dengan
 * where {id, status: "tersedia"} di dalam transaksi. Jika row terpengaruh 0,
 * berarti slot sudah direbut request lain -> 409.
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

  const now = new Date().toISOString();
  try {
    const hasil = await prisma.$transaction(async (tx) => {
      const kandidat = await tx.slot.findFirst({
        where: { hewanId, status: "tersedia" },
        orderBy: { nomorSlot: "asc" },
      });
      if (!kandidat) {
        const err = new Error("semua slot sudah terisi") as Error & { code?: string };
        err.code = "SLOT_PENUH";
        throw err;
      }
      const upd = await tx.slot.updateMany({
        where: { id: kandidat.id, status: "tersedia" },
        data: { namaPeserta, telepon: telepon || null, status: "terklaim" },
      });
      if (upd.count === 0) {
        const err = new Error("slot baru saja diklaim pihak lain") as Error & { code?: string };
        err.code = "SLOT_PENUH";
        throw err;
      }
      const hargaPerSlot = hewan.harga / 7;
      const termin = bagiTermin(hargaPerSlot);
      for (let t = 0; t < termin.length; t++) {
        await tx.cicilan.create({
          data: {
            slotId: kandidat.id,
            terminKe: t + 1,
            jumlah: termin[t],
            jatuhTempo: jatuhTempoTermin(t + 1),
            status: "belum_lunas",
          },
        });
      }
      const kupon = await tx.kupon.create({
        data: { slotId: kandidat.id, kode: kodeKupon(), status: "aktif" },
      });
      return tx.slot.findUnique({
        where: { id: kandidat.id },
        include: { cicilan: { orderBy: { terminKe: "asc" } }, kupon: true },
      });
    });
    return NextResponse.json(hasil, { status: 201 });
  } catch (e) {
    if ((e as Error & { code?: string }).code === "SLOT_PENUH")
      return NextResponse.json({ error: "semua slot sudah terisi" }, { status: 409 });
    throw e;
  }
}
