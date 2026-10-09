
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (
  configuredApiBaseUrl ?? "https://techyonthemove-api.onrender.com"
).replace(/\/+$/, "");
