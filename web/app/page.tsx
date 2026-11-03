import type { Metadata } from "next";
import { ensureAutoReopen } from "@/lib/settings";
import { serviceHoursLabel, serviceState } from "@/lib/service-hours";
import { CheckinForm } from "@/components/checkin-form";
import { ServiceBanner } from "@/components/service-banner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buku Tamu — BPS Kabupaten Tanah Datar",
};

export default async function HomePage() {
  const setting = await ensureAutoReopen();
  const state = serviceState(new Date());

  if (setting && !setting.isOpen) {
    return (
      <main className="mx-auto w-full max-w-page px-md py-xl">
        <header className="masthead mb-lg">
          <p className="masthead-org">Badan Pusat Statistik</p>
          <p className="masthead-unit">Kabupaten Tanah Datar</p>
        </header>

        <h1 className="text-heading-page text-ink">Buku tamu ditutup</h1>
        <p className="mt-xs text-body-md text-ink-muted">
          {setting.closedReason ??
            "Pencatatan tamu sedang tidak dibuka. Silakan kembali pada jam layanan."}
        </p>

        <div className="meta-strip mt-lg">
          <span>Jam layanan</span>
          <span className="font-medium text-ink">{serviceHoursLabel()}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-page px-md py-lg sm:py-xl">
      <header className="masthead mb-lg">
        <p className="masthead-org">Badan Pusat Statistik</p>
        <p className="masthead-unit">Kabupaten Tanah Datar</p>
      </header>

      <h1 className="text-display-hero text-ink">Buku tamu</h1>
      <p className="mt-xs max-w-[46ch] text-body-md text-ink-muted">
        Isi data kunjungan Anda di bawah ini. Setelah terkirim, Anda menerima nomor
        antrian yang bisa ditunjukkan ke petugas.
      </p>

      <div className="meta-strip mt-md mb-md">
        <span>Jam layanan</span>
        <span className="font-medium text-ink">{serviceHoursLabel()}</span>
      </div>

      <ServiceBanner state={state} />

      <div className="sheet">
        <div className="mb-lg">
          <h2 className="sheet-title">Data kunjungan</h2>
          <p className="sheet-note mt-2xs">
            Kolom bertanda bintang wajib diisi. Nomor HP dipakai untuk menghubungi Anda
            bila diperlukan.
          </p>
        </div>
        <CheckinForm />
      </div>

    </main>
  );
}
