import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listPointDeductionDisputes,
  requireAdmin,
  resolvePointDeductionDispute
} from "@/lib/classes/classroom-server";

const schema = z.object({
  disputeId: z.string().uuid(),
  resolution: z.enum(["upheld", "reversed"]),
  note: z.string().trim().min(4).max(600)
});

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ disputes: await listPointDeductionDisputes() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load disputes." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = schema.parse(await request.json());
    await resolvePointDeductionDispute({ adminId: admin.id, ...input });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to resolve dispute." }, { status: 400 });
  }
}
