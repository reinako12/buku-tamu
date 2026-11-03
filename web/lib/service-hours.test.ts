import { test } from "node:test";
import assert from "node:assert/strict";
import { serviceState } from "./service-hours";

/** Bantu: bikin Date dari jam dinding WIB. */
const wib = (iso: string) => new Date(`${iso}+07:00`);

test("jam layanan: Senin pagi jam kerja", () => {
  const state = serviceState(wib("2026-11-02T09:00:00"));
  assert.equal(state.status, "open");
});

test("jam layanan: sebelum dibuka", () => {
  const state = serviceState(wib("2026-11-02T07:00:00"));
  assert.equal(state.status, "outside");
  if (state.status === "outside") {
    assert.equal(state.nextAt.toISOString(), "2026-11-02T01:00:00.000Z");
  }
});

test("jam layanan: istirahat siang", () => {
  const state = serviceState(wib("2026-11-02T12:15:00"));
  assert.equal(state.status, "break");
  if (state.status === "break") {
    assert.equal(state.until.toISOString(), "2026-11-02T06:00:00.000Z");
  }
});

test("jam layanan: Jumat istirahat lebih panjang", () => {
  const state = serviceState(wib("2026-11-06T13:00:00"));
  assert.equal(state.status, "break");
  if (state.status === "break") {
    assert.equal(state.until.toISOString(), "2026-11-06T06:30:00.000Z");
  }
});

test("jam layanan: Jumat 16.15 masih buka, 16.45 tutup", () => {
  assert.equal(serviceState(wib("2026-11-06T16:15:00")).status, "open");
  assert.equal(serviceState(wib("2026-11-06T16:45:00")).status, "outside");
});

test("jam layanan: Sabtu tutup, buka Senin 08.00", () => {
  const state = serviceState(wib("2026-11-07T10:00:00"));
  assert.equal(state.status, "weekend");
  if (state.status === "weekend") {
    assert.equal(state.nextAt.toISOString(), "2026-11-09T01:00:00.000Z");
  }
});

test("jam layanan: lewat jam kerja buka besok", () => {
  const state = serviceState(wib("2026-11-02T20:00:00"));
  assert.equal(state.status, "outside");
  if (state.status === "outside") {
    assert.equal(state.nextAt.toISOString(), "2026-11-03T01:00:00.000Z");
  }
});
