import Link from "next/link";

/** Banner di dashboard selama buku tamu ditutup. */
export function ClosedBanner({
  reason,
  reopenLabel,
}: {
  reason: string | null;
  reopenLabel: string | null;
}) {
  return (
    <div
      role="status"
      className="mb-md flex flex-wrap items-center justify-between gap-sm border-l-2 border-warning bg-warning/[0.06] px-md py-sm"
    >
      <div>
        <p className="text-body-sm font-medium text-warning-dark">
          Buku tamu sedang ditutup
        </p>
        <p className="mt-2xs text-caption text-ink-muted">
          {reason ? `${reason}. ` : ""}
          {reopenLabel ? `Dibuka kembali ${reopenLabel} WIB.` : "Tidak ada jadwal buka kembali."}
        </p>
      </div>
      <Link href="/pengaturan" className="btn-ghost">
        Buka lagi
      </Link>
    </div>
  );
}
