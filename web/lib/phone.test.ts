import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidPhone, normalizePhone, phoneDigits } from "./phone";

test("format nomor disamakan jadi +62", () => {
  const expected = "+6281234567890";
  assert.equal(normalizePhone("081234567890"), expected);
  assert.equal(normalizePhone("0812-3456-7890"), expected);
  assert.equal(normalizePhone("0812 3456 7890"), expected);
  assert.equal(normalizePhone("+62 812 3456 7890"), expected);
  assert.equal(normalizePhone("6281234567890"), expected);
  assert.equal(normalizePhone("81234567890"), expected);
  assert.equal(normalizePhone("+62-812-3456-7890"), expected);
});

test("nomor kosong jadi string kosong, bukan '+62'", () => {
  assert.equal(normalizePhone(""), "");
  assert.equal(normalizePhone("   "), "");
  assert.equal(normalizePhone("+62"), "");
  assert.equal(normalizePhone("0"), "");
});

test("nomor luar negeri tidak dipaksa jadi nomor Indonesia", () => {
  assert.equal(normalizePhone("+65 8123 4567"), "+6581234567");
});

test("validasi nomor seluler Indonesia", () => {
  assert.equal(isValidPhone("081234567890"), true);
  assert.equal(isValidPhone("+62 812-3456-7890"), true);
  // terlalu pendek, nomor kantor, bukan angka, terlalu panjang
  assert.equal(isValidPhone("0812"), false);
  assert.equal(isValidPhone("0212345678"), false);
  assert.equal(isValidPhone("abcdefghij"), false);
  assert.equal(isValidPhone("1234567890123456"), false);
});

test("panjang total 10–15 digit diterima, di luar itu ditolak", () => {
  assert.equal(isValidPhone("081234567"), true); // 10 digit
  assert.equal(isValidPhone("08123456789012"), true); // 15 digit
  assert.equal(isValidPhone("08123456"), false); // 9 digit
  assert.equal(isValidPhone("081234567890123"), false); // 16 digit
  assert.equal(phoneDigits("+62 812-3456"), "628123456");
});
