export const createReviewSchema = {
  body: {
    type: "object",
    required: [
      "customerName",
      "serviceCategory",
      "rating",
      "reviewText",
      "turnstileToken",
      "idempotencyKey",
    ],
    additionalProperties: false,
    properties: {
      customerName: {
        type: "string",
        minLength: 2,
        maxLength: 120,
      },
      serviceCategory: {
        type: "string",
        minLength: 2,
        maxLength: 150,
      },

      rating: {
        type: "integer",
        minimum: 1,
        maximum: 5,
      },

      reviewText: {
        type: "string",
        minLength: 5,
        maxLength: 1000,
      },

      turnstileToken: {
        type: "string",
        minLength: 1,
        maxLength: 2048,
      },

      idempotencyKey: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

export const reviewIdSchema = {
  params: {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: {
      id: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;
