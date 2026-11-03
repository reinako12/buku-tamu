import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Masuk petugas — Buku Tamu BPS",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/") ? next : "/dashboard";

  return (
    <main className="mx-auto w-full max-w-form px-md py-xl">
      <header className="masthead mb-lg">
        <p className="masthead-org">Badan Pusat Statistik</p>
        <p className="masthead-unit">Kabupaten Tanah Datar</p>
      </header>

      <h1 className="text-heading-page text-ink">Masuk untuk petugas</h1>
      <p className="mt-xs max-w-[42ch] text-body-sm text-ink-muted">
        Halaman ini hanya untuk petugas resepsionis. Tamu tidak perlu masuk untuk
        mengisi buku tamu.
      </p>

      <div className="sheet mt-md">
        <LoginForm next={target} />
      </div>

      <p className="mt-md text-caption text-ink-muted">
        Lupa kata sandi? Hubungi pengelola sistem BPS Kabupaten Tanah Datar.
      </p>
    </main>
  );
}
