import test from "node:test";
import assert from "node:assert/strict";
import { pecahTautan, teksPolos } from "./tautan";

test("teks tanpa alamat tetap satu potongan", () => {
  const hasil = pecahTautan("Halo, ada yang bisa dibantu?");
  assert.equal(hasil.length, 1);
  assert.equal(hasil[0].tautan, false);
  assert.equal(hasil[0].teks, "Halo, ada yang bisa dibantu?");
});

test("alamat di tengah kalimat dipisah dari teks sekitarnya", () => {
  const hasil = pecahTautan(
    "Lihat tiket: https://bukutamu.grrifixn.my.id/t/abc-123 setelah itu tunjukkan ke petugas.",
  );
  assert.deepEqual(hasil, [
    { teks: "Lihat tiket: ", tautan: false },
    { teks: "https://bukutamu.grrifixn.my.id/t/abc-123", tautan: true, href: "https://bukutamu.grrifixn.my.id/t/abc-123" },
    { teks: " setelah itu tunjukkan ke petugas.", tautan: false },
  ]);
});

test("titik di ujung kalimat tidak ikut jadi bagian alamat", () => {
  const hasil = pecahTautan("Buka https://contoh.id/t/1.");
  assert.equal(hasil[1].tautan, true);
  assert.equal(hasil[1].teks, "https://contoh.id/t/1");
  assert.equal(hasil[2].teks, ".");
});

test("tautan berlabel tampil sebagai kata, alamatnya tetap utuh", () => {
  const hasil = pecahTautan("Lihat tiket: [link](https://contoh.id/t/1)");
  assert.deepEqual(hasil, [
    { teks: "Lihat tiket: ", tautan: false },
    { teks: "link", tautan: true, href: "https://contoh.id/t/1" },
  ]);
});

test("label boleh lebih dari satu kata", () => {
  const hasil = pecahTautan("Buka [Lihat tiket](https://contoh.id/t/9) sekarang.");
  assert.deepEqual(hasil[1], {
    teks: "Lihat tiket",
    tautan: true,
    href: "https://contoh.id/t/9",
  });
  assert.equal(hasil[2].teks, " sekarang.");
});

test("alamat di dalam tautan berlabel tidak dihitung dua kali", () => {
  const hasil = pecahTautan("[link](https://contoh.id/t/1)");
  assert.equal(hasil.filter((p) => p.tautan).length, 1);
});

test("dua alamat dalam satu pesan dua-duanya dikenali", () => {
  const hasil = pecahTautan("https://a.id lalu https://b.id");
  const tautan = hasil.filter((p) => p.tautan).map((p) => p.href);
  assert.deepEqual(tautan, ["https://a.id", "https://b.id"]);
});

test("alamat di awal dan di akhir tanpa sisa teks kosong", () => {
  const hasil = pecahTautan("https://a.id");
  assert.deepEqual(hasil, [{ teks: "https://a.id", tautan: true, href: "https://a.id" }]);
});

test("teks kosong tetap menghasilkan satu potongan", () => {
  const hasil = pecahTautan("");
  assert.deepEqual(hasil, [{ teks: "", tautan: false }]);
});

test("nama berkas mirip alamat tanpa skema tidak dianggap tautan", () => {
  const hasil = pecahTautan("lihat www.contoh.id atau contoh.id");
  assert.equal(hasil.every((p) => !p.tautan), true);
});

test("teks polos melepas penanda tautan berlabel", () => {
  assert.equal(
    teksPolos("Lihat tiket: [link](https://contoh.id/t/1)"),
    "Lihat tiket: link",
  );
  assert.equal(
    teksPolos("Kunjungan tercatat.\nLihat tiket: [link](https://contoh.id/t/1)"),
    "Kunjungan tercatat.\nLihat tiket: link",
  );
});

test("teks polos tidak mengubah alamat biasa", () => {
  assert.equal(
    teksPolos("Kunjungi https://contoh.id/t/1"),
    "Kunjungi https://contoh.id/t/1",
  );
});
