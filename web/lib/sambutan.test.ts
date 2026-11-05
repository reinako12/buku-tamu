import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AUTO_REPLY_BAWAAN,
  AUTO_REPLY_BAWAAN_EN,
  keLocale,
  pilihSambutan,
  teksKunjungan,
} from "../lib/sambutan";

test("bahasa tak dikenal dianggap Indonesia", () => {
  assert.equal(keLocale("en"), "en");
  assert.equal(keLocale("id"), "id");
  assert.equal(keLocale("fr"), "id");
  assert.equal(keLocale(null), "id");
  assert.equal(keLocale(undefined), "id");
});

test("isian petugas menang atas teks bawaan", () => {
  const kustom = { id: "Kantor tutup, besok kami balas.", en: "We are closed, back tomorrow." };
  assert.equal(pilihSambutan("id", kustom), kustom.id);
  assert.equal(pilihSambutan("en", kustom), kustom.en);
});

test("isian kosong atau spasi jatuh ke teks bawaan sesuai bahasa", () => {
  assert.equal(pilihSambutan("id", { id: "   ", en: "Hello" }), AUTO_REPLY_BAWAAN);
  assert.equal(pilihSambutan("en", { id: "Halo", en: "  " }), AUTO_REPLY_BAWAAN_EN);
  assert.equal(pilihSambutan("en"), AUTO_REPLY_BAWAAN_EN);
  assert.equal(pilihSambutan("id"), AUTO_REPLY_BAWAAN);
});

test("isian bahasa lain tidak bocor ke bahasa yang dipilih", () => {
  // Petugas hanya mengisi versi Inggris.
  assert.equal(pilihSambutan("id", { en: "Only English here" }), AUTO_REPLY_BAWAAN);
  assert.equal(pilihSambutan("en", { en: "Only English here" }), "Only English here");
});

test("nomor antrian disebut dalam bahasa tamu", () => {
  assert.equal(
    teksKunjungan("BT-20261105-001", "id"),
    "Kunjungan tercatat. Nomor antrian BT-20261105-001.",
  );
  assert.equal(
    teksKunjungan("BT-20261105-001", "en"),
    "Visit recorded. Your queue number is BT-20261105-001.",
  );
  assert.ok(teksKunjungan("BT-20261105-002", null).includes("Kunjungan tercatat"));
});

test("teks bawaan Inggris tidak tertukar dengan versi Indonesia", () => {
  assert.ok(AUTO_REPLY_BAWAAN.startsWith("Terima kasih"));
  assert.ok(AUTO_REPLY_BAWAAN_EN.startsWith("Thank you"));
  assert.notEqual(AUTO_REPLY_BAWAAN, AUTO_REPLY_BAWAAN_EN);
});
