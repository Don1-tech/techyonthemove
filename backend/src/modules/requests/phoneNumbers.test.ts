import assert from "node:assert/strict";
import test from "node:test";

import { normalizeKenyanPhone } from "./phoneNumbers";

test("normalizes common Kenyan mobile number formats", () => {
  assert.equal(normalizeKenyanPhone("0712 345 678"), "+254712345678");
  assert.equal(normalizeKenyanPhone("+254 712-345-678"), "+254712345678");
  assert.equal(normalizeKenyanPhone("712345678"), "+254712345678");
  assert.equal(normalizeKenyanPhone("0112 345 678"), "+254112345678");
});

test("rejects non-Kenyan and malformed phone numbers", () => {
  assert.equal(normalizeKenyanPhone("+1 212 555 0100"), null);
  assert.equal(normalizeKenyanPhone("0712"), null);
  assert.equal(normalizeKenyanPhone("abc 0712 345 678"), null);
  assert.equal(normalizeKenyanPhone("+254 +712345678"), null);
});
