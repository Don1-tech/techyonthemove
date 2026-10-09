import type { RequestStatus, ServiceRequest } from "./request";

export type RequestFilter = "all" | RequestStatus;

export interface DashboardCounts {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface RequestDetailsProps {
  request: ServiceRequest;
  onClose: () => void;
  onStatusChange: (id: string, status: RequestStatus) => void;
}