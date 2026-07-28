import "server-only";
import { otpSmsMessage, type OtpSmsReason } from "@/lib/auth/sms-links";

const baseUrl = "https://clifze.shop/api/v1";
const requestTimeoutMs = 15_000;

function config() {
  const apiKey = process.env.CLIFZE_API_KEY;
  if (!apiKey) throw new Error("CLIFZE_API_KEY is not configured.");
  return { apiKey, senderId: process.env.CLIFZE_SENDER_ID };
}

async function request(path: string, fields: Record<string, string>) {
  const { apiKey, senderId } = config();
  const body = new URLSearchParams({ api_key: apiKey, ...fields });
  if (senderId) body.set("sender_id", senderId);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs)
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error("The SMS service took too long to respond. Please wait a moment and try again.");
    }
    throw new Error("The SMS service could not be reached. Please check your connection and try again.");
  }
  const result = await response.json().catch(() => null) as { status?: string; message?: string } | null;
  if (!response.ok || result?.status !== "success") throw new Error(result?.message || "The SMS provider could not complete the request.");
  return result;
}

export function sendOtp(recipient: string, reason: OtpSmsReason, actionUrl: string) {
  return request("/otp/send", { recipient, message: otpSmsMessage(reason, actionUrl), expiry: "10" });
}

export function verifyOtp(recipient: string, otpCode: string) {
  return request("/otp/verify", { recipient, otp_code: otpCode });
}

export function sendSms(recipient: string, message: string) {
  return request("/send", { recipient, message });
}
