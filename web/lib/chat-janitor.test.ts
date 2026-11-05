import assert from "node:assert/strict";
import { test } from "node:test";
import { harusDihapus, harusDitutup, perluSapa, type SidangPercakapan } from "./chat-janitor";

const JAM = 60 * 60 * 1000;
const HARI = 24 * JAM;
const NOW = new Date("2026-11-05T10:00:00.000Z");

function baris(patch: Partial<SidangPercakapan> = {}): SidangPercakapan {
  return {
    status: "terbuka",
    lastMessageAt: new Date(NOW.getTime() - JAM),
    createdAt: new Date(NOW.getTime() - 2 * JAM),
    visitStatus: null,
    visitDoneAt: null,
    ...patch,
  };
}

test("percakapan yang baru ditulis belum ditutup", () => {
  assert.equal(harusDitutup(baris(), NOW), false);
});

test("diam 24 jam penuh sudah ditutup", () => {
  assert.equal(harusDitutup(baris({ lastMessageAt: new Date(NOW.getTime() - HARI) }), NOW), true);
});

test("tanpa pesan sama sekali, patokannya waktu dibuat", () => {
  const tua = baris({ lastMessageAt: null, createdAt: new Date(NOW.getTime() - 25 * JAM) });
  const baru = baris({ lastMessageAt: null, createdAt: new Date(NOW.getTime() - 2 * JAM) });
  assert.equal(harusDitutup(tua, NOW), true);
  assert.equal(harusDitutup(baru, NOW), false);
});

test("kunjungan selesai 25 jam lalu menutup percakapan walau pesannya baru", () => {
  const row = baris({
    visitStatus: "selesai",
    visitDoneAt: new Date(NOW.getTime() - 25 * JAM),
  });
  assert.equal(harusDitutup(row, NOW), true);
});

test("kunjungan selesai satu jam lalu belum menutup apa pun", () => {
  const row = baris({
    visitStatus: "selesai",
    visitDoneAt: new Date(NOW.getTime() - JAM),
  });
  assert.equal(harusDitutup(row, NOW), false);
});

test("percakapan yang sudah tertutup tidak diproses lagi", () => {
  const row = baris({ status: "ditutup", lastMessageAt: new Date(NOW.getTime() - 30 * HARI) });
  assert.equal(harusDitutup(row, NOW), false);
});

test("penghapusan hanya untuk yang lewat 90 hari", () => {
  assert.equal(harusDihapus(new Date(NOW.getTime() - 89 * HARI), NOW), false);
  assert.equal(harusDihapus(new Date(NOW.getTime() - 91 * HARI), NOW), true);
  assert.equal(harusDihapus(null, NOW), false);
});

test("sambutan luar jam hanya sekali per percakapan", () => {
  assert.equal(perluSapa({ status: "terbuka", autoRepliedAt: null }, false), true);
  assert.equal(perluSapa({ status: "terbuka", autoRepliedAt: new Date(NOW) }, false), false);
  assert.equal(perluSapa({ status: "terbuka", autoRepliedAt: null }, true), false);
  assert.equal(perluSapa({ status: "ditutup", autoRepliedAt: null }, false), false);
});
