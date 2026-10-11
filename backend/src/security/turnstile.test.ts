import assert from "node:assert/strict";
import test from "node:test";

import {
  TurnstileError,
  verifyTurnstileTokenWith,
  type TurnstileConfiguration,
} from "./turnstile";

const configuration: TurnstileConfiguration = {
  secretKey: "test-secret",
  allowedHostnames: ["example.com"],
};

const logger = {
  error() {},
};

function siteverifyResponse(
  payload: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(payload), { status });
}

test("accepts a valid token only for the expected action and hostname", async () => {
  await verifyTurnstileTokenWith(
    "test-token",
    "review_submit",
    configuration,
    logger,
    async () =>
      siteverifyResponse({
        success: true,
        action: "review_submit",
        hostname: "example.com",
      })
  );
});

test("rejects missing, invalid, duplicate, mismatched-action, and mismatched-host tokens", async () => {
  await assert.rejects(
    verifyTurnstileTokenWith("", "review_submit", configuration, logger),
    (error: unknown) =>
      error instanceof TurnstileError && error.statusCode === 403
  );

  for (const payload of [
    { success: false, "error-codes": ["invalid-input-response"] },
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: true, action: "request_create", hostname: "example.com" },
    { success: true, action: "review_submit", hostname: "attacker.test" },
  ]) {
    await assert.rejects(
      verifyTurnstileTokenWith(
        "test-token",
        "review_submit",
        configuration,
        logger,
        async () => siteverifyResponse(payload)
      ),
      (error: unknown) =>
        error instanceof TurnstileError && error.statusCode === 403
    );
  }
});

test("fails closed for missing secrets and Siteverify failures", async () => {
  await assert.rejects(
    verifyTurnstileTokenWith(
      "test-token",
      "request_create",
      { ...configuration, secretKey: undefined },
      logger
    ),
    (error: unknown) =>
      error instanceof TurnstileError && error.statusCode === 503
  );

  for (const malformedPayload of ["null", "[]", '"not-an-object"']) {
    await assert.rejects(
      verifyTurnstileTokenWith(
        "test-token",
        "request_create",
        configuration,
        logger,
        async () =>
          new Response(malformedPayload, {
            headers: { "Content-Type": "application/json" },
          })
      ),
      (error: unknown) =>
        error instanceof TurnstileError && error.statusCode === 503
    );
  }

  await assert.rejects(
    verifyTurnstileTokenWith(
      "test-token",
      "request_create",
      configuration,
      logger,
      async () => {
        throw new Error("network error");
      }
    ),
    (error: unknown) =>
      error instanceof TurnstileError && error.statusCode === 503
  );

  await assert.rejects(
    verifyTurnstileTokenWith(
      "test-token",
      "request_create",
      configuration,
      logger,
      async () =>
        siteverifyResponse({
          success: false,
          "error-codes": ["invalid-input-secret"],
        })
    ),
    (error: unknown) =>
      error instanceof TurnstileError && error.statusCode === 503
  );
});

test("does not include the token or secret in public errors", async () => {
  await assert.rejects(
    verifyTurnstileTokenWith(
      "sensitive-token",
      "review_submit",
      configuration,
      logger,
      async () => siteverifyResponse({ success: false })
    ),
    (error: unknown) => {
      assert(error instanceof TurnstileError);
      assert(!error.message.includes("sensitive-token"));
      assert(!error.message.includes("test-secret"));
      return true;
    }
  );
});
