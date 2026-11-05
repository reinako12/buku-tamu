/**
 * Tujuan setelah login hanya boleh alamat di dalam aplikasi ini.
 *
 * Cukup memeriksa "diawali /" tidak aman: "//jahat.example" dan "/\jahat.example"
 * dua-duanya lolos, padahal peramban membacanya sebagai alamat situs lain.
 * Aturannya: tepat satu garis miring di depan, tanpa garis miring kedua dan
 * tanpa garis miring terbalik.
 */
export function safeNextPath(nilai: unknown, cadangan = "/dashboard"): string {
  if (typeof nilai !== "string") return cadangan;
  const jalur = nilai.trim();
  if (!jalur.startsWith("/")) return cadangan;
  if (jalur.startsWith("//") || jalur.startsWith("/\\")) return cadangan;
  // Karakter kendali bisa dipakai menyusun jalur yang tidak terbaca manusia.
  if (/[\u0000-\u001f\u007f]/.test(jalur)) return cadangan;
  return jalur;
}
