import { CourseDetail } from "@/components/student/course-detail";
import { subjects } from "@/data/subjects";

type CoursePageProps = {
  params: Promise<{
    subjectSlug: string;
  }>;
};

export function generateStaticParams() {
  return subjects.map((subject) => ({
    subjectSlug: subject.slug
  }));
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { subjectSlug } = await params;

  return <CourseDetail subjectSlug={subjectSlug} />;
}
