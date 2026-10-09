import type { Request } from "../requests/requests.types";

const ADMIN_BACKEND_URL =
  process.env.ADMIN_BACKEND_URL ??
  "http://localhost:4100";

export async function notifyAdminRequestCreated(
  request: Request
): Promise<void> {
  try {
    const response = await fetch(
      `${ADMIN_BACKEND_URL}/api/internal/requests/created`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request,
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();

      console.error(
        `Admin notification failed: ${response.status} ${body}`
      );

      return;
    }

    console.log(
      `Admin notified about new request ${request.reference}.`
    );
  } catch (error) {
    console.error(
      "Could not notify admin backend about new request:",
      error
    );
  }
}