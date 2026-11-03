import { getT } from "@/lib/i18n/server";

/** Kerangka halaman tiket. */
export default async function TicketLoading() {
  const t = await getT();

  return (
    <main className="mx-auto w-full max-w-form px-md py-xl">
      <p className="sr-only" role="status">
        {t("common.loading")}
      </p>

      <div className="mb-lg h-10 w-48 skeleton" aria-hidden="true" />
      <div className="sheet space-y-sm" aria-hidden="true">
        <div className="h-16 w-32 skeleton" />
        <div className="h-4 w-full skeleton" />
        <div className="h-4 w-2/3 skeleton" />
        <div className="h-4 w-1/2 skeleton" />
      </div>
    </main>
  );
}
