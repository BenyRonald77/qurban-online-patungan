"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { rupiah } from "@/lib/format";
import { Loading, ErrorBox, Empty, Stat, Badge } from "./components/ui";

type Hewan = {
  id: number; kode: string; nama: string; harga: number;
  slotTerisi: number; slotTotal: number; status: string;
};
type Laporan = {
  totalHewan: number; slotTerisi: number; slotLunas: number;
  totalDanaTerkumpul: number; kuponTerpakai: number;
  paketDiserahkan: number; paketBelum: number;
};

function SlotBar({ terisi, total }: { terisi: number; total: number }) {
  return (
    <div className="flex gap-1" aria-label={`${terisi} dari ${total} slot terisi`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={
            "h-3 flex-1 rounded-sm " + (i < terisi ? "bg-emerald-600" : "bg-slate-200")
          }
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [lap, setLap] = useState<Laporan | null>(null);
  const [hewan, setHewan] = useState<Hewan[]>([]);
  const [err, setErr] = useState("");

  const muat = () => {
    setErr("");
    Promise.all([fetch("/api/laporan").then((r) => r.json()), fetch("/api/hewan").then((r) => r.json())])
      .then(([l, h]) => { setLap(l); setHewan(h); })
      .catch(() => setErr("Gagal memuat data dashboard."));
  };
  useEffect(muat, []);

  if (err) return <ErrorBox pesan={err} onRetry={muat} />;
  if (!lap) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Qurban</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pantau patungan sapi: slot, cicilan, kupon, dan distribusi daging.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Hewan qurban" value={String(lap.totalHewan)} />
        <Stat label="Slot terisi" value={`${lap.slotTerisi}`} sub={`${lap.slotLunas} slot lunas`} />
        <Stat label="Dana terkumpul" value={rupiah(lap.totalDanaTerkumpul)} />
        <Stat label="Kupon terpakai" value={String(lap.kuponTerpakai)} />
        <Stat label="Paket diserahkan" value={String(lap.paketDiserahkan)} sub={`${lap.paketBelum} paket menunggu`} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Hewan qurban</h2>
          <Link href="/hewan" className="text-sm font-medium text-emerald-700 hover:underline">
            Kelola hewan
          </Link>
        </div>
        {hewan.length === 0 ? (
          <Empty teks="Belum ada hewan qurban. Tambahkan lewat halaman Hewan Qurban." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {hewan.map((h) => (
              <Link
                key={h.id}
                href={`/hewan/${h.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{h.kode}</p>
                    <p className="font-semibold">{h.nama}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{rupiah(h.harga)} / ekor</p>
                  </div>
                  <Badge tone={h.status === "penuh" ? "amber" : "green"}>
                    {h.status === "penuh" ? "Penuh" : `${h.slotTotal - h.slotTerisi} slot tersisa`}
                  </Badge>
                </div>
                <div className="mt-3">
                  <SlotBar terisi={h.slotTerisi} total={h.slotTotal} />
                  <p className="mt-1 text-xs text-slate-500">
                    {h.slotTerisi} dari {h.slotTotal} slot patungan terisi
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
