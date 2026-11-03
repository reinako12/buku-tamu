import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { readSetting } from "@/lib/settings";
import { SettingsForm } from "@/components/settings-form";
import { LocaleToggle } from "@/components/locale-toggle";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengaturan buku tamu",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const t = await getT();
  await requireStaff("/pengaturan");
  const setting = await readSetting();

  const isOpen = setting?.isOpen ?? true;

  return (
    <main className="mx-auto w-full max-w-page px-md py-lg sm:py-xl">
      <header className="masthead mb-lg flex flex-wrap items-end justify-between gap-sm">
        <div>
          <p className="masthead-org">{t("org.name")}</p>
          <p className="masthead-unit">{t("org.unit")}</p>
        </div>
        <div className="flex items-center gap-xs">
          <LocaleToggle />
          <Link href="/dashboard" className="btn-quiet">
            {t("settings.backDashboard")}
          </Link>
        </div>
      </header>

      <h1 className="text-heading-page text-ink">{t("settings.title")}</h1>
      <p className="mt-xs max-w-[52ch] text-body-md text-ink-muted">
        {t("settings.currentPrefix")}{" "}
        <span className={isOpen ? "font-medium text-success" : "font-medium text-danger"}>
          {isOpen ? t("settings.currentOpen") : t("settings.currentClosed")}
        </span>
        . {t("settings.currentSuffix")}
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
