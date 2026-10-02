import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [hewan, slots, cicilanLunas, pembayaranAgg, kupon, penerima] =
    await Promise.all([
      prisma.hewan.count(),
      prisma.slot.findMany({ select: { status: true } }),
      prisma.cicilan.count({ where: { status: "lunas" } }),
      prisma.pembayaran.aggregate({ _sum: { jumlah: true } }),
      prisma.kupon.findMany({ select: { status: true } }),
      prisma.penerima.findMany({ orderBy: { id: "asc" } }),
    ]);

  const slotTerisi = slots.filter((s) => s.status !== "tersedia").length;
  const slotLunas = slots.filter((s) => s.status === "lunas").length;
  const kuponTerpakai = kupon.filter((k) => k.status === "terpakai").length;
  const paketDiserahkan = penerima
    .filter((p) => p.status === "diserahkan")
    .reduce((a, p) => a + p.jumlahPaket, 0);
  const paketBelum = penerima
    .filter((p) => p.status !== "diserahkan")
    .reduce((a, p) => a + p.jumlahPaket, 0);

  return NextResponse.json({
    totalHewan: hewan,
    slotTerisi,
    slotLunas,
    terminLunas: cicilanLunas,
    totalDanaTerkumpul: pembayaranAgg._sum.jumlah ?? 0,
    kuponTerpakai,
    kuponAktif: kupon.length - kuponTerpakai,
    paketDiserahkan,
    paketBelum,
    penerima,
  });
}
