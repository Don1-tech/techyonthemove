export type RequestStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface ServiceRequest {
  id: string;
  reference: string;
  serviceId: string;
  serviceName: string;
  issueId?: string | null;
  issueDetails: string;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  directions: string;
  requestedDate: string;
  requestedTime: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  approximatePrice: number | null;
}
