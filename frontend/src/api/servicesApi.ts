import type {
  Service,
  ServiceResponse,
  ServicesResponse,
} from "../types/service";

import { API_BASE_URL } from "./config";

export async function getServices(): Promise<Service[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/services`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load services."
    );
  }

  const data: ServicesResponse =
    await response.json();

  return data.services;
}

export async function getServiceById(
  id: string
): Promise<Service> {
  const response = await fetch(
    `${API_BASE_URL}/api/services/${encodeURIComponent(id)}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load the selected service."
    );
  }

  const data: ServiceResponse =
    await response.json();

  return data.service;
}
