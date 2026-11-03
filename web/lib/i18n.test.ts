import { test } from "node:test";
import assert from "node:assert/strict";
import { dictionaries, translate } from "./i18n/dict";

const idKeys = Object.keys(dictionaries.id).sort();
const enKeys = Object.keys(dictionaries.en).sort();

test("kamus: kunci ID dan EN sama persis", () => {
  assert.deepEqual(enKeys, idKeys);
});

test("kamus: tidak ada nilai kosong", () => {
  for (const locale of ["id", "en"] as const) {
    for (const [key, value] of Object.entries(dictionaries[locale])) {
      assert.ok(value.trim().length > 0, `${locale}.${key} kosong`);
    }
  }
});

test("kamus: pengganti {time} bekerja", () => {
  assert.match(translate("id", "settings.savedAt", { time: "10.32" }), /10\.32/);
  assert.match(translate("en", "settings.savedAt", { time: "10:32" }), /10:32/);
});

test("kamus: kunci tak dikenal dikembalikan apa adanya", () => {
  // @ts-expect-error sengaja kunci tidak valid
  assert.equal(translate("id", "tidak.ada"), "tidak.ada");
});
