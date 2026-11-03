/**
 * HALAMAN CEK TOKEN — sementara, hanya untuk verifikasi Fase 0.
 * Akan diganti form buku tamu di Fase 1.
 */
const palette = [
  { name: "primary", hex: "#003C80", cls: "bg-primary" },
  { name: "primary-dark", hex: "#002B6A", cls: "bg-primary-dark" },
  { name: "primary-light", hex: "#0093DD", cls: "bg-primary-light" },
  { name: "accent-orange", hex: "#E27303", cls: "bg-accent-orange" },
  { name: "accent-green", hex: "#5DAB2C", cls: "bg-accent-green" },
  { name: "success", hex: "#1F630E", cls: "bg-success" },
  { name: "danger", hex: "#B7163E", cls: "bg-danger" },
  { name: "warning", hex: "#EB891B", cls: "bg-warning" },
  { name: "surface", hex: "#FCFCFC", cls: "bg-surface border border-border" },
  { name: "surface-muted", hex: "#F1F5F9", cls: "bg-surface-muted" },
  { name: "neutral-body", hex: "#EEF0F2", cls: "bg-neutral-body border border-border" },
  { name: "ink", hex: "#111111", cls: "bg-ink" },
];

export default function TokenCheckPage() {
  return (
    <main className="mx-auto max-w-container px-md py-xl sm:px-lg">
      <header className="mb-xl border-b border-border pb-md">
        <p className="font-wordmark text-caption italic uppercase tracking-wide text-ink-muted">
          Badan Pusat Statistik
        </p>
        <h1 className="mt-xs text-heading-page text-primary">
          Buku Tamu — Cek Token Desain
        </h1>
        <p className="mt-xs text-body-sm text-ink-muted">
          Halaman ini hanya untuk verifikasi Fase 0. Diganti form buku tamu di Fase 1.
        </p>
      </header>

      <section className="mb-xl">
        <h2 className="mb-sm text-heading-card">Palet</h2>
        <div className="grid grid-cols-2 gap-xs sm:grid-cols-3 lg:grid-cols-4">
          {palette.map((c) => (
            <div key={c.name} className="rounded-lg bg-surface p-sm">
              <div className={`mb-xs h-12 rounded-md ${c.cls}`} />
              <p className="text-label-sm">{c.name}</p>
              <p className="font-mono text-caption text-ink-muted">{c.hex}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-xl grid gap-md md:grid-cols-2">
        <div className="card">
          <h2 className="mb-sm text-heading-card">Tipografi</h2>
          <p className="text-display-hero text-primary">007</p>
          <p className="mt-xs text-body-sm text-ink-muted">
            display-hero · 30/36 · 700
          </p>
          <p className="mt-md text-heading-page">Judul Halaman</p>
          <p className="mt-xs text-body-sm text-ink-muted">heading-page · 28/33.6 · 600</p>
          <p className="mt-md text-body-md">
            Body 16/24 — angka di layar ini untuk memastikan Inter termuat.
          </p>
          <p className="mt-xs text-caption text-ink-muted">caption · 12/16</p>
        </div>

        <div className="card">
          <h2 className="mb-sm text-heading-card">Komponen dasar</h2>
          <div className="flex flex-wrap gap-xs">
            <button className="btn-primary">Tombol utama</button>
            <button className="btn-accent">Tombol aksi</button>
            <button className="btn-ghost">Sekunder</button>
          </div>
          <div className="mt-md space-y-sm">
            <input className="field" placeholder="Nama lengkap" />
            <input className="field" placeholder="08xx xxxx xxxx" inputMode="tel" />
          </div>
          <div className="mt-md flex flex-wrap gap-2xs">
            {["Menunggu", "Dipanggil", "Dilayani", "Selesai", "Batal"].map((s) => (
              <span
                key={s}
                className="rounded-md bg-surface-muted px-xs py-2xs text-caption text-ink-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border pt-md text-caption text-ink-muted">
        Radius kartu 12px · tombol 6px · input 8px · tanpa shadow · latar #EEF0F2
      </footer>
    </main>
  );
}
