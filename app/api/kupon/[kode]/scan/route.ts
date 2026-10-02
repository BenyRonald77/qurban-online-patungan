import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";

/**
 * Scan kupon: tandai daging sudah diambil. ATOMIK via updateMany
 * where {kode, status: "aktif"} — scan kedua (row 0) -> 409.
 */
export async function POST(
  _req: Request,
  { params }: { params: { kode: string } }
) {
  const kode = decodeURIComponent(params.kode).trim().toUpperCase();
  if (!kode)
    return NextResponse.json({ error: "kode kupon wajib diisi" }, { status: 400 });

  const dipakaiPada = nowIso();
  const upd = await prisma.kupon.updateMany({
    where: { kode, status: "aktif" },
    data: { status: "terpakai", dipakaiPada },
  });
  if (upd.count === 0) {
    const ada = await prisma.kupon.findUnique({
      where: { kode },
      include: { slot: { include: { hewan: { select: { kode: true, nama: true } } } } },
    });
    if (!ada)
      return NextResponse.json({ error: "kupon tidak ditemukan" }, { status: 404 });
    return NextResponse.json(
      { error: "kupon sudah dipakai", dipakaiPada: ada.dipakaiPada, kupon: ada },
      { status: 409 }
    );
  }
  const kupon = await prisma.kupon.findUnique({
    where: { kode },
    include: { slot: { include: { hewan: { select: { kode: true, nama: true } } } } },
  });
  return NextResponse.json({ ok: true, kupon });
}
