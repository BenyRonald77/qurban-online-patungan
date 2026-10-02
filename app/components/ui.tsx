export function Loading({ teks = "Memuat..." }: { teks?: string }) {
  return <p className="py-8 text-center text-sm text-slate-500">{teks}</p>;
}

export function ErrorBox({ pesan, onRetry }: { pesan: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-medium">Terjadi kesalahan</p>
      <p className="mt-1">{pesan}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-700 px-3 py-1.5 text-white hover:bg-red-800"
        >
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function Empty({ teks }: { teks: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      {teks}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "slate" | "red" }) {
  const map = {
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    slate: "bg-slate-100 text-slate-700",
    red: "bg-red-100 text-red-800",
  };
  return (
    <span className={"inline-block rounded-full px-2.5 py-0.5 text-xs font-medium " + map[tone]}>
      {children}
    </span>
  );
}

export const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600";
export const btnPrimary =
  "rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50";
export const btnSecondary =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";
