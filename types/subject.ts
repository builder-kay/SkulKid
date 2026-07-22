export type SubjectName = "Mathematics" | "English Language" | "Science";

export type Subject = {
  id: string;
  name: SubjectName;
  slug: string;
  description: string;
  color: string;
  units: Unit[];
};

export type Unit = {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  topics: Topic[];
};

export type Topic = {
  id: string;
  unitId: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  lessonIds: string[];
};
