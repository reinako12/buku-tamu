import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatQueue } from "@/lib/schemas/visit";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tiket kunjungan — BPS Kabupaten Tanah Datar",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  menunggu: "Menunggu dipanggil",
  dipanggil: "Sudah dipanggil",
  dilayani: "Sedang dilayani",
  selesai: "Selesai",
  batal: "Dibatalkan",
};

const STATUS_STYLE: Record<string, string> = {
  menunggu: "border-warning text-warning-dark",
  dipanggil: "border-primary text-primary",
  dilayani: "border-primary text-primary",
  selesai: "border-success text-success",
  batal: "border-danger text-danger",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();

  const visit = await prisma.visit.findUnique({ where: { token } });
  if (!visit) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const ticketUrl = `${proto}://${host}/t/${visit.token}`;

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(visit.checkInAt);

  const timeLabel = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(visit.checkInAt);

  const waText = encodeURIComponent(
    `Tiket buku tamu BPS Kabupaten Tanah Datar\nNomor antrian: ${formatQueue(visit.queueSeq)}\nTanggal: ${dateLabel}\nLink tiket: ${ticketUrl}`,
  );

  return (
    <main className="mx-auto w-full max-w-ticket px-md py-lg">
      <p className="mb-sm text-body-sm text-ink-muted">Tiket kunjungan Anda</p>

      <div className="ticket">
        <div className="px-md pb-md pt-lg text-center">
          <p className="text-caption font-semibold text-primary">
            BPS Kabupaten Tanah Datar
          </p>
          <p className="mt-md text-caption text-ink-muted">Nomor antrian</p>
          <p className="queue-number mt-2xs">{formatQueue(visit.queueSeq)}</p>
          <span
            className={`stamp mt-sm ${
              STATUS_STYLE[visit.status] ?? STATUS_STYLE.menunggu
            }`}
          >
            {STATUS_LABEL[visit.status] ?? visit.status}
          </span>
        </div>

        <div className="ticket-perf" />

        <dl className="space-y-sm px-md py-md">
          <div className="flex items-baseline justify-between gap-sm">
            <dt className="text-caption text-ink-muted">Nama</dt>
            <dd className="text-right text-body-sm font-medium text-ink">
              {visit.name}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-sm">
            <dt className="text-caption text-ink-muted">Instansi</dt>
            <dd className="text-right text-body-sm text-ink">{visit.institution}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-sm">
            <dt className="text-caption text-ink-muted">Jumlah orang</dt>
            <dd className="text-right font-mono text-body-sm text-ink">
              {visit.personCount}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-sm">
            <dt className="text-caption text-ink-muted">Waktu daftar</dt>
            <dd className="text-right text-body-sm text-ink">
              {dateLabel}, {timeLabel} WIB
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-md space-y-sm no-print">
        <a
          className="btn-ghost w-full"
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noreferrer"
        >
          Simpan tiket ke WhatsApp
        </a>
        <PrintButton label="Cetak tiket" />
      </div>

      <p className="mt-md text-caption text-ink-muted">
        Tunjukkan nomor ini ke petugas resepsionis. Halaman ini bisa dibuka lagi lewat
        tautan yang Anda simpan.
      </p>
    </main>
  );
}
