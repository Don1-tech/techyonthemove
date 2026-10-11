import type { FastifyBaseLogger } from "fastify";

import { env } from "../config/env";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 5_000;
const CONFIGURATION_ERRORS = new Set([
  "bad-request",
  "internal-error",
  "invalid-input-secret",
  "missing-input-secret",
]);

interface SiteverifyResponse {
  success?: unknown;
  hostname?: unknown;
  action?: unknown;
  "error-codes"?: unknown;
}

export class TurnstileError extends Error {
  constructor(
    message: string,
    readonly statusCode: 403 | 503,
    readonly code: "invalid-token" | "unavailable"
  ) {
    super(message);
  }
}

export interface TurnstileConfiguration {
  secretKey: string | undefined;
  allowedHostnames: readonly string[];
}

export async function verifyTurnstileTokenWith(
  token: string,
  expectedAction: string,
  configuration: TurnstileConfiguration,
  logger: Pick<FastifyBaseLogger, "error">,
  fetcher: typeof fetch = fetch
): Promise<void> {
  if (!configuration.secretKey?.trim()) {
    logger.error("Turnstile secret is not configured");
    throw new TurnstileError(
      "Security verification is temporarily unavailable. Your information has not been submitted. Please try again shortly.",
      503,
      "unavailable"
    );
  }

  if (!token.trim()) {
    throw new TurnstileError(
      "Complete the security check and try again.",
      403,
      "invalid-token"
    );
  }

  let response: Response;
  try {
    response = await fetcher(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: configuration.secretKey,
        response: token,
      }),
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
  } catch {
    logger.error("Turnstile Siteverify request failed");
    throw new TurnstileError(
      "Security verification is temporarily unavailable. Your information has not been submitted. Please try again shortly.",
      503,
      "unavailable"
    );
  }

  if (!response.ok) {
    logger.error("Turnstile Siteverify returned an unsuccessful response");
    throw new TurnstileError(
      "Security verification is temporarily unavailable. Your information has not been submitted. Please try again shortly.",
      503,
      "unavailable"
    );
  }

  let siteverifyPayload: unknown;
  try {
    siteverifyPayload = await response.json();
  } catch {
    logger.error("Turnstile Siteverify returned an invalid response");
    throw new TurnstileError(
      "Security verification is temporarily unavailable. Your information has not been submitted. Please try again shortly.",
      503,
      "unavailable"
    );
  }

  if (
    typeof siteverifyPayload !== "object" ||
    siteverifyPayload === null ||
    Array.isArray(siteverifyPayload)
  ) {
    logger.error("Turnstile Siteverify returned a malformed response");
    throw new TurnstileError(
      "Security verification is temporarily unavailable. Your information has not been submitted. Please try again shortly.",
      503,
      "unavailable"
    );
  }

  const result = siteverifyPayload as SiteverifyResponse;
  const errorCodes = Array.isArray(result["error-codes"])
    ? result["error-codes"].filter(
        (value): value is string => typeof value === "string"
      )
    : [];
  if (errorCodes.some((code) => CONFIGURATION_ERRORS.has(code))) {
    logger.error(
      { errorCodes },
      "Turnstile rejected the server verification configuration"
    );
    throw new TurnstileError(
      "Security verification is temporarily unavailable. Your information has not been submitted. Please try again shortly.",
      503,
      "unavailable"
    );
  }

  if (result.success !== true) {
    throw new TurnstileError(
      "The security check expired or could not be verified. Complete it again and retry.",
      403,
      "invalid-token"
    );
  }

  const allowedHostnames = configuration.allowedHostnames.map((hostname) =>
    hostname.toLowerCase()
  );
  if (
    result.action !== expectedAction ||
    (allowedHostnames.length > 0 &&
      (typeof result.hostname !== "string" ||
        !allowedHostnames.includes(result.hostname.toLowerCase())))
  ) {
    throw new TurnstileError(
      "The security check could not be verified. Complete it again and retry.",
      403,
      "invalid-token"
    );
  }
}

export function verifyTurnstileToken(
  token: string,
  expectedAction: string,
  logger: Pick<FastifyBaseLogger, "error">,
  fetcher: typeof fetch = fetch
): Promise<void> {
  return verifyTurnstileTokenWith(
    token,
    expectedAction,
    {
      secretKey: env.turnstileSecretKey,
      allowedHostnames: env.turnstileAllowedHostnames,
    },
    logger,
    fetcher
  );
}
