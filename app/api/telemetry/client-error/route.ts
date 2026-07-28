import { NextResponse } from "next/server";
import { z } from "zod";
import { recordOperationalEvent, requestIp } from "@/lib/admin/operational-events";

const schema = z.object({
  digest: z.string().max(160).optional(),
  path: z.string().max(300).optional(),
  message: z.string().max(300).optional()
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    await recordOperationalEvent({
      category: "application",
      eventType: "client.crash",
      outcome: "failure",
      severity: "high",
      route: input.path,
      ip: requestIp(request),
      metadata: { digest: input.digest, message: input.message }
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}

