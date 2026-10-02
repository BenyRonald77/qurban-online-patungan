"use client";
import { useEffect, useState } from "react";
import { formatTanggal } from "@/lib/format";
import { Loading, ErrorBox, Empty, Stat, Badge, inputCls, btnPrimary, btnSecondary } from "../components/ui";

type Penerima = {
  id: number; nama: string; alamat: string | null; jumlahPaket: number;
  status: string; tanggalSerah: string | null;
};
type Laporan = {
  paketDiserahkan: number; paketBelum: number;
  penerima: Penerima[];
};

export default function DistribusiPage() {
  const [lap, setLap] = useState<Laporan | null>(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ nama: "", alamat: "", jumlahPaket: "" });
  const [pesan, setPesan] = useState("");
  const [saving, setSaving] = useState(false);
  const [proses, setProses] = useState<number | null>(null);

  const muat = () => {
    setErr("");
    fetch("/api/laporan").then((r) => r.json()).then(setLap)
      .catch(() => setErr("Gagal memuat data distribusi."));
  };
  useEffect(muat, []);

  const tambah = async (e: React.FormEvent) => {
    e.preventDefault();
    setPesan(""); setSaving(true);
    try {
      const res = await fetch("/api/penerima", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: form.nama, alamat: form.alamat || null, jumlahPaket: Number(form.jumlahPaket) }),
      });
      const d = await res.json();
      if (!res.ok) { setPesan(d.error ?? "Gagal menyimpan."); return; }
      setForm({ nama: "", alamat: "", jumlahPaket: "" });
      setPesan(`Penerima ${d.nama} ditambahkan (${d.jumlahPaket} paket).`);
      muat();
    } catch { setPesan("Gagal menyimpan."); } finally { setSaving(false); }
  };

  const serahkan = async (p: Penerima) => {
    setProses(p.id); setPesan("");
    try {
      const res = await fetch(`/api/penerima/${p.id}/serahkan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const d = await res.json();
      if (!res.ok) { setPesan(d.error ?? "Gagal."); return; }
      setPesan(`${p.nama} ditandai sudah menerima ${p.jumlahPaket} paket.`);
      muat();
    } catch { setPesan("Gagal."); } finally { setProses(null); }
  };

  if (err) return <ErrorBox pesan={err} onRetry={muat} />;
  if (!lap) return <Loading />;

  const belum = lap.penerima.filter((p) => p.status !== "diserahkan");
  const sudah = lap.penerima.filter((p) => p.status === "diserahkan");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Distribusi Daging</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Paket diserahkan" value={String(lap.paketDiserahkan)} />
        <Stat label="Paket menunggu" value={String(lap.paketBelum)} />
        <Stat label="Total penerima" value={String(lap.penerima.length)} />
      </div>

      {pesan && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{pesan}</p>}

      <form onSubmit={tambah} className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Tambah penerima (mustahik)</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input className={inputCls} placeholder="Nama penerima" value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
          <input className={inputCls} placeholder="Alamat / dusun" value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
          <input className={inputCls} type="number" min="1" placeholder="Jumlah paket" value={form.jumlahPaket}
            onChange={(e) => setForm({ ...form, jumlahPaket: e.target.value })} required />
        </div>
        <button className={btnPrimary + " mt-3"} disabled={saving}>
          {saving ? "Menyimpan..." : "Tambah penerima"}
        </button>
      </form>

      <section>
        <h2 className="mb-3 font-semibold">Menunggu penyerahan ({belum.length})</h2>
        {belum.length === 0 ? <Empty teks="Semua paket sudah diserahkan." /> : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Alamat</th>
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {belum.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{p.nama}</td>
                    <td className="px-4 py-3 text-slate-600">{p.alamat ?? "-"}</td>
                    <td className="px-4 py-3">{p.jumlahPaket}</td>
                    <td className="px-4 py-3 text-right">
                      <button className={btnSecondary + " !py-1.5"} disabled={proses === p.id}
                        onClick={() => serahkan(p)}>
                        {proses === p.id ? "Memproses..." : "Tandai diserahkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Sudah diserahkan ({sudah.length})</h2>
        {sudah.length === 0 ? <Empty teks="Belum ada paket yang diserahkan." /> : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Paket</th>
                  <th className="px-4 py-3">Tanggal serah</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sudah.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{p.nama}</td>
                    <td className="px-4 py-3">{p.jumlahPaket}</td>
                    <td className="px-4 py-3">{p.tanggalSerah ? formatTanggal(p.tanggalSerah) : "-"}</td>
                    <td className="px-4 py-3"><Badge tone="green">Diserahkan</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
