import { redirect } from "next/navigation";

export default function LegacyClassChatSafetyPage() {
  redirect("/teacher/settings?section=class-chat-safety");
}
