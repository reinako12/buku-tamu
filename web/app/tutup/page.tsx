import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serviceHoursLabel } from "@/lib/service-hours";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buku tamu ditutup — BPS Kabupaten Tanah Datar",
  robots: { index: false, follow: false },
};

export default async function ClosedPage() {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-form flex-col justify-center px-md py-xl">
      <div className="card">
        <h1 className="text-heading-page text-primary">Buku tamu ditutup</h1>
        <p className="mt-sm text-body-md text-ink-muted">
          {setting?.closedReason ??
            "Buku tamu ditutup sementara. Silakan datang pada hari kerja."}
        </p>

        {setting?.reopenAt ? (
          <p className="mt-sm text-body-sm text-ink">
            Dibuka kembali:{" "}
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "full",
              timeStyle: "short",
              timeZone: "Asia/Jakarta",
            }).format(setting.reopenAt)}{" "}
            WIB
          </p>
        ) : null}

        <p className="mt-lg text-caption text-ink-muted">
          Jam layanan: {serviceHoursLabel()}
        </p>

        <Link href="/" className="btn-ghost mt-md w-full">
          Coba buka lagi
        </Link>
      </div>
    </main>
  );
}
