"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { rupiah, formatTanggal } from "@/lib/format";
import { Loading, ErrorBox, Badge, inputCls, btnPrimary, btnSecondary } from "../../components/ui";

type Cicilan = { id: number; terminKe: number; jumlah: number; jatuhTempo: string; status: string };
type Slot = {
  id: number; nomorSlot: number; namaPeserta: string | null; telepon: string | null;
  status: string; jadwalSembelihId: number | null;
  cicilan: Cicilan[];
  kupon: { kode: string; status: string } | null;
  jadwalSembelih: { id: number; tanggal: string; lokasi: string } | null;
};
type Detail = {
  id: number; kode: string; nama: string; harga: number; bobotEstimasi: number;
  slotTerisi: number; slotTotal: number; status: string; slots: Slot[];
};
type Jadwal = { id: number; tanggal: string; lokasi: string; kapasitas: number; terpakai: number };

export default function DetailHewan() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<Detail | null>(null);
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [err, setErr] = useState("");
  const [klaimSlot, setKlaimSlot] = useState<number | null>(null);
  const [form, setForm] = useState({ nama: "", telepon: "" });
  const [pesan, setPesan] = useState("");
  const [saving, setSaving] = useState(false);
  const [jadwalPilih, setJadwalPilih] = useState<Record<number, string>>({});

  const muat = () => {
    setErr("");
    Promise.all([
      fetch(`/api/hewan/${id}`).then((r) => { if (!r.ok) throw new Error("notfound"); return r.json(); }),
      fetch("/api/jadwal").then((r) => r.json()),
    ])
      .then(([d, j]) => { setData(d); setJadwal(j); })
      .catch(() => setErr("Gagal memuat detail hewan."));
  };
  useEffect(muat, [id]);

  const klaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setPesan(""); setSaving(true);
    try {
      const res = await fetch(`/api/hewan/${id}/slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaPeserta: form.nama, telepon: form.telepon }),
      });
      const d = await res.json();
      if (!res.ok) { setPesan(d.error ?? "Gagal klaim."); return; }
      setKlaimSlot(null); setForm({ nama: "", telepon: "" });
      setPesan(`Slot ${d.nomorSlot} berhasil diklaim untuk ${d.namaPeserta}.`);
      muat();
    } catch { setPesan("Gagal klaim."); } finally { setSaving(false); }
  };

  const ikatJadwal = async (slotId: number) => {
    const jid = jadwalPilih[slotId];
    if (!jid) { setPesan("Pilih jadwal dulu."); return; }
    setPesan("");
    const res = await fetch(`/api/slot/${slotId}/jadwal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jadwalId: Number(jid) }),
    });
    const d = await res.json();
    if (!res.ok) { setPesan(d.error ?? "Gagal mengikat jadwal."); return; }
    setPesan("Slot terikat ke jadwal sembelih.");
    muat();
  };

  if (err) return <ErrorBox pesan={err} onRetry={muat} />;
  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{data.kode}</p>
        <h1 className="text-2xl font-bold tracking-tight">{data.nama}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {rupiah(data.harga)} / ekor &middot; {rupiah(data.harga / 7)} per slot &middot; {data.bobotEstimasi} kg
        </p>
      </div>

      {pesan && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{pesan}</p>}

      <section>
        <h2 className="mb-3 font-semibold">7 slot patungan</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {data.slots.map((s) => (
            <button
              key={s.id}
              disabled={s.status !== "tersedia"}
              onClick={() => setKlaimSlot(s.nomorSlot)}
              className={
                "rounded-xl border p-3 text-left transition " +
                (s.status === "tersedia"
                  ? "border-dashed border-emerald-400 bg-emerald-50 hover:bg-emerald-100"
                  : s.status === "lunas"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-300 bg-slate-200")
              }
              title={s.status === "tersedia" ? "Klik untuk klaim slot ini" : s.namaPeserta ?? ""}
            >
              <p className="text-xs font-medium opacity-70">Slot {s.nomorSlot}</p>
              <p className="mt-1 truncate text-sm font-semibold">
                {s.status === "tersedia" ? "Tersedia" : s.namaPeserta}
              </p>
              <p className="mt-0.5 text-xs opacity-70">
                {s.status === "tersedia" ? "Klik untuk klaim" : s.status === "lunas" ? "Lunas" : "Terklaim"}
              </p>
            </button>
          ))}
        </div>
      </section>

      {klaimSlot !== null && (
        <form onSubmit={klaim} className="rounded-xl border border-emerald-300 bg-white p-4">
          <h3 className="font-semibold">Klaim slot {klaimSlot}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className={inputCls} placeholder="Nama peserta" value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
            <input className={inputCls} placeholder="No. telepon / WA" value={form.telepon}
              onChange={(e) => setForm({ ...form, telepon: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button className={btnPrimary} disabled={saving}>{saving ? "Menyimpan..." : "Klaim slot"}</button>
            <button type="button" className={btnSecondary} onClick={() => setKlaimSlot(null)}>Batal</button>
          </div>
        </form>
      )}

      <section className="space-y-4">
        <h2 className="font-semibold">Peserta & kupon</h2>
        {data.slots.filter((s) => s.status !== "tersedia").map((s) => {
          const lunas = s.cicilan.filter((c) => c.status === "lunas").length;
          return (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Slot {s.nomorSlot}: {s.namaPeserta}</p>
                  <p className="text-sm text-slate-600">{s.telepon ?? "-"}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge tone={s.status === "lunas" ? "green" : "amber"}>
                      {s.status === "lunas" ? "Lunas" : `Cicilan ${lunas}/3`}
                    </Badge>
                    {s.jadwalSembelih && (
                      <Badge tone="slate">
                        Sembelih: {formatTanggal(s.jadwalSembelih.tanggal)}
                      </Badge>
                    )}
                  </div>
                </div>
                {s.kupon && (
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-2">
                    <img src={`/api/kupon/${s.kupon.kode}/qr`} alt={`QR ${s.kupon.kode}`} width={72} height={72} />
                    <div className="text-xs">
                      <p className="font-mono font-semibold">{s.kupon.kode}</p>
                      <Badge tone={s.kupon.status === "aktif" ? "green" : "slate"}>
                        {s.kupon.status === "aktif" ? "Aktif" : "Terpakai"}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link href={`/cicilan/${s.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
                  Kelola cicilan
                </Link>
                <span className="text-slate-300">|</span>
                <select
                  className={inputCls + " !w-auto text-sm"}
                  value={jadwalPilih[s.id] ?? (s.jadwalSembelihId ? String(s.jadwalSembelihId) : "")}
                  onChange={(e) => setJadwalPilih({ ...jadwalPilih, [s.id]: e.target.value })}
                >
                  <option value="">Pilih jadwal sembelih</option>
                  {jadwal.map((j) => (
                    <option key={j.id} value={j.id}>
                      {formatTanggal(j.tanggal)} - {j.lokasi} ({j.terpakai}/{j.kapasitas})
                    </option>
                  ))}
                </select>
                <button className={btnSecondary + " !py-1.5"} onClick={() => ikatJadwal(s.id)}>
                  Ikat jadwal
                </button>
              </div>
            </div>
          );
        })}
        {data.slotTerisi === 0 && (
          <p className="text-sm text-slate-500">Belum ada peserta. Klik slot tersedia di atas untuk klaim.</p>
        )}
      </section>
    </div>
  );
}
