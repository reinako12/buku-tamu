import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseJakartaInput,
  shouldAutoReopen,
  toJakartaInputValue,
} from "./settings-rules";

const base = { isOpen: false, autoReopen: true, reopenAt: new Date("2026-11-04T01:00:00Z") };
const now = new Date("2026-11-04T01:30:00Z");

test("auto-reopen: dibuka kalau sudah lewat jadwal", () => {
  assert.equal(shouldAutoReopen(base, now), true);
});

test("auto-reopen: belum waktunya", () => {
  assert.equal(shouldAutoReopen(base, new Date("2026-11-04T00:30:00Z")), false);
});

test("auto-reopen: tidak jalan kalau sudah buka", () => {
  assert.equal(shouldAutoReopen({ ...base, isOpen: true }, now), false);
});

test("auto-reopen: tidak jalan kalau auto dimatikan", () => {
  assert.equal(shouldAutoReopen({ ...base, autoReopen: false }, now), false);
});

test("auto-reopen: tidak jalan tanpa jadwal", () => {
  assert.equal(shouldAutoReopen({ ...base, reopenAt: null }, now), false);
});

test("auto-reopen: setting kosong", () => {
  assert.equal(shouldAutoReopen(null, now), false);
});

test("parseJakartaInput membaca jam dinding sebagai WIB", () => {
  const parsed = parseJakartaInput("2026-11-04T08:00");
  assert.equal(parsed?.toISOString(), "2026-11-04T01:00:00.000Z");
});

test("parseJakartaInput menolak format salah", () => {
  assert.equal(parseJakartaInput("4 November 2026"), null);
  assert.equal(parseJakartaInput(""), null);
});

test("toJakartaInputValue bolak-balik tetap sama", () => {
  const value = toJakartaInputValue(new Date("2026-11-04T01:00:00Z"));
  assert.equal(value, "2026-11-04T08:00");
  assert.equal(parseJakartaInput(value)?.toISOString(), "2026-11-04T01:00:00.000Z");
});
