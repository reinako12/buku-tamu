import { NextResponse } from "next/server";
import { ambilPesan } from "@/lib/chat";

/**
 * Polling ruang chat tamu.
 *
 * GET /api/chat/<token>/messages            → jendela terakhir
 * GET /api/chat/<token>/messages?after=120  → pesan baru setelah seq 120
 * GET /api/chat/<token>/messages?before=80  → 50 pesan sebelum seq 80
 *
 * Rute ini publik (lihat middleware): tamu tidak punya sesi. Token UUID-nya
 * sendiri yang jadi kunci, sama seperti halaman tiket.
 */
export const dynamic = "force-dynamic";

function angka(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : undefined;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const url = new URL(request.url);

  const hasil = await ambilPesan(token, {
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
