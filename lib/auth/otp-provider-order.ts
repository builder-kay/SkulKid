import "server-only";
import { readAdminSettingServer } from "@/lib/admin/settings-server";
import type { OtpProvider } from "@/lib/auth/otp-provider-diagnostics";

export const defaultOtpProviderOrder: OtpProvider[] = ["bms", "clifze", "arkesel"];

type PlatformSystemSettings = {
  smsProviderOrder?: unknown;
};

export function normalizeOtpProviderOrder(value: unknown): OtpProvider[] {
  if (!Array.isArray(value)) return [...defaultOtpProviderOrder];
  const allowed = new Set<OtpProvider>(defaultOtpProviderOrder);
  const unique = value.filter(
    (provider, index): provider is OtpProvider =>
      typeof provider === "string"
      && allowed.has(provider as OtpProvider)
      && value.indexOf(provider) === index
  );
  return unique.length === defaultOtpProviderOrder.length
    ? unique
    : [...defaultOtpProviderOrder];
}

export async function getOtpProviderOrder() {
  try {
    const settings = await readAdminSettingServer<PlatformSystemSettings>("platform-system-settings");
    return normalizeOtpProviderOrder(settings?.smsProviderOrder);
  } catch {
    // OTP delivery must keep working if operational settings are temporarily unavailable.
    return [...defaultOtpProviderOrder];
  }
}
