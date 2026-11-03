import { test } from "node:test";
import assert from "node:assert/strict";
import { serviceState, serviceHoursLabel } from "./service-hours";

/** Bantu bikin waktu WIB tanpa bergantung zona waktu mesin. */
const wib = (iso: string) => new Date(`${iso}+07:00`);

test("Senin pagi: layanan buka", () => {
  const state = serviceState(wib("2026-11-02T09:00:00"));
  assert.equal(state.status, "open");
  assert.equal(state.message, null);
});

test("Senin sebelum jam buka: di luar jam, sebut jam 08.00", () => {
  const state = serviceState(wib("2026-11-02T07:30:00"));
  assert.equal(state.status, "outside");
  assert.match(state.message ?? "", /08\.00/);
});

test("Senin istirahat: tetap boleh isi, sebut buka 13.00", () => {
  const state = serviceState(wib("2026-11-02T12:30:00"));
  assert.equal(state.status, "break");
  assert.match(state.message ?? "", /13\.00/);
});

test("Senin 15.59 masih buka, 16.00 sudah lewat", () => {
  assert.equal(serviceState(wib("2026-11-02T15:59:00")).status, "open");
  assert.equal(serviceState(wib("2026-11-02T16:00:00")).status, "outside");
});

test("Jumat: istirahat sampai 13.30 dan tutup 16.30", () => {
  const breakState = serviceState(wib("2026-11-06T12:45:00"));
  assert.equal(breakState.status, "break");
  assert.match(breakState.message ?? "", /13\.30/);

  assert.equal(serviceState(wib("2026-11-06T16:15:00")).status, "open");
  assert.equal(serviceState(wib("2026-11-06T16:30:00")).status, "outside");
});

test("Sabtu dan Minggu: tutup, sebut Senin", () => {
  const sabtu = serviceState(wib("2026-11-07T10:00:00"));
  assert.equal(sabtu.status, "weekend");
  assert.match(sabtu.message ?? "", /Senin/);

  const minggu = serviceState(wib("2026-11-08T10:00:00"));
  assert.equal(minggu.status, "weekend");
  assert.match(minggu.message ?? "", /Senin/);
});

test("Jumat lewat jam: buka lagi Senin, bukan besok", () => {
  const state = serviceState(wib("2026-11-06T17:00:00"));
  assert.equal(state.status, "outside");
  assert.match(state.message ?? "", /Senin/);
});

test("Perhitungan pakai WIB, bukan zona waktu server", () => {
  // 01.00 UTC = 08.00 WIB → tepat jam buka
  const state = serviceState(new Date("2026-11-02T01:00:00Z"));
  assert.equal(state.status, "open");
});

test("label jam layanan", () => {
  assert.match(serviceHoursLabel(), /Senin/);
  assert.match(serviceHoursLabel(), /Jumat/);
});
