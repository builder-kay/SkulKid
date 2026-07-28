import "server-only";
import { otpSmsMessage, type OtpSmsReason } from "@/lib/auth/sms-links";

const baseUrl = "https://sms.arkesel.com/api";
const requestTimeoutMs = 8_000;

type ArkeselResponse = {
  code?: string;
  message?: string;
  status?: string;
  ussd_code?: string;
};

function config() {
  const apiKey = process.env.ARKESEL_API_KEY;
  if (!apiKey) throw new Error("ARKESEL_API_KEY is not configured.");
  return {
    apiKey,
    senderId: process.env.ARKESEL_SENDER_ID || "SkulKid"
  };
}

async function request(path: string, body: Record<string, unknown>) {
  const { apiKey } = config();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs)
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error("The backup SMS service took too long to respond.");
    }
    throw new Error("The backup SMS service could not be reached.");
  }
  const result = await response.json().catch(() => null) as ArkeselResponse | null;
  if (!response.ok) {
    throw new Error(result?.message || "The backup SMS provider could not complete the request.");
  }
  return result;
}

export async function sendArkeselOtp(recipient: string, reason: OtpSmsReason, actionUrl: string) {
  const { senderId } = config();
  const result = await request("/otp/generate", {
    expiry: 10,
    length: 6,
    medium: "sms",
    message: otpSmsMessage(reason, actionUrl).replace("[otp]", "%otp_code%"),
    number: recipient,
    sender_id: senderId,
    type: "numeric"
  });
  if (result?.code !== "1000") {
    throw new Error(result?.message || "The backup SMS provider could not send the verification code.");
  }
  return {
    provider: "arkesel" as const,
    shortcode: result.ussd_code?.trim() || undefined
  };
}

export async function verifyArkeselOtp(recipient: string, otpCode: string) {
  const result = await request("/otp/verify", { number: recipient, code: otpCode });
  if (result?.code !== "1100") {
    throw new Error(result?.message || "The verification code is invalid or has expired.");
  }
  return { provider: "arkesel" as const };
}

export async function sendArkeselSms(recipient: string, message: string) {
  const { apiKey, senderId } = config();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v2/sms/send`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sender: senderId, message, recipients: [recipient] }),
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs)
    });
  } catch {
    throw new Error("The backup SMS service could not be reached.");
  }
  const result = await response.json().catch(() => null) as ArkeselResponse | null;
  if (!response.ok || result?.status !== "success") {
    throw new Error(result?.message || "The backup SMS provider could not send the message.");
  }
  return { provider: "arkesel" as const };
}
