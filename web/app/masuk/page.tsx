import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { LocaleToggle } from "@/components/locale-toggle";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Masuk petugas",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const t = await getT();
  const { next } = await searchParams;
  const target = next && next.startsWith("/") ? next : "/dashboard";

  return (
    <main className="mx-auto w-full max-w-form px-md py-xl">
      <header className="masthead mb-lg flex items-start justify-between gap-sm">
        <div>
          <p className="masthead-org">{t("org.name")}</p>
          <p className="masthead-unit">{t("org.unit")}</p>
        </div>
        <LocaleToggle />
      </header>

      <h1 className="text-heading-page text-ink">{t("login.title")}</h1>
      <p className="mt-xs max-w-[42ch] text-body-sm text-ink-muted">{t("login.lead")}</p>

      <div className="sheet mt-md">
        <LoginForm next={target} />
      </div>

      <Link href="/" className="mt-md inline-block text-caption text-ink-muted underline">
        {t("login.backHome")}
      </Link>
    </main>
  );
}
