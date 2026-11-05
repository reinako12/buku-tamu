import { getT } from "@/lib/i18n/server";

/** Kerangka halaman chat: kop, judul, satu lembar isi. */
export default async function ChatLoading() {
  const t = await getT();

  return (
    <main className="mx-auto w-full max-w-page px-md py-lg sm:py-xl">
      <p className="sr-only" role="status">
        {t("common.loading")}
      </p>

      <div className="mb-lg h-10 w-48 skeleton" aria-hidden="true" />
      <div className="mb-md h-9 w-64 skeleton" aria-hidden="true" />
      <div className="sheet space-y-lg" aria-hidden="true">
        <div className="h-12 w-full skeleton" />
        <div className="h-12 w-full skeleton" />
        <div className="h-12 w-40 skeleton" />
      </div>
    </main>
  );
}
