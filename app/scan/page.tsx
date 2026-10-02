"use client";
import { useState } from "react";
import { Badge, inputCls, btnPrimary } from "../components/ui";

type Hasil = {
  ok: boolean;
  kupon?: {
    kode: string; status: string; dipakaiPada: string | null;
    slot: { nomorSlot: number; namaPeserta: string | null; hewan: { kode: string; nama: string } };
  };
  error?: string;
  dipakaiPada?: string | null;
};

export default function ScanPage() {
  const [kode, setKode] = useState("");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [loading, setLoading] = useState(false);

  const scan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim()) return;
    setLoading(true); setHasil(null);
    try {
      const res = await fetch(`/api/kupon/${encodeURIComponent(kode.trim())}/scan`, { method: "POST" });
      const d = await res.json();
      setHasil(res.ok ? { ok: true, kupon: d.kupon } : { ok: false, error: d.error, dipakaiPada: d.dipakaiPada ?? null, kupon: d.kupon });
    } catch {
      setHasil({ ok: false, error: "Gagal menghubungi server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan Kupon Pengambilan Daging</h1>
        <p className="mt-1 text-sm text-slate-600">
          Masukkan kode kupon peserta (mis. QPN-ABC123), lalu tandai daging sudah diambil.
          Kupon yang sudah dipakai akan ditolak.
        </p>
      </div>

      <form onSubmit={scan} className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="kode">
          Kode kupon
        </label>
        <div className="flex gap-2">
          <input
            id="kode"
            className={inputCls + " font-mono uppercase"}
            placeholder="QPN-XXXXXX"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            autoComplete="off"
          />
          <button className={btnPrimary + " whitespace-nowrap"} disabled={loading}>
            {loading ? "Memproses..." : "Tandai diambil"}
          </button>
        </div>
      </form>

      {hasil && (
        <div
          className={
            "rounded-xl border p-4 " +
            (hasil.ok ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50")
          }
        >
          {hasil.ok && hasil.kupon ? (
            <div className="flex items-center gap-4">
              <img src={`/api/kupon/${hasil.kupon.kode}/qr`} alt="QR kupon" width={96} height={96} />
              <div>
                <Badge tone="green">Daging diserahkan</Badge>
                <p className="mt-2 font-semibold">{hasil.kupon.slot.namaPeserta}</p>
                <p className="text-sm text-slate-600">
                  Slot {hasil.kupon.slot.nomorSlot} &middot; {hasil.kupon.slot.hewan.kode} {hasil.kupon.slot.hewan.nama}
                </p>
                <p className="font-mono text-sm">{hasil.kupon.kode}</p>
              </div>
            </div>
          ) : (
            <div>
              <Badge tone="red">Ditolak</Badge>
              <p className="mt-2 text-sm font-medium">{hasil.error}</p>
              {hasil.kupon && (
                <p className="mt-1 text-sm text-slate-600">
                  {hasil.kupon.slot.namaPeserta} &middot; slot {hasil.kupon.slot.nomorSlot}
                  {hasil.dipakaiPada ? ` &middot; dipakai pada ${hasil.dipakaiPada}` : ""}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
