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
    <main className="mx-auto flex min-h-screen w-full max-w-form flex-col justify-center px-md py-xl">
      <header className="mb-md">
        <p className="text-caption uppercase tracking-wide text-ink-muted">
          Badan Pusat Statistik
        </p>
        <h1 className="text-heading-page text-primary">Masuk petugas</h1>
        <p className="mt-2xs text-body-sm text-ink-muted">
          Halaman ini hanya untuk petugas resepsionis BPS Kabupaten Tanah Datar.
        </p>
      </header>

      <div className="card">
        <LoginForm next={target} />
      </div>

      <p className="mt-md text-caption text-ink-muted">
        Tamu tidak perlu masuk. Silakan buka halaman utama untuk mengisi buku tamu.
      </p>
    </main>
  );
}
