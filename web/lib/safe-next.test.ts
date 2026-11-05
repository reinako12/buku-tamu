import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNextPath } from "../lib/safe-next";

test("jalur biasa diterima apa adanya", () => {
  assert.equal(safeNextPath("/dashboard"), "/dashboard");
  assert.equal(safeNextPath("/dashboard/pesan/123?x=1"), "/dashboard/pesan/123?x=1");
});

test("alamat situs lain dengan dua garis miring ditolak", () => {
  assert.equal(safeNextPath("//jahat.example"), "/dashboard");
  assert.equal(safeNextPath("//jahat.example/masuk"), "/dashboard");
});

test("garis miring terbalik juga ditolak", () => {
  assert.equal(safeNextPath("/\\jahat.example"), "/dashboard");
  assert.equal(safeNextPath("/\\/jahat.example"), "/dashboard");
});

test("alamat lengkap dengan protokol ditolak", () => {
  assert.equal(safeNextPath("https://jahat.example"), "/dashboard");
  assert.equal(safeNextPath("javascript:alert(1)"), "/dashboard");
});

test("bukan teks atau kosong jatuh ke cadangan", () => {
  assert.equal(safeNextPath(null), "/dashboard");
  assert.equal(safeNextPath(undefined), "/dashboard");
  assert.equal(safeNextPath(""), "/dashboard");
  assert.equal(safeNextPath(42), "/dashboard");
});

test("karakter kendali ditolak", () => {
  assert.equal(safeNextPath("/dashboard\u0000"), "/dashboard");
  assert.equal(safeNextPath("/dash\nboard"), "/dashboard");
});

test("cadangan bisa diganti", () => {
  assert.equal(safeNextPath("//x", "/pengaturan"), "/pengaturan");
});
