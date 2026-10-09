import {
  findRequestById,
  findRequests,
  updateRequestStatus,
} from "./requests.repository.js";
import type {
  RequestStatus,
} from "./requests.types.js";

const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function getRequests(
  status?: RequestStatus,
  search?: string,
) {
  return findRequests(status, search);
}

export async function getRequestById(id: string) {
  return findRequestById(id);
}

export async function changeRequestStatus(
  id: string,
  nextStatus: RequestStatus,
) {
  const request = await findRequestById(id);

  if (!request) {
    return {
      request: null,
      error: "NOT_FOUND" as const,
    };
  }

  if (request.status === nextStatus) {
    return {
      request,
      error: null,
    };
  }

  if (!allowedTransitions[request.status].includes(nextStatus)) {
    return {
      request: null,
      error: "INVALID_TRANSITION" as const,
    };
  }

  const updated = await updateRequestStatus(
    id,
    nextStatus,
  );

  return {
    request: updated,
    error: null,
  };
}