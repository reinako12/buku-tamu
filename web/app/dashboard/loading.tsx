import { getT } from "@/lib/i18n/server";

/** Kerangka dashboard: muncul saat data kunjungan masih diambil. */
export default async function DashboardLoading() {
  const t = await getT();

  return (
    <main className="mx-auto w-full max-w-container px-md py-lg">
      <header className="masthead mb-lg">
        <p className="masthead-org">{t("org.name")}</p>
        <p className="masthead-unit">{t("org.unit")}</p>
      </header>

      <p className="sr-only" role="status">
        {t("common.loading")}
      </p>

      <div className="mb-md h-8 w-56 skeleton" aria-hidden="true" />

      <div className="mb-lg flex gap-lg" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="w-16">
            <div className="mb-2xs h-7 w-10 skeleton" />
            <div className="h-3 w-14 skeleton" />
          </div>
        ))}
      </div>

      <div className="space-y-sm" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-sm border-y border-border py-sm">
            <div className="h-9 w-9 skeleton" />
            <div className="flex-1 space-y-2xs">
              <div className="h-4 w-40 skeleton" />
              <div className="h-3 w-24 skeleton" />
            </div>
            <div className="h-9 w-20 skeleton" />
          </div>
        ))}
      </div>
    </main>
  );
}
