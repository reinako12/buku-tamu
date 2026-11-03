import { test } from "node:test";
import assert from "node:assert/strict";
import { fieldErrors, normalizePhone, visitFormSchema } from "./visit";

const valid = {
  name: "Budi Santoso",
  institutionCat: "pemda",
  institution: "Dinas Pendidikan",
  phone: "0812 3456 7890",
  purpose: "data",
  gender: "pr",
  detail: "",
  website: "",
};

test("normalisasi nomor HP: 08, 62, +62, dengan spasi", () => {
  assert.equal(normalizePhone("081234567890"), "+6281234567890");
  assert.equal(normalizePhone("0812-3456-7890"), "+6281234567890");
  assert.equal(normalizePhone("+62 812 3456 7890"), "+6281234567890");
  assert.equal(normalizePhone("6281234567890"), "+6281234567890");
  assert.equal(normalizePhone("81234567890"), "+6281234567890");
});

test("payload valid lolos dan nomor HP dinormalkan", () => {
  const result = visitFormSchema.safeParse(valid);
  assert.equal(result.success, true);
  assert.equal(result.data?.phone, "+6281234567890");
  assert.equal(result.data?.gender, "pr");
  assert.equal(result.data?.detail, null);
});

test("nama terlalu pendek ditolak", () => {
  const result = visitFormSchema.safeParse({ ...valid, name: "B" });
  assert.equal(result.success, false);
  assert.equal(fieldErrors(result.error!).name, "err.nameShort");
});

test("nomor HP tidak valid ditolak", () => {
  for (const phone of ["123", "0812", "abcdefghij", "0212345678"]) {
    const result = visitFormSchema.safeParse({ ...valid, phone });
    assert.equal(result.success, false, `harus ditolak: ${phone}`);
  }
});

test("kategori instansi dan tujuan harus dari daftar", () => {
  assert.equal(
    visitFormSchema.safeParse({ ...valid, institutionCat: "apa-saja" }).success,
    false,
  );
  assert.equal(
    visitFormSchema.safeParse({ ...valid, purpose: "ngobrol" }).success,
    false,
  );
});

test("jumlah orang: batas 1 sampai 50, harus angka", () => {
  assert.equal(visitFormSchema.safeParse({ ...valid, gender: "" }).success, false);
  assert.equal(visitFormSchema.safeParse({ ...valid, gender: "x" }).success, false);
  assert.equal(visitFormSchema.safeParse({ ...valid, gender: "lk" }).success, true);
  assert.equal(visitFormSchema.safeParse({ ...valid, gender: "pr" }).success, true);
});

test("honeypot terisi = ditolak", () => {
  const result = visitFormSchema.safeParse({ ...valid, website: "http://spam.example" });
  assert.equal(result.success, false);
});

test("keterangan kosong jadi null, bukan string kosong", () => {
  const result = visitFormSchema.safeParse({ ...valid, detail: "   " });
  assert.equal(result.success, true);
  assert.equal(result.data?.detail, null);
});

test("fieldErrors mengambil pesan pertama per field", () => {
  const result = visitFormSchema.safeParse({ ...valid, name: "B", phone: "123" });
  const errors = fieldErrors(result.error!);
  assert.ok(errors.name);
  assert.ok(errors.phone);
  assert.equal(Object.keys(errors).length, 2);
});
