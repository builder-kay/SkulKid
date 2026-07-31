import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const teacherMessageBucket = "teacher-message-attachments";
const allowed = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4", "audio/wav",
  "application/pdf", "text/plain", "text/csv", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);

export type StoredMessageAttachment = {
  path: string;
  name: string;
  mime: string;
  size: number;
  kind: "image" | "audio" | "file";
};
export type MessageAttachment = StoredMessageAttachment & { url: string };

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-100) || "attachment";
}

export async function uploadTeacherMessageAttachments(input: {
  teacherId: string;
  files: File[];
}): Promise<StoredMessageAttachment[]> {
  if (input.files.length > 4) throw new Error("Attach no more than four files to one message.");
  const total = input.files.reduce((sum, file) => sum + file.size, 0);
  if (total > 20 * 1024 * 1024) throw new Error("Attachments may total no more than 20 MB.");
  const admin = createAdminClient();
  const uploaded: StoredMessageAttachment[] = [];
  try {
    for (const file of input.files) {
      if (!file.size || file.size > 15 * 1024 * 1024) throw new Error(`${file.name || "Attachment"} must be smaller than 15 MB.`);
      const mime = file.type.toLowerCase().split(";")[0].trim();
      if (!allowed.has(mime)) throw new Error(`${file.name || "Attachment"} is not a supported image, audio or document type.`);
      const kind = mime.startsWith("image/") ? "image" as const : mime.startsWith("audio/") ? "audio" as const : "file" as const;
      const path = `${input.teacherId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const { error } = await admin.storage.from(teacherMessageBucket).upload(path, file, { contentType: mime, upsert: false });
      if (error) throw new Error(error.message);
      uploaded.push({ path, name: file.name || (kind === "audio" ? "Voice message" : "Attachment"), mime, size: file.size, kind });
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) await admin.storage.from(teacherMessageBucket).remove(uploaded.map((item) => item.path));
    throw error;
  }
}

export async function removeTeacherMessageAttachments(attachments: StoredMessageAttachment[]) {
  if (!attachments.length) return;
  const admin = createAdminClient();
  await admin.storage.from(teacherMessageBucket).remove(attachments.map((item) => item.path));
}

export async function signMessageAttachments(value: unknown): Promise<MessageAttachment[]> {
  const attachments = Array.isArray(value)
    ? value.filter((item): item is StoredMessageAttachment => Boolean(item && typeof item === "object" && typeof item.path === "string"))
    : [];
  if (!attachments.length) return [];
  const admin = createAdminClient();
  const signed = await Promise.all(attachments.map(async (item) => {
    const { data } = await admin.storage.from(teacherMessageBucket).createSignedUrl(item.path, 60 * 60);
    return data?.signedUrl ? { ...item, url: data.signedUrl } : null;
  }));
  return signed.filter((item): item is MessageAttachment => Boolean(item));
}
