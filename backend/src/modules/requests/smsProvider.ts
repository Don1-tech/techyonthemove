export interface SmsProviderConfiguration {
  username: string;
  apiKey: string;
  senderId?: string;
  environment: "sandbox" | "production";
}

export class SmsDeliveryError extends Error {}

export async function sendSmsCode(
  configuration: SmsProviderConfiguration,
  phone: string,
  code: string,
  fetcher: typeof fetch = fetch
): Promise<void> {
  const form = new URLSearchParams({
    username: configuration.username,
    to: phone,
    message: `Your Techy On The Move verification code is ${code}. It expires in 10 minutes.`,
  });

  if (configuration.senderId) {
    form.set("from", configuration.senderId);
  }

  const url =
    configuration.environment === "sandbox"
      ? "https://api.sandbox.africastalking.com/version1/messaging"
      : "https://api.africastalking.com/version1/messaging";

  let response: Response;
  try {
    response = await fetcher(url, {
      method: "POST",
      headers: {
        apiKey: configuration.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form.toString(),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new SmsDeliveryError();
  }

  if (!response.ok) {
    throw new SmsDeliveryError();
  }

  let result: {
    SMSMessageData?: {
      Recipients?: Array<{ statusCode?: number | string }>;
    };
  };
  try {
    result = await response.json();
  } catch {
    throw new SmsDeliveryError();
  }

  const recipient = result.SMSMessageData?.Recipients?.[0];
  if (
    !recipient ||
    !["100", "101", "102"].includes(String(recipient.statusCode))
  ) {
    throw new SmsDeliveryError();
  }
}
