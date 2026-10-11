import assert from "node:assert/strict";
import test from "node:test";

import {
  sendSmsCode,
  SmsDeliveryError,
} from "./smsProvider";

const configuration = {
  username: "sandbox",
  apiKey: "mock-api-key",
  environment: "sandbox" as const,
};

test("sends a code through the mocked SMS gateway", async () => {
  let requestedUrl = "";
  let requestedBody = "";
  let requestedApiKey = "";

  await sendSmsCode(
    configuration,
    "+254712345678",
    "004281",
    async (url, init) => {
      requestedUrl = String(url);
      requestedBody = String(init?.body);
      requestedApiKey = new Headers(init?.headers).get("apiKey") ?? "";
      return new Response(
        JSON.stringify({
          SMSMessageData: {
            Recipients: [{ statusCode: 101 }],
          },
        }),
        { status: 201 }
      );
    }
  );

  assert.equal(
    requestedUrl,
    "https://api.sandbox.africastalking.com/version1/messaging"
  );
  assert.equal(requestedApiKey, "mock-api-key");
  assert.match(requestedBody, /to=%2B254712345678/);
  assert.match(requestedBody, /004281/);
});

test("does not treat a rejected SMS as successfully delivered", async () => {
  await assert.rejects(
    sendSmsCode(
      configuration,
      "+254712345678",
      "123456",
      async () =>
        new Response(
          JSON.stringify({
            SMSMessageData: {
              Recipients: [{ statusCode: 403 }],
            },
          }),
          { status: 200 }
        )
    ),
    SmsDeliveryError
  );
});

test("does not expose gateway response details on failures", async () => {
  await assert.rejects(
    sendSmsCode(
      configuration,
      "+254712345678",
      "123456",
      async () => new Response("private gateway response", { status: 503 })
    ),
    (error: unknown) =>
      error instanceof SmsDeliveryError &&
      !error.message.includes("private gateway response")
  );
});
