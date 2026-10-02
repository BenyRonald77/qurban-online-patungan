"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { rupiah } from "@/lib/format";
import { Loading, ErrorBox, Empty, Badge, inputCls, btnPrimary } from "../components/ui";

type Hewan = {
  id: number; kode: string; nama: string; harga: number; bobotEstimasi: number;
  slotTerisi: number; slotTotal: number; status: string;
};

export default function DaftarHewan() {
  const [rows, setRows] = useState<Hewan[]>([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ kode: "", nama: "", harga: "", bobot: "" });
  const [pesan, setPesan] = useState("");
  const [saving, setSaving] = useState(false);

  const muat = () => {
    setErr("");
    fetch("/api/hewan")
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setErr("Gagal memuat daftar hewan."));
  };
  useEffect(muat, []);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPesan("");
    setSaving(true);
    try {
      const res = await fetch("/api/hewan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: form.kode,
          nama: form.nama,
          harga: Number(form.harga),
          bobotEstimasi: Number(form.bobot),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPesan(data.error ?? "Gagal menyimpan."); return; }
      setForm({ kode: "", nama: "", harga: "", bobot: "" });
      setPesan(`Hewan ${data.kode} tersimpan dengan 7 slot patungan.`);
      muat();
    } catch {
      setPesan("Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Hewan Qurban</h1>

      <form onSubmit={simpan} className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Tambah hewan baru</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input className={inputCls} placeholder="Kode, mis. SP-004" value={form.kode}
            onChange={(e) => setForm({ ...form, kode: e.target.value })} required />
          <input className={inputCls} placeholder="Nama sapi" value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
          <input className={inputCls} placeholder="Harga (Rp)" type="number" min="1" value={form.harga}
            onChange={(e) => setForm({ ...form, harga: e.target.value })} required />
          <input className={inputCls} placeholder="Bobot estimasi (kg)" type="number" min="1" step="0.1" value={form.bobot}
            onChange={(e) => setForm({ ...form, bobot: e.target.value })} required />
        </div>
        {pesan && <p className="mt-3 text-sm text-slate-700">{pesan}</p>}
        <button className={btnPrimary + " mt-3"} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan hewan"}
        </button>
        <p className="mt-2 text-xs text-slate-500">Setiap hewan otomatis dibuatkan 7 slot patungan.</p>
      </form>

      {err ? <ErrorBox pesan={err} onRetry={muat} /> :
        rows.length === 0 ? <Loading /> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Bobot</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{h.kode}</td>
                  <td className="px-4 py-3">{h.nama}</td>
                  <td className="px-4 py-3">{rupiah(h.harga)}</td>
                  <td className="px-4 py-3">{h.bobotEstimasi} kg</td>
                  <td className="px-4 py-3">{h.slotTerisi}/{h.slotTotal}</td>
                  <td className="px-4 py-3">
                    <Badge tone={h.status === "penuh" ? "amber" : "green"}>
                      {h.status === "penuh" ? "Penuh" : "Tersedia"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/hewan/${h.id}`} className="font-medium text-emerald-700 hover:underline">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === 0 && !err && <Empty teks="Belum ada hewan." />}
    </div>
  );
}
