/**
 * Jam layanan BPS Kabupaten Tanah Datar (WIB).
 *
 * Senin–Kamis : 08.00–16.00, istirahat 12.00–13.00
 * Jumat       : 08.00–16.30, istirahat 12.00–13.30
 * Sabtu–Minggu: tutup
 *
 * Semua perhitungan memakai zona Asia/Jakarta, bukan zona server —
 * server bisa UTC dan hasilnya akan salah kalau memakai jam lokal.
 */

const TIMEZONE = "Asia/Jakarta";

export type ServiceStatus = "open" | "break" | "outside" | "weekend";

export type ServiceState = {
  status: ServiceStatus;
  /** Pesan untuk tamu; null saat layanan normal. */
  message: string | null;
};

type DaySchedule = {
  start: number;
  end: number;
  breakStart: number;
  breakEnd: number;
} | null;

const MINUTES = (h: number, m = 0) => h * 60 + m;

const SCHEDULE: Record<number, DaySchedule> = {
  0: null, // Minggu
  1: { start: MINUTES(8), end: MINUTES(16), breakStart: MINUTES(12), breakEnd: MINUTES(13) },
  2: { start: MINUTES(8), end: MINUTES(16), breakStart: MINUTES(12), breakEnd: MINUTES(13) },
  3: { start: MINUTES(8), end: MINUTES(16), breakStart: MINUTES(12), breakEnd: MINUTES(13) },
  4: { start: MINUTES(8), end: MINUTES(16), breakStart: MINUTES(12), breakEnd: MINUTES(13) },
  5: { start: MINUTES(8), end: MINUTES(16, 30), breakStart: MINUTES(12), breakEnd: MINUTES(13, 30) },
  6: null, // Sabtu
};

const DAY_LABEL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

type JakartaNow = { day: number; minutes: number };

function jakartaNow(now: Date): JakartaNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const day = weekdayMap[get("weekday")] ?? 0;
  // "24" muncul di sebagian runtime saat tengah malam
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));

  return { day, minutes: hour * 60 + minute };
}

function timeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}.${String(m).padStart(2, "0")}`;
}

/** Nama hari kerja berikutnya (termasuk hari ini kalau belum lewat jam buka). */
function nextOpenDayLabel(now: Date, includeToday: boolean): string {
  const base = jakartaNow(now);
  for (let offset = includeToday ? 0 : 1; offset <= 7; offset += 1) {
    const candidate = new Date(now.getTime() + offset * 86_400_000);
    const { day } = jakartaNow(candidate);
    if (SCHEDULE[day]) {
      const label = DAY_LABEL[day];
      return offset === 0 ? "hari ini" : offset === 1 ? `besok (${label})` : label;
    }
  }
  return "hari kerja berikutnya";
}

export function serviceState(now: Date = new Date()): ServiceState {
  const { day, minutes } = jakartaNow(now);
  const schedule = SCHEDULE[day];

  if (!schedule) {
    return {
      status: "weekend",
      message: `Hari ini kantor tutup. Buku tamu dibuka lagi ${nextOpenDayLabel(now, false)} pukul 08.00.`,
    };
  }

  if (minutes < schedule.start) {
    return {
      status: "outside",
      message: `Layanan belum dibuka. Buku tamu dibuka pukul ${timeLabel(schedule.start)} hari ini.`,
    };
  }

  if (minutes >= schedule.breakStart && minutes < schedule.breakEnd) {
    return {
      status: "break",
      message: `Kantor sedang istirahat. Buku tamu dibuka lagi pukul ${timeLabel(schedule.breakEnd)}.`,
    };
  }

  if (minutes >= schedule.end) {
    return {
      status: "outside",
      message: `Di luar jam layanan. Buku tamu dibuka lagi ${nextOpenDayLabel(now, false)} pukul 08.00.`,
    };
  }

  return { status: "open", message: null };
}

/** Label jam layanan untuk ditampilkan di footer form. */
export function serviceHoursLabel(): string {
  return "Senin sampai Kamis 08.00–16.00, Jumat 08.00–16.30";
}
