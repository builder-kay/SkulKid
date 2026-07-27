import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type AppealTokenPayload = { teacherId: string; exp: number };

function secret() {
  const value = process.env.PHONE_BLOCKLIST_HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Appeal token signing is not configured.");
  return value;
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function createAppealToken(teacherId: string) {
  const body = Buffer.from(JSON.stringify({ teacherId, exp: Date.now() + 15 * 60_000 } satisfies AppealTokenPayload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyAppealToken(token: string) {
  const [body, supplied] = token.split(".");
  if (!body || !supplied) throw new Error("Your appeal session is invalid. Request a new code.");
  const expected = sign(body);
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("Your appeal session is invalid. Request a new code.");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AppealTokenPayload;
  if (!payload.teacherId || payload.exp < Date.now()) throw new Error("Your appeal session has expired. Request a new code.");
  return payload;
}
