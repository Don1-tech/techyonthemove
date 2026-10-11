import assert from "node:assert/strict";
import test from "node:test";

import {
  containsUnsafeMarkup,
  normalizeCustomerName,
  validateReviewSubmission,
} from "./reviewValidation";

test("normalizes names consistently without removing legitimate letters", () => {
  assert.equal(normalizeCustomerName(" Achieng  OTIENO "), "achiengotieno");
  assert.equal(normalizeCustomerName("José Mwangi"), "josemwangi");
});

test("rejects HTML, encoded markup, event handlers, and script URLs", () => {
  const payloads = [
    "<script>alert(1)</script>",
    "&lt;img src=x onerror=alert(1)&gt;",
    "%3Csvg%20onload%3Dalert(1)%3E",
    "%3Cscript%ZZ",
    "java&#x73;cript:alert(1)",
    "normal text onerror = alert(1)",
    "<scr<script>ipt>alert(1)</scr</script>ipt>",
  ];

  for (const payload of payloads) {
    assert.equal(containsUnsafeMarkup(payload), true, payload);
  }
});

test("allows genuine technical feedback and Kenyan names", () => {
  assert.equal(
    validateReviewSubmission(
      "Wanjiku O'Connor",
      "The technician configured my router, DHCP, and VLAN settings correctly."
    ),
    null
  );
});

test("rejects blank, repeated, keyboard-mashed, or abusive reviews", () => {
  assert.notEqual(validateReviewSubmission("Achieng", "   "), null);
  assert.notEqual(validateReviewSubmission("Achieng", "qwerty qwerty"), null);
  assert.notEqual(validateReviewSubmission("Achieng", "very very very very good"), null);
  assert.notEqual(validateReviewSubmission("Achieng", "This service was fucking bad"), null);
});
