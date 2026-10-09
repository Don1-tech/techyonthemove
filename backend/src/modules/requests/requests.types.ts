export interface CreateRequestInput {
  serviceId: string;
  issueId?: string | null;
  issueDetails?: string | null;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  directions?: string | null;
  requestedDate: string;
  requestedTime: string;
  approximatePrice?: number | null;
}

export interface Request {
  id: string;
  reference: string;
  serviceId: string;
  issueId: string | null;
  issueDetails: string | null;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  directions: string | null;
  requestedDate: string;
  requestedTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  approximatePrice: number | null;
}
