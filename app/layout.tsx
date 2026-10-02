import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Qurban Online Patungan",
  description: "Kelola qurban sapi patungan: slot, cicilan, jadwal sembelih, kupon QR, distribusi",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">{children}</body>
    </html>
  );
}
