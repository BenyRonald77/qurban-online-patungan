import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const slotId = Number(params.id);
  if (!Number.isInteger(slotId))
    return NextResponse.json({ error: "id slot tidak valid" }, { status: 400 });

  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      hewan: { select: { id: true, kode: true, nama: true, harga: true } },
      cicilan: {
        orderBy: { terminKe: "asc" },
        include: { pembayaran: { orderBy: { id: "asc" } } },
      },
      pembayaran: { orderBy: { id: "asc" } },
    },
  });
  if (!slot) return NextResponse.json({ error: "slot tidak ditemukan" }, { status: 404 });
  if (slot.status === "tersedia")
    return NextResponse.json({ error: "slot belum diklaim" }, { status: 404 });

  const totalTagihan = slot.cicilan.reduce((a, c) => a + c.jumlah, 0);
  const totalBayar = slot.pembayaran.reduce((a, p) => a + p.jumlah, 0);
  return NextResponse.json({ slot, totalTagihan, totalBayar, sisa: totalTagihan - totalBayar });
}
