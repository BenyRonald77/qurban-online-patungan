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

/**
 * Mutex sederhana per kunci (in-process). Dipakai untuk men-serialisasi
 * operasi tulis yang memakai transaksi interaktif di SQLite, karena SQLite
 * hanya punya satu writer: N transaksi interaktif bersamaan akan timeout.
 * Jaminan "tidak double-claim" tetap dipegang oleh updateMany dengan
 * where status + pengecekan jumlah row terpengaruh (bekerja lintas proses).
 */
const locks = new Map<string, Promise<void>>();
export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key);
  let release!: () => void;
  const cur = new Promise<void>((res) => {
    release = res;
  });
  locks.set(key, (prev ?? Promise.resolve()).then(
    () => cur,
    () => cur
  ));
  if (prev) await prev.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key)) locks.delete(key);
  }
}
