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
