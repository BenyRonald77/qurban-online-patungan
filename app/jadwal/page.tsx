"use client";
import { useEffect, useState } from "react";
import { formatTanggal } from "@/lib/format";
import { Loading, ErrorBox, Empty, Badge, inputCls, btnPrimary } from "../components/ui";

type Jadwal = { id: number; tanggal: string; lokasi: string; kapasitas: number; terpakai: number };

export default function JadwalPage() {
  const [rows, setRows] = useState<Jadwal[]>([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ tanggal: "", lokasi: "", kapasitas: "" });
  const [pesan, setPesan] = useState("");
  const [saving, setSaving] = useState(false);

  const muat = () => {
    setErr("");
    fetch("/api/jadwal").then((r) => r.json()).then(setRows)
      .catch(() => setErr("Gagal memuat jadwal."));
  };
  useEffect(muat, []);

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPesan(""); setSaving(true);
    try {
      const res = await fetch("/api/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tanggal: form.tanggal, lokasi: form.lokasi, kapasitas: Number(form.kapasitas) }),
      });
      const d = await res.json();
      if (!res.ok) { setPesan(d.error ?? "Gagal menyimpan."); return; }
      setForm({ tanggal: "", lokasi: "", kapasitas: "" });
      setPesan("Jadwal tersimpan.");
      muat();
    } catch { setPesan("Gagal menyimpan."); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Jadwal Penyembelihan</h1>

      <form onSubmit={simpan} className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Tambah jadwal</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input className={inputCls} type="date" value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required />
          <input className={inputCls} placeholder="Lokasi penyembelihan" value={form.lokasi}
            onChange={(e) => setForm({ ...form, lokasi: e.target.value })} required />
          <input className={inputCls} type="number" min="1" placeholder="Kapasitas (ekor)" value={form.kapasitas}
            onChange={(e) => setForm({ ...form, kapasitas: e.target.value })} required />
        </div>
        {pesan && <p className="mt-3 text-sm text-slate-700">{pesan}</p>}
        <button className={btnPrimary + " mt-3"} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan jadwal"}
        </button>
      </form>

      {err ? <ErrorBox pesan={err} onRetry={muat} /> : rows.length === 0 ? <Loading /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((j) => (
            <div key={j.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{formatTanggal(j.tanggal)}</p>
                  <p className="text-sm text-slate-600">{j.lokasi}</p>
                </div>
                <Badge tone={j.terpakai >= j.kapasitas ? "red" : "green"}>
                  {j.terpakai}/{j.kapasitas} ekor
                </Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-emerald-600"
                  style={{ width: `${Math.min(100, (j.terpakai / j.kapasitas) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 && !err && <Empty teks="Belum ada jadwal." />}
    </div>
  );
}
