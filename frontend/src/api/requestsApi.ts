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

export interface ConfirmedRequest {
  reference: string;
  approximatePrice: number | null;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

async function readResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // response is not JSON
  }

  if (!response.ok) {
    const error = (payload && typeof payload === "object" ? payload : {}) as ApiErrorResponse;

    if (response.status === 429) {
      throw new Error("Too many attempts. Please wait before trying again.");
    }
    if (response.status === 403) {
      if (
        error.code === "invalid-token" ||
        error.message?.toLowerCase().includes("security check")
      ) {
        throw new Error("Please complete the security check and try again.");
      }
      throw new Error(error.message ?? "Please complete the security check and try again.");
    }
    if (response.status === 503) {
      if (
        error.code === "unavailable" ||
        error.message?.toLowerCase().includes("security")
      ) {
        throw new Error(
          "Security verification is temporarily unavailable. Please try again shortly."
        );
      }
      throw new Error(error.message ?? fallbackMessage);
    }

    throw new Error(error.message ?? fallbackMessage);
  }

  return payload as T;
}

export async function createServiceRequest(
  input: CreateRequestInput,
  turnstileToken: string,
  idempotencyKey: string
): Promise<ConfirmedRequest> {
  const response = await fetch(
    `${API_BASE_URL}/api/requests`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...input, turnstileToken, idempotencyKey }),
    }
  );

  const data = await readResponse<{
    request: ConfirmedRequest;
  }>(response, "Unable to submit your service request.");
  return data.request;
}
