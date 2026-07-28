import { CourseDetail } from "@/components/student/course-detail";

type CoursePageProps = {
  params: Promise<{
    subjectSlug: string;
  }>;
  searchParams: Promise<{ classId?: string }>;
};

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  const { subjectSlug } = await params;
  const { classId } = await searchParams;

  return <CourseDetail classId={classId} subjectSlug={subjectSlug} />;
}
