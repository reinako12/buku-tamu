import type { Metadata } from "next";
import { ensureAutoReopen } from "@/lib/settings";
import { serviceState } from "@/lib/service-hours";
import { getT } from "@/lib/i18n/server";
import { CheckinForm } from "@/components/checkin-form";
import { ServiceBanner } from "@/components/service-banner";
import { LocaleToggle } from "@/components/locale-toggle";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("home.title")} — ${t("org.name")} ${t("org.unit")}` };
}

export default async function HomePage() {
  const t = await getT();
  const setting = await ensureAutoReopen();
  const state = serviceState(new Date());

  if (setting && !setting.isOpen) {
    return (
      <main className="mx-auto w-full max-w-page px-md py-xl">
        <header className="masthead mb-lg flex items-start justify-between gap-sm">
          <div>
            <p className="masthead-org">{t("org.name")}</p>
            <p className="masthead-unit">{t("org.unit")}</p>
          </div>
          <LocaleToggle />
        </header>

        <h1 className="text-heading-page text-ink">{t("closed.title")}</h1>
        <p className="mt-xs text-body-md text-ink-muted">
          {setting.closedReason ?? t("closed.defaultReason")}
        </p>

        <div className="meta-strip mt-lg">
          <span>{t("home.hoursLabel")}</span>
          <span className="font-medium text-ink">{t("hours.label")}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-page px-md py-lg sm:py-xl">
      <header className="masthead mb-lg flex items-start justify-between gap-sm">
        <div>
          <p className="masthead-org">{t("org.name")}</p>
          <p className="masthead-unit">{t("org.unit")}</p>
        </div>
        <LocaleToggle />
      </header>

      <h1 className="text-display-hero text-ink">{t("home.title")}</h1>
      <p className="mt-xs max-w-[46ch] text-body-md text-ink-muted">{t("home.lead")}</p>

      <div className="meta-strip mt-md mb-md">
        <span>{t("home.hoursLabel")}</span>
        <span className="font-medium text-ink">{t("hours.label")}</span>
      </div>

      <ServiceBanner state={state} />

      <div className="sheet sheet-accent">
        <div className="mb-lg">
          <h2 className="sheet-title">{t("home.sectionVisit")}</h2>
          <p className="sheet-note mt-2xs">{t("home.privacy")}</p>
        </div>
        <CheckinForm />
      </div>
    </main>
  );
}
