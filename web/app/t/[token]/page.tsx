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
  menunggu: "Menunggu",
  dipanggil: "Dipanggil",
  dilayani: "Sedang dilayani",
  selesai: "Selesai",
  batal: "Dibatalkan",
};

const STATUS_STYLE: Record<string, string> = {
  menunggu: "bg-warning/10 text-warning-dark border-warning/40",
  dipanggil: "bg-primary-light/10 text-primary border-primary-light/40",
  dilayani: "bg-primary-light/10 text-primary border-primary-light/40",
  selesai: "bg-success/10 text-success border-success/40",
  batal: "bg-danger/5 text-danger border-danger/40",
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
    <main className="mx-auto w-full max-w-form px-md py-lg">
      <div className="card text-center">
        <p className="text-caption uppercase tracking-wide text-ink-muted">
          Nomor antrian
        </p>
        <p className="mt-xs text-[64px] font-bold leading-none text-primary">
          {formatQueue(visit.queueSeq)}
        </p>

        <div
          className={`mx-auto mt-sm inline-flex items-center rounded-sm border px-sm py-2xs text-label-sm ${
            STATUS_STYLE[visit.status] ?? STATUS_STYLE.menunggu
          }`}
        >
          {STATUS_LABEL[visit.status] ?? visit.status}
        </div>

        <dl className="mt-lg space-y-xs text-left">
          <div>
            <dt className="text-caption text-ink-muted">Nama</dt>
            <dd className="text-body-md text-ink">{visit.name}</dd>
          </div>
          <div>
            <dt className="text-caption text-ink-muted">Instansi</dt>
            <dd className="text-body-md text-ink">{visit.institution}</dd>
          </div>
          <div>
            <dt className="text-caption text-ink-muted">Jumlah orang</dt>
            <dd className="text-body-md text-ink">{visit.personCount} orang</dd>
          </div>
          <div>
            <dt className="text-caption text-ink-muted">Waktu daftar</dt>
            <dd className="text-body-md text-ink">
              {dateLabel}, {timeLabel} WIB
            </dd>
          </div>
        </dl>

        <div className="mt-lg space-y-sm no-print">
          <a
            className="btn-primary w-full"
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noreferrer"
          >
            Simpan link ke WhatsApp
          </a>
          <PrintButton />
        </div>
      </div>

      <p className="mt-md text-center text-caption text-ink-muted">
        Simpan halaman ini. Tunjukkan nomor antrian kepada petugas resepsionis.
      </p>
    </main>
  );
}
