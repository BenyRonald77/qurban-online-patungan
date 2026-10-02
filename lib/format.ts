export const rupiah = (n: number) =>
  "Rp" + Math.round(n).toLocaleString("id-ID");
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};
export const nowIso = () => new Date().toISOString();

export const formatTanggal = (t: string) => {
  const [y, m, d] = t.split("-");
  const namaBulan = [
    "Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus",
    "September","Oktober","November","Desember",
  ];
  return `${parseInt(d, 10)} ${namaBulan[parseInt(m, 10) - 1]} ${y}`;
};
