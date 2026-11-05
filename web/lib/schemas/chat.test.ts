import { test } from "node:test";
import assert from "node:assert/strict";
import { chatStartErrors, chatStartSchema } from "./chat";

const valid = { name: "Rina", phone: "0812-3456-7890", website: "" };

test("nama dan nomor dinormalkan", () => {
  const result = chatStartSchema.safeParse({ ...valid, name: "  Rina  " });
  assert.equal(result.success, true);
  assert.equal(result.data?.name, "Rina");
  assert.equal(result.data?.phone, "+6281234567890");
});

test("dua penulisan nomor yang sama menghasilkan nilai identik", () => {
  const a = chatStartSchema.parse({ ...valid, phone: "0812 3456 7890" });
  const b = chatStartSchema.parse({ ...valid, phone: "+62 812-3456-7890" });
  assert.equal(a.phone, b.phone);
});

test("nama terlalu pendek ditolak", () => {
  const result = chatStartSchema.safeParse({ ...valid, name: "R" });
  assert.equal(result.success, false);
  assert.equal(chatStartErrors(result.error!).name, "err.nameShort");
});

test("nomor kantor dan nomor terlalu pendek ditolak", () => {
  for (const phone of ["0212345678", "0812", "abcdefghij", "081234567890123"]) {
    const result = chatStartSchema.safeParse({ ...valid, phone });
    assert.equal(result.success, false, phone);
    assert.equal(chatStartErrors(result.error!).phone, "err.phoneInvalid");
  }
});

test("honeypot yang terisi ditolak", () => {
  const result = chatStartSchema.safeParse({ ...valid, website: "http://spam" });
  assert.equal(result.success, false);
});
