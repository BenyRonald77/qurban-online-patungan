import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JUMLAH_SLOT, statusHewanDariSlot } from "@/lib/qurban";

export async function GET() {
  const hewan = await prisma.hewan.findMany({
    orderBy: { id: "asc" },
    include: { slots: { select: { id: true, status: true } } },
  });
  const hasil = hewan.map((h) => {
    const terisi = h.slots.filter((s) => s.status !== "tersedia").length;
    return {
      id: h.id,
      kode: h.kode,
      nama: h.nama,
      harga: h.harga,
      bobotEstimasi: h.bobotEstimasi,
      slotTerisi: terisi,
      slotTotal: JUMLAH_SLOT,
      status: statusHewanDariSlot(terisi),
      createdAt: h.createdAt,
    };
  });
  return NextResponse.json(hasil);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const kode = String(body?.kode ?? "").trim().toUpperCase();
  const nama = String(body?.nama ?? "").trim();
  const harga = Number(body?.harga);
  const bobot = Number(body?.bobotEstimasi ?? body?.bobot);

  if (!kode) return NextResponse.json({ error: "kode wajib diisi" }, { status: 400 });
  if (!nama) return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  if (!Number.isFinite(harga) || harga <= 0)
    return NextResponse.json({ error: "harga harus lebih dari 0" }, { status: 400 });
  if (!Number.isFinite(bobot) || bobot <= 0)
    return NextResponse.json({ error: "bobot estimasi harus lebih dari 0" }, { status: 400 });

  const ada = await prisma.hewan.findUnique({ where: { kode } });
  if (ada) return NextResponse.json({ error: `kode ${kode} sudah dipakai` }, { status: 409 });

  const created = await prisma.$transaction(async (tx) => {
    const h = await tx.hewan.create({
      data: { kode, nama, harga: Math.round(harga), bobotEstimasi: bobot, createdAt: new Date().toISOString() },
    });
    for (let n = 1; n <= JUMLAH_SLOT; n++) {
      await tx.slot.create({
        data: { hewanId: h.id, nomorSlot: n, status: "tersedia", createdAt: new Date().toISOString() },
      });
    }
    return h;
  });
  return NextResponse.json({ ...created, slotTotal: JUMLAH_SLOT }, { status: 201 });
}
