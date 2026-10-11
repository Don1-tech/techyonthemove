import { API_BASE_URL } from "./config";

export interface CreateRequestInput {
  serviceId: string;
  issueDetails: string;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  directions: string;
  requestedDate: string;
  requestedTime: string;
}

export interface VerificationChallenge {
  verificationId: string;
  expiresAt: string;
  resendAt: string;
}

export interface ConfirmedRequest {
  reference: string;
  approximatePrice: number | null;
}

interface ApiErrorResponse {
  message?: string;
}

async function readResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiErrorResponse;
    throw new Error(error.message ?? fallbackMessage);
  }

  return data as T;
}

export async function startRequestVerification(
  input: CreateRequestInput
): Promise<VerificationChallenge> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  const data = await readResponse<{
    verification: VerificationChallenge;
  }>(response, "Unable to start phone verification.");
  return data.verification;
}

export async function verifyRequestPhone(
  verificationId: string,
  code: string,
  idempotencyKey: string
): Promise<ConfirmedRequest> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/verification/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ verificationId, code, idempotencyKey }),
    }
  );

  const data = await readResponse<{
    request: ConfirmedRequest;
  }>(response, "Unable to verify your phone number.");
  return data.request;
}

export async function resendRequestVerification(
  verificationId: string
): Promise<VerificationChallenge> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/verification/resend`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationId }),
    }
  );

  const data = await readResponse<{
    verification: VerificationChallenge;
  }>(response, "Unable to resend the verification code.");
  return data.verification;
}

export async function cancelRequestVerification(
  verificationId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/verification/cancel`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationId }),
    }
  );

  await readResponse<{ cancelled: boolean }>(
    response,
    "Unable to cancel phone verification."
  );
}
