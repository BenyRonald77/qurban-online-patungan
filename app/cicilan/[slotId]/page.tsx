"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { rupiah, formatTanggal, today } from "@/lib/format";
import { Loading, ErrorBox, Badge, inputCls, btnPrimary } from "../../components/ui";

type Bayar = { id: number; jumlah: number; tanggalBayar: string; catatan: string | null };
type Termin = {
  id: number; terminKe: number; jumlah: number; jatuhTempo: string;
  status: string; pembayaran: Bayar[];
};
type Data = {
  slot: {
    id: number; nomorSlot: number; namaPeserta: string; status: string;
    hewan: { id: number; kode: string; nama: string };
    cicilan: Termin[];
  };
  totalTagihan: number; totalBayar: number; sisa: number;
};

export default function CicilanPage() {
  const { slotId } = useParams() as { slotId: string };
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState<Record<number, { jumlah: string; tanggal: string; catatan: string }>>({});
  const [pesan, setPesan] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  const muat = () => {
    setErr("");
    fetch(`/api/slot/${slotId}/cicilan`)
      .then((r) => { if (!r.ok) throw new Error("x"); return r.json(); })
      .then(setData)
      .catch(() => setErr("Gagal memuat data cicilan."));
  };
  useEffect(muat, [slotId]);

  const bayar = async (t: Termin) => {
    const f = form[t.id] ?? { jumlah: String(sisaTermin(t)), tanggal: today(), catatan: "" };
    if (!Number(f.jumlah) || Number(f.jumlah) <= 0) { setPesan("Jumlah harus lebih dari 0."); return; }
    setPesan(""); setSaving(t.id);
    try {
      const res = await fetch(`/api/cicilan/${t.id}/bayar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jumlah: Number(f.jumlah), tanggalBayar: f.tanggal, catatan: f.catatan || null }),
      });
      const d = await res.json();
      if (!res.ok) { setPesan(d.error ?? "Gagal menyimpan pembayaran."); return; }
      setPesan(d.terminLunas ? `Termin ${t.terminKe} lunas.` : "Pembayaran tercatat (sebagian).");
      muat();
    } catch { setPesan("Gagal menyimpan pembayaran."); } finally { setSaving(null); }
  };

  const sisaTermin = (t: Termin) =>
    t.jumlah - t.pembayaran.reduce((a, p) => a + p.jumlah, 0);

  if (err) return <ErrorBox pesan={err} onRetry={muat} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/hewan/${data.slot.hewan.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
          Kembali ke detail hewan
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Cicilan Slot {data.slot.nomorSlot}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {data.slot.namaPeserta} &middot; {data.slot.hewan.kode} {data.slot.hewan.nama}
        </p>
        <div className="mt-2 flex gap-2 text-sm">
          <span>Total tagihan: <b>{rupiah(data.totalTagihan)}</b></span>
          <span>Terbayar: <b className="text-emerald-700">{rupiah(data.totalBayar)}</b></span>
          <span>Sisa: <b className="text-amber-700">{rupiah(data.sisa)}</b></span>
        </div>
      </div>

      {pesan && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{pesan}</p>}

      <div className="space-y-4">
        {data.slot.cicilan.map((t) => {
          const sisa = sisaTermin(t);
          const f = form[t.id] ?? { jumlah: String(sisa), tanggal: today(), catatan: "" };
          return (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">Termin {t.terminKe}</p>
                <Badge tone={t.status === "lunas" ? "green" : "amber"}>
                  {t.status === "lunas" ? "Lunas" : `Sisa ${rupiah(sisa)}`}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {rupiah(t.jumlah)} &middot; jatuh tempo {formatTanggal(t.jatuhTempo)}
              </p>
              {t.pembayaran.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {t.pembayaran.map((p) => (
                    <li key={p.id}>
                      {formatTanggal(p.tanggalBayar)}: {rupiah(p.jumlah)}{p.catatan ? ` (${p.catatan})` : ""}
                    </li>
                  ))}
                </ul>
              )}
              {t.status !== "lunas" && (
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  <input className={inputCls} type="number" min="1" max={sisa} placeholder="Jumlah"
                    value={f.jumlah}
                    onChange={(e) => setForm({ ...form, [t.id]: { ...f, jumlah: e.target.value } })} />
                  <input className={inputCls} type="date" value={f.tanggal}
                    onChange={(e) => setForm({ ...form, [t.id]: { ...f, tanggal: e.target.value } })} />
                  <input className={inputCls} placeholder="Catatan (opsional)" value={f.catatan}
                    onChange={(e) => setForm({ ...form, [t.id]: { ...f, catatan: e.target.value } })} />
                  <button className={btnPrimary} disabled={saving === t.id} onClick={() => bayar(t)}>
                    {saving === t.id ? "Menyimpan..." : "Catat bayar"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
