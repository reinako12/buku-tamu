import { NextResponse } from "next/server";
import { staffSesi } from "@/lib/auth";
import { daftarPercakapan, hitungBelumDibaca } from "@/lib/chat";

/**
 * Daftar percakapan untuk inbox petugas.
 *
 * Dipakai dua tempat: halaman `/dashboard/pesan` saat pertama dibuka (lewat
 * server component) dan polling daftar selama halaman terbuka. Hasilnya sama
 * supaya daftar tidak "berkedip" berganti bentuk.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const sesi = await staffSesi();
  if (!sesi) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [conversations, unread] = await Promise.all([
    daftarPercakapan(),
    hitungBelumDibaca(),
  ]);

  return NextResponse.json(
    { conversations, unread },
    { headers: { "cache-control": "no-store" } },
  );
}
