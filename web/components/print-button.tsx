"use client";

export function PrintButton({ label = "Cetak tiket" }: { label?: string }) {
  return (
    <button type="button" className="btn-ghost w-full" onClick={() => window.print()}>
      {label}
    </button>
  );
}
