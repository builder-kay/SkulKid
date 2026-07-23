import { CourseDetail } from "@/components/student/course-detail";

type CoursePageProps = {
  params: Promise<{
    subjectSlug: string;
  }>;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { subjectSlug } = await params;

  return <CourseDetail subjectSlug={subjectSlug} />;
}
