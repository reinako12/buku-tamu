/**
 * Jam layanan BPS Kabupaten Tanah Datar (WIB).
 *
 * Senin–Kamis : 08.00–16.00, istirahat 12.00–13.00
 * Jumat       : 08.00–16.30, istirahat 12.00–13.30
 * Sabtu–Minggu: tutup
 *
 * Semua perhitungan memakai zona Asia/Jakarta, bukan zona server — server
 * bisa UTC dan hasilnya akan salah kalau memakai jam lokal.
 *
 * Fungsi ini sengaja tidak mengembalikan kalimat jadi: teks disusun di UI
 * lewat kamus, supaya bisa ID maupun EN.
 */

const TIMEZONE = "Asia/Jakarta";
const JAKARTA_OFFSET_MINUTES = 7 * 60;

export type ServiceStatus = "open" | "break" | "outside" | "weekend";

export type ServiceState =
  | { status: "open" }
  | { status: "break"; until: Date }
  | { status: "outside"; nextAt: Date }
  | { status: "weekend"; nextAt: Date };

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

type JakartaParts = { day: number; minutes: number; year: number; month: number; date: number };

function jakartaParts(now: Date): JakartaParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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

  return {
    day,
    minutes: hour * 60 + minute,
    year: Number(get("year")),
    month: Number(get("month")),
    date: Number(get("day")),
  };
}

/** Date (UTC) untuk jam dinding WIB tertentu. */
function jakartaDate(
  year: number,
  month: number,
  date: number,
  minutes: number,
): Date {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const utc = Date.UTC(year, month - 1, date, hour, minute);
  return new Date(utc - JAKARTA_OFFSET_MINUTES * 60 * 1000);
}

/** Waktu buka berikutnya (08.00 WIB pada hari kerja terdekat). */
function nextOpenAt(now: Date, includeToday: boolean): Date {
  const base = jakartaParts(now);
  for (let offset = includeToday ? 0 : 1; offset <= 7; offset += 1) {
    const candidate = new Date(now.getTime() + offset * 86_400_000);
    const parts = jakartaParts(candidate);
    if (SCHEDULE[parts.day]) {
      return jakartaDate(parts.year, parts.month, parts.date, SCHEDULE[parts.day]!.start);
    }
  }
  return jakartaDate(base.year, base.month, base.date, MINUTES(8));
}

export function serviceState(now: Date = new Date()): ServiceState {
  const parts = jakartaParts(now);
  const schedule = SCHEDULE[parts.day];

  if (!schedule) {
    return { status: "weekend", nextAt: nextOpenAt(now, false) };
  }

  if (parts.minutes < schedule.start) {
    return { status: "outside", nextAt: nextOpenAt(now, true) };
  }

  if (parts.minutes >= schedule.breakStart && parts.minutes < schedule.breakEnd) {
    return {
      status: "break",
      until: jakartaDate(parts.year, parts.month, parts.date, schedule.breakEnd),
    };
  }

  if (parts.minutes >= schedule.end) {
    return { status: "outside", nextAt: nextOpenAt(now, false) };
  }

  return { status: "open" };
}
