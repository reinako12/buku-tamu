import type { ServiceState } from "@/lib/service-hours";

/**
 * Pemberitahuan jam layanan. Tidak memblokir pengisian: tamu di luar jam
 * tetap boleh mencatat kedatangan, petugas yang memutuskan.
 */
export function ServiceBanner({ state }: { state: ServiceState }) {
  if (state.status === "open" || !state.message) return null;

  const title =
    state.status === "break"
      ? "Sedang istirahat"
      : state.status === "weekend"
        ? "Kantor tutup hari ini"
        : "Di luar jam layanan";

  return (
    <div
      role="status"
      className="mb-md border-l-2 border-warning bg-warning/[0.06] px-sm py-sm"
    >
      <p className="text-label-sm text-warning-dark">{title}</p>
      <p className="mt-2xs text-body-sm text-ink">{state.message}</p>
    </div>
  );
}
