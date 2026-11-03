import { test } from "node:test";
import assert from "node:assert/strict";
import { canTransition, formatQueueNumber, todayInJakarta } from "./visit-status";

test("alur normal: menunggu → dipanggil → dilayani → selesai", () => {
  assert.equal(canTransition("menunggu", "dipanggil"), true);
  assert.equal(canTransition("dipanggil", "dilayani"), true);
  assert.equal(canTransition("dilayani", "selesai"), true);
});

test("tidak bisa melompati status wajib", () => {
  assert.equal(canTransition("selesai", "dilayani"), false);
  assert.equal(canTransition("selesai", "menunggu"), false);
  assert.equal(canTransition("batal", "selesai"), false);
});

test("petugas boleh membatalkan dan mengembalikan", () => {
  assert.equal(canTransition("menunggu", "batal"), true);
  assert.equal(canTransition("dipanggil", "menunggu"), true);
  assert.equal(canTransition("dilayani", "batal"), true);
});

test("status akhir tidak bisa diubah lagi", () => {
  assert.deepEqual(
    ["menunggu", "dipanggil", "dilayani", "selesai", "batal"].filter((s) =>
      canTransition(s as never, "selesai"),
    ),
    ["dilayani"],
  );
});

test("todayInJakarta memakai WIB, bukan UTC", () => {
  // 2026-11-03 00:30 WIB = 2026-11-02 17:30 UTC → tanggal harus 3
  const date = todayInJakarta(new Date("2026-11-02T17:30:00Z"));
  assert.equal(date.toISOString().slice(0, 10), "2026-11-03");

  // 2026-11-02 23:30 WIB = 2026-11-02 16:30 UTC → tetap 2
  const date2 = todayInJakarta(new Date("2026-11-02T16:30:00Z"));
  assert.equal(date2.toISOString().slice(0, 10), "2026-11-02");
});

test("nomor antrian 3 digit", () => {
  assert.equal(formatQueueNumber(1), "001");
  assert.equal(formatQueueNumber(42), "042");
  assert.equal(formatQueueNumber(999), "999");
});
