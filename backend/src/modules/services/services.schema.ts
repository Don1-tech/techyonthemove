export const serviceIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      minLength: 1,
      maxLength: 100,
    },
  },
} as const;