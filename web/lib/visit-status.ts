export const VISIT_STATUSES = [
  "menunggu",
  "dipanggil",
  "dilayani",
  "selesai",
  "batal",
] as const;

export type VisitStatus = (typeof VISIT_STATUSES)[number];

/** Aksi yang boleh dilakukan petugas dari sebuah status. */
export const ALLOWED_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  menunggu: ["dipanggil", "dilayani", "batal"],
  dipanggil: ["dilayani", "batal", "menunggu"],
  dilayani: ["selesai", "batal"],
  selesai: [],
  batal: [],
};

export function canTransition(from: VisitStatus, to: VisitStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isVisitStatus(value: string): value is VisitStatus {
  return (VISIT_STATUSES as readonly string[]).includes(value);
}

/** Tanggal hari ini (WIB) sebagai Date UTC-midnight, cocok untuk kolom `date`. */
export function todayInJakarta(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return new Date(`${parts}T00:00:00.000Z`);
}

export function formatQueueNumber(seq: number): string {
  return String(seq).padStart(3, "0");
}
