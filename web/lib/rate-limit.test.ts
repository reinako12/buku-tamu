import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, hashIp, resetRateLimit } from "./rate-limit";

test("3 percobaan pertama lolos, keempat diblokir", () => {
  resetRateLimit();
  const now = 1_000_000;
  assert.equal(checkRateLimit("ip-1", 3, 30_000, now).allowed, true);
  assert.equal(checkRateLimit("ip-1", 3, 30_000, now + 1000).allowed, true);
  assert.equal(checkRateLimit("ip-1", 3, 30_000, now + 2000).allowed, true);

  const blocked = checkRateLimit("ip-1", 3, 30_000, now + 3000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("setelah jendela waktu lewat, boleh lagi", () => {
  resetRateLimit();
  const now = 2_000_000;
  for (let i = 0; i < 3; i += 1) checkRateLimit("ip-2", 3, 30_000, now + i);
  assert.equal(checkRateLimit("ip-2", 3, 30_000, now + 5000).allowed, false);
  assert.equal(checkRateLimit("ip-2", 3, 30_000, now + 31_000).allowed, true);
});

test("IP berbeda punya kuota sendiri", () => {
  resetRateLimit();
  const now = 3_000_000;
  for (let i = 0; i < 3; i += 1) checkRateLimit("ip-3", 3, 30_000, now + i);
  assert.equal(checkRateLimit("ip-3", 3, 30_000, now + 10).allowed, false);
  assert.equal(checkRateLimit("ip-4", 3, 30_000, now + 10).allowed, true);
});

test("hash IP tidak menyimpan IP asli", () => {
  const hash = hashIp("203.0.113.7");
  assert.equal(hash.length, 16);
  assert.ok(!hash.includes("203"));
  assert.equal(hash, hashIp("203.0.113.7"));
  assert.notEqual(hash, hashIp("203.0.113.8"));
});
