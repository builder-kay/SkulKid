export type SubjectName = string;

/** Top-level learning area (Mathematics, English, Science). Shown as "Subject" in the product UI. */
export type Subject = {
  id: string;
  name: SubjectName;
  slug: string;
  description: string;
  color: string;
  coverUrl?: string | null;
  gradeLevels?: number[];
  /** Ghana curriculum term: Strands (DB table remains Unit). */
  units: Unit[];
};

/** Strand within a subject (DB table: Unit). Contains sub-strands and lessons. */
export type Unit = {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  requiresPrevious?: boolean;
  topics: Topic[];
};

/** Sub-strand inside a strand (DB table: Topic). */
export type Topic = {
  id: string;
  unitId: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  lessonIds: string[];
};
