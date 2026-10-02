import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { today } from "@/lib/format";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const tanggalSerah = String(body?.tanggalSerah ?? today());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalSerah))
    return NextResponse.json({ error: "tanggalSerah harus format YYYY-MM-DD" }, { status: 400 });

  const upd = await prisma.penerima.updateMany({
    where: { id, status: "belum_diserahkan" },
    data: { status: "diserahkan", tanggalSerah },
  });
  if (upd.count === 0) {
    const ada = await prisma.penerima.findUnique({ where: { id } });
    if (!ada)
      return NextResponse.json({ error: "penerima tidak ditemukan" }, { status: 404 });
    return NextResponse.json(
      { error: "paket sudah diserahkan sebelumnya", penerima: ada },
      { status: 409 }
    );
  }
  const penerima = await prisma.penerima.findUnique({ where: { id } });
  return NextResponse.json({ ok: true, penerima });
}
