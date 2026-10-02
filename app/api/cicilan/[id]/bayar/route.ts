import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { today } from "@/lib/format";

/**
 * Catat pembayaran cicilan. Pembayaran sebagian diperbolehkan; termin menjadi
 * lunas saat total bayar >= jumlah termin. Penandaan lunas dilakukan atomik
 * dengan conditional updateMany where {id, status: "belum_lunas"} + cek row
 * terpengaruh — tanpa interactive transaction (tidak tahan konkurensi di SQLite).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cicilanId = Number(params.id);
  if (!Number.isInteger(cicilanId))
    return NextResponse.json({ error: "id cicilan tidak valid" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const jumlah = Number(body?.jumlah);
  const tanggalBayar = String(body?.tanggalBayar ?? today());
  const catatan = body?.catatan ? String(body.catatan) : null;

  if (!Number.isFinite(jumlah) || jumlah <= 0)
    return NextResponse.json({ error: "jumlah harus lebih dari 0" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalBayar))
    return NextResponse.json({ error: "tanggalBayar harus format YYYY-MM-DD" }, { status: 400 });

  const cicilan = await prisma.cicilan.findUnique({ where: { id: cicilanId } });
  if (!cicilan)
    return NextResponse.json({ error: "cicilan tidak ditemukan" }, { status: 404 });
  if (cicilan.status === "lunas")
    return NextResponse.json({ error: "termin ini sudah lunas" }, { status: 409 });

  const bayar = await prisma.pembayaran.create({
    data: {
      slotId: cicilan.slotId,
      cicilanId: cicilan.id,
      jumlah: Math.round(jumlah),
      tanggalBayar,
      catatan,
    },
  });

  const agg = await prisma.pembayaran.aggregate({
    where: { cicilanId: cicilan.id },
    _sum: { jumlah: true },
  });
  const total = agg._sum.jumlah ?? 0;

  let terminLunas = false;
  if (total >= cicilan.jumlah) {
    const upd = await prisma.cicilan.updateMany({
      where: { id: cicilan.id, status: "belum_lunas" },
      data: { status: "lunas", dibayarPada: tanggalBayar },
    });
    terminLunas = upd.count === 1;
  }

  if (terminLunas) {
    const sisa = await prisma.cicilan.count({
      where: { slotId: cicilan.slotId, status: "belum_lunas" },
    });
    if (sisa === 0) {
      await prisma.slot.update({
        where: { id: cicilan.slotId },
        data: { status: "lunas" },
      });
    }
  }

  return NextResponse.json(
    { pembayaran: bayar, totalBayarTermin: total, terminLunas },
    { status: 201 }
  );
}
