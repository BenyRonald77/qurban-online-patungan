import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Ikat slot ke jadwal sembelih. Kapasitas jadwal dihitung per HEWAN unik
 * (satu sapi disembelih sekali). Pengecekan kapasitas dilakukan di dalam
 * transaksi; jika penuh -> 409.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const slotId = Number(params.id);
  if (!Number.isInteger(slotId))
    return NextResponse.json({ error: "id slot tidak valid" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const jadwalId = Number(body?.jadwalId);
  if (!Number.isInteger(jadwalId))
    return NextResponse.json({ error: "jadwalId tidak valid" }, { status: 400 });

  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot) return NextResponse.json({ error: "slot tidak ditemukan" }, { status: 404 });
  if (slot.status === "tersedia")
    return NextResponse.json({ error: "slot belum diklaim" }, { status: 400 });

  const jadwal = await prisma.jadwalSembelih.findUnique({ where: { id: jadwalId } });
  if (!jadwal)
    return NextResponse.json({ error: "jadwal tidak ditemukan" }, { status: 404 });

  try {
    const hasil = await prisma.$transaction(async (tx) => {
      const terikat = await tx.slot.findMany({
        where: { jadwalSembelihId: jadwalId },
        select: { hewanId: true },
      });
      const hewanUnik = new Set(terikat.map((s) => s.hewanId));
      if (!hewanUnik.has(slot.hewanId) && hewanUnik.size >= jadwal.kapasitas) {
        const err = new Error("kapasitas jadwal penuh") as Error & { code?: string };
        err.code = "JADWAL_PENUH";
        throw err;
      }
      return tx.slot.update({
        where: { id: slotId },
        data: { jadwalSembelihId: jadwalId },
        include: { jadwalSembelih: true },
      });
    });
    return NextResponse.json(hasil);
  } catch (e) {
    if ((e as Error & { code?: string }).code === "JADWAL_PENUH")
      return NextResponse.json({ error: "kapasitas jadwal sembelih sudah penuh" }, { status: 409 });
    throw e;
  }
}
