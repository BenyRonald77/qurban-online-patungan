export const JUMLAH_SLOT = 7;
export const JUMLAH_TERMIN = 3;

/** Bagi harga per slot menjadi 3 termin; selisih pembulatan di termin terakhir. */
export function bagiTermin(hargaPerSlot: number): number[] {
  const per = Math.floor(hargaPerSlot / JUMLAH_TERMIN);
  const hasil = Array(JUMLAH_TERMIN - 1).fill(per);
  hasil.push(hargaPerSlot - per * (JUMLAH_TERMIN - 1));
  return hasil;
}

export function kodeKupon(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return `QPN-${s}`;
}

export function jatuhTempoTermin(terminKe: number): string {
  // jatuh tempo: tanggal 15, 3 bulan berurutan mulai bulan depan relatif sederhana
  const d = new Date();
  d.setMonth(d.getMonth() + terminKe);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-15`;
}

export type StatusSlot = "tersedia" | "terklaim" | "lunas";

export function statusHewanDariSlot(terisi: number): string {
  return terisi >= JUMLAH_SLOT ? "penuh" : "tersedia";
}

export function isTanggalValid(t: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return false;
  const d = new Date(t + "T00:00:00");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t;
}
