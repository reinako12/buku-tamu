import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { serviceHoursLabel, serviceState } from "@/lib/service-hours";
import { CheckinForm } from "@/components/checkin-form";
import { ServiceBanner } from "@/components/service-banner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buku Tamu — BPS Kabupaten Tanah Datar",
  description: "Isi buku tamu digital BPS Kabupaten Tanah Datar.",
  robots: { index: false, follow: false },
};

export default async function HomePage() {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  const state = serviceState(new Date());

  if (setting && !setting.isOpen) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-form flex-col justify-center px-md py-xl">
        <div className="card">
          <h1 className="text-heading-page text-primary">Buku tamu ditutup</h1>
          <p className="mt-sm text-body-md text-ink-muted">
            {setting.closedReason ??
              "Buku tamu ditutup sementara. Silakan datang pada hari kerja."}
          </p>
          {setting.reopenAt ? (
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
            BPS Kabupaten Tanah Datar · {serviceHoursLabel()}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-form px-md py-lg">
      <header className="mb-md">
        <p className="text-caption uppercase tracking-wide text-ink-muted">
          Badan Pusat Statistik
        </p>
        <h1 className="text-heading-page text-primary">
          Buku Tamu Digital
        </h1>
        <p className="mt-2xs text-body-sm text-ink-muted">
          Kabupaten Tanah Datar
        </p>
      </header>

      <ServiceBanner state={state} />

      <div className="card">
        <CheckinForm />
      </div>

      <footer className="mt-md space-y-2xs text-caption text-ink-muted">
        <p>Jam layanan: {serviceHoursLabel()}</p>
        <p>
          Setelah mendaftar, tunjukkan nomor antrian kepada petugas resepsionis.
        </p>
      </footer>
    </main>
  );
}
