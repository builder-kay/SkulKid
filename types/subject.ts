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
  /** Product term: Modules (DB table remains Unit). */
  units: Unit[];
};

/** Module within a subject (DB table: Unit). Contains lesson groups (topics) and lessons. */
export type Unit = {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  topics: Topic[];
};

/** Optional lesson group inside a module (DB table: Topic). */
export type Topic = {
  id: string;
  unitId: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  lessonIds: string[];
};
