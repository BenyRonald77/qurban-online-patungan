"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/", label: "Dashboard" },
  { href: "/hewan", label: "Hewan Qurban" },
  { href: "/jadwal", label: "Jadwal Sembelih" },
  { href: "/scan", label: "Scan Kupon" },
  { href: "/distribusi", label: "Distribusi" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="bg-emerald-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <Link href="/" className="mr-4 text-lg font-bold tracking-tight">
          Qurban Patungan
        </Link>
        <nav className="flex flex-wrap gap-1">
          {MENU.map((m) => {
            const aktif =
              m.href === "/" ? path === "/" : path.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className={
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                  (aktif
                    ? "bg-emerald-700 text-white"
                    : "text-emerald-100 hover:bg-emerald-800")
                }
              >
                {m.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
