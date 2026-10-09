export interface Review {
  id: string;
  customerName: string;
  serviceCategory: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export interface CreateReviewInput {
  customerName: string;
  serviceCategory: string;
  rating: number;
  reviewText: string;
}