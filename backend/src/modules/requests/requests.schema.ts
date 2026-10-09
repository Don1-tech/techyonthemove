export const createRequestBodySchema = {
  type: "object",
  required: [
    "serviceId",
    "fullName",
    "phone",
    "email",
    "location",
    "requestedDate",
    "requestedTime",
  ],
  additionalProperties: false,
  properties: {
    serviceId: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },

    issueId: {
      type: ["string", "null"],
      minLength: 1,
      maxLength: 100,
    },

    issueDetails: {
      type: ["string", "null"],
      maxLength: 2000,
    },

    fullName: {
      type: "string",
      minLength: 2,
      maxLength: 120,
    },

    phone: {
      type: "string",
      minLength: 7,
      maxLength: 30,
    },

    email: {
      type: "string",
      format: "email",
      maxLength: 255,
    },

    location: {
      type: "string",
      minLength: 2,
      maxLength: 1000,
    },

    directions: {
      type: ["string", "null"],
      maxLength: 2000,
    },

    requestedDate: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    },

    requestedTime: {
      type: "string",
      pattern: "^\\d{2}:\\d{2}(:\\d{2})?$",
    },

    approximatePrice: {
      type: ["number", "null"],
      minimum: 0,
    },
  },
} as const;
