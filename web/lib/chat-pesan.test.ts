import { test } from "node:test";
import assert from "node:assert/strict";
import { PESAN_MAKS, periksaPesan } from "./chat-pesan";

test("pesan: spasi saja dianggap kosong", () => {
  assert.equal(periksaPesan("   \n\t "), "empty");
});

test("pesan: teks biasa diterima", () => {
  assert.equal(periksaPesan("Jam berapa layanan loket?"), null);
});

test("pesan: tepat 1000 karakter masih boleh", () => {
  assert.equal(periksaPesan("a".repeat(PESAN_MAKS)), null);
});

test("pesan: 1001 karakter ditolak", () => {
  assert.equal(periksaPesan("a".repeat(PESAN_MAKS + 1)), "long");
});
