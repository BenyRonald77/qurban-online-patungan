import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JUMLAH_SLOT, statusHewanDariSlot } from "@/lib/qurban";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });

  const h = await prisma.hewan.findUnique({
    where: { id },
    include: {
      slots: {
        orderBy: { nomorSlot: "asc" },
        include: {
          cicilan: { orderBy: { terminKe: "asc" } },
          kupon: true,
          jadwalSembelih: true,
        },
      },
    },
  });
  if (!h) return NextResponse.json({ error: "hewan tidak ditemukan" }, { status: 404 });

  const terisi = h.slots.filter((s) => s.status !== "tersedia").length;
  return NextResponse.json({
    id: h.id,
    kode: h.kode,
    nama: h.nama,
    harga: h.harga,
    bobotEstimasi: h.bobotEstimasi,
    slotTerisi: terisi,
    slotTotal: JUMLAH_SLOT,
    status: statusHewanDariSlot(terisi),
    slots: h.slots,
  });
}
