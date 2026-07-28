import "server-only";
import { otpSmsMessage, type OtpSmsReason } from "@/lib/auth/sms-links";
import { sendArkeselOtp, sendArkeselSms, verifyArkeselOtp } from "@/lib/auth/arkesel";
import { bmsConfigured, sendBmsOtp } from "@/lib/auth/bms";
import { createFallbackOtp, verifyFallbackOtp } from "@/lib/auth/otp-challenge";

const baseUrl = "https://clifze.shop/api/v1";
const requestTimeoutMs = 8_000;

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

function arkeselConfigured() {
  return Boolean(process.env.ARKESEL_API_KEY);
}

export async function sendOtp(recipient: string, reason: OtpSmsReason, actionUrl: string) {
  const sends: Promise<{ provider: string; shortcode?: string }>[] = [
    request("/otp/send", { recipient, message: otpSmsMessage(reason, actionUrl), expiry: "10" })
      .then(() => ({ provider: "clifze" }))
  ];
  if (arkeselConfigured()) {
    sends.push(sendArkeselOtp(recipient, reason, actionUrl));
  }
  if (bmsConfigured()) {
    sends.push(
      createFallbackOtp(recipient).then((code) =>
        sendBmsOtp(recipient, otpSmsMessage(reason, actionUrl).replace("[otp]", code))
      )
    );
  }

  const results = await Promise.allSettled(sends);
  const successful = results
    .filter((result): result is PromiseFulfilledResult<{ provider: string; shortcode?: string }> => result.status === "fulfilled")
    .map((result) => result.value);
  if (successful.length === 0) {
    throw new AggregateError(
      results.filter((result) => result.status === "rejected").map((result) => result.reason),
      "No SMS provider could send the verification code."
    );
  }
  return {
    providers: successful.map((result) => result.provider),
    shortcode: successful.find((result) => result.shortcode)?.shortcode
  };
}

export async function verifyOtp(recipient: string, otpCode: string) {
  try {
    if (await verifyFallbackOtp(recipient, otpCode)) return { provider: "bms" as const };
  } catch {
    // BMS fallback storage may be unavailable while provider-managed OTPs still work.
  }
  let primaryError: unknown;
  try {
    await request("/otp/verify", { recipient, otp_code: otpCode });
    return { provider: "clifze" as const };
  } catch (error) {
    primaryError = error;
  }
  if (!arkeselConfigured()) throw primaryError;
  try {
    return await verifyArkeselOtp(recipient, otpCode);
  } catch (backupError) {
    throw new AggregateError([primaryError, backupError], "The verification code is invalid or has expired.");
  }
}

export async function sendSms(recipient: string, message: string) {
  try {
    await request("/send", { recipient, message });
    return { provider: "clifze" as const };
  } catch (primaryError) {
    if (!arkeselConfigured()) throw primaryError;
    try {
      return await sendArkeselSms(recipient, message);
    } catch (backupError) {
      throw new AggregateError([primaryError, backupError], "Neither SMS provider could send the message.");
    }
  }
}
