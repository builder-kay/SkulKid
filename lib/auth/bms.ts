import "server-only";

const baseUrl = "https://api.mnotify.com/api";
const requestTimeoutMs = 8_000;

type BmsSendResponse = {
  status?: string;
  code?: string | number;
  message?: string;
  summary?: { _id?: string };
};

type BmsDeliveryResponse = {
  status?: string;
  report?: Array<{ recipient?: string; status?: string }>;
};

function config() {
  const apiKey = process.env.BMS_API_KEY;
  if (!apiKey) throw new Error("BMS_API_KEY is not configured.");
  return {
    apiKey,
    senderId: process.env.BMS_SENDER_ID || "SkulKid"
  };
}

export function bmsConfigured() {
  return Boolean(process.env.BMS_API_KEY);
}

export async function sendBmsOtp(recipient: string, message: string) {
  const { apiKey, senderId } = config();
  const url = new URL(`${baseUrl}/sms/quick`);
  url.searchParams.set("key", apiKey);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: [recipient],
      sender: senderId,
      message,
      is_schedule: false,
      schedule_date: "",
      sms_type: "otp"
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(requestTimeoutMs)
  });
  const result = await response.json().catch(() => null) as BmsSendResponse | null;
  if (!response.ok || result?.status !== "success" || String(result.code) !== "2000") {
    throw new Error(result?.message || "BMS could not send the verification code.");
  }
  const campaignId = result.summary?._id;
  const deliveryStatus = campaignId
    ? await checkBmsDelivery(campaignId, recipient).catch(() => "UNKNOWN")
    : "UNKNOWN";
  return { provider: "bms" as const, campaignId, deliveryStatus };
}

async function checkBmsDelivery(campaignId: string, recipient: string) {
  const { apiKey } = config();
  const url = new URL(`${baseUrl}/campaign/${encodeURIComponent(campaignId)}`);
  url.searchParams.set("key", apiKey);
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(requestTimeoutMs)
  });
  const result = await response.json().catch(() => null) as BmsDeliveryResponse | null;
  if (!response.ok || result?.status !== "success") return "UNKNOWN";
  return result.report?.find((item) => item.recipient === recipient)?.status || "PENDING";
}
