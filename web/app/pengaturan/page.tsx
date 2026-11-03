import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { readSetting } from "@/lib/settings";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengaturan buku tamu — BPS Kabupaten Tanah Datar",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  await requireStaff("/pengaturan");
  const setting = await readSetting();

  const isOpen = setting?.isOpen ?? true;

  return (
    <main className="mx-auto w-full max-w-page px-md py-lg sm:py-xl">
      <header className="masthead mb-lg flex flex-wrap items-end justify-between gap-sm">
        <div>
          <p className="masthead-org">Badan Pusat Statistik</p>
          <p className="masthead-unit">Kabupaten Tanah Datar</p>
        </div>
        <Link href="/dashboard" className="btn-quiet">
          Kembali ke dashboard
        </Link>
      </header>

      <h1 className="text-heading-page text-ink">Pengaturan buku tamu</h1>
      <p className="mt-xs max-w-[52ch] text-body-md text-ink-muted">
        Status saat ini:{" "}
        <span className={isOpen ? "font-medium text-success" : "font-medium text-danger"}>
          {isOpen ? "dibuka" : "ditutup"}
        </span>
        . Perubahan langsung berlaku untuk semua tamu.
      </p>

      <div className="sheet mt-lg">
        <SettingsForm
          isOpen={isOpen}
          closedReason={setting?.closedReason ?? null}
          reopenAt={setting?.reopenAt ? setting.reopenAt.toISOString() : null}
          autoReopen={setting?.autoReopen ?? true}
        />
      </div>
    </main>
  );
}
