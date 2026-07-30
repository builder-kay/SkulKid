import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const metadataSchema = z.object({
  title: z.string().trim().min(2).max(160),
  subject: z.string().trim().min(2).max(100),
  grades: z.string().transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean)).pipe(z.array(z.enum(["KG1","KG2","B1","B2","B3","B4","B5","B6"])).min(1)),
  authority: z.string().trim().max(160).default(""),
  sourceUrl: z.string().trim().url().or(z.literal("")).default(""),
  publishedYear: z.string().transform((value) => value ? Number(value) : null).pipe(z.number().int().min(1900).max(2100).nullable())
});
const allowedTypes = new Set(["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword"]);

async function ensureBucket() {
  const admin = createAdminClient();
  const { data } = await admin.storage.getBucket("teacher-curricula");
  if (!data) await admin.storage.createBucket("teacher-curricula", { public: false, fileSizeLimit: 15 * 1024 * 1024, allowedMimeTypes: [...allowedTypes] });
}
export async function GET() {
  try {
    const teacher = await requireTeacher(); const admin = createAdminClient();
    const { data, error } = await admin.from("TeacherCurriculumUpload").select("*").eq("teacherId", teacher.id).order("createdAt", { ascending: false });
    if (error) throw new Error(error.message);
    const uploads = await Promise.all((data ?? []).map(async (item) => {
      const { data: signed } = await admin.storage.from("teacher-curricula").createSignedUrl(String(item.storagePath), 3600);
      return { ...item, downloadUrl: signed?.signedUrl ?? null };
    }));
    return NextResponse.json({ uploads });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load uploads." }, { status: 400 }); }
}
export async function POST(request: Request) {
  try {
    const teacher = await requireTeacher(); const form = await request.formData();
    const file = form.get("file"); if (!(file instanceof File)) throw new Error("Choose a curriculum file.");
    if (!allowedTypes.has(file.type)) throw new Error("Upload a PDF, DOC or DOCX file.");
    if (!file.size || file.size > 15 * 1024 * 1024) throw new Error("The file must be no larger than 15 MB.");
    const input = metadataSchema.parse({ title: form.get("title"), subject: form.get("subject"), grades: form.get("grades"), authority: form.get("authority") ?? "", sourceUrl: form.get("sourceUrl") ?? "", publishedYear: form.get("publishedYear") ?? "" });
    await ensureBucket(); const admin = createAdminClient();
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
    const path = `${teacher.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await admin.storage.from("teacher-curricula").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { data, error } = await admin.from("TeacherCurriculumUpload").insert({ teacherId: teacher.id, title: input.title, subject: input.subject, gradeLevels: input.grades, authority: input.authority, sourceUrl: input.sourceUrl || null, publishedYear: input.publishedYear, storagePath: path, fileName: file.name, mimeType: file.type, fileSize: file.size }).select("id").single();
    if (error) { await admin.storage.from("teacher-curricula").remove([path]); throw new Error(error.message); }
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 }); }
}
export async function DELETE(request: Request) {
  try {
    const teacher = await requireTeacher(); const { id } = z.object({ id: z.string().uuid() }).parse(await request.json()); const admin = createAdminClient();
    const { data } = await admin.from("TeacherCurriculumUpload").select("storagePath").eq("id", id).eq("teacherId", teacher.id).maybeSingle();
    if (!data) throw new Error("Curriculum upload not found.");
    await admin.storage.from("teacher-curricula").remove([String(data.storagePath)]);
    const { error } = await admin.from("TeacherCurriculumUpload").delete().eq("id", id).eq("teacherId", teacher.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete upload." }, { status: 400 }); }
}
