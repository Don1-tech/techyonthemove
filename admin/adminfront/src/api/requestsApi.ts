import type {
  RequestStatus,
  ServiceRequest,
} from "../types/request";

const API_BASE_URL =
  import.meta.env.VITE_ADMIN_API_URL ??
  "http://localhost:4100";

interface AdminRequestsResponse {
  requests: ServiceRequest[];
}

interface AdminRequestResponse {
  request: ServiceRequest;
}

function getServiceName(
  serviceId: string,
): string {
  const names: Record<string, string> = {
    "wifi-internet": "Wi-Fi & Internet",
    "network-issues": "Network Issues",
    "pc-laptops": "PC & Laptops",
    "tv-entertainment": "TV & Entertainment",
    "smart-home": "Smart Home",
    "smart-devices": "Smart Devices",
    cctv: "CCTV",
    "other-repairs": "Other Repairs",
  };

  return (
    names[serviceId] ??
    serviceId
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      )
  );
}

function normalizeRequest(
  request: ServiceRequest,
): ServiceRequest {
  return {
    ...request,
    serviceName:
      request.serviceName ||
      getServiceName(request.serviceId),
  };
}

export async function getRequests(
  status?: RequestStatus,
  search?: string,
): Promise<ServiceRequest[]> {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();

  const response = await fetch(
    `${API_BASE_URL}/api/admin/requests${
      query ? `?${query}` : ""
    }`,
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load admin requests.",
    );
  }

  const data =
    (await response.json()) as AdminRequestsResponse;

  return data.requests.map(normalizeRequest);
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<ServiceRequest> {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/requests/${encodeURIComponent(
      id,
    )}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    },
  );

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => null);

    throw new Error(
      data?.message ??
        "Failed to update request status.",
    );
  }

  const data =
    (await response.json()) as AdminRequestResponse;

  return normalizeRequest(data.request);
}
