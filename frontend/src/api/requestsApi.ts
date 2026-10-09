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

interface CreateRequestResponse {
  request: {
    reference: string;
  };
}

interface ApiErrorResponse {
  message?: string;
}

export async function createRequest(
  input: CreateRequestInput
): Promise<CreateRequestResponse["request"]> {
  const response = await fetch(`${API_BASE_URL}/api/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();

    throw new Error(
      error.message ?? "Unable to submit your service request."
    );
  }

  const data: CreateRequestResponse = await response.json();
  return data.request;
}