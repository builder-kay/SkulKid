import { redirect } from "next/navigation";

export default async function LessonsPage({ searchParams }: { searchParams: Promise<{ subject?: string; courseId?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.courseId) query.set("courseId", params.courseId);
  redirect(`/teacher/curriculum${query.size ? `?${query}` : ""}`);
}
