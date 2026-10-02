import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  _req: Request,
  { params }: { params: { kode: string } }
) {
  const kode = decodeURIComponent(params.kode).trim().toUpperCase();
  const kupon = await prisma.kupon.findUnique({
    where: { kode },
    include: {
      slot: {
        include: {
          hewan: { select: { kode: true, nama: true } },
        },
      },
    },
  });
  if (!kupon)
    return NextResponse.json({ error: "kupon tidak ditemukan" }, { status: 404 });

  const svg = await QRCode.toString(kupon.kode, { type: "svg", margin: 2, width: 240 });
  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
}
