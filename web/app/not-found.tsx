import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-form flex-col justify-center px-md py-xl">
      <p className="masthead-org">{t("org.name")}</p>
      <p className="masthead-unit mb-lg">{t("org.unit")}</p>

      <h1 className="text-heading-page text-ink">{t("notFound.title")}</h1>
      <p className="mt-xs text-body-md text-ink-muted">{t("notFound.body")}</p>

      <Link href="/" className="btn-ghost mt-lg w-full sm:w-auto">
        {t("notFound.home")}
      </Link>
    </main>
  );
}
