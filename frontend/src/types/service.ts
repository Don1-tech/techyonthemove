export interface Service {
  id: string;
  name: string;
  description: string | null;
  basePrice: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicesResponse {
  services: Service[];
}

export interface ServiceResponse {
  service: Service;
}
