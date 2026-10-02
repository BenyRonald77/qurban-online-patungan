import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTanggalValid } from "@/lib/qurban";

export async function GET() {
  const rows = await prisma.jadwalSembelih.findMany({
    orderBy: { tanggal: "asc" },
    include: { slots: { select: { id: true, hewanId: true } } },
  });
  return NextResponse.json(
    rows.map((j) => ({
      id: j.id,
      tanggal: j.tanggal,
      lokasi: j.lokasi,
      kapasitas: j.kapasitas,
      terpakai: new Set(j.slots.map((s) => s.hewanId)).size,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const tanggal = String(body?.tanggal ?? "").trim();
  const lokasi = String(body?.lokasi ?? "").trim();
  const kapasitas = Number(body?.kapasitas);

  if (!isTanggalValid(tanggal))
    return NextResponse.json({ error: "tanggal harus format YYYY-MM-DD yang valid" }, { status: 400 });
  if (!lokasi)
    return NextResponse.json({ error: "lokasi wajib diisi" }, { status: 400 });
  if (!Number.isInteger(kapasitas) || kapasitas <= 0)
    return NextResponse.json({ error: "kapasitas harus bilangan bulat > 0" }, { status: 400 });

  const created = await prisma.jadwalSembelih.create({
    data: { tanggal, lokasi, kapasitas, createdAt: new Date().toISOString() },
  });
  return NextResponse.json(created, { status: 201 });
}
