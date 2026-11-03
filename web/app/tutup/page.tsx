import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAutoReopen } from "@/lib/settings";
import { serviceHoursLabel } from "@/lib/service-hours";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buku tamu ditutup — BPS Kabupaten Tanah Datar",
  robots: { index: false, follow: false },
};

export default async function ClosedPage() {
  const setting = await ensureAutoReopen();

  // Sudah dibuka (mungkin oleh auto-reopen) — tidak ada gunanya menahan tamu di sini.
  if (setting?.isOpen !== false) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-form flex-col justify-center px-md py-xl">
      <header className="masthead mb-lg">
        <p className="masthead-org">Badan Pusat Statistik</p>
        <p className="masthead-unit">Kabupaten Tanah Datar</p>
      </header>

      <h1 className="text-heading-page text-ink">Buku tamu ditutup</h1>
      <p className="mt-xs text-body-md text-ink-muted">
        {setting?.closedReason ??
          "Pencatatan tamu sedang tidak dibuka. Silakan datang pada hari kerja."}
      </p>

      {setting?.reopenAt ? (
        <p className="mt-sm text-body-sm text-ink">
          Dibuka kembali{" "}
          {new Intl.DateTimeFormat("id-ID", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Asia/Jakarta",
          }).format(setting.reopenAt)}{" "}
          WIB
        </p>
      ) : null}

      <div className="meta-strip mt-lg">
        <span>Jam layanan</span>
        <span className="font-medium text-ink">{serviceHoursLabel()}</span>
      </div>

      <Link href="/" className="btn-ghost mt-md w-full">
        Coba buka lagi
      </Link>
    </main>
  );
}
