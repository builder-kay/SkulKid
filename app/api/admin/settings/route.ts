import { NextResponse } from "next/server";
import { readAdminSettingServer, writeAdminSettingServer } from "@/lib/admin/settings-server";

const SETTINGS_KEY = "platform-system-settings";

type SystemSettings = {
  maintenanceMode: boolean;
  allowTeacherPublishing: boolean;
  requireLessonApproval: boolean;
  signupEnabled: boolean;
  supportEmail: string;
};

const defaults: SystemSettings = {
  maintenanceMode: false,
  allowTeacherPublishing: true,
  requireLessonApproval: true,
  signupEnabled: true,
  supportEmail: "support@skulkid.app"
};

export async function GET() {
  try {
    const stored = await readAdminSettingServer<SystemSettings>(SETTINGS_KEY);
    return NextResponse.json({ settings: { ...defaults, ...(stored ?? {}) } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as Partial<SystemSettings>;
    const settings: SystemSettings = {
      maintenanceMode: Boolean(body.maintenanceMode),
      allowTeacherPublishing: body.allowTeacherPublishing !== false,
      requireLessonApproval: body.requireLessonApproval !== false,
      signupEnabled: body.signupEnabled !== false,
      supportEmail: typeof body.supportEmail === "string" && body.supportEmail.trim() ? body.supportEmail.trim() : defaults.supportEmail
    };
    await writeAdminSettingServer(SETTINGS_KEY, settings);
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save settings." }, { status: 500 });
  }
}
