export interface AvailabilitySlot {
  time: string;
  available: boolean;
}

export interface AvailabilityDay {
  date: string;
  slots: AvailabilitySlot[];
}

export interface AvailabilityResponse {
  availability: AvailabilityDay[];
}