export const requestStatusSchema = {
  type: "string",
  enum: ["pending", "confirmed", "completed", "cancelled"],
} as const;