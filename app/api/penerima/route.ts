import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.penerima.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const nama = String(body?.nama ?? "").trim();
  const alamat = body?.alamat ? String(body.alamat).trim() : null;
  const jumlahPaket = Number(body?.jumlahPaket);

  if (!nama)
    return NextResponse.json({ error: "nama penerima wajib diisi" }, { status: 400 });
  if (!Number.isInteger(jumlahPaket) || jumlahPaket <= 0)
    return NextResponse.json({ error: "jumlah paket harus bilangan bulat > 0" }, { status: 400 });

  const created = await prisma.penerima.create({
    data: {
      nama,
      alamat,
      jumlahPaket,
      status: "belum_diserahkan",
      createdAt: new Date().toISOString(),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
