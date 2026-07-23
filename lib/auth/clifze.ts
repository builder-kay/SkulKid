import "server-only";

const baseUrl = "https://clifze.shop/api/v1";

function config() {
  const apiKey = process.env.CLIFZE_API_KEY;
  if (!apiKey) throw new Error("CLIFZE_API_KEY is not configured.");
  return { apiKey, senderId: process.env.CLIFZE_SENDER_ID };
}

async function request(path: string, fields: Record<string, string>) {
  const { apiKey, senderId } = config();
  const body = new URLSearchParams({ api_key: apiKey, ...fields });
  if (senderId) body.set("sender_id", senderId);
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store"
  });
  const result = await response.json().catch(() => null) as { status?: string; message?: string } | null;
  if (!response.ok || result?.status !== "success") throw new Error(result?.message || "The SMS provider could not complete the request.");
  return result;
}

export function sendOtp(recipient: string, purpose: "signup" | "password-reset") {
  const message = purpose === "signup"
    ? "Your SkulKid signup code is [otp]. It expires in 10 minutes."
    : "Your SkulKid password reset code is [otp]. It expires in 10 minutes.";
  return request("/otp/send", { recipient, message, expiry: "10" });
}

export function verifyOtp(recipient: string, otpCode: string) {
  return request("/otp/verify", { recipient, otp_code: otpCode });
}
