import { NextResponse } from "next/server";
import { staffSesi } from "@/lib/auth";
import { ambilPesanPetugas } from "@/lib/chat";

/**
 * Polling ruang petugas. Bentuk jawabannya sama dengan rute tamu, hanya
 * kuncinya id percakapan dan pemanggilnya wajib punya sesi petugas.
 *
 * GET /api/pesan/<id>/messages            → jendela terakhir
 * GET /api/pesan/<id>/messages?after=120  → pesan baru setelah seq 120
 * GET /api/pesan/<id>/messages?before=80  → halaman pesan lama
 */
export const dynamic = "force-dynamic";

function angka(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sesi = await staffSesi();
  if (!sesi) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(request.url);

  const hasil = await ambilPesanPetugas(id, {
    after: angka(url.searchParams.get("after")),
    before: angka(url.searchParams.get("before")),
  });

  if (!hasil) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  return NextResponse.json(hasil, {
    headers: { "cache-control": "no-store" },
  });
}
