import test from "node:test";
import assert from "node:assert/strict";
import { pecahTautan } from "./tautan";

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
    { teks: "https://bukutamu.grrifixn.my.id/t/abc-123", tautan: true },
    { teks: " setelah itu tunjukkan ke petugas.", tautan: false },
  ]);
});

test("titik di ujung kalimat tidak ikut jadi bagian alamat", () => {
  const hasil = pecahTautan("Buka https://contoh.id/t/1.");
  assert.equal(hasil[1].tautan, true);
  assert.equal(hasil[1].teks, "https://contoh.id/t/1");
  assert.equal(hasil[2].teks, ".");
});

test("dua alamat dalam satu pesan dua-duanya dikenali", () => {
  const hasil = pecahTautan("https://a.id lalu https://b.id");
  const tautan = hasil.filter((p) => p.tautan).map((p) => p.teks);
  assert.deepEqual(tautan, ["https://a.id", "https://b.id"]);
});

test("alamat di awal dan di akhir tanpa sisa teks kosong", () => {
  const hasil = pecahTautan("https://a.id");
  assert.deepEqual(hasil, [{ teks: "https://a.id", tautan: true }]);
});

test("teks kosong tetap menghasilkan satu potongan", () => {
  const hasil = pecahTautan("");
  assert.deepEqual(hasil, [{ teks: "", tautan: false }]);
});

test("nama berkas mirip alamat tanpa skema tidak dianggap tautan", () => {
  const hasil = pecahTautan("lihat www.contoh.id atau contoh.id");
  assert.equal(hasil.every((p) => !p.tautan), true);
});
